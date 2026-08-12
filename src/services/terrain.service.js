// FILE: src/services/terrain.service.js
// PURPOSE: Terrain position + drainage risk — does water COLLECT at this property?
//          Complements jrc.service.js, which answers "was there ever water at this pixel"
//          and "how close is the nearest water body". Neither of those catches the actual
//          mechanism behind Indian urban waterlogging: a plot sitting in a local depression
//          with nowhere for runoff to go. A site 200m from a lake but 10m above it drains
//          fine; a site 2km from any water but in a bowl floods every monsoon.
//
// Method: sample elevation at the property plus two concentric rings around it, then compare
// the property against the median of its surroundings.
//
// Sources (both free, no API key, full India coverage):
//   Level 1 — Open-Meteo Elevation (Copernicus DEM GLO-90, ~90m/px)
//   Level 2 — OpenTopoData (SRTM 30m)
//   Level 3 — null; the report card hides rather than guessing.

import fetch from 'node-fetch';

// Radii were calibrated against known-flooding vs known-dry localities in Bengaluru.
// Tight rings (<1km) fail badly: the Challaghatta/Bellandur flood valleys are kilometres
// wide, so a 400m ring samples inside the valley and reports a flood-prone plot as
// "elevated". At 6km the separation is clean — flooding localities read 7–23m below their
// regional median, ridge localities 18–26m above.
const RING_RADII_M  = [1000, 3000, 6000];
const RING_BEARINGS = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

// DEM returns ~0m over sea and large water bodies. Left in the sample these drag the
// regional median down and make every coastal property look elevated, which is how a
// first pass rated low-lying Mumbai localities as low-risk. Treated as water, not ground.
const SEA_LEVEL_M = 1;

// Above this share of water in the surroundings the "relative to surroundings" question
// stops being meaningful — the surroundings are the sea — and absolute height takes over.
const COASTAL_WATER_SHARE = 0.15;

// Half a ring of real ground is the minimum for a median worth quoting. Below it the
// service returns null and the card hides — a fabricated flood reading is worse than none.
const MIN_LAND_SAMPLES = 6;

// Copernicus GLO-90 carries 1–2m vertical error and regional medians add more, so
// anything inside ±LEVEL_BAND_M is reported as level ground rather than dressed up as
// precision we don't have.
const LEVEL_BAND_M = 5;

// Below this much local relief the terrain is effectively flat, DEM noise dominates the
// relative-elevation reading, and confidence is downgraded accordingly.
const FLAT_TERRAIN_RELIEF_M = 8;

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

// Property first, then each ring clockwise from north. Index 0 is always the property itself.
function buildSamplePoints(lat, lng) {
  const points = [{ lat, lng }];
  const latRad = (lat * Math.PI) / 180;
  for (const radius of RING_RADII_M) {
    for (const bearing of RING_BEARINGS) {
      const rad  = (bearing * Math.PI) / 180;
      const dLat = (radius * Math.cos(rad)) / 111320;
      const dLng = (radius * Math.sin(rad)) / (111320 * Math.cos(latRad));
      points.push({ lat: lat + dLat, lng: lng + dLng });
    }
  }
  return points;
}

// Level 1: Open-Meteo — batches every point into one request, same vendor already
// relied on for solar, so no new failure domain is introduced.
async function fetchFromOpenMeteo(points) {
  try {
    const lats = points.map((p) => p.lat.toFixed(6)).join(',');
    const lngs = points.map((p) => p.lng.toFixed(6)).join(',');
    const url  = `https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lngs}`;
    const res  = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.elevation) || data.elevation.length !== points.length) return null;
    return data.elevation;
  } catch {
    return null;
  }
}

// Level 2: OpenTopoData SRTM 30m
async function fetchFromOpenTopoData(points) {
  try {
    const locations = points.map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`).join('|');
    const url = `https://api.opentopodata.org/v1/srtm30m?locations=${encodeURIComponent(locations)}`;
    const res = await fetchWithTimeout(url, {}, 8000);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.results) || data.results.length !== points.length) return null;
    return data.results.map((r) => (typeof r?.elevation === 'number' ? r.elevation : null));
  } catch {
    return null;
  }
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// Coastal sites are judged on height above sea level: near the coast the threat is tidal
// surge and a water table that leaves runoff nowhere to go, neither of which shows up as a
// dip relative to neighbours.
function classifyCoastal(elevationM) {
  if (elevationM <= 3) {
    return {
      terrainPosition: 'Coastal low-lying',
      drainageRisk:    'High',
      drainageScore:   75,
      reason:          `Property sits about ${Math.round(elevationM)}m above sea level in a coastal area — exposed to tidal backflow and monsoon waterlogging.`,
    };
  }
  if (elevationM <= 8) {
    return {
      terrainPosition: 'Coastal low-lying',
      drainageRisk:    'Moderate',
      drainageScore:   50,
      reason:          `Property sits about ${Math.round(elevationM)}m above sea level — low enough that drainage during heavy monsoon tides is worth checking.`,
    };
  }
  return null; // High enough to judge on local terrain instead.
}

function classifyInland(relativeM, localReliefM) {
  // On genuinely flat ground the relative reading is inside the error bar either way,
  // so report position honestly and never escalate drainage risk off DEM noise.
  if (localReliefM < FLAT_TERRAIN_RELIEF_M) {
    return {
      terrainPosition: 'Level',
      drainageRisk:    'Low-Moderate',
      drainageScore:   25,
      reason:          'Surrounding terrain is flat, so the property sits level with its neighbourhood. Drainage here depends on stormwater infrastructure rather than slope.',
    };
  }

  if (relativeM <= -15) {
    return {
      terrainPosition: 'Depression',
      drainageRisk:    'High',
      drainageScore:   75,
      reason:          `Property sits about ${Math.abs(Math.round(relativeM))}m below the surrounding area — runoff from the wider neighbourhood drains toward this location, the usual cause of repeat monsoon waterlogging.`,
    };
  }
  if (relativeM <= -LEVEL_BAND_M) {
    return {
      terrainPosition: 'Low-lying',
      drainageRisk:    'Moderate',
      drainageScore:   50,
      reason:          `Property sits about ${Math.abs(Math.round(relativeM))}m below the surrounding area — check stormwater drainage and ask neighbours about past monsoons.`,
    };
  }
  if (relativeM < LEVEL_BAND_M) {
    return {
      terrainPosition: 'Level',
      drainageRisk:    'Low-Moderate',
      drainageScore:   25,
      reason:          'Property sits level with the surrounding area — no natural collection point detected.',
    };
  }
  if (relativeM < 15) {
    return {
      terrainPosition: 'Elevated',
      drainageRisk:    'Low',
      drainageScore:   12,
      reason:          `Property sits about ${Math.round(relativeM)}m above the surrounding area — runoff drains away from this location.`,
    };
  }
  return {
    terrainPosition: 'Ridge',
    drainageRisk:    'Low',
    drainageScore:   8,
    reason:          `Property sits about ${Math.round(relativeM)}m above the surrounding area on high ground — natural drainage is favourable.`,
  };
}

/**
 * Resolve terrain position and drainage risk for a coordinate.
 * Returns null when no elevation source is reachable — callers should hide the card
 * rather than substitute an estimate, since a fabricated flood signal is worse than none.
 */
export async function fetchTerrain(lat, lng) {
  const points = buildSamplePoints(lat, lng);

  let elevations = await fetchFromOpenMeteo(points);
  let source = 'open-meteo';
  if (!elevations) {
    elevations = await fetchFromOpenTopoData(points);
    source = 'opentopodata';
  }
  if (!elevations) return null;

  const propertyElevation = elevations[0];
  if (typeof propertyElevation !== 'number') return null;

  const ringElevations = elevations.slice(1).filter((e) => typeof e === 'number');
  if (!ringElevations.length) return null;

  // Separate ground from water before taking any median.
  const landElevations = ringElevations.filter((e) => e > SEA_LEVEL_M);
  const waterShare     = 1 - landElevations.length / ringElevations.length;
  const isCoastal      = waterShare >= COASTAL_WATER_SHARE;

  if (landElevations.length < MIN_LAND_SAMPLES) return null;

  // The reference must be the OUTERMOST ring alone, not all rings pooled. Pooling
  // reintroduces the tight-radius bug: the 1km and 3km samples sit inside the same valley
  // as the property, drag the median down to its own level, and a plot 13m into a flood
  // basin reads as "level". The outer ring is the only one that carries regional context.
  const outerRing = elevations
    .slice(1 + (RING_RADII_M.length - 1) * RING_BEARINGS.length)
    .filter((e) => typeof e === 'number' && e > SEA_LEVEL_M);

  const referenceSamples = outerRing.length >= MIN_LAND_SAMPLES ? outerRing : landElevations;
  const surroundingMedianM = median(referenceSamples);
  const relativeM          = propertyElevation - surroundingMedianM;
  const allElevations      = [propertyElevation, ...landElevations];
  const localReliefM       = Math.max(...allElevations) - Math.min(...allElevations);

  const classification =
    (isCoastal ? classifyCoastal(propertyElevation) : null)
    ?? classifyInland(relativeM, localReliefM);

  const { terrainPosition, drainageRisk, drainageScore, reason } = classification;

  return {
    elevationM:          Math.round(propertyElevation),
    surroundingMedianM:  Math.round(surroundingMedianM),
    relativeM:           parseFloat(relativeM.toFixed(1)),
    localReliefM:        parseFloat(localReliefM.toFixed(1)),
    terrainPosition,
    drainageRisk,
    drainageScore,
    reason,
    isCoastal,
    confidence:          localReliefM < FLAT_TERRAIN_RELIEF_M ? 'low' : 'moderate',
    samplesUsed:         landElevations.length + 1,
    source,
  };
}
