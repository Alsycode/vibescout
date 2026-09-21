// FILE: test/unit/perf7FetchWithTimeout.test.js
// PURPOSE: PERF-7 — proves fetchWithTimeout still hands callers a normal Response
// (so every existing `if (!res.ok) ...` fallback keeps working) even though a
// 429/5xx is now also fed to the circuit breaker, and that a tripped breaker
// makes fetchWithTimeout fail fast (reject) without hitting the network.

import { describe, it, expect, beforeEach } from 'vitest';
import nock from 'nock';
import { fetchWithTimeout } from '../../src/lib/fetchWithTimeout.js';
import { _resetProviderGuardState } from '../../src/lib/providerGuard.js';

beforeEach(() => {
  _resetProviderGuardState();
  nock.cleanAll();
});

describe('fetchWithTimeout — PERF-7 circuit breaker integration', () => {
  it('a 429 is still returned as a normal (non-ok) Response to the caller', async () => {
    nock('https://api.openaq.org').get('/one-off').reply(429, { error: 'rate limited' });

    const res = await fetchWithTimeout('https://api.openaq.org/one-off');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(429);
  });

  it('a 5xx is still returned as a normal (non-ok) Response to the caller', async () => {
    nock('https://api.openaq.org').get('/one-off').reply(503, { error: 'down' });

    const res = await fetchWithTimeout('https://api.openaq.org/one-off');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(503);
  });

  it('a 2xx is returned as-is', async () => {
    nock('https://api.openaq.org').get('/one-off').reply(200, { ok: true });

    const res = await fetchWithTimeout('https://api.openaq.org/one-off');
    expect(res.ok).toBe(true);
  });

  it('repeated 5xx responses trip the breaker, then fetchWithTimeout rejects without a network call', async () => {
    // providerGuard's breaker has volumeThreshold: 5 — it opens once the 5th
    // failure lands, on the *next* (6th) call.
    nock('https://api.openaq.org').get('/flaky').times(5).reply(500);

    for (let i = 0; i < 5; i++) {
      const res = await fetchWithTimeout('https://api.openaq.org/flaky');
      expect(res.status).toBe(500);
    }

    // No mocked interceptor is registered for this 6th call — if the breaker
    // didn't short-circuit, guardedCall would actually invoke fetch and nock
    // (real network disabled in test/setup.js) would throw an unrelated
    // "no match for request" error instead of opossum's own open-breaker code.
    await expect(fetchWithTimeout('https://api.openaq.org/flaky')).rejects.toMatchObject({
      code: 'EOPENBREAKER',
    });
  });
});
