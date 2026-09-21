// FILE: test/unit/scoringServices.test.js
// PURPOSE: Stage 2.5 — livability, maturity, solarSavings, infrastructureMomentum.
// All four are pure functions over already-fetched intelligence data (no I/O).

import { describe, it, expect } from 'vitest';
import { computeLivabilityIndex } from '../../src/services/livability.service.js';
import { computeMaturityScore } from '../../src/services/maturity.service.js';
import { computeSolarSavings } from '../../src/services/solarSavings.service.js';
import { extractInfraSignals } from '../../src/services/infrastructureMomentum.service.js';

describe('computeLivabilityIndex', () => {
  it('scores a best-case input as A+ near 100', () => {
    const r = computeLivabilityIndex(
      { value: 40 },
      { noiseRiskScore: 0 },
      { parks: [{ distanceM: 100 }, { distanceM: 200 }, { distanceM: 300 }] },
      { peakSunHours: 7 },
    );
    expect(r.score).toBe(100);
    expect(r.grade).toBe('A+');
  });

  it('scores a worst-case input as D near 10', () => {
    const r = computeLivabilityIndex(
      { value: 500 },
      { noiseRiskScore: 100 },
      { parks: [] },
      { peakSunHours: 0 },
    );
    // aqi=10*0.3 + noise=0*0.3 + parks=0*0.2 + solar=25*0.2 = 3+0+0+5 = 8
    expect(r.score).toBe(8);
    expect(r.grade).toBe('D');
  });

  it('defaults every sub-score to its midpoint when inputs are missing', () => {
    const r = computeLivabilityIndex(undefined, undefined, undefined, undefined);
    // 50*0.3 + 50*0.3 + 0*0.2 + 50*0.2 = 15+15+0+10 = 40
    expect(r.score).toBe(40);
    expect(r.breakdown.aqi.value).toBeNull();
  });

  it('grades at the documented A+/A/B thresholds', () => {
    // aqi=100(.3)+noise=100(.3)+parks=75(.2, 2 parks)+solar=50(.2, 3hrs) = 30+30+15+10 = 85 -> A+
    const at85 = computeLivabilityIndex(
      { value: 40 }, { noiseRiskScore: 0 },
      { parks: [{ distanceM: 100 }, { distanceM: 200 }] }, { peakSunHours: 3 },
    );
    expect(at85.score).toBe(85);
    expect(at85.grade).toBe('A+');

    // aqi=100(.3)+noise=100(.3)+parks=0(.2)+solar=75(.2, 5hrs) = 30+30+0+15 = 75 -> A
    const at75 = computeLivabilityIndex(
      { value: 40 }, { noiseRiskScore: 0 }, { parks: [] }, { peakSunHours: 5 },
    );
    expect(at75.score).toBe(75);
    expect(at75.grade).toBe('A');

    // aqi=100(.3)+noise=100(.3)+parks=0(.2)+solar=25(.2, 1hr) = 30+30+0+5 = 65 -> B
    const at65 = computeLivabilityIndex(
      { value: 40 }, { noiseRiskScore: 0 }, { parks: [] }, { peakSunHours: 1 },
    );
    expect(at65.score).toBe(65);
    expect(at65.grade).toBe('B');
  });

  it('only counts parks within 1500m', () => {
    const r = computeLivabilityIndex(
      { value: 40 },
      { noiseRiskScore: 0 },
      { parks: [{ distanceM: 1500 }, { distanceM: 1501 }] },
      { peakSunHours: 7 },
    );
    expect(r.breakdown.parks.value).toBe(1);
  });
});

describe('computeMaturityScore', () => {
  it('scores Mature (>=80) when every category is saturated', () => {
    const saturated = Array.from({ length: 3 }, () => ({ distanceM: 100 }));
    const amenities = {
      schools: saturated, hospitals: saturated, gyms: saturated, cafes: saturated,
      restaurants: saturated, parks: saturated, worship: saturated,
    };
    const r = computeMaturityScore(amenities);
    expect(r.score).toBe(100);
    expect(r.band).toBe('Mature');
  });

  it('scores Early Stage (<30) with no amenities at all', () => {
    const r = computeMaturityScore({});
    expect(r.score).toBe(0);
    expect(r.band).toBe('Early Stage');
  });

  it('caps each category at 2 points regardless of count', () => {
    const many = Array.from({ length: 10 }, () => ({ distanceM: 100 }));
    const r = computeMaturityScore({ schools: many });
    expect(r.counts.schools).toBe(10);
    // 2/14 * 100 = 14.28 -> 14
    expect(r.score).toBe(14);
  });

  it('only counts amenities within each category radius', () => {
    const r = computeMaturityScore({ schools: [{ distanceM: 2000 }, { distanceM: 2001 }] });
    expect(r.counts.schools).toBe(1);
  });

  it('bands at the documented thresholds', () => {
    // 55/14*100 needs specific point totals; verify via band function indirectly
    // 8 points / 14 = 57.1 -> 57 -> Established
    const amenities = {
      schools: Array(2).fill({ distanceM: 100 }),
      hospitals: Array(2).fill({ distanceM: 100 }),
      gyms: Array(2).fill({ distanceM: 100 }),
      cafes: Array(2).fill({ distanceM: 100 }),
    };
    const r = computeMaturityScore(amenities);
    // 4 categories * 2 pts = 8; 8/14*100 = 57.14 -> 57
    expect(r.score).toBe(57);
    expect(r.band).toBe('Established');
  });
});

describe('computeSolarSavings', () => {
  it('returns null for missing or non-positive peak sun hours', () => {
    expect(computeSolarSavings(null)).toBeNull();
    expect(computeSolarSavings(undefined)).toBeNull();
    expect(computeSolarSavings(0)).toBeNull();
    expect(computeSolarSavings(-1)).toBeNull();
  });

  it('computes annual savings from a 3kW/85%-efficiency/₹8-per-unit model', () => {
    const r = computeSolarSavings(5);
    const dailyKwh = 5 * 3 * 0.85; // 12.75
    const annualKwh = dailyKwh * 365; // 4653.75
    const annualSavings = Math.round(annualKwh * 8); // 37230
    expect(r.dailyKwh).toBe(parseFloat(dailyKwh.toFixed(1)));
    expect(r.annualKwh).toBe(Math.round(annualKwh));
    expect(r.annualSavingsRs).toBe(annualSavings);
    expect(r.panelKw).toBe(3);
    expect(r.displayText).toBe(`₹${annualSavings.toLocaleString('en-IN')}/yr`);
  });
});

describe('extractInfraSignals', () => {
  it('returns no signals for empty/missing headlines', () => {
    expect(extractInfraSignals(undefined)).toEqual({ signals: [], hasSignals: false, count: 0 });
    expect(extractInfraSignals([])).toEqual({ signals: [], hasSignals: false, count: 0 });
  });

  it('matches an infra keyword in the title', () => {
    const r = extractInfraSignals([{ title: 'New Metro line approved for the corridor', url: 'u', source: 's', publishedAt: 't' }]);
    expect(r.hasSignals).toBe(true);
    expect(r.count).toBe(1);
    expect(r.signals[0].matchedKeywords).toContain('metro');
  });

  it('matches an infra keyword in the snippet, case-insensitively', () => {
    const r = extractInfraSignals([{ title: 'Local update', snippet: 'A new FLYOVER will ease traffic' }]);
    expect(r.hasSignals).toBe(true);
    expect(r.signals[0].matchedKeywords).toContain('flyover');
  });

  it('ignores headlines with no infra keyword match', () => {
    const r = extractInfraSignals([{ title: 'Local bakery wins award', snippet: 'nothing infra related' }]);
    expect(r.hasSignals).toBe(false);
    expect(r.count).toBe(0);
  });

  it('can match multiple keywords in the same headline', () => {
    const r = extractInfraSignals([{ title: 'New metro and highway expansion planned' }]);
    expect(r.signals[0].matchedKeywords).toEqual(expect.arrayContaining(['metro', 'highway']));
  });
});
