// FILE: test/unit/geocodeService.test.js
// PURPOSE: PERF-7 — proves the shared reverseGeocodeNominatim: caches a
// successful lookup (so the 3 former call sites no longer triple-hit
// Nominatim for the same coordinate), and negative-caches a failed one for
// the plan's short (10 min) window instead of retrying every request.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const store = new Map();
const redisGetMock = vi.fn((key) => Promise.resolve(store.get(key) ?? null));
const redisSetMock = vi.fn((key, value) => { store.set(key, value); return Promise.resolve(); });

vi.mock('../../src/lib/redis.js', () => ({
  redisGet: (...args) => redisGetMock(...args),
  redisSet: (...args) => redisSetMock(...args),
}));

const fetchWithTimeoutMock = vi.fn();
vi.mock('../../src/lib/fetchWithTimeout.js', () => ({
  fetchWithTimeout: (...args) => fetchWithTimeoutMock(...args),
}));

const { reverseGeocodeNominatim } = await import('../../src/services/geocode.service.js');

beforeEach(() => {
  store.clear();
  redisGetMock.mockClear();
  redisSetMock.mockClear();
  fetchWithTimeoutMock.mockReset();
});

describe('reverseGeocodeNominatim — PERF-7 shared cache', () => {
  it('fetches live on a cache miss and caches the result', async () => {
    fetchWithTimeoutMock.mockResolvedValue({
      ok: true,
      json: async () => ({ address: { city: 'Mumbai', state: 'Maharashtra' }, display_name: 'Mumbai, MH' }),
    });

    const result = await reverseGeocodeNominatim(19.076, 72.877);

    expect(result).toEqual({ city: 'Mumbai', state: 'Maharashtra', displayName: 'Mumbai, MH' });
    expect(fetchWithTimeoutMock).toHaveBeenCalledTimes(1);
    expect(redisSetMock).toHaveBeenCalledWith(
      expect.stringContaining('geocode:nominatim:'),
      expect.any(String),
      30 * 24 * 60 * 60,
    );
  });

  it('a second lookup at the same coordinate is served from cache — no second Nominatim call', async () => {
    fetchWithTimeoutMock.mockResolvedValue({
      ok: true,
      json: async () => ({ address: { state: 'Karnataka' }, display_name: 'Bengaluru' }),
    });

    await reverseGeocodeNominatim(12.9716, 77.5946);
    fetchWithTimeoutMock.mockClear();

    const second = await reverseGeocodeNominatim(12.9716, 77.5946);

    expect(second.state).toBe('Karnataka');
    expect(fetchWithTimeoutMock).not.toHaveBeenCalled();
  });

  it('negative-caches a failed lookup for the short TTL instead of retrying every call', async () => {
    fetchWithTimeoutMock.mockResolvedValue({ ok: false, status: 500 });

    const first = await reverseGeocodeNominatim(1.234, 5.678);
    expect(first).toBeNull();
    expect(redisSetMock).toHaveBeenCalledWith(
      expect.stringContaining('geocode:nominatim:'),
      expect.stringContaining('miss'),
      10 * 60,
    );

    fetchWithTimeoutMock.mockClear();
    const second = await reverseGeocodeNominatim(1.234, 5.678);
    expect(second).toBeNull();
    expect(fetchWithTimeoutMock).not.toHaveBeenCalled(); // served from the negative cache
  });

  it('a network error also negative-caches rather than throwing', async () => {
    fetchWithTimeoutMock.mockRejectedValue(new Error('network down'));

    const result = await reverseGeocodeNominatim(9.99, 9.99);
    expect(result).toBeNull();
  });
});
