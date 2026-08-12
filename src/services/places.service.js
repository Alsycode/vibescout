// FILE: src/services/places.service.js
// PURPOSE: Amenities waterfall — Google Places at exact coords → cluster cache → seed fallback

import fetch from 'node-fetch';
import Cluster from '../models/Cluster.js';
import { haversineKm } from './clusterService.js';
import { redisGet, redisSet } from '../lib/redis.js';

async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
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

const PLACE_TYPE_MAP = {
  school: 'schools',
  hospital: 'hospitals',
  gym: 'gyms',
  restaurant: 'restaurants',
  park: 'parks',
  place_of_worship: 'worship',
  cafe: 'cafes',
};

const GOOGLE_TYPES = Object.keys(PLACE_TYPE_MAP);

// Fetch one type from Google Places Nearby Search at exact coordinates
async function fetchPlaceType(lat, lng, type) {
  if (!process.env.GOOGLE_PLACES_API_KEY) return [];
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=3000&type=${type}` +
      `&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return [];
    const data = await res.json();
    // INT-04: Log specific API error statuses that silently masquerade as no results
    if (data.status === 'REQUEST_DENIED') {
      console.error(`[Places] API key rejected for type=${type}:`, data.error_message ?? 'unknown reason');
    }
    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error(`[Places] Quota exceeded for type=${type}:`, data.error_message ?? 'unknown reason');
    }
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
    return (data.results ?? []).slice(0, 5).map((place) => {
      const placeLat = place.geometry?.location?.lat ?? lat;
      const placeLng = place.geometry?.location?.lng ?? lng;
      const distanceM = Math.round(haversineKm({ lat, lng }, { lat: placeLat, lng: placeLng }) * 1000);
      return {
        name: place.name,
        distanceM,
        distance: distanceM,
        placeId: place.place_id ?? null,
        lat: placeLat,
        lng: placeLng,
      };
    });
  } catch {
    return [];
  }
}

// Level 1: Google Places at EXACT property coordinates — all 7 types in parallel
async function fetchFromGooglePlaces(lat, lng) {
  try {
    const results = await Promise.all(GOOGLE_TYPES.map((t) => fetchPlaceType(lat, lng, t)));
    const amenities = {};
    GOOGLE_TYPES.forEach((type, i) => {
      amenities[PLACE_TYPE_MAP[type]] = results[i];
    });
    // At least one type must have results to count as 'live'
    const hasAny = Object.values(amenities).some((arr) => arr.length > 0);
    if (!hasAny) return null;
    return { ...amenities, source: 'live' };
  } catch {
    return null;
  }
}

// Level 2: Cluster MongoDB cache
async function fetchFromClusterCache(clusterId) {
  try {
    const cluster = await Cluster.findOne({ clusterId });
    if (!cluster?.cachedAmenities?.updatedAt) return null;
    const ca = cluster.cachedAmenities;
    // FAIL-03: Remap distance → distanceM for consistency with live results
    // Cluster schema stores 'distance'; verdictEngine reads 'distanceM'
    const remap = (items) => (items ?? []).map(i => {
      const obj = typeof i.toObject === 'function' ? i.toObject() : i;
      return { ...obj, distanceM: obj.distanceM ?? obj.distance };
    });
    return {
      schools: remap(ca.schools),
      hospitals: remap(ca.hospitals),
      gyms: remap(ca.gyms),
      restaurants: remap(ca.restaurants),
      parks: remap(ca.parks),
      worship: remap(ca.worship),
      cafes: remap(ca.cafes),
      source: 'cache',
    };
  } catch {
    return null;
  }
}

// Nearby residential complexes/apartment projects — discovery layer, not a listings feed.
// Two broad keyword searches (not per-type) to keep Google Places API cost bounded;
// cached by rounded coordinate since buildings don't move.
const COMPLEX_KEYWORDS = ['apartment complex', 'residential complex'];
const COMPLEX_CACHE_TTL_S = 30 * 24 * 60 * 60; // 30 days

async function searchComplexesByKeyword(lat, lng, keyword) {
  if (!process.env.GOOGLE_PLACES_API_KEY) return [];
  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=5000&keyword=${encodeURIComponent(keyword)}` +
      `&key=${process.env.GOOGLE_PLACES_API_KEY}`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return [];
    return (data.results ?? []).map((place) => {
      const placeLat = place.geometry?.location?.lat ?? lat;
      const placeLng = place.geometry?.location?.lng ?? lng;
      const distanceM = Math.round(haversineKm({ lat, lng }, { lat: placeLat, lng: placeLng }) * 1000);
      return {
        name: place.name,
        distanceM,
        placeId: place.place_id ?? null,
        lat: placeLat,
        lng: placeLng,
        rating: place.rating ?? null,
      };
    });
  } catch {
    return [];
  }
}

// Returns { items, count, source } — items are named complexes only (no price/availability).
export async function fetchResidentialComplexes(lat, lng) {
  const cacheKey = `complexes:${lat.toFixed(2)}:${lng.toFixed(2)}`;

  try {
    const cached = await redisGet(cacheKey);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return { ...parsed, source: 'cache' };
    }
  } catch {
    // Redis miss — continue to live fetch
  }

  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return { items: [], count: 0, source: 'unavailable' };
  }

  try {
    const results = await Promise.all(
      COMPLEX_KEYWORDS.map((kw) => searchComplexesByKeyword(lat, lng, kw))
    );
    const seen = new Set();
    const deduped = [];
    for (const item of results.flat()) {
      const key = item.placeId ?? item.name;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(item);
    }
    deduped.sort((a, b) => a.distanceM - b.distanceM);
    const items = deduped.slice(0, 12);
    const payload = { items, count: items.length };

    try {
      await redisSet(cacheKey, JSON.stringify(payload), COMPLEX_CACHE_TTL_S);
    } catch {
      // Cache write failure is non-fatal
    }

    return { ...payload, source: 'live' };
  } catch (err) {
    console.error('[Places] Residential complexes fetch failed:', err.message);
    return { items: [], count: 0, source: 'error' };
  }
}

// Full 3-level amenities waterfall — never returns null, returns all 7 types
export async function fetchAmenities(lat, lng, clusterId) {
  // Level 1: Google Places at exact coordinates
  const live = await fetchFromGooglePlaces(lat, lng);
  if (live) return live;

  // Level 2: Cluster MongoDB cache
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 3: Seed fallback — empty arrays (populated at deployment by seedClusters.js)
  return {
    schools: [],
    hospitals: [],
    gyms: [],
    restaurants: [],
    parks: [],
    worship: [],
    cafes: [],
    source: 'seed',
  };
}
