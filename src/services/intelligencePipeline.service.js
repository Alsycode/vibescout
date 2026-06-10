// FILE: src/services/intelligencePipeline.service.js
// PURPOSE: Intelligence pipeline — waterfall wrappers (Part 9a) + orchestrator (Part 9b)

import Cluster from '../models/Cluster.js';
import ShadowProperty from '../models/ShadowProperty.js';
import { redisGet, redisSet } from '../lib/redis.js';
import { fetchAQI } from './aqi.service.js';
import { fetchNoise } from './noise.service.js';
import { fetchSolar } from './solar.service.js';
import { fetchWeather } from './weather.service.js';
import { fetchAmenities } from './places.service.js';
import { fetchNewsWithFallback } from './news.service.js';
import { getSeasonalAQI, CITY_AQI_AVERAGES } from '../data/cityAQIAverages.js';
import { getSeasonalWeather } from '../data/cityWeatherAverages.js';

// ─── Part 9a — Waterfall helpers ────────────────────────────────────

const SIGNAL_CACHE_FIELD_MAP = {
  AQI:     'cachedAQI',
  Weather: 'cachedWeather',
  Solar:   'cachedSolar',
};

function fetchSignalLive(signalType, lat, lng, cityName) {
  switch (signalType) {
    case 'AQI':     return fetchAQI(lat, lng, null, cityName);
    case 'Weather': return fetchWeather(lat, lng, null, cityName);
    case 'Solar':   return fetchSolar(lat, lng, null);
    default:        return Promise.resolve(null);
  }
}

async function cacheClusterSignal(clusterId, signalType, data) {
  const cacheField = SIGNAL_CACHE_FIELD_MAP[signalType];
  if (!cacheField) return;

  try {
    await redisSet(
      `cluster:${clusterId}:${signalType}`,
      JSON.stringify(data),
      86400,
    );
    await Cluster.findOneAndUpdate(
      { clusterId },
      { [cacheField]: { ...data, updatedAt: new Date() } },
    );
  } catch (err) {
    console.error(`[Pipeline] Cache write failed for ${signalType}:`, err.message);
  }
}

export async function getOrFetchClusterSignal(clusterId, lat, lng, signalType, cityName) {
  // 1. Redis hot cache
  try {
    const cached = await redisGet(`cluster:${clusterId}:${signalType}`);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return { ...parsed, source: 'cache' };
    }
  } catch {
    // Redis miss — continue
  }

  // 2. MongoDB cluster cache
  const cacheField = SIGNAL_CACHE_FIELD_MAP[signalType];
  if (cacheField) {
    try {
      const cluster = await Cluster.findOne({ clusterId });
      if (cluster?.[cacheField]?.updatedAt) {
        return { ...cluster[cacheField].toObject(), source: 'cache' };
      }
    } catch {
      // DB miss — continue
    }
  }

  // 3. Live fetch
  try {
    const fresh = await fetchSignalLive(signalType, lat, lng, cityName);
    if (fresh) {
      await cacheClusterSignal(clusterId, signalType, fresh);
      return { ...fresh, source: 'live' };
    }
  } catch {
    // Live failed — fall through to fallback
  }

  // 4. Guaranteed fallback
  return getFallbackSignal(signalType, lat, lng, cityName);
}

export async function fetchNoiseWithFallback(lat, lng, clusterId, cityName) {
  try {
    const result = await fetchNoise(lat, lng, clusterId, cityName);
    return result;
  } catch (err) {
    console.error('[Pipeline] Noise waterfall error:', err.message);
    // Absolute fallback — matches new Noise Risk Engine v1 output shape
    return {
      noiseRiskScore: 40,
      estimatedDb:    58,
      category:       'Moderate',
      confidence:     'low',
      factors:        [],
      explanation:    ['Unable to fetch noise data — default moderate estimate applied'],
      source:         'estimated',
    };
  }
}

export async function fetchAmenitiesWithFallback(lat, lng, clusterId, cityName) {
  try {
    const result = await fetchAmenities(lat, lng, clusterId);
    return result;
  } catch (err) {
    console.error('[Pipeline] Amenities waterfall error:', err.message);
    return {
      schools: [], hospitals: [], gyms: [],
      restaurants: [], parks: [], worship: [], cafes: [],
      source: 'seed',
    };
  }
}

export function getFallbackSignal(signalType, lat, lng, cityName) {
  switch (signalType) {
    case 'AQI': {
      // NOTE (SF-07): Unreachable in normal pipeline flow — fetchAQI() never returns null
      // (it has its own Level 4 seasonal fallback). Kept for defensive safety only.
      const value = typeof getSeasonalAQI === 'function' ? getSeasonalAQI(null) : 80;
      const category = value <= 50 ? 'Good'
        : value <= 100 ? 'Satisfactory'
        : value <= 200 ? 'Moderate'
        : 'Poor';
      return { value, category, source: 'seasonal' };
    }
    case 'Weather': {
      const seasonal = typeof getSeasonalWeather === 'function'
        ? getSeasonalWeather(null)
        : { temp: 28, humidity: 65 };
      return { temp: seasonal.temp, humidity: seasonal.humidity, description: null, source: 'seasonal' };
    }
    case 'Solar': {
      const baseHours = 8 - ((lat - 8) / 29) * 2;
      const peakSunHours = Math.round(Math.max(2, Math.min(8, baseHours)) * 10) / 10;
      const viability = peakSunHours > 5 ? 'Good' : peakSunHours > 3 ? 'Moderate' : 'Poor';
      return { peakSunHours, viability, source: 'computed' };
    }
    default:
      return { value: null, source: 'fallback' };
  }
}

// ─── Part 9b — Orchestrator ─────────────────────────────────────────

export async function runPipeline(shadowPropertyId, lat, lng, clusterId, cityName) {
  const sp = await ShadowProperty.findById(shadowPropertyId);
  const sessionId = sp?.sessionId;

  const [aqi, noise, solar, weather, amenities, localNews] = await Promise.all([
    getOrFetchClusterSignal(clusterId, lat, lng, 'AQI', cityName),
    fetchNoiseWithFallback(lat, lng, clusterId, cityName),
    getOrFetchClusterSignal(clusterId, lat, lng, 'Solar', cityName),
    getOrFetchClusterSignal(clusterId, lat, lng, 'Weather', cityName),
    fetchAmenitiesWithFallback(lat, lng, clusterId, cityName),
    fetchNewsWithFallback(clusterId, cityName),
  ]);

  // SF-02: Removed dead Redis write — session:{sessionId}:intelligence was never read
  // Intelligence is persisted to MongoDB (ShadowProperty) and read from there by report generation

  // RACE-01: Wrap finalization in try/catch — set status:'failed' if writes fail
  try {
    await ShadowProperty.findByIdAndUpdate(shadowPropertyId, {
      intelligence: { aqi, noise, solar, weather, amenities, localNews },
      dataSource: {
        aqi:       aqi.source,
        noise:     noise.source,
        solar:     solar.source,
        weather:   weather.source,
        amenities: amenities.source,
        localNews: localNews.source,
      },
      status: 'completed',
    });

    // Update cluster lastSearchedAt
    await Cluster.findOneAndUpdate(
      { clusterId },
      { lastSearchedAt: new Date() },
    );
  } catch (err) {
    console.error(`[Pipeline] Finalization failed for ${shadowPropertyId}:`, err.message);
    try {
      await ShadowProperty.findByIdAndUpdate(shadowPropertyId, { status: 'failed' });
    } catch (innerErr) {
      console.error(`[Pipeline] Could not set failed status:`, innerErr.message);
    }
  }
}
