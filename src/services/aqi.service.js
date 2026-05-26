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

// Level 1: OpenAQ live data
async function fetchFromOpenAQ(lat, lng) {
  try {
    const url = `https://api.openaq.org/v2/latest?coordinates=${lat},${lng}&radius=5000&limit=10`;
    const res = await fetchWithTimeout(
      url,
      { headers: { 'X-API-Key': process.env.OPENAQ_API_KEY } },
      5000
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;

    // Collect all PM2.5 and PM10 readings
    let pm25Values = [];
    let pm10Values = [];
    for (const result of data.results) {
      for (const m of result.measurements ?? []) {
        if (m.parameter === 'pm25' && m.value > 0) pm25Values.push(m.value);
        if (m.parameter === 'pm10' && m.value > 0) pm10Values.push(m.value);
      }
    }

    let aqiValue = null;
    if (pm25Values.length) {
      const avgPm25 = pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length;
      aqiValue = pm25ToAQI(avgPm25);
    } else if (pm10Values.length) {
      const avgPm10 = pm10Values.reduce((a, b) => a + b, 0) / pm10Values.length;
      aqiValue = pm10ToAQI(avgPm10);
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

// Full 4-level AQI waterfall — never returns null
export async function fetchAQI(lat, lng, clusterId, cityName) {
  // Level 1: OpenAQ live
  const live = await fetchFromOpenAQ(lat, lng);
  if (live) return live;

  // Level 2: Cluster MongoDB cache
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 3: CPCB city average (use cityName or reverse geocode to find it)
  let resolvedCity = cityName;
  let resolvedState = null;

  if (!resolvedCity) {
    const geo = await reverseGeocodeState(lat, lng);
    resolvedCity = geo?.city ?? null;
    resolvedState = geo?.state ?? null;
  } else {
    // Also get state for seasonal fallback
    const geo = await reverseGeocodeState(lat, lng);
    resolvedState = geo?.state ?? null;
  }

  const cpcb = await fetchFromCPCB(resolvedCity);
  if (cpcb) return cpcb;

  // Level 4: State-wise seasonal average — always returns a value
  const value = getSeasonalAQI(resolvedState);
  return { value, category: aqiCategory(value), source: 'seasonal' };
}
