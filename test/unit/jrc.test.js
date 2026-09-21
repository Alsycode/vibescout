// FILE: test/unit/jrc.test.js
// PURPOSE: Stage 2.6 — jrc.service.js#classifyFloodRisk: all occurrence and
// nearest-water-distance thresholds, and the fallback precedence between them.

import { describe, it, expect } from 'vitest';
import { classifyFloodRisk } from '../../src/services/jrc.service.js';

describe('classifyFloodRisk — JRC occurrence branch (takes precedence when available)', () => {
  it('Very High at occurrence >= 50', () => {
    expect(classifyFloodRisk(50, null).risk).toBe('Very High');
    expect(classifyFloodRisk(50, null).score).toBe(90);
  });

  it('High at occurrence 20-49', () => {
    expect(classifyFloodRisk(20, null).risk).toBe('High');
    expect(classifyFloodRisk(49, null).risk).toBe('High');
  });

  it('Moderate at occurrence 5-19', () => {
    expect(classifyFloodRisk(5, null).risk).toBe('Moderate');
    expect(classifyFloodRisk(19, null).risk).toBe('Moderate');
  });

  it('falls through to the water-distance branch when occurrence is below 5 but nonzero', () => {
    // occurrence=4 doesn't hit any occurrence bracket -> falls to nearestWaterM logic
    const r = classifyFloodRisk(4, 50);
    expect(r.risk).toBe('High'); // nearestWaterM <= 100
  });

  it('falls through to Low when occurrence is below 5 and no water nearby', () => {
    expect(classifyFloodRisk(4, null).risk).toBe('Low');
    expect(classifyFloodRisk(0, null).risk).toBe('Low');
  });
});

describe('classifyFloodRisk — nearest-water-distance branch (occurrence unavailable)', () => {
  it('High at <=100m', () => {
    const r = classifyFloodRisk(null, 100);
    expect(r.risk).toBe('High');
    expect(r.score).toBe(65);
  });

  it('Moderate at 101-300m', () => {
    expect(classifyFloodRisk(null, 101).risk).toBe('Moderate');
    expect(classifyFloodRisk(null, 300).risk).toBe('Moderate');
  });

  it('Low-Moderate at 301-500m', () => {
    expect(classifyFloodRisk(null, 301).risk).toBe('Low-Moderate');
    expect(classifyFloodRisk(null, 500).risk).toBe('Low-Moderate');
  });

  it('Low beyond 500m or with no water data at all', () => {
    expect(classifyFloodRisk(null, 501).risk).toBe('Low');
    expect(classifyFloodRisk(null, null).risk).toBe('Low');
  });

  it('includes the distance in the reason text', () => {
    const r = classifyFloodRisk(null, 250);
    expect(r.reason).toContain('250m');
  });
});
