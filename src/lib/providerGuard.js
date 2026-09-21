// FILE: src/lib/providerGuard.js
// PURPOSE: PERF-7 — protects external providers from overload: a per-provider
// concurrency cap (Nominatim's fair-use is ~1 req/s — under load you WILL get
// banned without one), a circuit breaker that stops hammering a down/rate-limited
// provider, and a soft daily spend cap for paid/quota-limited providers.
// fetchWithTimeout.js is the single choke point that routes every outbound
// third-party call through here.

import pLimit from 'p-limit';
import CircuitBreaker from 'opossum';

const PROVIDER_CONCURRENCY = {
  'Nominatim (OSM)': 1,
  'Overpass (OSM)': 2,
  'Google Maps': 5,
  'Google Air Quality': 5,
  Groq: 5,
};
const DEFAULT_CONCURRENCY = 10;

// Paid/quota-limited providers only. Exceeding this forces every caller straight
// to its fallback for the rest of the day instead of paying for (or getting
// throttled on) more calls.
const DAILY_CAP = {
  'Google Maps': 8000,
  'Google Air Quality': 8000,
  Groq: 20000,
};

const CIRCUIT_OPTIONS = {
  timeout: false, // fetchWithTimeout's own AbortController already bounds latency
  errorThresholdPercentage: 50,
  resetTimeout: 30_000, // cooldown before a single trial request is allowed through
  rollingCountTimeout: 10_000,
  volumeThreshold: 5, // don't trip on the first couple of failures
};

const limiters = new Map();
const breakers = new Map();
const dailyCounts = new Map(); // provider -> { day: 'YYYY-MM-DD', count }

function getLimiter(provider) {
  if (!limiters.has(provider)) {
    limiters.set(provider, pLimit(PROVIDER_CONCURRENCY[provider] ?? DEFAULT_CONCURRENCY));
  }
  return limiters.get(provider);
}

function getBreaker(provider) {
  if (!breakers.has(provider)) {
    const breaker = new CircuitBreaker((fn) => fn(), CIRCUIT_OPTIONS);
    breaker.on('open', () =>
      console.error(`[CircuitBreaker] ${provider} tripped open — cooling down ${CIRCUIT_OPTIONS.resetTimeout}ms`)
    );
    breakers.set(provider, breaker);
  }
  return breakers.get(provider);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function underDailyCap(provider) {
  const cap = DAILY_CAP[provider];
  if (!cap) return true;
  const entry = dailyCounts.get(provider);
  return !entry || entry.day !== todayKey() || entry.count < cap;
}

function recordDailyCall(provider) {
  const cap = DAILY_CAP[provider];
  if (!cap) return;
  const today = todayKey();
  const entry = dailyCounts.get(provider);
  if (!entry || entry.day !== today) {
    dailyCounts.set(provider, { day: today, count: 1 });
    return;
  }
  entry.count += 1;
  if (entry.count === cap) {
    console.error(`[DailySpendCap] ${provider} hit its daily cap of ${cap} calls — forcing fallback for the rest of today`);
  }
}

export class ProviderCapExceededError extends Error {
  constructor(provider) {
    super(`${provider} daily spend cap reached`);
    this.name = 'ProviderCapExceededError';
    this.provider = provider;
  }
}

// Runs `task` (a zero-arg async function performing the actual network call) under
// this provider's concurrency limit and circuit breaker. Never calls `task` at all
// if the daily cap is already spent or the breaker is open — both throw instead,
// which every caller already treats as a failed lookup and falls back on.
export function guardedCall(provider, task) {
  if (!underDailyCap(provider)) {
    return Promise.reject(new ProviderCapExceededError(provider));
  }
  const limiter = getLimiter(provider);
  const breaker = getBreaker(provider);
  return limiter(async () => {
    const result = await breaker.fire(task);
    recordDailyCall(provider);
    return result;
  });
}

// Test-only: reset all in-memory state between test files/cases.
export function _resetProviderGuardState() {
  limiters.clear();
  breakers.clear();
  dailyCounts.clear();
}

// Test-only: fast-forward a provider's daily count without looping thousands of
// calls. No-op for a provider with no configured DAILY_CAP.
export function _setDailyCountForTest(provider, count) {
  if (!DAILY_CAP[provider]) return;
  dailyCounts.set(provider, { day: todayKey(), count });
}
