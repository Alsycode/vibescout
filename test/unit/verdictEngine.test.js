// FILE: test/unit/verdictEngine.test.js
// PURPOSE: Stage 2.1 — verdictEngine.service.js: all verdict keys, boundaries,
// floor-noise reduction, flag counting, headline selection. Layer 1 of the
// anti-hallucination protocol — no AI touches this, so it must be pinned down hard.

import { describe, it, expect } from 'vitest';
import {
  floorNoiseReduction,
  vastuVerdict,
  communityVerdict,
  noiseVerdict,
  aqiVerdict,
  budgetVerdict,
  deriveUserBudgetBracket,
  solarVerdict,
  amenityVerdict,
  commuteVerdict,
  generateHeadline,
  computeAllVerdicts,
} from '../../src/services/verdictEngine.service.js';

describe('floorNoiseReduction', () => {
  it('returns the configured reduction per band', () => {
    expect(floorNoiseReduction('Ground')).toBe(0);
    expect(floorNoiseReduction('1–3')).toBe(1);
    expect(floorNoiseReduction('4–7')).toBe(3);
    expect(floorNoiseReduction('8–15')).toBe(5);
    expect(floorNoiseReduction('16+')).toBe(6);
    expect(floorNoiseReduction('Top Floor')).toBe(5);
  });

  it('defaults to 0 for unknown/missing floor', () => {
    expect(floorNoiseReduction('Unknown')).toBe(0);
    expect(floorNoiseReduction(undefined)).toBe(0);
    expect(floorNoiseReduction('nonsense')).toBe(0);
  });
});

describe('vastuVerdict', () => {
  it('passes when the user has no preference', () => {
    expect(vastuVerdict('South', undefined)).toBe('pass');
    expect(vastuVerdict('South', 'No preference')).toBe('pass');
    expect(vastuVerdict('South', 'No')).toBe('pass');
  });

  it('flags South as red_flag when the user opted in', () => {
    expect(vastuVerdict('South', 'Yes')).toBe('red_flag');
  });

  it('flags West as caution when the user opted in', () => {
    expect(vastuVerdict('West', 'Yes')).toBe('caution');
  });

  it('passes N/E/NE and unknown directions when opted in', () => {
    expect(vastuVerdict('North', 'Yes')).toBe('pass');
    expect(vastuVerdict('East', 'Yes')).toBe('pass');
    expect(vastuVerdict('NE', 'Yes')).toBe('pass');
    expect(vastuVerdict(undefined, 'Yes')).toBe('pass');
  });
});

describe('communityVerdict', () => {
  const near = (n) => Array.from({ length: n }, () => ({ distanceM: 500 }));

  it('derives Quiet & Private when both scores are low', () => {
    const r = communityVerdict({ schools: near(1), parks: [], cafes: [], gyms: [] }, undefined);
    expect(r.derivedCharacter).toBe('Quiet & Private');
  });

  it('derives Family-friendly when family score dominates', () => {
    const r = communityVerdict(
      { schools: near(3), parks: near(2), cafes: [], gyms: [] },
      undefined,
    );
    expect(r.derivedCharacter).toBe('Family-friendly');
  });

  it('derives Young & Social when social score dominates', () => {
    const r = communityVerdict(
      { schools: [], parks: [], cafes: near(3), gyms: near(2) },
      undefined,
    );
    expect(r.derivedCharacter).toBe('Young & Social');
  });

  it('derives Mixed when scores are close', () => {
    const r = communityVerdict(
      { schools: near(2), parks: [], cafes: near(2), gyms: [] },
      undefined,
    );
    expect(r.derivedCharacter).toBe('Mixed');
  });

  it('passes when preference is unset, Mixed, or matches the derived character', () => {
    const amenities = { schools: near(3), parks: near(2), cafes: [], gyms: [] }; // Family-friendly
    expect(communityVerdict(amenities, undefined).communityMatchVerdict).toBe('pass');
    expect(communityVerdict(amenities, 'Mixed').communityMatchVerdict).toBe('pass');
    expect(communityVerdict(amenities, 'Family-friendly').communityMatchVerdict).toBe('pass');
  });

  it('red_flags a hard-opposite pair (Family-friendly pref vs Young & Social area)', () => {
    const amenities = { schools: [], parks: [], cafes: near(3), gyms: near(2) }; // Young & Social
    expect(communityVerdict(amenities, 'Family-friendly').communityMatchVerdict).toBe('red_flag');
  });

  it('cautions a non-opposite mismatch (Quiet & Private pref vs Family-friendly area)', () => {
    const amenities = { schools: near(3), parks: near(2), cafes: [], gyms: [] }; // Family-friendly
    expect(communityVerdict(amenities, 'Quiet & Private').communityMatchVerdict).toBe('caution');
  });

  it('counts amenities only within the 1500m radius', () => {
    const r = communityVerdict({ schools: [{ distanceM: 1500 }, { distanceM: 1501 }] }, undefined);
    expect(r.communityAmenityCounts.schoolsNear).toBe(1);
  });
});

describe('noiseVerdict', () => {
  it('High sensitivity: pass <=55, caution 56-65, red_flag >65', () => {
    expect(noiseVerdict(55, 'High')).toBe('pass');
    expect(noiseVerdict(56, 'High')).toBe('caution');
    expect(noiseVerdict(65, 'High')).toBe('caution');
    expect(noiseVerdict(66, 'High')).toBe('red_flag');
  });

  it('Moderate sensitivity: pass <=65, caution 66-75, red_flag >75', () => {
    expect(noiseVerdict(65, 'Moderate')).toBe('pass');
    expect(noiseVerdict(66, 'Moderate')).toBe('caution');
    expect(noiseVerdict(75, 'Moderate')).toBe('caution');
    expect(noiseVerdict(76, 'Moderate')).toBe('red_flag');
  });

  it('Low/other sensitivity always passes', () => {
    expect(noiseVerdict(999, 'Low')).toBe('pass');
    expect(noiseVerdict(999, undefined)).toBe('pass');
  });
});

describe('aqiVerdict', () => {
  it('Sensitive: pass <=50, caution 51-100, red_flag >100', () => {
    expect(aqiVerdict(50, 'Sensitive')).toBe('pass');
    expect(aqiVerdict(51, 'Sensitive')).toBe('caution');
    expect(aqiVerdict(100, 'Sensitive')).toBe('caution');
    expect(aqiVerdict(101, 'Sensitive')).toBe('red_flag');
  });

  it('Moderate: pass <=100, caution 101-150, red_flag >150', () => {
    expect(aqiVerdict(100, 'Moderate')).toBe('pass');
    expect(aqiVerdict(101, 'Moderate')).toBe('caution');
    expect(aqiVerdict(150, 'Moderate')).toBe('caution');
    expect(aqiVerdict(151, 'Moderate')).toBe('red_flag');
  });

  it('other sensitivities always pass', () => {
    expect(aqiVerdict(500, 'Low')).toBe('pass');
  });
});

describe('budgetVerdict', () => {
  it('passes when property bracket is at or below the user bracket', () => {
    expect(budgetVerdict('20K–35K', '35K–50K', 'rent')).toBe('pass');
    expect(budgetVerdict('35K–50K', '35K–50K', 'rent')).toBe('pass');
  });

  it('cautions exactly one bracket above', () => {
    expect(budgetVerdict('50K–75K', '35K–50K', 'rent')).toBe('caution');
  });

  it('red_flags two or more brackets above', () => {
    expect(budgetVerdict('75K–1L', '35K–50K', 'rent')).toBe('red_flag');
  });

  it('uses the sale bracket list for sale listings', () => {
    expect(budgetVerdict('1Cr–1.5Cr', '60L–1Cr', 'sale')).toBe('caution');
    expect(budgetVerdict('2Cr–3Cr', '60L–1Cr', 'sale')).toBe('red_flag');
  });
});

describe('deriveUserBudgetBracket', () => {
  it('derives a rent bracket at 30% of monthly income', () => {
    // 75000 * 0.30 = 22500 -> '20K-35K'
    expect(deriveUserBudgetBracket('50K–1L', 'rent')).toBe('20K–35K');
  });

  it('derives a sale bracket from 60x monthly income loan eligibility', () => {
    // 75000 * 60 = 4,500,000 -> '30L-60L'
    expect(deriveUserBudgetBracket('50K–1L', 'sale')).toBe('30L–60L');
  });

  it('falls back to the 75000 midpoint for an unrecognized income bracket', () => {
    expect(deriveUserBudgetBracket('not-a-real-bracket', 'rent')).toBe('20K–35K');
  });
});

describe('solarVerdict', () => {
  it('pass at >=5 adjusted hours', () => {
    expect(solarVerdict(5, 'N')).toBe('pass');
  });
  it('caution at 3-4.9 adjusted hours', () => {
    expect(solarVerdict(3, 'N')).toBe('caution');
    expect(solarVerdict(4.9, 'N')).toBe('caution');
  });
  it('red_flag below 3 adjusted hours', () => {
    expect(solarVerdict(2.9, 'N')).toBe('red_flag');
  });
  it('applies a +0.5 bonus for E/NE/SE facing', () => {
    expect(solarVerdict(4.5, 'E')).toBe('pass'); // 4.5+0.5=5.0
    expect(solarVerdict(4.5, 'N')).toBe('caution'); // no bonus, stays at 4.5
  });
});

describe('amenityVerdict', () => {
  it('passes when both top-2 priorities are within pass distance', () => {
    const v = amenityVerdict({ schools: 700, hospitals: 1000 }, ['schools', 'hospitals']);
    expect(v).toBe('pass');
  });

  it('cautions when a top priority is within caution range', () => {
    const v = amenityVerdict({ schools: 1500, hospitals: 1000 }, ['schools', 'hospitals']);
    expect(v).toBe('caution');
  });

  it('red_flags when a top priority is beyond caution range', () => {
    const v = amenityVerdict({ schools: 3000, hospitals: 1000 }, ['schools', 'hospitals']);
    expect(v).toBe('red_flag');
  });

  it('only considers the top 2 priorities', () => {
    // gyms is 3rd priority and far, but not counted
    const v = amenityVerdict({ schools: 700, hospitals: 1000, gyms: 99999 }, ['schools', 'hospitals', 'gyms']);
    expect(v).toBe('pass');
  });

  it('defaults an unmeasured amenity distance to 9999 (red_flag range)', () => {
    const v = amenityVerdict({}, ['schools']);
    expect(v).toBe('red_flag');
  });
});

describe('commuteVerdict', () => {
  const propertyCoords = { lat: 12.9716, lng: 77.5946 }; // Bangalore
  const workplaceCoords = { lat: 12.9716, lng: 77.6946 }; // ~10.8km east

  it('passes unconditionally for full-time WFH', () => {
    expect(commuteVerdict(propertyCoords, null, 'car', 30, 'full-time')).toBe('pass');
  });

  it('cautions when workplace coordinates are missing (and not full-time WFH)', () => {
    expect(commuteVerdict(propertyCoords, {}, 'car', 30, 'hybrid')).toBe('caution');
  });

  it('passes within maxMinutes, cautions within 1.5x, red_flags beyond', () => {
    // ~10.8km at 25km/h (car) ~= 26 min
    expect(commuteVerdict(propertyCoords, workplaceCoords, 'car', 30, 'office')).toBe('pass');
    expect(commuteVerdict(propertyCoords, workplaceCoords, 'car', 20, 'office')).toBe('caution'); // 26 <= 30
    expect(commuteVerdict(propertyCoords, workplaceCoords, 'car', 10, 'office')).toBe('red_flag'); // 26 > 15
  });

  it('falls back to a 20km/h default speed for an unknown commute mode', () => {
    // ~10.8km at the 20km/h default (unknown mode) ~= 32.5 min -> caution at maxMinutes=30
    expect(commuteVerdict(propertyCoords, workplaceCoords, 'jetpack', 30, 'office')).toBe('caution');
  });
});

describe('generateHeadline', () => {
  it('escalates with red flags and cautions', () => {
    expect(generateHeadline(2, 0)).toBe('Significant concerns found — review carefully');
    expect(generateHeadline(3, 5)).toBe('Significant concerns found — review carefully');
    expect(generateHeadline(1, 2)).toBe('Mixed signals — a few things to consider');
    expect(generateHeadline(0, 0)).toBe('Strong match across all signals');
    expect(generateHeadline(0, 2)).toBe('Decent match with some trade-offs');
    expect(generateHeadline(0, 1)).toBe('Good overall fit with minor notes');
    expect(generateHeadline(1, 0)).toBe('Good overall fit with minor notes');
    expect(generateHeadline(1, 1)).toBe('Good overall fit with minor notes');
  });
});

describe('computeAllVerdicts (integration of the above)', () => {
  function buildShadowProperty(overrides = {}) {
    return {
      coordinates: { lat: 12.9716, lng: 77.5946 },
      userProvidedSpecs: {
        floor: 'Ground',
        listingType: 'rent',
        budgetBracket: '20K–35K',
        bhk: '2BHK',
        ...overrides.userProvidedSpecs,
      },
      intelligence: {
        noise: { estimatedDb: 50 },
        aqi: { value: 60 },
        solar: { peakSunHours: 6 },
        amenities: {
          schools: [{ distanceM: 500 }],
          hospitals: [{ distanceM: 1000 }],
          parks: [{ distanceM: 400 }],
          gyms: [{ distanceM: 900 }],
          cafes: [{ distanceM: 300 }],
        },
        ...overrides.intelligence,
      },
    };
  }

  function buildPreferences(overrides = {}) {
    return {
      step1: { wfhStatus: 'full-time', maxCommuteMinutes: 30, commuteMode: 'car', workplaceLat: null, workplaceLng: null, ...overrides.step1 },
      step3: { noiseSensitivity: 'Moderate', aqiSensitivity: 'Moderate', ...overrides.step3 },
      step4: { facingDirection: 'North', vastuPreference: 'No', ...overrides.step4 },
      step5: { amenityPriorities: ['schools', 'hospitals'], ...overrides.step5 },
      step6: { communityPreference: 'Mixed', ...overrides.step6 },
      step7: { monthlyHouseholdIncome: '50K–1L', ...overrides.step7 },
    };
  }

  it('produces a strong-match headline with zero flags when everything is favourable', () => {
    const result = computeAllVerdicts(buildShadowProperty(), buildPreferences());
    expect(result.totalRedFlags).toBe(0);
    expect(result.headline).toBe('Strong match across all signals');
  });

  it('reduces effective noise by the floor band before scoring', () => {
    const sp = buildShadowProperty({
      userProvidedSpecs: { floor: '8–15' },
      intelligence: { noise: { estimatedDb: 70 } },
    });
    const result = computeAllVerdicts(sp, buildPreferences());
    // 70 - 5 (8-15 reduction) = 65 -> Moderate sensitivity pass threshold is <=65
    expect(result.estimatedDb).toBe(65);
    expect(result.rawNoiseDb).toBe(70);
    expect(result.floorNoiseReduction).toBe(5);
    expect(result.noiseVerdict).toBe('pass');
  });

  it('never lets floor-adjusted noise go negative', () => {
    const sp = buildShadowProperty({
      userProvidedSpecs: { floor: '16+' },
      intelligence: { noise: { estimatedDb: 3 } },
    });
    const result = computeAllVerdicts(sp, buildPreferences());
    expect(result.estimatedDb).toBe(0);
  });

  it('only opted-in South-facing vastu counts toward flags (opted-out passes by design)', () => {
    const sp = buildShadowProperty();
    const prefsOptedOut = buildPreferences({ step4: { facingDirection: 'South', vastuPreference: 'No' } });
    const prefsOptedIn = buildPreferences({ step4: { facingDirection: 'South', vastuPreference: 'Yes' } });

    const withoutVastu = computeAllVerdicts(sp, prefsOptedOut);
    const withVastu = computeAllVerdicts(sp, prefsOptedIn);

    // vastuVerdict() itself passes-through direction only when the user opted in —
    // an opted-out preference always reads 'pass' regardless of facing direction.
    expect(withoutVastu.vastuVerdict).toBe('pass');
    expect(withoutVastu.totalRedFlags).toBe(0);

    expect(withVastu.vastuVerdict).toBe('red_flag');
    expect(withVastu.totalRedFlags).toBe(1); // counted — opted in
  });

  it('uses overrides.realCommuteMins instead of the haversine estimate when provided', () => {
    const sp = buildShadowProperty();
    const prefs = buildPreferences({ step1: { wfhStatus: 'office', maxCommuteMinutes: 30, commuteMode: 'car', workplaceLat: 12.9716, workplaceLng: 77.6946 } });
    const result = computeAllVerdicts(sp, prefs, { realCommuteMins: 999 });
    expect(result.commuteVerdict).toBe('red_flag');
    expect(result.estimatedCommuteMins).toBe(999);
  });

  it('reports 0 estimated commute minutes for full-time WFH with no override', () => {
    const result = computeAllVerdicts(buildShadowProperty(), buildPreferences());
    expect(result.estimatedCommuteMins).toBe(0);
  });

  it('reports null estimated commute minutes when not WFH and no workplace set', () => {
    const prefs = buildPreferences({ step1: { wfhStatus: 'office', maxCommuteMinutes: 30, commuteMode: 'car', workplaceLat: null, workplaceLng: null } });
    const result = computeAllVerdicts(buildShadowProperty(), prefs);
    expect(result.estimatedCommuteMins).toBeNull();
  });
});
