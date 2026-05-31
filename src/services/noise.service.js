// FILE: src/services/noise.service.js
// PURPOSE: Noise waterfall — HowLoud live → cluster cache → GROQ structured estimate

import fetch from 'node-fetch';
import Cluster from '../models/Cluster.js';

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

function noiseCategory(db) {
  if (db < 45) return 'Quiet';
  if (db < 55) return 'Moderate';
  if (db < 65) return 'Loud';
  if (db < 75) return 'Very Loud';
  return 'Extremely Loud';
}

// Level 1: HowLoud at exact property coordinates
// Score range 50–100 → dB = 110 - score
async function fetchFromHowLoud(lat, lng) {
  if (!process.env.HOWLOUD_API_KEY) return null;
  try {
    // NOTE (INT-02): Plain HTTP — verify HTTPS support with diagnostics/probe-fetches.mjs
    // before changing to https://. If HTTPS unsupported, request fails fast and falls to Level 2.
    const url =
      `http://elb1.howloud.com/score` +
      `?key=${process.env.HOWLOUD_API_KEY}&latitude=${lat}&longitude=${lng}`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return null;
    const data = await res.json();
    // HowLoud returns { result: [{ score: number }] } or similar
    const score = data?.result?.[0]?.score ?? data?.score ?? null;
    if (score === null || score < 50 || score > 100) return null;
    const estimatedDb = 110 - score;
    return {
      estimatedDb,
      category: noiseCategory(estimatedDb),
      source: 'live',
    };
  } catch {
    return null;
  }
}

// Level 2: Cluster MongoDB cached noise
async function fetchFromClusterCache(clusterId) {
  try {
    const cluster = await Cluster.findOne({ clusterId });
    if (!cluster?.cachedNoise?.updatedAt) return null;
    const { estimatedDb, category } = cluster.cachedNoise;
    if (estimatedDb == null) return null;
    return {
      estimatedDb,
      category: category || noiseCategory(estimatedDb),
      source: 'cache',
    };
  } catch {
    return null;
  }
}

// Derives nearby place type hints from cluster amenities cache
function deriveNearbyPlaceTypes(cachedAmenities) {
  if (!cachedAmenities) return [];
  const types = [];
  if (cachedAmenities.schools?.length) types.push('school');
  if (cachedAmenities.hospitals?.length) types.push('hospital');
  if (cachedAmenities.gyms?.length) types.push('gym');
  if (cachedAmenities.restaurants?.length) types.push('restaurant');
  if (cachedAmenities.parks?.length) types.push('park');
  if (cachedAmenities.cafes?.length) types.push('cafe');
  if (cachedAmenities.worship?.length) types.push('place_of_worship');
  return types;
}

// Level 3: GROQ structured noise estimate — coordinates NEVER sent to GROQ
async function estimateNoiseWithGroq(clusterId, floorLevel) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    // Load cluster amenities to derive place type context
    const cluster = clusterId ? await Cluster.findOne({ clusterId }) : null;
    const nearbyPlaceTypes = deriveNearbyPlaceTypes(cluster?.cachedAmenities);
    const roadProximity = nearbyPlaceTypes.includes('restaurant') ? 'busy_street' : 'local_road';

    const inputContext = {
      nearbyPlaceTypes: nearbyPlaceTypes.length ? nearbyPlaceTypes : ['residential'],
      floorLevel: floorLevel || 'Unknown',
      roadProximity,
    };

    const systemPrompt =
      'You are a noise level estimator for residential property analysis. ' +
      'Based on the provided environment context, estimate the ambient noise level in decibels. ' +
      'Return ONLY valid JSON: {"estimatedDb": number}. ' +
      'Typical ranges: quiet residential 35-50 dB, normal residential 50-60 dB, ' +
      'busy street 65-75 dB, very noisy area 75-90 dB. ' +
      'Do not include any explanation. Start with { and end with }.';

    const res = await fetchWithTimeout(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: 50,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: JSON.stringify(inputContext) },
          ],
        }),
      },
      8000
    );

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    const estimatedDb = parsed?.estimatedDb;
    if (typeof estimatedDb !== 'number' || estimatedDb < 20 || estimatedDb > 120) return null;
    return { estimatedDb, category: noiseCategory(estimatedDb), source: 'estimated' };
  } catch {
    return null;
  }
}

// Full 3-level noise waterfall — never returns null
// floorLevel: from userProvidedSpecs.floor — used for GROQ context
// NOTE (SF-08): floorLevel is always 'Unknown' in the pipeline because the pipeline
// runs before the user submits property details in Step 4. Architectural constraint — by design.
export async function fetchNoise(lat, lng, clusterId, floorLevel = 'Unknown') {
  // Level 1: HowLoud at exact coordinates
  const live = await fetchFromHowLoud(lat, lng);
  if (live) return live;

  // Level 2: Cluster MongoDB cache
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 3: GROQ structured estimate — no coordinates sent
  const estimated = await estimateNoiseWithGroq(clusterId, floorLevel);
  if (estimated) return estimated;

  // Absolute fallback — GROQ failed; return safe default
  return { estimatedDb: 55, category: 'Moderate', source: 'estimated' };
}
