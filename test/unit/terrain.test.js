// FILE: test/unit/terrain.test.js
// PURPOSE: Stage 2.7 — terrain.service.js: coastal vs inland classification,
// the flat-terrain downgrade, the min-land-samples null guard, and the
// documented drainage bands. Pure classifiers are tested directly; the
// min-samples/coastal-detection wiring is tested through fetchTerrain with
// mocked elevation providers (both real network hosts are nock-blocked by
// test/setup.js, so this never touches the real network).

import { describe, it, expect } from 'vitest';
import { nock } from '../mocks/externalApis.js';
import { median, classifyCoastal, classifyInland, fetchTerrain } from '../../src/services/terrain.service.js';

describe('median', () => {
  it('averages the two middle values for an even-length array', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });
  it('returns the middle value for an odd-length array', () => {
    expect(median([5, 1, 3])).toBe(3);
  });
});

describe('classifyCoastal', () => {
  it('High drainage risk at <=3m above sea level', () => {
    const r = classifyCoastal(2);
    expect(r.terrainPosition).toBe('Coastal low-lying');
    expect(r.drainageRisk).toBe('High');
  });
  it('Moderate drainage risk at 3.01-8m', () => {
    const r = classifyCoastal(5);
    expect(r.drainageRisk).toBe('Moderate');
  });
  it('returns null above 8m — let inland classification take over', () => {
    expect(classifyCoastal(9)).toBeNull();
  });
});

describe('classifyInland', () => {
  it('downgrades to Level/Low-Moderate on flat terrain regardless of relative elevation', () => {
    // localReliefM < 8 forces the flat-terrain branch even with a large relativeM
    const r = classifyInland(-20, 7);
    expect(r.terrainPosition).toBe('Level');
    expect(r.drainageRisk).toBe('Low-Moderate');
  });

  it('Depression/High risk at relativeM <= -15 (with enough relief to trust it)', () => {
    const r = classifyInland(-15, 20);
    expect(r.terrainPosition).toBe('Depression');
    expect(r.drainageRisk).toBe('High');
  });

  it('Low-lying/Moderate risk at -14.9..-5', () => {
    expect(classifyInland(-5, 20).terrainPosition).toBe('Low-lying');
    expect(classifyInland(-14, 20).drainageRisk).toBe('Moderate');
  });

  it('Level/Low-Moderate within the +-5m error band', () => {
    expect(classifyInland(0, 20).terrainPosition).toBe('Level');
    expect(classifyInland(4.9, 20).terrainPosition).toBe('Level');
    expect(classifyInland(-4.9, 20).terrainPosition).toBe('Level');
  });

  it('Elevated/Low risk at 5..14.9', () => {
    const r = classifyInland(10, 20);
    expect(r.terrainPosition).toBe('Elevated');
    expect(r.drainageRisk).toBe('Low');
  });

  it('Ridge/Low risk at >=15', () => {
    const r = classifyInland(15, 20);
    expect(r.terrainPosition).toBe('Ridge');
    expect(r.drainageRisk).toBe('Low');
  });
});

describe('fetchTerrain — provider wiring + guards', () => {
  const lat = 12.9716, lng = 77.5946;
  const POINT_COUNT = 37; // 1 property + 3 rings * 12 bearings

  it('returns null when neither elevation provider responds', () => {
    nock('https://api.open-meteo.com').get(/.*/).reply(500);
    nock('https://api.opentopodata.org').get(/.*/).reply(500);
    return fetchTerrain(lat, lng).then((r) => expect(r).toBeNull());
  });

  it('returns null when fewer than MIN_LAND_SAMPLES (6) land points are available', () => {
    // All ring points at sea level (<=1m) -> 0 land samples in the rings
    const elevation = Array.from({ length: POINT_COUNT }, () => 0);
    elevation[0] = 10; // property itself is on land, but that's not enough
    nock('https://api.open-meteo.com')
      .get(/.*/)
      .reply(200, { elevation });
    return fetchTerrain(lat, lng).then((r) => expect(r).toBeNull());
  });

  it('classifies an inland property using the outer-ring median as the reference', () => {
    // Property at 100m; every ring point (including the outer ring) at 90m -> relativeM = +10 -> Elevated
    const elevation = Array.from({ length: POINT_COUNT }, () => 90);
    elevation[0] = 100;
    nock('https://api.open-meteo.com')
      .get(/.*/)
      .reply(200, { elevation });
    return fetchTerrain(lat, lng).then((r) => {
      expect(r).not.toBeNull();
      expect(r.terrainPosition).toBe('Elevated');
      expect(r.source).toBe('open-meteo');
      expect(r.elevationM).toBe(100);
    });
  });

  it('falls back to OpenTopoData when Open-Meteo fails', () => {
    const elevation = Array.from({ length: POINT_COUNT }, () => 50);
    elevation[0] = 50;
    nock('https://api.open-meteo.com').get(/.*/).reply(500);
    nock('https://api.opentopodata.org')
      .get(/.*/)
      .reply(200, { results: elevation.map((e) => ({ elevation: e })) });
    return fetchTerrain(lat, lng).then((r) => {
      expect(r).not.toBeNull();
      expect(r.source).toBe('opentopodata');
    });
  });
});
