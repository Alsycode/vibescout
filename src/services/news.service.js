// FILE: src/services/news.service.js
// PURPOSE: News waterfall — GNews → NewsAPI → Google RSS → empty fallback; cluster-level Redis cache EX 86400

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

// Parses Google News RSS XML without external dependencies
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

    const url = (linkMatch?.[1] ?? '').trim();
    const pubDate = pubDateMatch?.[1]?.trim() ?? '';
    const rawDesc = (descMatch?.[1] ?? '').substring(0, 600);
    const description = stripTags(rawDesc).substring(0, 200);
    const sourceName = stripTags(sourceMatch?.[1] ?? 'Google News');

    items.push({
      title,
      url,
      source: sourceName,
      publishedAt: pubDate ? new Date(pubDate) : new Date(),
      snippet: description,
    });
  }
  return items;
}

// Level 1: GNews.io
async function fetchFromGNews(cityName) {
  if (!process.env.GNEWS_API_KEY || !cityName) return null;
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];
    const q = encodeURIComponent(`${cityName} real estate`);
    const url =
      `https://gnews.io/api/v4/search` +
      `?q=${q}&lang=en&country=in&max=10&from=${sevenDaysAgo}`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'X-API-Key': process.env.GNEWS_API_KEY } },
      6000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const articles = data?.articles ?? [];
    if (!articles.length) return null;

    const headlines = articles.map((a) => ({
      title: a.title ?? '',
      url: a.url ?? '',
      source: a.source?.name ?? 'GNews',
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      snippet: (a.description ?? '').substring(0, 200),
    }));

    return { headlines, source: 'gnews' };
  } catch {
    return null;
  }
}

// Level 2: NewsAPI.org
async function fetchFromNewsAPI(cityName) {
  if (!process.env.NEWSAPI_API_KEY || !cityName) return null;
  try {
    const q = encodeURIComponent(`${cityName} property`);
    const url =
      `https://newsapi.org/v2/everything` +
      `?q=${q}&language=en&sortBy=publishedAt&pageSize=10`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'X-Api-Key': process.env.NEWSAPI_API_KEY } },
      6000
    );
    if (!res.ok) return null;
    const data = await res.json();
    const articles = data?.articles ?? [];
    if (!articles.length) return null;

    const headlines = articles.map((a) => ({
      title: a.title ?? '',
      url: a.url ?? '',
      source: a.source?.name ?? 'NewsAPI',
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      snippet: (a.description ?? '').substring(0, 200),
    }));

    return { headlines, source: 'newsapi' };
  } catch {
    return null;
  }
}

// Level 3: Google News RSS
async function fetchFromGoogleRSS(cityName) {
  if (!cityName) return null;
  try {
    const q = encodeURIComponent(`${cityName} real estate property`);
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetchWithTimeout(url, {}, 6000);
    if (!res.ok) return null;
    const xml = await res.text();
    const headlines = parseRSSItems(xml).slice(0, 10).map((item) => ({
      ...item,
      source: 'google-rss',
    }));
    if (!headlines.length) return null;
    return { headlines, source: 'google-rss' };
  } catch {
    return null;
  }
}

// News waterfall with location cascade — never throws, always returns { headlines, source }
// Tries each location name most-specific → broadest (e.g. ["Vyttila", "Kochi", "Ernakulam"]).
// For each location: GNews → NewsAPI → Google RSS. Stops at first non-empty result.
// Cluster-level Redis cache: cluster:{clusterId}:news EX 86400
export async function fetchNewsWithFallback(clusterId, locationNames) {
  const locations = Array.isArray(locationNames)
    ? locationNames.filter(Boolean)
    : [locationNames].filter(Boolean);

  // Check cluster Redis cache first
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

  // All locations exhausted — empty fallback
  return { headlines: [], source: 'fallback' };
}
