// FILE: src/services/reportTemplates.service.js
// PURPOSE: Template fallback strings for every verdict key — fires when GROQ output fails validation.

export const NOISE_TEMPLATES = {
  red_flag: (db, sens) => `Noise level of ${db}dB is high for ${sens.toLowerCase()} sensitivity.`,
  caution:  (db, sens) => `Noise at ${db}dB may occasionally bother someone with ${sens.toLowerCase()} sensitivity.`,
  pass:     (db)       => `Noise level of ${db}dB is within comfortable range.`,
};

export const AQI_TEMPLATES = {
  red_flag: (aqi) => `AQI of ${aqi} is poor — a concern for sensitive individuals.`,
  caution:  (aqi) => `AQI of ${aqi} is moderate — manageable with basic precautions.`,
  pass:     (aqi) => `AQI of ${aqi} is acceptable.`,
};

export const SOLAR_TEMPLATES = {
  red_flag: (hrs) => `Peak sun hours of ${hrs} limits solar and natural light potential.`,
  caution:  (hrs) => `Peak sun hours of ${hrs} is moderate — adequate for basic needs.`,
  pass:     (hrs) => `Peak sun hours of ${hrs} is good for solar viability and natural light.`,
};

export const BUDGET_TEMPLATES = {
  red_flag: (prop, user) => `Property bracket (${prop}) significantly exceeds your budget range (${user}).`,
  caution:  (prop, user) => `Property bracket (${prop}) is slightly above your budget range (${user}).`,
  pass:     ()           => `Property price is within your budget range.`,
};

export const AMENITY_TEMPLATES = {
  red_flag: (hosp, school) => `Key amenities are far — nearest hospital ${hosp}m, school ${school}m.`,
  caution:  (hosp, school) => `Some amenities within reach — hospital ${hosp}m, school ${school}m.`,
  pass:     (hosp, school) => `Good amenity access — hospital ${hosp}m, school ${school}m.`,
};

export const COMMUTE_TEMPLATES = {
  red_flag: (mins) => `Estimated commute of ${mins} minutes exceeds your preferred maximum.`,
  caution:  (mins) => `Estimated commute of ${mins} minutes is close to your preferred maximum.`,
  pass:     (mins) => mins === 0
    ? `No commute impact — working from home full-time.`
    : `Estimated commute of ${mins} minutes is within your preferred range.`,
};

// PATCH #7 — NEWS_TEMPLATES added
export const NEWS_TEMPLATES = {
  has_headlines: (count) => `${count} recent local headlines available for this area.`,
  no_headlines:  ()      => 'No recent local headlines found.',
};

export function buildTemplateReport(verdictObject, listingType) {
  const v    = verdictObject;
  const hosp = v.nearestHospitalM ?? 9999;
  const sch  = v.nearestSchoolM   ?? 9999;
  const mins = v.estimatedCommuteMins ?? 0;

  const noiseLabel   = NOISE_TEMPLATES[v.noiseVerdict]?.(v.estimatedDb, v.userNoiseSensitivity)
    ?? NOISE_TEMPLATES.pass(v.estimatedDb);

  const aqiLabel     = AQI_TEMPLATES[v.aqiVerdict]?.(v.aqiValue)
    ?? AQI_TEMPLATES.pass(v.aqiValue);

  const solarLabel   = SOLAR_TEMPLATES[v.solarVerdict]?.(v.peakSunHours)
    ?? SOLAR_TEMPLATES.pass(v.peakSunHours);

  const amenityLabel = AMENITY_TEMPLATES[v.amenityVerdict]?.(hosp, sch)
    ?? AMENITY_TEMPLATES.pass(hosp, sch);

  const budgetLabel  = BUDGET_TEMPLATES[v.budgetVerdict]?.(v.propertyBudgetBracket, v.userBudgetBracket)
    ?? BUDGET_TEMPLATES.pass();

  const commuteLabel = COMMUTE_TEMPLATES[v.commuteVerdict]?.(mins)
    ?? COMMUTE_TEMPLATES.pass(mins);

  const flagCount = v.totalRedFlags + v.totalCautions;
  const verdict = flagCount === 0
    ? 'All signals clear — strong overall fit.'
    : `${v.totalRedFlags} concern${v.totalRedFlags !== 1 ? 's' : ''}, ${v.totalCautions} caution${v.totalCautions !== 1 ? 's' : ''} noted.`;

  const base = {
    noiseLabel,
    aqiLabel,
    solarLabel,
    amenityLabel,
    budgetLabel,
    commuteLabel,
    matchKeywords: [],
    verdict,
    newsLabel: NEWS_TEMPLATES.no_headlines(),
  };

  if (listingType === 'sale') {
    base.financialNote = `Property is in the ${v.propertyBudgetBracket} bracket.`;
  } else {
    base.rentalNote = `Property is in the ${v.propertyBudgetBracket} bracket.`;
  }

  return base;
}
