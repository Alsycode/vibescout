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

export const VASTU_TEMPLATES = {
  red_flag: (dir) => `${dir}-facing is considered inauspicious in Vastu — a notable concern.`,
  caution:  (dir) => `${dir}-facing is a moderate Vastu direction — some remedies may help.`,
  pass:     (dir) => dir ? `${dir}-facing aligns well with Vastu principles.` : 'Vastu alignment is favourable.',
  neutral:  ()    => 'Vastu not applied for this report.',
};

export const COMMUNITY_TEMPLATES = {
  pass: (derived, pref, counts) => {
    const evidence = buildCommunityEvidence(derived, counts);
    return pref && pref !== 'Mixed'
      ? `${derived} character matches your preference — ${evidence}.`
      : `Area has a ${derived} character — ${evidence}.`;
  },
  caution: (derived, pref, counts) => {
    const evidence = buildCommunityEvidence(derived, counts);
    return `Area leans ${derived} (${evidence}) — partial match for your ${pref} preference.`;
  },
  red_flag: (derived, pref, counts) => {
    const evidence = buildCommunityEvidence(derived, counts);
    return `Area is ${derived} (${evidence}) — a mismatch for your ${pref} preference.`;
  },
};

function buildCommunityEvidence(derived, counts) {
  if (!counts) return 'amenity data limited';
  const parts = [];
  if (counts.schoolsNear > 0) parts.push(`${counts.schoolsNear} school${counts.schoolsNear > 1 ? 's' : ''}`);
  if (counts.parksNear   > 0) parts.push(`${counts.parksNear} park${counts.parksNear > 1 ? 's' : ''}`);
  if (counts.cafesNear   > 0) parts.push(`${counts.cafesNear} cafe${counts.cafesNear > 1 ? 's' : ''}`);
  if (counts.gymsNear    > 0) parts.push(`${counts.gymsNear} gym${counts.gymsNear > 1 ? 's' : ''}`);
  return parts.length > 0 ? parts.join(', ') + ' nearby' : 'few amenities nearby';
}

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
  const vastuPref = v.userVastuPreference;

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

  const vastuLabel = vastuPref === 'Yes'
    ? (VASTU_TEMPLATES[v.vastuVerdict]?.(v.facingDirection) ?? VASTU_TEMPLATES.pass(v.facingDirection))
    : VASTU_TEMPLATES.neutral();

  const communityLabel = COMMUNITY_TEMPLATES[v.communityMatchVerdict]?.(
    v.derivedCharacter,
    v.userCommunityPreference,
    v.communityAmenityCounts,
  ) ?? COMMUNITY_TEMPLATES.pass(v.derivedCharacter, v.userCommunityPreference, v.communityAmenityCounts);

  const base = {
    noiseLabel,
    aqiLabel,
    solarLabel,
    amenityLabel,
    budgetLabel,
    commuteLabel,
    vastuLabel,
    communityLabel,
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
