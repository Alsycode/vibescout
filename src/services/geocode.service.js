// FILE: src/services/geocode.service.js
// PURPOSE: PERF-7 — single shared, cached Nominatim reverse-geocode. Previously
// analyze.routes.js, aqi.service.js, and weather.service.js each had their own
// reverse-geocode call, so one pipeline run could hit Nominatim up to 3x for the
// *same* coordinate (their fair-use policy is ~1 req/s — a real ban risk under
// load). Also adds the plan's short negative cache so a bad/unresolvable
// coordinate doesn't retry Nominatim on every request.

import { fetchWithTimeout } from '../lib/fetchWithTimeout.js';
import { redisGet, redisSet } from '../lib/redis.js';

const SUCCESS_TTL_S = 30 * 24 * 60 * 60; // 30 days — addresses don't move
const NEGATIVE_TTL_S = 10 * 60; // 10 min — plan PERF-7's short negative cache

function cacheKey(lat, lng) {
  return `geocode:nominatim:${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

// Returns Nominatim's raw `address` block (plus `displayName`), or null on any
// failure — cached by rounded coordinate so repeat callers within a pipeline
// run (or across runs at the same building) never re-hit Nominatim.
export async function reverseGeocodeNominatim(lat, lng) {
  const key = cacheKey(lat, lng);

  try {
    const cached = await redisGet(key);
    if (cached !== null && cached !== undefined) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return parsed.miss ? null : parsed.address;
    }
  } catch {
    // corrupt cache entry — fall through to a live lookup
  }

  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'Vibescout/1.0' } },
      5000
    );
    if (!res.ok) {
      await redisSet(key, JSON.stringify({ miss: true }), NEGATIVE_TTL_S);
      return null;
    }
    const data = await res.json();
    const address = { ...(data.address ?? {}), displayName: data.display_name ?? null };
    await redisSet(key, JSON.stringify({ address }), SUCCESS_TTL_S);
    return address;
  } catch {
    await redisSet(key, JSON.stringify({ miss: true }), NEGATIVE_TTL_S);
    return null;
  }
}
