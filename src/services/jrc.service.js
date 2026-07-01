// FILE: src/services/jrc.service.js
// PURPOSE: Land history + flood risk — JRC Global Surface Water (primary) + Overpass water proximity (fallback)
// JRC: free REST endpoint, no key required, Landsat 1984-present coverage all India
// Overpass: queries natural=water/wetland + waterway features within 500m

import fetch from 'node-fetch';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
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

async function fetchJRCOccurrence(lat, lng) {
  try {
    const url = `https://global-surface-water.appspot.com/api/waterOccurrence?lat=${lat}&lon=${lng}`;
    const res = await fetchWithTimeout(url, {}, 6000);
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data?.occurrence !== 'number') return null;
    return data.occurrence;
  } catch {
    return null;
  }
}

async function fetchNearbyWaterFromOverpass(lat, lng) {
  const query = `
[out:json][timeout:10];
(
  way["natural"="water"](around:500,${lat},${lng});
  relation["natural"="water"](around:500,${lat},${lng});
  way["waterway"~"river|stream|canal|drain"](around:300,${lat},${lng});
  way["natural"="wetland"](around:1000,${lat},${lng});
);
out center;
`.trim();

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    `data=${encodeURIComponent(query)}`,
        },
        10000,
      );
      if (!res.ok) continue;
      const data = await res.json();
      return data?.elements ?? [];
    } catch {
      // try next endpoint
    }
  }
  return null;
}

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function classifyFloodRisk(occurrence, nearestWaterM) {
  if (occurrence !== null) {
    if (occurrence >= 50) return { risk: 'Very High', score: 90, reason: 'Location was under water >50% of observed years (1984–2024)' };
    if (occurrence >= 20) return { risk: 'High',      score: 70, reason: 'Seasonal water presence detected at this coordinate historically' };
    if (occurrence >= 5)  return { risk: 'Moderate',  score: 45, reason: 'Occasional historical water presence detected' };
  }

  if (nearestWaterM !== null) {
    if (nearestWaterM <= 100) return { risk: 'High',          score: 65, reason: `Water body ${nearestWaterM}m away — flood risk during heavy rains` };
    if (nearestWaterM <= 300) return { risk: 'Moderate',      score: 40, reason: `Water body ${nearestWaterM}m away — monitor during monsoon` };
    if (nearestWaterM <= 500) return { risk: 'Low-Moderate',  score: 25, reason: `Nearest water body is ${nearestWaterM}m away` };
  }

  return { risk: 'Low', score: 10, reason: 'No significant water body detected nearby' };
}

export async function fetchLandHistory(lat, lng) {
  const [occurrence, elements] = await Promise.all([
    fetchJRCOccurrence(lat, lng),
    fetchNearbyWaterFromOverpass(lat, lng),
  ]);

  let nearestWaterM = null;
  if (Array.isArray(elements)) {
    for (const el of elements) {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (elLat == null || elLng == null) continue;
      const dist = haversineM(lat, lng, elLat, elLng);
      if (nearestWaterM === null || dist < nearestWaterM) nearestWaterM = dist;
    }
  }

  const { risk, score, reason } = classifyFloodRisk(occurrence, nearestWaterM);

  return {
    floodRisk:          risk,
    floodRiskScore:     score,
    waterOccurrence:    occurrence,
    nearestWaterBodyM:  nearestWaterM,
    reason,
    hasHistoricalWater: occurrence != null ? occurrence >= 5 : null,
    source:             occurrence !== null ? 'jrc+osm' : (nearestWaterM !== null ? 'osm' : 'unavailable'),
  };
}
