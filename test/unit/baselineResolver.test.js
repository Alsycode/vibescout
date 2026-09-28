// FILE: test/unit/baselineResolver.test.js
// PURPOSE: Stage 2.4 — baselineResolver.service.js#compareRentToBaseline plus
// the resolveRentBaseline fallback chain (locality -> citywide -> adjacent BHK
// -> cross-property-type estimate -> national average).

import { describe, it, expect } from 'vitest';
import {
  mapBhkToPropertyType,
  resolveRentBaseline,
  compareRentToBaseline,
  resolveSalePriceBaseline,
  compareSalePriceToBaseline,
} from '../../src/services/baselineResolver.service.js';

describe('mapBhkToPropertyType', () => {
  it('maps standard BHK enums to apartment + bhkKey', () => {
    expect(mapBhkToPropertyType('1BHK')).toEqual({ propertyType: 'apartment', bhkKey: '1bhk' });
    expect(mapBhkToPropertyType('4BHK+')).toEqual({ propertyType: 'apartment', bhkKey: '4bhk' });
  });

  it('maps Villa to villa/3bhk', () => {
    expect(mapBhkToPropertyType('Villa')).toEqual({ propertyType: 'villa', bhkKey: '3bhk' });
  });

  it('returns null for unsupported types (Studio/Plot/PG)', () => {
    expect(mapBhkToPropertyType('Studio')).toBeNull();
    expect(mapBhkToPropertyType('Plot')).toBeNull();
    expect(mapBhkToPropertyType(undefined)).toBeNull();
  });
});

describe('resolveRentBaseline — fallback chain', () => {
  it('resolves at locality precision when the exact locality+BHK exists', () => {
    const r = resolveRentBaseline({ cityName: 'Mumbai', suburb: 'Andheri West', bhk: '2BHK' });
    expect(r.basis).toBe('locality');
    expect(r.rentPerMonth.avg).toBe(90000);
  });

  it('resolves an alias city name (Bengaluru -> bangalore)', () => {
    const r = resolveRentBaseline({ cityName: 'Bengaluru', bhk: '2BHK' });
    expect(r).not.toBeNull();
  });

  it('falls back to citywide when the locality is unknown', () => {
    const r = resolveRentBaseline({ cityName: 'Mumbai', suburb: 'Nowhere Village', bhk: '2BHK' });
    expect(r.basis).toBe('citywide');
    expect(r.matchedLabel).toBe('Mumbai');
  });

  it('falls back to an adjacent BHK when the exact one is missing citywide', () => {
    // Mumbai citywide only has 1/2/3 bhk apartment data, not 4bhk
    const r = resolveRentBaseline({ cityName: 'Mumbai', bhk: '4BHK+' });
    expect(r.basis).toBe('estimated_adjacent_bhk');
  });

  it('estimates across property types when the requested type is entirely absent', () => {
    // Delhi citywide has apartment only, no villa data at all (unlike Mumbai, which
    // gained a sourced citywide villa rent block — see rentSaleBaseline.seed.json's
    // meta.notes "VILLA RENT PASS" — so it now resolves at 'citywide' instead).
    const r = resolveRentBaseline({ cityName: 'Delhi', bhk: 'Villa' });
    expect(r.basis).toBe('estimated_multiplier');
    expect(r.rentPerMonth.avg).toBeGreaterThan(0);
  });

  it('falls back to the national average for an unresolvable city', () => {
    const r = resolveRentBaseline({ cityName: 'Some Fictional Town', bhk: '2BHK' });
    expect(r.basis).toBe('national_estimate');
    expect(r.matchedLabel).toBe('National average');
  });

  it('returns null for a bhk with no comparable baseline concept', () => {
    expect(resolveRentBaseline({ cityName: 'Mumbai', bhk: 'Studio' })).toBeNull();
  });
});

describe('compareRentToBaseline — verdict thresholds', () => {
  const params = { cityName: 'Mumbai', suburb: 'Andheri West', bhk: '2BHK' }; // baseline avg = 90000

  it('returns null when there is no baseline or no actual rent', () => {
    expect(compareRentToBaseline({ ...params, actualRent: null })).toBeNull();
    expect(compareRentToBaseline({ cityName: 'Mumbai', bhk: 'Studio', actualRent: 20000 })).toBeNull();
  });

  it('pass + "good deal" at <= -10% delta', () => {
    const r = compareRentToBaseline({ ...params, actualRent: 81000 }); // -10%
    expect(r.deltaPercent).toBe(-10);
    expect(r.verdict).toBe('pass');
    expect(r.label).toBe('Below market average — a good deal');
  });

  it('pass + "in line" at the boundary just above -10%', () => {
    const r = compareRentToBaseline({ ...params, actualRent: 81900 }); // -9%
    expect(r.verdict).toBe('pass');
    expect(r.label).toBe('In line with the market average');
  });

  it('pass + "in line" at exactly +10% delta', () => {
    const r = compareRentToBaseline({ ...params, actualRent: 99000 }); // +10%
    expect(r.deltaPercent).toBe(10);
    expect(r.verdict).toBe('pass');
    expect(r.label).toBe('In line with the market average');
  });

  it('caution just above +10% delta', () => {
    const r = compareRentToBaseline({ ...params, actualRent: 99900 }); // +11%
    expect(r.verdict).toBe('caution');
    expect(r.label).toBe('Above the market average');
  });

  it('caution at exactly +25% delta', () => {
    const r = compareRentToBaseline({ ...params, actualRent: 112500 }); // +25%
    expect(r.deltaPercent).toBe(25);
    expect(r.verdict).toBe('caution');
  });

  it('red_flag just above +25% delta', () => {
    const r = compareRentToBaseline({ ...params, actualRent: 113400 }); // +26%
    expect(r.verdict).toBe('red_flag');
    expect(r.label).toBe('Significantly above the market average');
  });

  it('reports confidence derived from the resolution basis', () => {
    const locality = compareRentToBaseline({ ...params, actualRent: 90000 });
    expect(locality.confidence).toBe('high'); // basis: locality

    const national = compareRentToBaseline({ cityName: 'Some Fictional Town', bhk: '2BHK', actualRent: 30000 });
    expect(national.confidence).toBe('low'); // basis: national_estimate
  });
});

describe('resolveSalePriceBaseline — fallback chain', () => {
  it('resolves at locality precision when the exact locality+BHK exists', () => {
    // Mumbai — Andheri West 2BHK salePricePerSqft avg = 46500
    const r = resolveSalePriceBaseline({ cityName: 'Mumbai', suburb: 'Andheri West', bhk: '2BHK' });
    expect(r.basis).toBe('locality');
    expect(r.salePricePerSqft.avg).toBe(46500);
  });

  it('falls back to citywide when the locality is unknown', () => {
    const r = resolveSalePriceBaseline({ cityName: 'Mumbai', suburb: 'Nowhere Village', bhk: '2BHK' });
    expect(r.basis).toBe('citywide');
    expect(r.matchedLabel).toBe('Mumbai');
  });

  it('falls back to an adjacent BHK within the same locality before dropping to citywide', () => {
    // Andheri West 1BHK only has rentPerMonth in the seed, no salePricePerSqft, but the
    // same locality's 2BHK/3BHK do — locality-level adjacent-BHK must win over citywide.
    const r = resolveSalePriceBaseline({ cityName: 'Mumbai', suburb: 'Andheri West', bhk: '1BHK' });
    expect(r).not.toBeNull();
    expect(r.basis).toBe('estimated_adjacent_bhk');
    expect(r.salePricePerSqft.avg).toBe(46500);
  });

  it('estimates villa sale price from the apartment figure when no villa salePricePerSqft exists anywhere', () => {
    // Per the seed's own sourcing notes, no city has a villa salePricePerSqft figure at all,
    // so this must fall through to the apartment estimate rather than returning null.
    const r = resolveSalePriceBaseline({ cityName: 'Mumbai', bhk: 'Villa' });
    expect(r.basis).toBe('estimated_multiplier');
    expect(r.salePricePerSqft.avg).toBeGreaterThan(0);
  });

  it('falls back to the national average for an unresolvable city', () => {
    const r = resolveSalePriceBaseline({ cityName: 'Some Fictional Town', bhk: '2BHK' });
    expect(r.basis).toBe('national_estimate');
    expect(r.matchedLabel).toBe('National average');
  });

  it('returns null for a bhk with no comparable baseline concept', () => {
    expect(resolveSalePriceBaseline({ cityName: 'Mumbai', bhk: 'Studio' })).toBeNull();
  });

  it('returns null for a city/bhk combination with no sale data anywhere in the fallback chain', () => {
    // Madurai has no citywide/locality salePricePerSqft at all per meta.notes, but the
    // tier/national average fallback should still resolve something for a real city —
    // this only returns null when mapBhkToPropertyType itself rejects the bhk.
    expect(resolveSalePriceBaseline({ cityName: 'Madurai', bhk: 'Studio' })).toBeNull();
  });
});

describe('compareSalePriceToBaseline — verdict thresholds', () => {
  const params = { cityName: 'Mumbai', suburb: 'Andheri West', bhk: '2BHK' }; // baseline avg/sqft = 46500

  it('returns null when actualAmount or sqft is missing', () => {
    expect(compareSalePriceToBaseline({ ...params, actualAmount: null, sqft: 1000 })).toBeNull();
    expect(compareSalePriceToBaseline({ ...params, actualAmount: 46500000, sqft: null })).toBeNull();
    expect(compareSalePriceToBaseline({ ...params, actualAmount: 0, sqft: 1000 })).toBeNull();
  });

  it('returns null when no baseline can be resolved at all', () => {
    expect(compareSalePriceToBaseline({ cityName: 'Mumbai', bhk: 'Studio', actualAmount: 5000000, sqft: 1000 })).toBeNull();
  });

  it('computes actualPricePerSqft from actualAmount / sqft', () => {
    const r = compareSalePriceToBaseline({ ...params, actualAmount: 46500000, sqft: 1000 }); // 46500/sqft — exactly avg
    expect(r.actualPricePerSqft).toBe(46500);
    expect(r.deltaPercent).toBe(0);
    expect(r.verdict).toBe('pass');
    expect(r.label).toBe('In line with the market average');
  });

  it('pass + "good deal" at <= -10% delta', () => {
    const r = compareSalePriceToBaseline({ ...params, actualAmount: 41850000, sqft: 1000 }); // 41850/sqft = -10%
    expect(r.deltaPercent).toBe(-10);
    expect(r.verdict).toBe('pass');
    expect(r.label).toBe('Below market average — a good deal');
  });

  it('caution just above +10% delta', () => {
    const r = compareSalePriceToBaseline({ ...params, actualAmount: 51615000, sqft: 1000 }); // 51615/sqft = +11%
    expect(r.verdict).toBe('caution');
    expect(r.label).toBe('Above the market average');
  });

  it('red_flag just above +25% delta', () => {
    const r = compareSalePriceToBaseline({ ...params, actualAmount: 58559000, sqft: 1000 }); // ~+25.9%
    expect(r.verdict).toBe('red_flag');
    expect(r.label).toBe('Significantly above the market average');
  });

  it('reports confidence derived from the resolution basis', () => {
    const locality = compareSalePriceToBaseline({ ...params, actualAmount: 46500000, sqft: 1000 });
    expect(locality.confidence).toBe('high'); // basis: locality

    const national = compareSalePriceToBaseline({ cityName: 'Some Fictional Town', bhk: '2BHK', actualAmount: 5000000, sqft: 1000 });
    expect(national.confidence).toBe('low'); // basis: national_estimate
  });

  it('does not affect or get affected by the rent baseline for the same params', () => {
    const rent = compareRentToBaseline({ ...params, actualRent: 90000 });
    const sale = compareSalePriceToBaseline({ ...params, actualAmount: 46500000, sqft: 1000 });
    expect(rent.baselineAvg).toBe(90000);
    expect(sale.baselineAvgPerSqft).toBe(46500);
  });
});
