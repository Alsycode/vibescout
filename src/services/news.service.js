// FILE: src/services/news.service.js
// PURPOSE: News waterfall — GNews → NewsAPI → Google RSS → empty fallback; cluster-level Redis cache EX 86400
//          Queries are tuned for home buyers (civic, infrastructure, safety) not investors or corporates.

import fetch from 'node-fetch';
import { redisGet, redisSet } from '../lib/redis.js';

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ── Relevance filters ─────────────────────────────────────────────────────────

// Financial / market noise — never useful to a home buyer
const FINANCIAL_NOISE = [
  'sensex', 'nifty', 'bse', 'nse', 'stock market', 'share market',
  'mutual fund', 'equity', 'ipo', 'rbi rate', 'repo rate', 'inflation rate',
  'gdp', 'forex', 'cryptocurrency', 'bitcoin', 'crypto',
];

// Corporate / investor real-estate news — not relevant to someone looking for a home
const CORPORATE_NOISE = [
  'lakh sq ft', 'sq ft office', 'office lease', 'office space', 'commercial lease',
  'it park', 'sez ', 'special economic zone', 'rental yield', 'capital appreciation',
  'nri investment', 'luxury villa', 'realty stocks', 'crore deal',
  'co-working', 'coworking', 'data centre', 'warehouse lease',
  'private equity', 'institutional investor', 'reit',
];

const ALL_NOISE = [...FINANCIAL_NOISE, ...CORPORATE_NOISE];

function isRelevantArticle(title = '', snippet = '') {
  const text = `${title} ${snippet}`.toLowerCase();
  return !ALL_NOISE.some(kw => text.includes(kw));
}

// Returns true if the article mentions the location name in title or snippet.
// Accepts alternate spellings (Bengaluru / Bangalore).
function mentionsLocation(title = '', snippet = '', locationName = '') {
  const text = `${title} ${snippet}`.toLowerCase();
  const loc  = locationName.toLowerCase();
  if (text.includes(loc)) return true;
  // Handle common Bengaluru ↔ Bangalore equivalence
  if (loc === 'bengaluru' && text.includes('bangalore')) return true;
  if (loc === 'bangalore' && text.includes('bengaluru')) return true;
  return false;
}

// Home-buyer query terms — things that affect daily life in a neighbourhood
const HOME_BUYER_TERMS = [
  'residents', 'flooding', 'waterlogging', 'metro', 'road', 'flyover',
  'water supply', 'bwssb', 'bescom', 'power cut', 'civic', 'bbmp',
  'school', 'hospital', 'safety', 'crime', 'traffic', 'infrastructure',
  'apartments', 'neighbourhood', 'locality', 'connectivity', 'drainage',
  'garbage', 'park', 'footpath', 'signal', 'pothole',
].join(' OR ');

// ── RSS parser ────────────────────────────────────────────────────────────────

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch =
      block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/i) ||
      block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch =
      block.match(/<link>([\s\S]*?)<\/link>/i) ||
      block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/i);
    const pubDateMatch = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch =
      block.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) ||
      block.match(/<description>([\s\S]*?)<\/description>/i);
    const sourceMatch = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);

    const decodeEntities = (s) => s
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    const stripTags = (s) => decodeEntities(s).replace(/<[^>]+>/g, '').trim();

    const title = stripTags(titleMatch?.[1] ?? '');
    if (!title) continue;

    const url         = (linkMatch?.[1] ?? '').trim();
    const pubDate     = pubDateMatch?.[1]?.trim() ?? '';
    const rawDesc     = (descMatch?.[1] ?? '').substring(0, 600);
    const description = stripTags(rawDesc).substring(0, 200);
    const sourceName  = stripTags(sourceMatch?.[1] ?? 'Google News');

    items.push({
      title,
      url,
      source:      sourceName,
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      snippet:     description,
    });
  }
  return items;
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

// Level 1: GNews.io — home-buyer query, location-enforced
async function fetchFromGNews(locationName) {
  if (!process.env.GNEWS_API_KEY || !locationName) return null;
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];
    const q = encodeURIComponent(
      `"${locationName}" (residents OR flooding OR metro OR road OR water supply OR civic OR school OR safety OR infrastructure OR apartments)`
    );
    const url =
      `https://gnews.io/api/v4/search` +
      `?q=${q}&lang=en&country=in&max=10&from=${sevenDaysAgo}`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'X-API-Key': process.env.GNEWS_API_KEY } },
      6000,
    );
    if (!res.ok) return null;
    const data     = await res.json();
    const articles = data?.articles ?? [];
    if (!articles.length) return null;

    const headlines = articles
      .map((a) => ({
        title:       a.title ?? '',
        url:         a.url ?? '',
        source:      a.source?.name ?? 'GNews',
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        snippet:     (a.description ?? '').substring(0, 200),
      }))
      .filter(h => isRelevantArticle(h.title, h.snippet))
      .filter(h => mentionsLocation(h.title, h.snippet, locationName));

    if (!headlines.length) return null;
    return { headlines, source: 'gnews' };
  } catch {
    return null;
  }
}

// Level 2: NewsAPI.org — home-buyer query, location-enforced
async function fetchFromNewsAPI(locationName) {
  if (!process.env.NEWSAPI_API_KEY || !locationName) return null;
  try {
    const q = encodeURIComponent(
      `"${locationName}" (residents OR flooding OR metro OR road OR water OR civic OR school OR safety OR infrastructure OR apartments)`
    );
    const url =
      `https://newsapi.org/v2/everything` +
      `?q=${q}&language=en&sortBy=publishedAt&pageSize=10`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'X-Api-Key': process.env.NEWSAPI_API_KEY } },
      6000,
    );
    if (!res.ok) return null;
    const data     = await res.json();
    const articles = data?.articles ?? [];
    if (!articles.length) return null;

    const headlines = articles
      .map((a) => ({
        title:       a.title ?? '',
        url:         a.url ?? '',
        source:      a.source?.name ?? 'NewsAPI',
        publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
        snippet:     (a.description ?? '').substring(0, 200),
      }))
      .filter(h => isRelevantArticle(h.title, h.snippet))
      .filter(h => mentionsLocation(h.title, h.snippet, locationName));

    if (!headlines.length) return null;
    return { headlines, source: 'newsapi' };
  } catch {
    return null;
  }
}

// Level 3: Google News RSS — home-buyer query, location-enforced
async function fetchFromGoogleRSS(locationName) {
  if (!locationName) return null;
  try {
    const q = encodeURIComponent(
      `"${locationName}" (residents OR flooding OR metro OR road OR water supply OR civic OR BBMP OR school OR safety OR infrastructure OR apartments OR neighbourhood OR pothole OR drainage)`
    );
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetchWithTimeout(url, {}, 6000);
    if (!res.ok) return null;
    const xml = await res.text();
    const headlines = parseRSSItems(xml)
      .filter(item => isRelevantArticle(item.title, item.snippet))
      .filter(item => mentionsLocation(item.title, item.snippet, locationName))
      .slice(0, 10)
      .map((item) => ({ ...item, source: 'google-rss' }));
    if (!headlines.length) return null;
    return { headlines, source: 'google-rss' };
  } catch {
    return null;
  }
}

// ── Main waterfall ────────────────────────────────────────────────────────────
// Tries each location most-specific → broadest (e.g. ["Koramangala", "Bengaluru", "Bangalore Urban"]).
// For each location: GNews → NewsAPI → Google RSS, all with home-buyer queries + location enforcement.
// Stops at the first level that returns location-relevant results.
// Cluster-level Redis cache: cluster:{clusterId}:news EX 86400

export async function fetchNewsWithFallback(clusterId, locationNames) {
  const locations = Array.isArray(locationNames)
    ? locationNames.filter(Boolean)
    : [locationNames].filter(Boolean);

  if (clusterId) {
    try {
      const cached = await redisGet(`cluster:${clusterId}:news`);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached;
      }
    } catch {
      // ignore Redis errors
    }
  }

  for (const loc of locations) {
    const result =
      await fetchFromGNews(loc) ||
      await fetchFromNewsAPI(loc) ||
      await fetchFromGoogleRSS(loc);

    if (result) {
      if (clusterId) {
        await redisSet(`cluster:${clusterId}:news`, JSON.stringify(result), 86400);
      }
      return result;
    }
  }

  return { headlines: [], source: 'fallback' };
}
