// FILE: src/data/cityTiers.js
// PURPOSE: Hardcoded India city-tier classification + name aliases used by baselineResolver.service.js
//          to fall back to a tier average when a city isn't in rentSaleBaseline.seed.json.

// Standard tier-1 metros — all present as keys in rentSaleBaseline.seed.json.
export const TIER_1_CITIES = [
  'mumbai', 'delhi-ncr-delhi', 'delhi-ncr-gurgaon', 'delhi-ncr-noida',
  'bangalore', 'hyderabad', 'chennai', 'kolkata', 'pune', 'ahmedabad',
];

// Well-known tier-2 cities — present as keys in rentSaleBaseline.seed.json.
export const TIER_2_CITIES = [
  'jaipur', 'lucknow', 'chandigarh', 'kochi', 'surat', 'indore', 'nagpur',
];

// Common alternate spellings / synonyms mapped to the seed file's city keys.
export const CITY_ALIASES = {
  bengaluru: 'bangalore',
  bangaluru: 'bangalore',
  gurugram: 'delhi-ncr-gurgaon',
  gurgaon: 'delhi-ncr-gurgaon',
  noida: 'delhi-ncr-noida',
  'greater noida': 'delhi-ncr-noida',
  delhi: 'delhi-ncr-delhi',
  'new delhi': 'delhi-ncr-delhi',
  cochin: 'kochi',
  ernakulam: 'kochi',
  poona: 'pune',
  calcutta: 'kolkata',
  bombay: 'mumbai',
};

/**
 * Classify an already-resolved city key into a tier for fallback averaging.
 * Anything not in tier 1/2 is treated as tier 3 (no seed data expected).
 */
export function tierForCity(cityKey) {
  if (TIER_1_CITIES.includes(cityKey)) return 1;
  if (TIER_2_CITIES.includes(cityKey)) return 2;
  return 3;
}
