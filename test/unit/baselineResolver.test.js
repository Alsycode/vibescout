// FILE: test/unit/baselineResolver.test.js
// PURPOSE: Stage 2.4 — baselineResolver.service.js#compareRentToBaseline plus
// the resolveRentBaseline fallback chain (locality -> citywide -> adjacent BHK
// -> cross-property-type estimate -> national average).

import { describe, it, expect } from 'vitest';
import {
  mapBhkToPropertyType,
  resolveRentBaseline,
  compareRentToBaseline,
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
    // Mumbai citywide has apartment only, no villa data at all
    const r = resolveRentBaseline({ cityName: 'Mumbai', bhk: 'Villa' });
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
