// FILE: src/services/solar.service.js
// PURPOSE: Solar waterfall — Open-Meteo live → cluster cache → latitude-based computation

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

function solarViability(peakSunHours) {
  if (peakSunHours > 5) return 'Good';
  if (peakSunHours > 3) return 'Moderate';
  return 'Poor';
}

// Pure JS latitude-based solar estimate — zero API dependency
// Formula from Section 4: baseHours = 8 - ((lat - 8) / 29) * 2
function estimateSolarFromLatitude(lat, facingDirection = 'Unknown') {
  const baseHours = 8 - ((lat - 8) / 29) * 2;
  const facingBonus = ['E', 'NE', 'SE'].includes(facingDirection) ? 0.5 : 0;
  return parseFloat(Math.max(2, baseHours + facingBonus).toFixed(1));
}

// Level 1: Open-Meteo live data (free, no key required)
// peakSunHours = count of hourly slots where direct_radiation > 200 W/m²
async function fetchFromOpenMeteo(lat, lng) {
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&hourly=direct_radiation` +
      `&timezone=Asia%2FKolkata` +
      `&forecast_days=1`;
    const res = await fetchWithTimeout(url, {}, 5000);
    if (!res.ok) return null;
    const data = await res.json();
    const radiation = data?.hourly?.direct_radiation;
    if (!Array.isArray(radiation) || !radiation.length) return null;

    const peakSunHours = radiation.filter((r) => r > 200).length;
    const viability = solarViability(peakSunHours);

    // Additional derived scores for the Cluster cache shape
    const morningRadiation = radiation.slice(6, 12);
    const morningScore = morningRadiation.filter((r) => r > 100).length;
    const wfhLightScore = Math.min(10, Math.round((peakSunHours / 8) * 10));
    const acSavingsEstimate = Math.round(peakSunHours * 0.8); // rough kWh/day estimate

    return {
      peakSunHours,
      morningScore,
      wfhLightScore,
      acSavingsEstimate,
      solarPanelViability: viability,
      viability,
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
    if (!cluster?.cachedSolar?.updatedAt) return null;
    const cs = cluster.cachedSolar;
    if (cs.peakSunHours == null) return null;
    return {
      peakSunHours: cs.peakSunHours,
      morningScore: cs.morningScore,
      wfhLightScore: cs.wfhLightScore,
      acSavingsEstimate: cs.acSavingsEstimate,
      solarPanelViability: cs.solarPanelViability,
      viability: cs.solarPanelViability,
      source: 'cache',
    };
  } catch {
    return null;
  }
}

// Full 3-level solar waterfall — never returns null
export async function fetchSolar(lat, lng, clusterId) {
  // Level 1: Open-Meteo live
  const live = await fetchFromOpenMeteo(lat, lng);
  if (live) return live;

  // Level 2: Cluster MongoDB cache
  if (clusterId) {
    const cached = await fetchFromClusterCache(clusterId);
    if (cached) return cached;
  }

  // Level 3: Computed from latitude — always returns a value
  const peakSunHours = estimateSolarFromLatitude(lat);
  const viability = solarViability(peakSunHours);
  return {
    peakSunHours,
    morningScore: Math.round(peakSunHours * 0.8),
    wfhLightScore: Math.min(10, Math.round((peakSunHours / 8) * 10)),
    acSavingsEstimate: Math.round(peakSunHours * 0.8),
    solarPanelViability: viability,
    viability,
    source: 'computed',
  };
}
