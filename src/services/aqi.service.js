// FILE: src/services/aqi.service.js
// PURPOSE: AQI waterfall — OpenAQ → cluster cache → CPCB city average → seasonal fallback

import fetch from 'node-fetch';
import Cluster from '../models/Cluster.js';
import { CITY_AQI_AVERAGES, STATE_NAME_MAP, getSeasonalAQI } from '../data/cityAQIAverages.js';

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

function aqiCategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Satisfactory';
  if (aqi <= 200) return 'Moderate';
  if (aqi <= 300) return 'Poor';
  if (aqi <= 400) return 'Very Poor';
  return 'Severe';
}

// Indian NAQI linear interpolation for PM2.5 (µg/m³) → AQI
function pm25ToAQI(pm25) {
  const bp = [
    [0, 30, 0, 50],
    [31, 60, 51, 100],
    [61, 90, 101, 200],
    [91, 120, 201, 300],
    [121, 250, 301, 400],
    [251, 500, 401, 500],
  ];
  const c = Math.min(Math.max(pm25, 0), 500);
  for (const [cl, ch, il, ih] of bp) {
    if (c >= cl && c <= ch) {
      return Math.round(((ih - il) / (ch - cl)) * (c - cl) + il);
    }
  }
  return 500;
}

// PM10 (µg/m³) → AQI
function pm10ToAQI(pm10) {
  const bp = [
    [0, 50, 0, 50],
    [51, 100, 51, 100],
    [101, 250, 101, 200],
    [251, 350, 201, 300],
    [351, 430, 301, 400],
    [431, 600, 401, 500],
  ];
  const c = Math.min(Math.max(pm10, 0), 600);
  for (const [cl, ch, il, ih] of bp) {
    if (c >= cl && c <= ch) {
      return Math.round(((ih - il) / (ch - cl)) * (c - cl) + il);
    }
  }
  return 500;
}

async function reverseGeocodeState(lat, lng) {
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'Vibescout/1.0' } },
      5000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      city: data.address?.city || data.address?.town || data.address?.village || null,
      state: data.address?.state || null,
    };
  } catch {
    return null;
  }
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Level 1: WAQI — aggregates real CPCB ground-station data, coordinate-based, returns AQI directly
// Guard: reject if returned station is >75 km from query point — WAQI silently falls back to
// distant stations when no local CPCB monitor exists (e.g. returns Delhi data for Bengaluru suburbs).
async function fetchFromWAQI(lat, lng) {
  if (!process.env.WAQI_API_KEY) return null;
  try {
    const url = `https://api.waqi.info/feed/geo:${lat};${lng}/?token=${process.env.WAQI_API_KEY}`;
    const res = await fetchWithTimeout(url, {}, 6000);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'ok') return null;
    const aqi = data?.data?.aqi;
    if (!aqi || aqi <= 0) return null;

    const stationGeo = data?.data?.city?.geo;
    if (Array.isArray(stationGeo) && stationGeo.length === 2) {
      const distKm = haversineKm(lat, lng, stationGeo[0], stationGeo[1]);
      if (distKm > 75) return null;
    }

    return { value: aqi, category: aqiCategory(aqi), source: 'live' };
  } catch {
    return null;
  }
}

// Level 2: Open-Meteo Air Quality API — CAMS Copernicus, coordinate-precise, no API key, free
// Better than OpenWeather for India: higher spatial resolution, no station proximity issues,
// returns current-hour PM2.5/PM10 averaged over latest 3 hours to smooth spikes.
async function fetchFromOpenMeteo(lat, lng) {
  try {
    const url =
      `https://air-quality-api.open-meteo.com/v1/air-quality` +
      `?latitude=${lat}&longitude=${lng}` +
      `&hourly=pm2_5,pm10&timezone=Asia%2FKolkata&forecast_days=1`;
    const res = await fetchWithTimeout(url, {}, 7000);
    if (!res.ok) return null;
    const data = await res.json();

    const times = data?.hourly?.time ?? [];
    const pm25s = data?.hourly?.pm2_5 ?? [];
    const pm10s = data?.hourly?.pm10 ?? [];
    if (!times.length) return null;

    // Find the index of the current hour
    const nowHour = new Date().toISOString().slice(0, 13); // "2026-06-30T14"
    // Open-Meteo returns local-time strings like "2026-06-30T14:00"
    const nowLocal = new Date(Date.now() + 5.5 * 3600 * 1000)
      .toISOString()
      .slice(0, 13);
    let idx = times.findIndex((t) => t.startsWith(nowLocal));
    if (idx < 0) idx = times.length - 1;

    // Average over ±1 hour window to smooth noise
    const window = [idx - 1, idx, idx + 1].filter((i) => i >= 0 && i < times.length);

    const pm25Vals = window.map((i) => pm25s[i]).filter((v) => v != null && v > 0);
    const pm10Vals = window.map((i) => pm10s[i]).filter((v) => v != null && v > 0);

    let aqiValue = null;
    if (pm25Vals.length) {
      const avg = pm25Vals.reduce((a, b) => a + b, 0) / pm25Vals.length;
      aqiValue = pm25ToAQI(avg);
    } else if (pm10Vals.length) {
      const avg = pm10Vals.reduce((a, b) => a + b, 0) / pm10Vals.length;
      aqiValue = pm10ToAQI(avg);
    }
    if (aqiValue === null) return null;
    return { value: aqiValue, category: aqiCategory(aqiValue), source: 'live' };
  } catch {
    return null;
  }
}

// Level 2: OpenAQ v3 live data (station-based, may be stale)
// Strategy: (a) find nearby monitoring stations via /v3/locations?coordinates,
//           (b) fetch /v3/locations/{id}/latest for up to 3 stations in parallel,
//           (c) match pm25/pm10 sensor IDs from the location payload.
async function fetchFromOpenAQ(lat, lng) {
  if (!process.env.OPENAQ_API_KEY) return null;
  try {
    // Step A — find nearest stations (includes sensor list with parameter names)
    const locUrl =
      `https://api.openaq.org/v3/locations` +
      `?coordinates=${lat},${lng}&radius=10000&limit=5`;
    const locRes = await fetchWithTimeout(
      locUrl,
      { headers: { 'X-API-Key': process.env.OPENAQ_API_KEY } },
      8000,
    );
    if (!locRes.ok) return null;
    const locData = await locRes.json();
    if (!locData.results?.length) return null;

    // Step B — fetch latest readings for the nearest 3 stations in parallel
    const pm25Values = [];
    const pm10Values = [];

    await Promise.all(
      locData.results.slice(0, 3).map(async (loc) => {
        // Build sensor-ID sets for pm25 and pm10 from the location payload
        const pm25Ids = new Set(
          (loc.sensors ?? [])
            .filter((s) => s.parameter?.name === 'pm25')
            .map((s) => s.id),
        );
        const pm10Ids = new Set(
          (loc.sensors ?? [])
            .filter((s) => s.parameter?.name === 'pm10')
            .map((s) => s.id),
        );
        if (!pm25Ids.size && !pm10Ids.size) return;

        try {
          const latestRes = await fetchWithTimeout(
            `https://api.openaq.org/v3/locations/${loc.id}/latest`,
            { headers: { 'X-API-Key': process.env.OPENAQ_API_KEY } },
            5000,
          );
          if (!latestRes.ok) return;
          const latestData = await latestRes.json();

          for (const reading of latestData.results ?? []) {
            if (reading.value > 0) {
              if (pm25Ids.has(reading.sensorsId)) pm25Values.push(reading.value);
              else if (pm10Ids.has(reading.sensorsId)) pm10Values.push(reading.value);
            }
          }
        } catch {
          // per-station failure — skip, continue with others
        }
      }),
    );

    // Step C — convert best available pollutant to Indian NAQI AQI
    let aqiValue = null;
    if (pm25Values.length) {
      const avg = pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length;
      aqiValue = pm25ToAQI(avg);
    } else if (pm10Values.length) {
      const avg = pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length;
      aqiValue = pm10ToAQI(avg);
    }

    if (aqiValue === null) return null;
    return { value: aqiValue, category: aqiCategory(aqiValue), source: 'live' };
  } catch {
    return null;
  }
}

// Level 2: Cluster MongoDB cache
async function fetchFromClusterCache(clusterId) {
  try {
    const cluster = await Cluster.findOne({ clusterId });
    if (!cluster?.cachedAQI?.updatedAt) return null;
    const { aqi, category } = cluster.cachedAQI;
    if (!aqi) return null;
    return { value: aqi, category: category || aqiCategory(aqi), source: 'cache' };
  } catch {
    return null;
  }
}

// Level 3: CPCB city average via data.gov.in
async function fetchFromCPCB(cityName) {
  if (!cityName || !process.env.CPCB_API_KEY) return null;
  try {
    const encodedCity = encodeURIComponent(cityName);
    const url =
      `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69` +
      `?api-key=${process.env.CPCB_API_KEY}&format=json` +
      `&filters[city]=${encodedCity}&limit=10`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return null;
    const data = await res.json();
    const records = data.records ?? [];
    if (!records.length) return null;

    // Prefer AQI records; fall back to PM2.5
    const aqiRecord = records.find((r) => r.pollutant_id === 'AQI');
    if (aqiRecord) {
      const value = parseInt(aqiRecord.pollutant_avg, 10);
      if (!isNaN(value) && value > 0) {
        return { value, category: aqiCategory(value), source: 'city_average' };
      }
    }

    const pm25Record = records.find((r) => r.pollutant_id === 'PM2.5');
    if (pm25Record) {
      const pm25 = parseFloat(pm25Record.pollutant_avg);
      if (!isNaN(pm25) && pm25 > 0) {
        const value = pm25ToAQI(pm25);
        return { value, category: aqiCategory(value), source: 'city_average' };
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Full 5-level AQI waterfall — never returns null
export async function fetchAQI(lat, lng, clusterId, cityName) {
  // Level 1: WAQI — real CPCB ground-station data, most accurate for India
  const waqiLive = await fetchFromWAQI(lat, lng);
  if (waqiLive) return waqiLive;

  // Level 2: Open-Meteo Air Quality — CAMS Copernicus, coordinate-precise, free, no key needed
  const omLive = await fetchFromOpenMeteo(lat, lng);
  if (omLive) return omLive;

  // Level 3: OpenAQ v3 — station-based fallback (may be stale in India)
  const live = await fetchFromOpenAQ(lat, lng);
  if (live) return live;

  // Level 4: Cluster MongoDB cache
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 5: CPCB city average (use cityName or reverse geocode to find it)
  let resolvedCity = cityName;
  let resolvedState = null;

  // SF-06: Only call Nominatim eagerly if we need a city name for CPCB
  if (!resolvedCity) {
    const geo = await reverseGeocodeState(lat, lng);
    resolvedCity = geo?.city ?? null;
    resolvedState = geo?.state ?? null;
  }

  const cpcb = await fetchFromCPCB(resolvedCity);
  if (cpcb) return cpcb;

  // Level 6: State-wise seasonal average — always returns a value
  // SF-06: Nominatim called lazily — only when CPCB fails and state is still unknown
  if (resolvedState === null) {
    const geo = await reverseGeocodeState(lat, lng);
    resolvedState = geo?.state ?? null;
  }

  const value = getSeasonalAQI(resolvedState);
  return { value, category: aqiCategory(value), source: 'seasonal' };
}
