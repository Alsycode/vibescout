// FILE: test/unit/reportTemplates.test.js
// PURPOSE: Stage 2.2 — reportTemplates.service.js: every fallback string fires
// for its verdict key, and buildTemplateReport degrades sanely on edge inputs.
// This is what a user sees whenever GROQ output fails validation, so every
// verdict->string mapping must actually resolve to real text, never undefined.

import { describe, it, expect } from 'vitest';
import {
  NOISE_TEMPLATES,
  AQI_TEMPLATES,
  SOLAR_TEMPLATES,
  BUDGET_TEMPLATES,
  AMENITY_TEMPLATES,
  COMMUTE_TEMPLATES,
  VASTU_TEMPLATES,
  COMMUNITY_TEMPLATES,
  NEWS_TEMPLATES,
  buildTemplateReport,
} from '../../src/services/reportTemplates.service.js';

function baseVerdict(overrides = {}) {
  return {
    noiseVerdict: 'pass',
    aqiVerdict: 'pass',
    solarVerdict: 'pass',
    amenityVerdict: 'pass',
    budgetVerdict: 'pass',
    commuteVerdict: 'pass',
    vastuVerdict: 'pass',
    communityMatchVerdict: 'pass',
    estimatedDb: 50,
    userNoiseSensitivity: 'Moderate',
    aqiValue: 60,
    peakSunHours: 5,
    nearestHospitalM: 1000,
    nearestSchoolM: 500,
    propertyBudgetBracket: '20K–35K',
    userBudgetBracket: '20K–35K',
    estimatedCommuteMins: 20,
    userVastuPreference: 'No',
    facingDirection: 'North',
    derivedCharacter: 'Mixed',
    userCommunityPreference: 'Mixed',
    communityAmenityCounts: { schoolsNear: 1, parksNear: 1, cafesNear: 0, gymsNear: 0 },
    totalRedFlags: 0,
    totalCautions: 0,
    ...overrides,
  };
}

describe('every verdict-keyed template produces a non-empty string', () => {
  for (const key of ['red_flag', 'caution', 'pass']) {
    it(`NOISE_TEMPLATES.${key}`, () => {
      expect(NOISE_TEMPLATES[key](60, 'High')).toEqual(expect.any(String));
    });
    it(`AQI_TEMPLATES.${key}`, () => {
      expect(AQI_TEMPLATES[key](120)).toEqual(expect.any(String));
    });
    it(`SOLAR_TEMPLATES.${key}`, () => {
      expect(SOLAR_TEMPLATES[key](4)).toEqual(expect.any(String));
    });
    it(`BUDGET_TEMPLATES.${key}`, () => {
      expect(BUDGET_TEMPLATES[key]('1Cr–1.5Cr', '60L–1Cr')).toEqual(expect.any(String));
    });
    it(`AMENITY_TEMPLATES.${key}`, () => {
      expect(AMENITY_TEMPLATES[key](1000, 500)).toEqual(expect.any(String));
    });
    it(`COMMUTE_TEMPLATES.${key}`, () => {
      expect(COMMUTE_TEMPLATES[key](25)).toEqual(expect.any(String));
    });
    it(`VASTU_TEMPLATES.${key}`, () => {
      expect(VASTU_TEMPLATES[key]('South')).toEqual(expect.any(String));
    });
    it(`COMMUNITY_TEMPLATES.${key}`, () => {
      expect(COMMUNITY_TEMPLATES[key]('Family-friendly', 'Family-friendly', { schoolsNear: 2, parksNear: 1, cafesNear: 0, gymsNear: 0 })).toEqual(expect.any(String));
    });
  }

  it('VASTU_TEMPLATES.neutral', () => {
    expect(VASTU_TEMPLATES.neutral()).toEqual(expect.any(String));
  });
  it('VASTU_TEMPLATES.pass with no direction falls back to a generic string', () => {
    expect(VASTU_TEMPLATES.pass(undefined)).toBe('Vastu alignment is favourable.');
  });
  it('NEWS_TEMPLATES both branches', () => {
    expect(NEWS_TEMPLATES.has_headlines(3)).toEqual(expect.any(String));
    expect(NEWS_TEMPLATES.no_headlines()).toEqual(expect.any(String));
  });
});

describe('buildTemplateReport', () => {
  it('builds a full sale report with financialNote (not rentalNote)', () => {
    const report = buildTemplateReport(baseVerdict(), 'sale');
    expect(report.financialNote).toBeDefined();
    expect(report.rentalNote).toBeUndefined();
    expect(report.verdict).toBe('All signals clear — strong overall fit.');
  });

  it('builds a full rent report with rentalNote (not financialNote)', () => {
    const report = buildTemplateReport(baseVerdict(), 'rent');
    expect(report.rentalNote).toBeDefined();
    expect(report.financialNote).toBeUndefined();
  });

  it('summarizes flag counts into the verdict string', () => {
    const report = buildTemplateReport(baseVerdict({ totalRedFlags: 2, totalCautions: 1 }), 'rent');
    expect(report.verdict).toBe('2 concerns, 1 caution noted.');
  });

  it('pluralizes a single concern/caution correctly', () => {
    const report = buildTemplateReport(baseVerdict({ totalRedFlags: 1, totalCautions: 1 }), 'rent');
    expect(report.verdict).toBe('1 concern, 1 caution noted.');
  });

  it('falls back to the "pass" template for an unrecognized verdict key', () => {
    const report = buildTemplateReport(baseVerdict({ noiseVerdict: 'not-a-real-key' }), 'rent');
    expect(report.noiseLabel).toBe(NOISE_TEMPLATES.pass(50));
  });

  it('defaults missing hospital/school distances to 9999', () => {
    const v = baseVerdict({ nearestHospitalM: null, nearestSchoolM: null, amenityVerdict: 'red_flag' });
    const report = buildTemplateReport(v, 'rent');
    expect(report.amenityLabel).toBe(AMENITY_TEMPLATES.red_flag(9999, 9999));
  });

  it('defaults missing estimated commute minutes to 0 (WFH phrasing)', () => {
    const v = baseVerdict({ estimatedCommuteMins: null });
    const report = buildTemplateReport(v, 'rent');
    expect(report.commuteLabel).toBe('No commute impact — working from home full-time.');
  });

  it('renders vastuLabel as neutral when the user did not opt in, even with a bad-direction verdict', () => {
    const v = baseVerdict({ userVastuPreference: 'No', vastuVerdict: 'red_flag', facingDirection: 'South' });
    const report = buildTemplateReport(v, 'rent');
    expect(report.vastuLabel).toBe(VASTU_TEMPLATES.neutral());
  });

  it('renders the real vastuLabel when the user opted in', () => {
    const v = baseVerdict({ userVastuPreference: 'Yes', vastuVerdict: 'red_flag', facingDirection: 'South' });
    const report = buildTemplateReport(v, 'rent');
    expect(report.vastuLabel).toBe(VASTU_TEMPLATES.red_flag('South'));
  });

  it('always returns an empty matchKeywords array (GROQ-only field)', () => {
    const report = buildTemplateReport(baseVerdict(), 'rent');
    expect(report.matchKeywords).toEqual([]);
  });

  it('always defaults newsLabel to no_headlines (informational only, not GROQ-sourced here)', () => {
    const report = buildTemplateReport(baseVerdict(), 'rent');
    expect(report.newsLabel).toBe(NEWS_TEMPLATES.no_headlines());
  });
});

describe('buildCommunityEvidence via COMMUNITY_TEMPLATES (edge inputs)', () => {
  it('reports "amenity data limited" when counts are missing entirely', () => {
    const s = COMMUNITY_TEMPLATES.pass('Mixed', 'Mixed', undefined);
    expect(s).toContain('amenity data limited');
  });

  it('reports "few amenities nearby" when all counts are zero', () => {
    const s = COMMUNITY_TEMPLATES.pass('Quiet & Private', undefined, { schoolsNear: 0, parksNear: 0, cafesNear: 0, gymsNear: 0 });
    expect(s).toContain('few amenities nearby');
  });

  it('pluralizes multi-count amenities correctly', () => {
    const s = COMMUNITY_TEMPLATES.pass('Family-friendly', 'Family-friendly', { schoolsNear: 2, parksNear: 1, cafesNear: 0, gymsNear: 0 });
    expect(s).toContain('2 schools');
    expect(s).toContain('1 park');
  });
});
