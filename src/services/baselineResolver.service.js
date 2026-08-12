// FILE: src/services/baselineResolver.service.js
// PURPOSE: Resolves a market-rent baseline for a given city/locality/property-type/BHK,
//          falling back through locality → citywide → tier-average → national-average so
//          every report gets a comparison. Every result carries a `basis` tag so the report
//          never claims sourced-data precision for an estimate.

import seed from '../data/rentSaleBaseline.seed.json' with { type: 'json' };
import { CITY_ALIASES, tierForCity } from '../data/cityTiers.js';

const CITIES = seed.cities;
const CITY_KEYS = Object.keys(CITIES);

function slugify(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// BHK bracket size ordering used for nearest-neighbour fallback when an exact BHK is missing.
const BHK_ORDER = ['1bhk', '2bhk', '3bhk', '4bhk'];

/**
 * Map the funnel's `bhk` enum onto (propertyType, bhkKey) used by the seed file.
 * Returns null for types this feature doesn't support (Studio/Plot/PG — no comparable market data).
 */
export function mapBhkToPropertyType(bhk) {
  // Villa selection in the funnel doesn't capture a BHK size — default to 3BHK,
  // the most common villa configuration in the seed data, for lookup purposes.
  if (bhk === 'Villa') return { propertyType: 'villa', bhkKey: '3bhk' };
  if (bhk === '1BHK') return { propertyType: 'apartment', bhkKey: '1bhk' };
  if (bhk === '2BHK') return { propertyType: 'apartment', bhkKey: '2bhk' };
  if (bhk === '3BHK') return { propertyType: 'apartment', bhkKey: '3bhk' };
  if (bhk === '4BHK+') return { propertyType: 'apartment', bhkKey: '4bhk' };
  return null;
}

function resolveCityKey(cityNameRaw) {
  if (!cityNameRaw) return null;
  const slug = slugify(cityNameRaw);
  if (CITIES[slug]) return slug;
  if (CITY_ALIASES[cityNameRaw.toLowerCase().trim()]) return CITY_ALIASES[cityNameRaw.toLowerCase().trim()];
  if (CITY_ALIASES[slug]) return CITY_ALIASES[slug];
  // last resort: a seed city key contained in (or containing) the slug, e.g. "delhi-ncr-gurgaon" vs "gurgaon"
  const partial = CITY_KEYS.find((k) => k.includes(slug) || slug.includes(k));
  return partial ?? null;
}

function resolveLocalityKey(cityKey, suburbNameRaw) {
  if (!suburbNameRaw) return null;
  const city = CITIES[cityKey];
  if (!city?.localities) return null;
  const slug = slugify(suburbNameRaw);
  const localityKeys = Object.keys(city.localities);
  if (city.localities[slug]) return slug;
  const partial = localityKeys.find((k) => k.includes(slug) || slug.includes(k));
  return partial ?? null;
}

function entryFor(block, propertyType, bhkKey) {
  return block?.[propertyType]?.[bhkKey] ?? null;
}

// Nearest available BHK within the same property type at a given geo block, plus the step
// distance (used to flag confidence — 1 step away is far more trustworthy than 2+).
function nearestBhkEntry(block, propertyType, bhkKey) {
  if (!bhkKey || !block?.[propertyType]) return null;
  const idx = BHK_ORDER.indexOf(bhkKey);
  if (idx === -1) return null;
  for (let dist = 1; dist < BHK_ORDER.length; dist++) {
    for (const dir of [-1, 1]) {
      const candidate = BHK_ORDER[idx + dist * dir];
      if (candidate && block[propertyType][candidate]?.rentPerMonth) {
        return { entry: block[propertyType][candidate], steps: dist };
      }
    }
  }
  return null;
}

// Average villa-vs-apartment rent premium across cities where both exist for the same BHK,
// used to estimate villa rent in cities that only have apartment data (or vice versa).
let cachedPremium = null;
function villaApartmentPremium() {
  if (cachedPremium != null) return cachedPremium;
  const ratios = [];
  for (const city of Object.values(CITIES)) {
    const apt = city.citywide?.apartment;
    const villa = city.citywide?.villa;
    if (!apt || !villa) continue;
    for (const bhkKey of BHK_ORDER) {
      const a = apt[bhkKey]?.rentPerMonth?.avg;
      const v = villa[bhkKey]?.rentPerMonth?.avg;
      if (a && v) ratios.push(v / a);
    }
  }
  cachedPremium = ratios.length ? ratios.reduce((s, r) => s + r, 0) / ratios.length : 1.6;
  return cachedPremium;
}

function estimateOtherPropertyType(block, propertyType, bhkKey) {
  const otherType = propertyType === 'villa' ? 'apartment' : 'villa';
  const otherEntry = entryFor(block, otherType, bhkKey) ?? nearestBhkEntry(block, otherType, bhkKey)?.entry;
  const other = otherEntry?.rentPerMonth;
  if (!other) return null;
  const premium = villaApartmentPremium();
  const factor = propertyType === 'villa' ? premium : 1 / premium;
  return {
    rentPerMonth: {
      low: Math.round((other.low * factor) / 500) * 500,
      avg: Math.round((other.avg * factor) / 500) * 500,
      high: Math.round((other.high * factor) / 500) * 500,
    },
  };
}

function rentFromCitywide(cityKey, propertyType, bhkKey) {
  const city = CITIES[cityKey];
  if (!city) return null;
  const direct = entryFor(city.citywide, propertyType, bhkKey);
  if (direct?.rentPerMonth) {
    return { rentPerMonth: direct.rentPerMonth, basis: 'citywide', label: city.displayName };
  }
  const nearest = nearestBhkEntry(city.citywide, propertyType, bhkKey);
  if (nearest?.entry?.rentPerMonth) {
    return {
      rentPerMonth: nearest.entry.rentPerMonth,
      basis: 'estimated_adjacent_bhk',
      label: city.displayName,
    };
  }
  const estimated = estimateOtherPropertyType(city.citywide, propertyType, bhkKey);
  if (estimated?.rentPerMonth) {
    return { rentPerMonth: estimated.rentPerMonth, basis: 'estimated_multiplier', label: city.displayName };
  }
  return null;
}

function averageAcross(cityKeys, propertyType, bhkKey) {
  const samples = [];
  for (const key of cityKeys) {
    const r = rentFromCitywide(key, propertyType, bhkKey);
    if (r?.rentPerMonth) samples.push(r.rentPerMonth);
  }
  if (!samples.length) return null;
  const avgOf = (field) => Math.round(samples.reduce((s, r) => s + r[field], 0) / samples.length / 500) * 500;
  return { low: avgOf('low'), avg: avgOf('avg'), high: avgOf('high') };
}

/**
 * Resolve a rent baseline for a property.
 * @param {object} params
 * @param {string} params.cityName    - city as resolved by reverse geocoding (ShadowProperty.location.cityName)
 * @param {string} [params.suburb]    - most-specific locality, e.g. location.locationCascade[0]
 * @param {string} params.bhk         - funnel bhk enum value ('1BHK'..'4BHK+', 'Villa', etc.)
 * @returns {object|null} { rentPerMonth: {low,avg,high}, basis, matchedLabel } or null if unsupported/unavailable
 */
export function resolveRentBaseline({ cityName, suburb, bhk }) {
  const mapped = mapBhkToPropertyType(bhk);
  if (!mapped) return null; // Studio/Plot/PG — no comparable baseline concept
  const { propertyType, bhkKey } = mapped;

  const cityKey = resolveCityKey(cityName);

  if (cityKey) {
    const city = CITIES[cityKey];
    const localityKey = resolveLocalityKey(cityKey, suburb);
    if (localityKey) {
      const direct = entryFor(city.localities[localityKey], propertyType, bhkKey);
      if (direct?.rentPerMonth) {
        return {
          rentPerMonth: direct.rentPerMonth,
          basis: 'locality',
          matchedLabel: `${city.displayName} — ${localityKey.replace(/-/g, ' ')}`,
        };
      }
      const nearest = nearestBhkEntry(city.localities[localityKey], propertyType, bhkKey);
      if (nearest?.entry?.rentPerMonth) {
        return {
          rentPerMonth: nearest.entry.rentPerMonth,
          basis: 'estimated_adjacent_bhk',
          matchedLabel: `${city.displayName} — ${localityKey.replace(/-/g, ' ')}`,
        };
      }
    }
    const citywide = rentFromCitywide(cityKey, propertyType, bhkKey);
    if (citywide) {
      return { rentPerMonth: citywide.rentPerMonth, basis: citywide.basis, matchedLabel: citywide.label };
    }
  }

  const tier = cityKey ? tierForCity(cityKey) : 3;
  if (tier <= 2) {
    const tierCities = CITY_KEYS.filter((k) => tierForCity(k) === tier && k !== cityKey);
    const tierAvg = averageAcross(tierCities, propertyType, bhkKey);
    if (tierAvg) {
      return { rentPerMonth: tierAvg, basis: 'tier_estimate', matchedLabel: `Tier ${tier} city average` };
    }
  }

  const nationalAvg = averageAcross(CITY_KEYS, propertyType, bhkKey);
  if (nationalAvg) {
    return { rentPerMonth: nationalAvg, basis: 'national_estimate', matchedLabel: 'National average' };
  }

  return null;
}

const BASIS_CONFIDENCE = {
  locality: 'high',
  citywide: 'high',
  estimated_adjacent_bhk: 'medium',
  estimated_multiplier: 'medium',
  tier_estimate: 'low',
  national_estimate: 'low',
};

/**
 * Full rent comparison: resolves the baseline and scores the user's actual rent against it.
 * @param {number} actualRent - the exact monthly rent the user entered
 */
export function compareRentToBaseline({ cityName, suburb, bhk, actualRent }) {
  const baseline = resolveRentBaseline({ cityName, suburb, bhk });
  if (!baseline || !actualRent) return null;

  const { avg } = baseline.rentPerMonth;
  const deltaPercent = Math.round(((actualRent - avg) / avg) * 100);

  let verdict = 'pass';
  let label;
  if (deltaPercent <= -10) {
    verdict = 'pass';
    label = 'Below market average — a good deal';
  } else if (deltaPercent <= 10) {
    verdict = 'pass';
    label = 'In line with the market average';
  } else if (deltaPercent <= 25) {
    verdict = 'caution';
    label = 'Above the market average';
  } else {
    verdict = 'red_flag';
    label = 'Significantly above the market average';
  }

  return {
    actualRent,
    baselineAvg: avg,
    baselineRange: baseline.rentPerMonth,
    deltaPercent,
    verdict,
    label,
    basis: baseline.basis,
    confidence: BASIS_CONFIDENCE[baseline.basis] ?? 'low',
    matchedLabel: baseline.matchedLabel,
  };
}
