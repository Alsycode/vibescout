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
import { computeLivabilityIndex } from './livability.service.js';
import { computeMaturityScore } from './maturity.service.js';
import { computeSolarSavings } from './solarSavings.service.js';
import { extractInfraSignals } from './infrastructureMomentum.service.js';
import { fetchLandHistory } from './jrc.service.js';

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

    // Cluster schema stores AQI as 'aqi', but fetchAQI returns 'value' — align on write
    const dbPayload = { ...data, updatedAt: new Date() };
    if (signalType === 'AQI') {
      if (dbPayload.value !== undefined) dbPayload.aqi = dbPayload.value;
      delete dbPayload.value;
      delete dbPayload.source;
    }

    await Cluster.findOneAndUpdate(
      { clusterId },
      { [cacheField]: dbPayload },
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
        const raw = cluster[cacheField].toObject();
        // Cluster schema stores AQI as 'aqi', pipeline expects 'value' — normalize on read
        if (signalType === 'AQI' && raw.aqi != null) raw.value = raw.aqi;
        return { ...raw, source: 'cache' };
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

// ─── Signal Timeout Wrapper ─────────────────────────────────────────
// Prevents any single signal fetch from blocking the entire pipeline (max 10s each)
function withTimeout(promise, timeoutMs = 10000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// ─── Part 9b — Orchestrator ─────────────────────────────────────────

export async function runPipeline(shadowPropertyId, lat, lng, clusterId, cityName, locationCascade) {
  const sp = await ShadowProperty.findById(shadowPropertyId);
  const sessionId = sp?.sessionId;

  // Define timeout fallbacks for each signal
  const aqiFallback = getFallbackSignal('AQI', lat, lng, cityName);
  const noiseFallback = {
    noiseRiskScore: 40,
    estimatedDb: 58,
    category: 'Moderate',
    confidence: 'low',
    factors: [],
    explanation: ['Signal timeout — default moderate estimate applied'],
    source: 'timeout_fallback',
  };
  const solarFallback = getFallbackSignal('Solar', lat, lng, cityName);
  const weatherFallback = getFallbackSignal('Weather', lat, lng, cityName);
  const amenitiesFallback = {
    schools: [], hospitals: [], gyms: [],
    restaurants: [], parks: [], worship: [], cafes: [],
    source: 'timeout_fallback',
  };
  const newsFallback = { headlines: [], source: 'timeout_fallback' };

  // Fetch all signals with 10s timeout per signal; use fallback if timeout occurs
  const [aqi, noise, solar, weather, amenities, localNews] = await Promise.all([
    withTimeout(getOrFetchClusterSignal(clusterId, lat, lng, 'AQI', cityName), 10000)
      .catch(err => { console.warn('[Pipeline] AQI timeout:', err.message); return aqiFallback; }),
    withTimeout(fetchNoiseWithFallback(lat, lng, clusterId, cityName), 10000)
      .catch(err => { console.warn('[Pipeline] Noise timeout:', err.message); return noiseFallback; }),
    withTimeout(getOrFetchClusterSignal(clusterId, lat, lng, 'Solar', cityName), 10000)
      .catch(err => { console.warn('[Pipeline] Solar timeout:', err.message); return solarFallback; }),
    withTimeout(getOrFetchClusterSignal(clusterId, lat, lng, 'Weather', cityName), 10000)
      .catch(err => { console.warn('[Pipeline] Weather timeout:', err.message); return weatherFallback; }),
    withTimeout(fetchAmenitiesWithFallback(lat, lng, clusterId, cityName), 10000)
      .catch(err => { console.warn('[Pipeline] Amenities timeout:', err.message); return amenitiesFallback; }),
    withTimeout(fetchNewsWithFallback(clusterId, locationCascade || cityName), 10000)
      .catch(err => { console.warn('[Pipeline] LocalNews timeout:', err.message); return newsFallback; }),
  ]);

  // ─── Derived signals — computed from already-fetched data (no extra API cost for 4 of 5) ───
  const livabilityIndex        = computeLivabilityIndex(aqi, noise, amenities, solar);
  const maturityScore          = computeMaturityScore(amenities);
  const solarSavings           = computeSolarSavings(solar?.peakSunHours);
  const infrastructureMomentum = extractInfraSignals(localNews?.headlines ?? []);

  let landHistory = null;
  try {
    landHistory = await withTimeout(fetchLandHistory(lat, lng), 12000);
  } catch (err) {
    console.warn('[Pipeline] Land history fetch failed:', err.message);
  }

  // SF-02: Removed dead Redis write — session:{sessionId}:intelligence was never read
  // Intelligence is persisted to MongoDB (ShadowProperty) and read from there by report generation

  // RACE-01: Wrap finalization in try/catch — set status:'failed' if writes fail
  try {
    await ShadowProperty.findByIdAndUpdate(shadowPropertyId, {
      intelligence: {
        aqi, noise, solar, weather, amenities, localNews,
        livabilityIndex, maturityScore, solarSavings,
        infrastructureMomentum, landHistory,
      },
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
