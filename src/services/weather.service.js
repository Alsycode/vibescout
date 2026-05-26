// FILE: src/services/weather.service.js
// PURPOSE: Weather waterfall — OpenWeatherMap live → cluster cache → seasonal city averages

import fetch from 'node-fetch';
import Cluster from '../models/Cluster.js';
import { getSeasonalWeather, WEATHER_STATE_NAME_MAP } from '../data/cityWeatherAverages.js';

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

async function reverseGeocodeState(lat, lng) {
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'Vibescout/1.0' } },
      5000
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.address?.state ?? null;
  } catch {
    return null;
  }
}

// Level 1: OpenWeatherMap live data
async function fetchFromOpenWeatherMap(lat, lng) {
  if (!process.env.OPENWEATHER_API_KEY) return null;
  try {
    const url =
      `https://api.openweathermap.org/data/2.5/weather` +
      `?lat=${lat}&lon=${lng}` +
      `&appid=${process.env.OPENWEATHER_API_KEY}` +
      `&units=metric`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return null;
    const data = await res.json();
    const temp = data?.main?.temp;
    const humidity = data?.main?.humidity;
    const description = data?.weather?.[0]?.description ?? null;
    if (temp == null || humidity == null) return null;
    return {
      temp: Math.round(temp),
      humidity,
      description,
      source: 'live',
    };
  } catch {
    return null;
  }
}

// Level 2: Cluster MongoDB cache
async function fetchFromClusterCache(clusterId) {
  try {
    const cluster = await Cluster.findOne({ clusterId });
    if (!cluster?.cachedWeather?.updatedAt) return null;
    const { temp, humidity, description } = cluster.cachedWeather;
    if (temp == null || humidity == null) return null;
    return { temp, humidity, description: description ?? null, source: 'cache' };
  } catch {
    return null;
  }
}

// Full 3-level weather waterfall — never returns null
export async function fetchWeather(lat, lng, clusterId, cityName) {
  // Level 1: OpenWeatherMap live
  const live = await fetchFromOpenWeatherMap(lat, lng);
  if (live) return live;

  // Level 2: Cluster MongoDB cache
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 3: Seasonal state averages — always returns a value
  let stateName = null;
  try {
    stateName = await reverseGeocodeState(lat, lng);
  } catch {
    // ignore
  }

  const seasonal = getSeasonalWeather(stateName);
  return {
    temp: seasonal.temp,
    humidity: seasonal.humidity,
    description: null,
    source: 'seasonal',
  };
}
