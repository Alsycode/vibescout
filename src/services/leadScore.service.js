// FILE: src/services/leadScore.service.js
// PURPOSE: Composite lead score — budget fit, financial stress, lifestyle match, environment, commute, readiness.

const LIFESTYLE_WEIGHTS = {
  family:       { schools: 3, hospitals: 2, parks: 2, gyms: 1, cafes: 0 },
  remote:       { cafes: 3, parks: 2, gyms: 2, schools: 0, hospitals: 1 },
  student:      { cafes: 3, gyms: 2, parks: 1, schools: 1, hospitals: 1 },
  professional: { gyms: 3, cafes: 2, hospitals: 1, parks: 1, schools: 1 },
  retired:      { hospitals: 3, parks: 3, schools: 0, gyms: 1, cafes: 1 },
};

// Income bracket → monthly rupee midpoint
const INCOME_MIDPOINTS = {
  'Under 25K':  20000,
  '25K–50K':    37500,
  '50K–1L':     75000,
  '1L–2L':     150000,
  '2L–3L':     250000,
  'Above 3L':  350000,
};

// Sale price bracket → approximate value in rupees
const SALE_PRICE_MIDPOINTS = {
  'Under 30L':  2000000,
  '30L–60L':    4500000,
  '60L–1Cr':    8000000,
  '1Cr–1.5Cr': 12500000,
  '1.5Cr–2Cr': 17500000,
  '2Cr–3Cr':   25000000,
  '3Cr–5Cr':   40000000,
  'Above 5Cr':  65000000,
};

// Rent bracket → approximate monthly rent midpoint
const RENT_MIDPOINTS = {
  'Under 10K':  7500,
  '10K–20K':   15000,
  '20K–35K':   27500,
  '35K–50K':   42500,
  '50K–75K':   62500,
  '75K–1L':    87500,
  'Above 1L':  125000,
};

function computeLifestyleMatch(clusterAmenities, lifestyleType) {
  const weights = LIFESTYLE_WEIGHTS[lifestyleType] ?? LIFESTYLE_WEIGHTS.professional;
  let score = 0, maxScore = 0;
  for (const [type, weight] of Object.entries(weights)) {
    maxScore += weight * 3;
    const count = clusterAmenities[type]?.length ?? 0;
    score += Math.min(count, 3) * weight;
  }
  if (maxScore === 0) return 0;
  return Math.round((score / maxScore) * 15);
}

// Derives financial stress from income bracket vs property budget bracket.
// Returns 0–100 (higher = less financial stress).
export function computeStressScore(monthlyHouseholdIncome, budgetBracket, listingType) {
  const income = INCOME_MIDPOINTS[monthlyHouseholdIncome] ?? 75000;

  if (listingType === 'rent') {
    const rent = RENT_MIDPOINTS[budgetBracket] ?? 25000;
    const rentPercent = (rent / income) * 100;
    // 30% rule: 30% or less is stress-free; over 60% is extreme stress
    return Math.max(0, Math.min(100, Math.round(100 - (rentPercent / 60) * 100)));
  }

  // Sale: estimate monthly EMI as ~0.9% of 80% of property price (20y loan, ~8.5% rate)
  const price = SALE_PRICE_MIDPOINTS[budgetBracket] ?? 8000000;
  const emi = price * 0.80 * 0.009;
  const emiPercent = (emi / income) * 100;
  // 40% EMI/income ratio = borderline; 80%+ = extreme stress
  return Math.max(0, Math.min(100, Math.round(100 - (emiPercent / 80) * 100)));
}

export function computeLeadScore(preferences, shadowProperty, verdictObject) {
  const p = preferences;
  const sp = shadowProperty;
  const v = verdictObject;

  const budgetPts = v.budgetVerdict === 'pass' ? 25
    : v.budgetVerdict === 'caution' ? 15
    : 5;

  const stressScore = computeStressScore(
    p.step7.monthlyHouseholdIncome,
    sp.userProvidedSpecs.budgetBracket,
    sp.userProvidedSpecs.listingType,
  );
  const financialPts = Math.round((stressScore / 100) * 20);

  const lifestylePts = computeLifestyleMatch(
    sp.intelligence?.amenities ?? {},
    p.step2.lifestyleType,
  );

  const envPts = v.aqiVerdict === 'pass' ? 10
    : v.aqiVerdict === 'caution' ? 6
    : 2;

  const commutePts = v.commuteVerdict === 'pass' ? 10
    : v.commuteVerdict === 'caution' ? 6
    : 2;

  const readinessPts = sp.userProvidedSpecs.listingType === 'sale'
    ? (p.step7.loanPreApproved ? 5 : 0)
    : (p.step7.moveInTimeline === 'immediately' ? 5 : 0);

  const locationPts = p.step1.wfhStatus === 'full-time' ? 15
    : v.commuteVerdict === 'pass' ? 15
    : v.commuteVerdict === 'caution' ? 8
    : 3;

  const compositeScore = Math.min(
    100,
    budgetPts + financialPts + lifestylePts + envPts + commutePts + readinessPts + locationPts,
  );

  const tier = compositeScore >= 80 ? 'hot'
    : compositeScore >= 60 ? 'warm'
    : compositeScore >= 40 ? 'lukewarm'
    : 'cold';

  return {
    compositeScore,
    tier,
    breakdown: {
      budget:      budgetPts,
      financial:   financialPts,
      lifestyle:   lifestylePts,
      environmental: envPts,
      commute:     commutePts,
      readiness:   readinessPts,
      location:    locationPts,
    },
  };
}
