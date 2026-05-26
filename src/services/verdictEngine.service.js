// FILE: src/services/verdictEngine.service.js
// PURPOSE: Deterministic verdict functions — Layer 1 of anti-hallucination protocol. No AI touches this.

import { haversineKm } from './clusterService.js';

export const COMMUTE_SPEEDS = {
  walking: 5,
  two_wheeler: 30,
  auto_rickshaw: 20,
  car: 25,
  public_transport: 18,
};

const AMENITY_THRESHOLDS = {
  schools:   { pass: 800,  caution: 2000 },
  hospitals: { pass: 1500, caution: 4000 },
  parks:     { pass: 500,  caution: 1500 },
  gyms:      { pass: 1000, caution: 3000 },
  cafes:     { pass: 500,  caution: 2000 },
};

const SALE_BRACKETS = [
  'Under 30L', '30L–60L', '60L–1Cr', '1Cr–1.5Cr',
  '1.5Cr–2Cr', '2Cr–3Cr', '3Cr–5Cr', 'Above 5Cr',
];

const RENT_BRACKETS = [
  'Under 10K', '10K–20K', '20K–35K', '35K–50K',
  '50K–75K', '75K–1L', 'Above 1L',
];

// Income bracket midpoints (monthly, rupees)
const INCOME_MIDPOINTS = {
  'Under 25K':  20000,
  '25K–50K':    37500,
  '50K–1L':     75000,
  '1L–2L':     150000,
  '2L–3L':     250000,
  'Above 3L':  350000,
};

function mapToSaleBracket(amount) {
  if (amount < 3000000)  return 'Under 30L';
  if (amount < 6000000)  return '30L–60L';
  if (amount < 10000000) return '60L–1Cr';
  if (amount < 15000000) return '1Cr–1.5Cr';
  if (amount < 20000000) return '1.5Cr–2Cr';
  if (amount < 30000000) return '2Cr–3Cr';
  if (amount < 50000000) return '3Cr–5Cr';
  return 'Above 5Cr';
}

function mapToRentBracket(amount) {
  if (amount < 10000) return 'Under 10K';
  if (amount < 20000) return '10K–20K';
  if (amount < 35000) return '20K–35K';
  if (amount < 50000) return '35K–50K';
  if (amount < 75000) return '50K–75K';
  if (amount < 100000) return '75K–1L';
  return 'Above 1L';
}

export function noiseVerdict(estimatedDb, noiseSensitivity) {
  if (noiseSensitivity === 'High' && estimatedDb > 65) return 'red_flag';
  if (noiseSensitivity === 'High' && estimatedDb > 55) return 'caution';
  if (noiseSensitivity === 'Moderate' && estimatedDb > 75) return 'red_flag';
  if (noiseSensitivity === 'Moderate' && estimatedDb > 65) return 'caution';
  return 'pass';
}

export function aqiVerdict(aqiValue, aqiSensitivity) {
  if (aqiSensitivity === 'Sensitive' && aqiValue > 100) return 'red_flag';
  if (aqiSensitivity === 'Sensitive' && aqiValue > 50)  return 'caution';
  if (aqiSensitivity === 'Moderate'  && aqiValue > 150) return 'red_flag';
  if (aqiSensitivity === 'Moderate'  && aqiValue > 100) return 'caution';
  return 'pass';
}

export function budgetVerdict(propertyBudgetBracket, userBudgetBracket, listingType) {
  const brackets = listingType === 'sale' ? SALE_BRACKETS : RENT_BRACKETS;
  const propIdx = brackets.indexOf(propertyBudgetBracket);
  const userIdx = brackets.indexOf(userBudgetBracket);
  if (propIdx > userIdx + 1) return 'red_flag';
  if (propIdx > userIdx)     return 'caution';
  return 'pass';
}

export function deriveUserBudgetBracket(monthlyIncome, listingType) {
  const income = INCOME_MIDPOINTS[monthlyIncome] ?? 75000;
  if (listingType === 'rent') {
    const maxRent = income * 0.30;
    return mapToRentBracket(maxRent);
  }
  const loanEligibility = income * 60;
  return mapToSaleBracket(loanEligibility);
}

export function solarVerdict(peakSunHours, facingDirection) {
  const facingBonus = ['E', 'NE', 'SE'].includes(facingDirection) ? 0.5 : 0;
  const adjusted = peakSunHours + facingBonus;
  if (adjusted >= 5) return 'pass';
  if (adjusted >= 3) return 'caution';
  return 'red_flag';
}

export function amenityVerdict(amenityDistances, userPriorities) {
  const top2 = userPriorities.slice(0, 2);
  const verdicts = top2.map(type => {
    const d = amenityDistances[type] ?? 9999;
    const t = AMENITY_THRESHOLDS[type];
    if (!t) return 'pass';
    if (d <= t.pass)    return 'pass';
    if (d <= t.caution) return 'caution';
    return 'red_flag';
  });
  if (verdicts.includes('red_flag')) return 'red_flag';
  if (verdicts.includes('caution'))  return 'caution';
  return 'pass';
}

export function commuteVerdict(propertyCoords, workplaceCoords, commuteMode, maxMinutes, wfhStatus) {
  if (wfhStatus === 'full-time') return 'pass';
  if (!workplaceCoords?.lat)     return 'caution';
  const km = haversineKm(propertyCoords, workplaceCoords);
  const speed = COMMUTE_SPEEDS[commuteMode] ?? 20;
  const estimatedMinutes = (km / speed) * 60;
  if (estimatedMinutes <= maxMinutes)        return 'pass';
  if (estimatedMinutes <= maxMinutes * 1.5)  return 'caution';
  return 'red_flag';
}

// Pure JS — GROQ never touches this
export function generateHeadline(totalRedFlags, totalCautions) {
  if (totalRedFlags >= 2)                          return 'Significant concerns found — review carefully';
  if (totalRedFlags === 1 && totalCautions >= 2)   return 'Mixed signals — a few things to consider';
  if (totalRedFlags === 0 && totalCautions === 0)  return 'Strong match across all signals';
  if (totalCautions >= 2)                          return 'Decent match with some trade-offs';
  return 'Good overall fit with minor notes';
}

export function computeAllVerdicts(shadowProperty, preferences) {
  const sp    = shadowProperty;
  const p     = preferences;
  const intel = sp.intelligence;

  const _noiseVerdict = noiseVerdict(intel.noise.estimatedDb, p.step3.noiseSensitivity);
  const _aqiVerdict   = aqiVerdict(intel.aqi.value, p.step3.aqiSensitivity);
  const _solarVerdict = solarVerdict(intel.solar.peakSunHours, p.step4.facingDirection);

  const _amenityVerdict = amenityVerdict(
    {
      schools:   intel.amenities.schools[0]?.distanceM,
      hospitals: intel.amenities.hospitals[0]?.distanceM,
      parks:     intel.amenities.parks[0]?.distanceM,
      gyms:      intel.amenities.gyms[0]?.distanceM,
      cafes:     intel.amenities.cafes[0]?.distanceM,
    },
    p.step5.amenityPriorities,
  );

  const _commuteVerdict = commuteVerdict(
    sp.coordinates,
    { lat: p.step1.workplaceLat, lng: p.step1.workplaceLng },
    p.step1.commuteMode,
    p.step1.maxCommuteMinutes,
    p.step1.wfhStatus,
  );

  const userBudgetBracket = deriveUserBudgetBracket(
    p.step7.monthlyHouseholdIncome,
    sp.userProvidedSpecs.listingType,
  );

  const _budgetVerdict = budgetVerdict(
    sp.userProvidedSpecs.budgetBracket,
    userBudgetBracket,
    sp.userProvidedSpecs.listingType,
  );

  const allVerdicts = [
    _noiseVerdict, _aqiVerdict, _solarVerdict,
    _amenityVerdict, _commuteVerdict, _budgetVerdict,
  ];

  // NOTE: localNews is informational only — no verdict function.
  // If news sentiment verdict is added in future, update allVerdicts array.
  const totalRedFlags = allVerdicts.filter(v => v === 'red_flag').length;
  const totalCautions = allVerdicts.filter(v => v === 'caution').length;
  const totalPasses   = allVerdicts.filter(v => v === 'pass').length;

  const estimatedCommuteMins = (() => {
    if (p.step1.wfhStatus === 'full-time') return 0;
    if (!p.step1.workplaceLat)             return null;
    const km = haversineKm(
      sp.coordinates,
      { lat: p.step1.workplaceLat, lng: p.step1.workplaceLng },
    );
    return Math.round((km / (COMMUTE_SPEEDS[p.step1.commuteMode] ?? 20)) * 60);
  })();

  return {
    noiseVerdict:     _noiseVerdict,
    aqiVerdict:       _aqiVerdict,
    solarVerdict:     _solarVerdict,
    amenityVerdict:   _amenityVerdict,
    commuteVerdict:   _commuteVerdict,
    budgetVerdict:    _budgetVerdict,
    estimatedDb:      intel.noise.estimatedDb,
    aqiValue:         intel.aqi.value,
    peakSunHours:     intel.solar.peakSunHours,
    nearestHospitalM: intel.amenities.hospitals[0]?.distanceM ?? null,
    nearestSchoolM:   intel.amenities.schools[0]?.distanceM ?? null,
    userBudgetBracket,
    propertyBudgetBracket: sp.userProvidedSpecs.budgetBracket,
    userNoiseSensitivity:  p.step3.noiseSensitivity,
    estimatedCommuteMins,
    listingType:     sp.userProvidedSpecs.listingType,
    totalRedFlags,
    totalCautions,
    totalPasses,
    headline: generateHeadline(totalRedFlags, totalCautions),
  };
}
