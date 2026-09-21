// FILE: src/services/apiUsage.service.js
// PURPOSE: Count every outbound third-party API call, per provider, in Redis — so the
//          admin dashboard can show request volume and a rough monthly-bill estimate.
//          Write path is fire-and-forget: it never throws and never blocks a request.
//          PERF-6: counts are accumulated in-process and flushed to Redis as one
//          pipelined write every FLUSH_INTERVAL_MS (and on shutdown), instead of a
//          fresh ~6-command Redis pipeline per outbound call (~70+ per report).

import { redis } from '../lib/redis.js';

// ─── Provider detection ──────────────────────────────────────────────
// Map an outbound URL hostname to a human-readable provider label. First match wins.
const PROVIDER_RULES = [
  { test: (h) => h.includes('airquality.googleapis.com'),   provider: 'Google Air Quality' },
  { test: (h) => h.includes('maps.googleapis.com'),         provider: 'Google Maps' },
  { test: (h) => h.endsWith('googleapis.com'),              provider: 'Google (other)' },
  { test: (h) => h.includes('api.groq.com'),                provider: 'Groq' },
  { test: (h) => h.includes('gnews.io'),                    provider: 'GNews' },
  { test: (h) => h.includes('newsapi.org'),                 provider: 'NewsAPI' },
  { test: (h) => h.includes('news.google.com'),             provider: 'Google News RSS' },
  { test: (h) => h.includes('openweathermap.org'),          provider: 'OpenWeatherMap' },
  { test: (h) => h.includes('waqi.info'),                   provider: 'WAQI' },
  { test: (h) => h.includes('api.openaq.org'),              provider: 'OpenAQ' },
  { test: (h) => h.includes('open-meteo.com'),              provider: 'Open-Meteo' },
  { test: (h) => h.includes('opentopodata.org'),            provider: 'OpenTopoData' },
  { test: (h) => h.includes('nominatim.openstreetmap.org'), provider: 'Nominatim (OSM)' },
  { test: (h) => h.includes('overpass'),                    provider: 'Overpass (OSM)' },
  { test: (h) => h.includes('data.gov.in'),                 provider: 'data.gov.in (CPCB)' },
  { test: (h) => h.includes('global-surface-water'),        provider: 'JRC Surface Water' },
];

export function providerFromUrl(url) {
  let host;
  try {
    host = new URL(typeof url === 'string' ? url : url?.href ?? url?.url ?? '').hostname.toLowerCase();
  } catch {
    return 'Unknown';
  }
  for (const rule of PROVIDER_RULES) {
    if (rule.test(host)) return rule.provider;
  }
  return host || 'Unknown';
}

function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function dayKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

const MONTH_TTL_S = 86400 * 400; // keep ~13 months of monthly totals
const DAY_TTL_S   = 86400 * 45;  // keep ~45 days of daily granularity
const FLUSH_INTERVAL_MS = 20_000;

// In-process accumulator: `${scope}|${dateKey}|${provider}|${field}` -> count.
// scope is 'month'|'day'; field is 'total'|'ok'|'err' ('day' hashes only ever
// use 'total', matching the pre-batching schema).
let pendingCounts = new Map();
let pendingMonths = new Set();

function bump(key) {
  pendingCounts.set(key, (pendingCounts.get(key) ?? 0) + 1);
}

// Called once per outbound third-party fetch. Never throws, never awaited by the caller.
export function recordApiCall(url, { ok = true } = {}) {
  try {
    const provider = providerFromUrl(url);
    if (!provider || provider === 'Unknown') return;

    const mk = monthKey();
    const dk = dayKey();
    bump(`month|${mk}|${provider}|total`);
    bump(`month|${mk}|${provider}|${ok ? 'ok' : 'err'}`);
    bump(`day|${dk}|${provider}|total`);
    pendingMonths.add(mk);
  } catch {
    /* telemetry must never break a request */
  }
}

// Drains the in-process accumulator into one pipelined Redis write. Safe to call
// concurrently with recordApiCall — the snapshot-then-clear swap means any counts
// recorded mid-flush land in the *next* flush rather than being lost or double-counted.
async function flushApiUsage() {
  if (pendingCounts.size === 0) return;
  const countsSnapshot = pendingCounts;
  const monthsSnapshot = pendingMonths;
  pendingCounts = new Map();
  pendingMonths = new Set();

  try {
    const p = redis.pipeline();
    const touchedHashes = new Set();
    for (const [key, count] of countsSnapshot) {
      const [scope, dateKey, provider, field] = key.split('|');
      const hash = scope === 'month' ? `apiusage:month:${dateKey}` : `apiusage:day:${dateKey}`;
      const hashField = field === 'total' ? provider : `${provider}:${field}`;
      p.hincrby(hash, hashField, count);
      if (!touchedHashes.has(hash)) {
        touchedHashes.add(hash);
        p.expire(hash, scope === 'month' ? MONTH_TTL_S : DAY_TTL_S);
      }
    }
    for (const mk of monthsSnapshot) p.sadd('apiusage:months', mk);
    await p.exec();
  } catch {
    /* telemetry must never break a request — dropped counts are acceptable */
  }
}

const flushTimer = setInterval(() => { flushApiUsage().catch(() => {}); }, FLUSH_INTERVAL_MS);
flushTimer.unref(); // telemetry must never keep the process alive on its own

// Call during graceful shutdown so counts accumulated since the last tick aren't lost.
export async function shutdownApiUsage() {
  clearInterval(flushTimer);
  await flushApiUsage();
}

// ─── Read side (admin only) ──────────────────────────────────────────

// Rough public pricing in INR. Deliberately conservative — this is an ESTIMATE,
// the provider's own billing dashboard is the source of truth.
// freePerMonth = calls covered before any charge kicks in.
const COST_MODEL = {
  'Google Maps':        { inrPer1k: 2700, freePerMonth: 0,      note: 'Nearby Search is the costly SKU; the $200/mo Google credit absorbs the first slice' },
  'Google Air Quality': { inrPer1k: 420,  freePerMonth: 0,      note: 'Covered by the $200/mo Google credit at low volume' },
  'Google (other)':     { inrPer1k: 420,  freePerMonth: 0,      note: '' },
  'Groq':               { inrPer1k: 4,    freePerMonth: 30000,  note: 'Free tier ~500k tokens/day; paid llama-3.1-8b is near-free' },
  'GNews':              { inrPer1k: 0,    freePerMonth: 3000,   note: 'Free tier 100 req/day — paid plans start ~$50/mo' },
  'NewsAPI':            { inrPer1k: 0,    freePerMonth: 3000,   note: 'Free DEV tier 100 req/day; production plan is very expensive — keep dev-only' },
  'OpenWeatherMap':     { inrPer1k: 0,    freePerMonth: 30000,  note: 'Free tier 1,000 calls/day' },
  'WAQI':               { inrPer1k: 0,    freePerMonth: 999999, note: 'Free token' },
  'OpenAQ':             { inrPer1k: 0,    freePerMonth: 999999, note: 'Free' },
  'Open-Meteo':         { inrPer1k: 0,    freePerMonth: 999999, note: 'Free for reasonable volume' },
  'OpenTopoData':       { inrPer1k: 0,    freePerMonth: 999999, note: 'Free public instance, rate-limited' },
  'Nominatim (OSM)':    { inrPer1k: 0,    freePerMonth: 999999, note: 'Free, 1 req/sec fair-use' },
  'Overpass (OSM)':     { inrPer1k: 0,    freePerMonth: 999999, note: 'Free public instance' },
  'data.gov.in (CPCB)': { inrPer1k: 0,    freePerMonth: 999999, note: 'Free' },
  'Google News RSS':    { inrPer1k: 0,    freePerMonth: 999999, note: 'Free' },
  'JRC Surface Water':  { inrPer1k: 0,    freePerMonth: 999999, note: 'Free' },
};

function estimateCostInr(provider, count) {
  const m = COST_MODEL[provider];
  if (!m || m.inrPer1k === 0) return 0;
  const billable = Math.max(0, count - (m.freePerMonth ?? 0));
  return Math.round((billable / 1000) * m.inrPer1k);
}

export async function getMonthlyUsage(mk = monthKey()) {
  const raw = (await redis.hgetall(`apiusage:month:${mk}`)) || {};

  const providers = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k.endsWith(':ok') || k.endsWith(':err')) continue;
    providers[k] = { provider: k, requests: Number(v) || 0, errors: 0 };
  }
  for (const [k, v] of Object.entries(raw)) {
    if (!k.endsWith(':err')) continue;
    const name = k.slice(0, -4);
    if (providers[name]) providers[name].errors = Number(v) || 0;
  }

  const rows = Object.values(providers)
    .map((r) => ({
      provider: r.provider,
      requests: r.requests,
      errors: r.errors,
      estMonthlyCostInr: estimateCostInr(r.provider, r.requests),
      paid: (COST_MODEL[r.provider]?.inrPer1k ?? 0) > 0,
      note: COST_MODEL[r.provider]?.note ?? '',
    }))
    .sort((a, b) => b.requests - a.requests);

  return {
    month: mk,
    rows,
    totalRequests: rows.reduce((s, r) => s + r.requests, 0),
    estTotalCostInr: rows.reduce((s, r) => s + r.estMonthlyCostInr, 0),
  };
}

export async function getAvailableMonths() {
  const months = await redis.smembers('apiusage:months');
  return (months || []).sort().reverse();
}

export async function getDailySeries(days = 30) {
  const labels = [];
  for (let i = days - 1; i >= 0; i--) {
    labels.push(dayKey(new Date(Date.now() - i * 86400000)));
  }
  const p = redis.pipeline();
  labels.forEach((d) => p.hgetall(`apiusage:day:${d}`));
  const results = await p.exec();

  return labels.map((date, i) => {
    const h = results[i] || {};
    const byProvider = Object.fromEntries(
      Object.entries(h)
        .filter(([k]) => !k.endsWith(':ok') && !k.endsWith(':err'))
        .map(([k, v]) => [k, Number(v) || 0])
    );
    const total = Object.values(byProvider).reduce((s, v) => s + v, 0);
    return { date, total, byProvider };
  });
}
