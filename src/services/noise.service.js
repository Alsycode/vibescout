// FILE: src/services/noise.service.js
// PURPOSE: Noise Risk Engine v1 — OSM/Overpass primary, cluster cache, Groq AI fallback.
// No noise APIs. All India locations supported.
//
// Waterfall:
//   Level 1 — Overpass live OSM query (primary + fallback endpoint)
//   Level 2 — Cluster MongoDB cache (30-day TTL)
//   Level 3 — Groq AI estimation (city/locality context only, no coordinates)
//   Absolute — safe hardcoded default (if Groq also fails)

import fetch from 'node-fetch';
import Cluster from '../models/Cluster.js';

// ─── Fetch helper ────────────────────────────────────────────────────────────

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

// ─── Overpass endpoints ───────────────────────────────────────────────────────

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

// ─── Scoring matrix ───────────────────────────────────────────────────────────
// Each entry: { maxDist, points }[] — checked from closest to furthest

const SCORING_RULES = {
  motorway:    [{ max: 100, pts: 30 }, { max: 250, pts: 20 }, { max: 500, pts: 10 }],
  trunk:       [{ max: 100, pts: 20 }, { max: 250, pts: 10 }, { max: 500, pts:  5 }],
  primary:     [{ max: 100, pts: 15 }, { max: 250, pts: 10 }, { max: 500, pts:  5 }],
  secondary:   [{ max: 100, pts: 10 }, { max: 250, pts:  5 }],
  railway:     [{ max: 100, pts: 25 }, { max: 250, pts: 15 }, { max: 500, pts:  5 }],
  rail_station:[{ max: 500, pts: 15 }, { max: 1000, pts:  5 }],
  airport:     [{ max: 5000, pts: 30 }, { max: 10000, pts: 15 }, { max: 20000, pts:  5 }],
  bus_station: [{ max: 500, pts: 10 }, { max: 1000, pts:  5 }],
  industrial:  [{ max: 1000, pts: 20 }, { max: 2000, pts: 10 }],
  commercial:  [{ max: 500, pts: 10 }, { max: 1000, pts:  5 }],
};

// ─── Category bands ───────────────────────────────────────────────────────────

function noiseCategory(score) {
  if (score <= 20) return 'Very Quiet';
  if (score <= 40) return 'Quiet';
  if (score <= 60) return 'Moderate';
  if (score <= 80) return 'Noisy';
  return 'Very Noisy';
}

// ─── noiseRiskScore → estimatedDb mapping ────────────────────────────────────
// Preserves backward-compat with verdictEngine which reads estimatedDb (dB).
// score 0 → ~30 dB (countryside), score 100 → ~100 dB (next to highway)

function scoreToDb(score) {
  return Math.round(30 + (score / 100) * 70);
}

// ─── Overpass query builder ───────────────────────────────────────────────────
// Uses `out center;` so only centroids are returned — avoids huge way geometry.

function buildOverpassQuery(lat, lng, radiusM) {
  const around = `(around:${radiusM},${lat},${lng})`;
  return `
[out:json][timeout:15];
(
  way["highway"="motorway"]${around};
  way["highway"="trunk"]${around};
  way["highway"="primary"]${around};
  way["highway"="secondary"]${around};
  way["railway"="rail"]${around};
  node["railway"="station"]${around};
  way["railway"="station"]${around};
  node["aeroway"="aerodrome"]${around};
  way["aeroway"="aerodrome"]${around};
  node["amenity"="bus_station"]${around};
  way["amenity"="bus_station"]${around};
  way["landuse"="industrial"]${around};
  way["landuse"="commercial"]${around};
);
out center;
`.trim();
}

// ─── Haversine distance (metres) ─────────────────────────────────────────────

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

// ─── Tag → feature type mapper ────────────────────────────────────────────────

function elementToFeatureType(el) {
  const t = el.tags ?? {};
  if (t.highway === 'motorway')  return 'motorway';
  if (t.highway === 'trunk')     return 'trunk';
  if (t.highway === 'primary')   return 'primary';
  if (t.highway === 'secondary') return 'secondary';
  if (t.railway === 'rail')      return 'railway';
  if (t.railway === 'station')   return 'rail_station';
  if (t.aeroway === 'aerodrome') return 'airport';
  if (t.amenity === 'bus_station') return 'bus_station';
  if (t.landuse === 'industrial')  return 'industrial';
  if (t.landuse === 'commercial')  return 'commercial';
  return null;
}

// ─── Core OSM processor ───────────────────────────────────────────────────────

function processOsmElements(elements, lat, lng) {
  // Find nearest distance per feature type
  const nearest = {};

  for (const el of elements) {
    const featureType = elementToFeatureType(el);
    if (!featureType) continue;

    // Nodes have lat/lon directly; ways have a `center` object from `out center;`
    const elLat = el.lat ?? el.center?.lat;
    const elLng = el.lon ?? el.center?.lon;
    if (elLat == null || elLng == null) continue;

    const dist = haversineM(lat, lng, elLat, elLng);
    if (nearest[featureType] == null || dist < nearest[featureType]) {
      nearest[featureType] = dist;
    }
  }

  // Compute score contributions
  let score = 0;
  const factors = [];
  const explanation = [];

  for (const [feature, rules] of Object.entries(SCORING_RULES)) {
    const dist = nearest[feature];
    if (dist == null) continue;

    for (const rule of rules) {
      if (dist < rule.max) {
        score += rule.pts;
        factors.push({ feature, distanceMeters: dist, scoreContribution: rule.pts });
        explanation.push(
          `${feature.replace('_', ' ')} located ${dist}m away (+${rule.pts} pts)`,
        );
        break; // only the tightest band counts
      }
    }
  }

  const noiseRiskScore = Math.min(100, Math.max(0, score));
  const category = noiseCategory(noiseRiskScore);
  const estimatedDb = scoreToDb(noiseRiskScore);

  return { noiseRiskScore, category, estimatedDb, factors, explanation };
}

// ─── Level 1: Overpass live query ─────────────────────────────────────────────

async function fetchFromOverpass(lat, lng) {
  const query = buildOverpassQuery(lat, lng, 5000);
  const body  = `data=${encodeURIComponent(query)}`;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        },
        12000,
      );
      if (!res.ok) continue;

      const data = await res.json();
      const elements = data?.elements ?? [];
      if (!elements.length) {
        // Valid response but no OSM features within 5 km — very rural area
        return {
          noiseRiskScore: 0,
          category:       'Very Quiet',
          estimatedDb:    30,
          factors:        [],
          explanation:    ['No significant noise sources found within 5 km'],
          confidence:     'high',
          source:         'osm_live',
        };
      }

      const result = processOsmElements(elements, lat, lng);
      return { ...result, confidence: 'high', source: 'osm_live' };
    } catch {
      // Try next endpoint
    }
  }

  return null; // both endpoints failed
}

// ─── Level 2: Cluster MongoDB cache (30-day TTL) ──────────────────────────────

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

async function fetchFromClusterCache(clusterId) {
  try {
    const cluster = await Cluster.findOne({ clusterId });
    const cn = cluster?.cachedNoise;
    if (!cn?.updatedAt) return null;

    // Enforce 30-day TTL — stale cache triggers re-fetch
    const ageMs = Date.now() - new Date(cn.updatedAt).getTime();
    if (ageMs > CACHE_TTL_MS) return null;

    if (cn.estimatedDb == null) return null;

    return {
      noiseRiskScore: cn.noiseRiskScore ?? null,
      estimatedDb:    cn.estimatedDb,
      category:       cn.category,
      confidence:     cn.confidence ?? 'medium',
      factors:        cn.factors    ?? [],
      explanation:    cn.explanation ?? [],
      source:         'osm_cache',
    };
  } catch {
    return null;
  }
}

// ─── Level 3: Groq AI estimation ─────────────────────────────────────────────
// Coordinates are NOT sent. Only locality/city/district context is used.

async function estimateWithGroq(cityName) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const systemPrompt =
      'You are a noise risk estimator for residential property analysis in India. ' +
      'Based on the provided locality context, estimate the ambient noise risk score (0–100) ' +
      'where 0 = Very Quiet and 100 = Very Noisy. ' +
      'Return ONLY valid JSON: {"noiseRiskScore": number, "category": string, "explanation": string}. ' +
      'Category must be one of: Very Quiet, Quiet, Moderate, Noisy, Very Noisy. ' +
      'Do not invent specific roads, distances, or landmarks. ' +
      'Do not include coordinates. Start with { and end with }.';

    const userContent = JSON.stringify({
      locality: cityName ?? 'Unknown',
      country:  'India',
    });

    const res = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model:       'llama-3.1-8b-instant',
          max_tokens:  80,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userContent },
          ],
        }),
      },
      8000,
    );

    if (!res.ok) return null;
    const data    = await res.json();
    const raw     = data.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed  = JSON.parse(cleaned);

    const noiseRiskScore = parsed?.noiseRiskScore;
    if (typeof noiseRiskScore !== 'number' || noiseRiskScore < 0 || noiseRiskScore > 100) {
      return null;
    }

    return {
      noiseRiskScore,
      estimatedDb:  scoreToDb(noiseRiskScore),
      category:     parsed.category ?? noiseCategory(noiseRiskScore),
      confidence:   'low',
      factors:      [],
      explanation:  [parsed.explanation ?? 'AI-estimated based on locality context'],
      source:       'ai_estimation',
    };
  } catch {
    return null;
  }
}

// ─── Public export — full 3-level waterfall ───────────────────────────────────
// Signature unchanged from the old service so intelligencePipeline needs no edits.

export async function fetchNoise(lat, lng, clusterId, cityName) {
  // Level 1: Overpass live OSM
  const live = await fetchFromOverpass(lat, lng);
  if (live) {
    // Write-through to cluster cache
    if (clusterId) {
      try {
        await Cluster.findOneAndUpdate(
          { clusterId },
          {
            cachedNoise: {
              estimatedDb:    live.estimatedDb,
              noiseRiskScore: live.noiseRiskScore,
              category:       live.category,
              confidence:     live.confidence,
              factors:        live.factors,
              explanation:    live.explanation,
              source:         'osm_live',
              updatedAt:      new Date(),
            },
          },
        );
      } catch (err) {
        console.error('[Noise] Cache write-through failed:', err.message);
      }
    }
    return live;
  }

  // Level 2: Cluster cache (30-day TTL)
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 3: Groq AI estimation (locality context only)
  const estimated = await estimateWithGroq(cityName);
  if (estimated) return estimated;

  // Absolute fallback — all levels failed
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
