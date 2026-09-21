// FILE: test/unit/leadScore.test.js
// PURPOSE: Stage 2.9 — leadScore.service.js: composite lead score + tier
// boundaries, plus the underlying financial-stress sub-score.

import { describe, it, expect } from 'vitest';
import { computeStressScore, computeLeadScore } from '../../src/services/leadScore.service.js';

describe('computeStressScore — formulas (direct verification)', () => {
  it('rent: 30%-of-income rule, clamped 0-100', () => {
    // income 75000 (50K-1L), rent 27500 (20K-35K) -> 36.67% -> 100 - (36.67/60*100) = 38.89 -> 39
    const score = computeStressScore('50K–1L', '20K–35K', 'rent');
    expect(score).toBe(39);
  });

  it('rent: clamps to 0 for extreme rent burden', () => {
    // income 20000 (Under 25K), rent 125000 (Above 1L) -> 625% -> way over 60% -> clamp 0
    expect(computeStressScore('Under 25K', 'Above 1L', 'rent')).toBe(0);
  });

  it('rent: clamps to 100 for trivial rent burden', () => {
    // income 350000 (Above 3L), rent 7500 (Under 10K) -> 2.14% -> 100 - tiny = ~96, not 100 unless 0
    const score = computeStressScore('Above 3L', 'Under 10K', 'rent');
    expect(score).toBeGreaterThan(90);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('sale: EMI-based formula, clamped 0-100', () => {
    // income 150000 (1L-2L), price 8,000,000 (60L-1Cr)
    // emi = 8000000*0.8*0.009 = 57600; emiPercent (unrounded) = 57600/150000*100 = 38.4
    // stress = 100 - (38.4/80*100) = 100-48 = 52
    expect(computeStressScore('1L–2L', '60L–1Cr', 'sale')).toBe(52);
  });

  it('sale: clamps to 0 for extreme EMI burden', () => {
    expect(computeStressScore('Under 25K', 'Above 5Cr', 'sale')).toBe(0);
  });

  it('falls back to default midpoints for unrecognized brackets', () => {
    // unrecognized income -> 75000; unrecognized budget -> rent 25000 -> 33.3% -> 100-(33.33/60*100)=44.4->44
    expect(computeStressScore('nonsense', 'nonsense', 'rent')).toBe(44);
  });
});

function baseInputs(overrides = {}) {
  return {
    preferences: {
      step1: { wfhStatus: 'office' },
      step2: { lifestyleType: 'professional' },
      step7: { monthlyHouseholdIncome: '50K–1L', loanPreApproved: true, moveInTimeline: 'immediately' },
      ...overrides.preferences,
    },
    shadowProperty: {
      userProvidedSpecs: { listingType: 'rent', budgetBracket: '20K–35K' },
      intelligence: { amenities: {} },
      ...overrides.shadowProperty,
    },
    verdictObject: {
      budgetVerdict: 'pass',
      aqiVerdict: 'pass',
      commuteVerdict: 'pass',
      ...overrides.verdictObject,
    },
  };
}

describe('computeLeadScore — tiers', () => {
  it('produces a "hot" tier for an ideal candidate', () => {
    const { preferences, shadowProperty, verdictObject } = baseInputs({
      preferences: {
        step1: { wfhStatus: 'full-time' },
        step7: { monthlyHouseholdIncome: 'Above 3L', loanPreApproved: true, moveInTimeline: 'immediately' },
      },
      shadowProperty: {
        userProvidedSpecs: { listingType: 'sale', budgetBracket: 'Under 30L' },
        intelligence: { amenities: { gyms: [1, 2, 3], cafes: [1, 2, 3] } },
      },
    });
    const r = computeLeadScore(preferences, shadowProperty, verdictObject);
    expect(r.compositeScore).toBeGreaterThanOrEqual(80);
    expect(r.tier).toBe('hot');
  });

  it('produces a "cold" tier for a poor candidate', () => {
    const { preferences, shadowProperty, verdictObject } = baseInputs({
      preferences: {
        step1: { wfhStatus: 'office' },
        step7: { monthlyHouseholdIncome: 'Under 25K', loanPreApproved: false, moveInTimeline: 'not soon' },
      },
      shadowProperty: { userProvidedSpecs: { listingType: 'rent', budgetBracket: 'Above 1L' } },
      verdictObject: { budgetVerdict: 'red_flag', aqiVerdict: 'red_flag', commuteVerdict: 'red_flag' },
    });
    const r = computeLeadScore(preferences, shadowProperty, verdictObject);
    expect(r.compositeScore).toBeLessThan(40);
    expect(r.tier).toBe('cold');
  });

  it('never exceeds 100 even if sub-scores would otherwise sum higher', () => {
    const { preferences, shadowProperty, verdictObject } = baseInputs({
      preferences: {
        step1: { wfhStatus: 'full-time' },
        step7: { monthlyHouseholdIncome: 'Above 3L', loanPreApproved: true, moveInTimeline: 'immediately' },
      },
      shadowProperty: {
        userProvidedSpecs: { listingType: 'sale', budgetBracket: 'Under 30L' },
        intelligence: {
          amenities: {
            gyms: [1, 2, 3], cafes: [1, 2, 3], hospitals: [1, 2, 3], parks: [1, 2, 3], schools: [1, 2, 3],
          },
        },
      },
    });
    const r = computeLeadScore(preferences, shadowProperty, verdictObject);
    expect(r.compositeScore).toBeLessThanOrEqual(100);
  });

  it('breaks down into named sub-scores that sum to the composite (when not clamped)', () => {
    const { preferences, shadowProperty, verdictObject } = baseInputs();
    const r = computeLeadScore(preferences, shadowProperty, verdictObject);
    const sum = Object.values(r.breakdown).reduce((a, b) => a + b, 0);
    expect(r.compositeScore).toBe(Math.min(100, sum));
  });

  it('gives full readiness points for loanPreApproved on a sale listing', () => {
    const { preferences, shadowProperty, verdictObject } = baseInputs({
      shadowProperty: { userProvidedSpecs: { listingType: 'sale', budgetBracket: '60L–1Cr' } },
    });
    const withApproval = computeLeadScore(
      { ...preferences, step7: { ...preferences.step7, loanPreApproved: true } },
      shadowProperty, verdictObject,
    );
    const withoutApproval = computeLeadScore(
      { ...preferences, step7: { ...preferences.step7, loanPreApproved: false } },
      shadowProperty, verdictObject,
    );
    expect(withApproval.breakdown.readiness).toBe(5);
    expect(withoutApproval.breakdown.readiness).toBe(0);
  });

  it('gives 15 location points for full-time WFH regardless of commute verdict', () => {
    const { preferences, shadowProperty, verdictObject } = baseInputs({
      preferences: { step1: { wfhStatus: 'full-time' } },
      verdictObject: { budgetVerdict: 'pass', aqiVerdict: 'pass', commuteVerdict: 'red_flag' },
    });
    const r = computeLeadScore(preferences, shadowProperty, verdictObject);
    expect(r.breakdown.location).toBe(15);
  });
});
