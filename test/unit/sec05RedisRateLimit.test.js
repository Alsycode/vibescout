// FILE: test/unit/sec05RedisRateLimit.test.js
// PURPOSE: SEC-05/PERF-2 — proves the rate limiters are wired to Redis (via
// @upstash/ratelimit, mocked here for determinism), 429 once the configured
// limit is exceeded, fail OPEN (let the request through) when the Redis
// check errors, and that the global limiter now actually applies (it used to
// be mounted at the dead '/api' prefix the Next.js rewrite strips).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const { mockLimit } = vi.hoisted(() => ({ mockLimit: vi.fn() }));

vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: Object.assign(
    class {
      limit(...args) {
        return mockLimit(...args);
      }
    },
    { slidingWindow: vi.fn(() => ({})) },
  ),
}));

const { authLimiter } = await import('../../src/middleware/rateLimiter.js');
const app = (await import('../../src/app.js')).default;

function miniApp(limiter) {
  const mini = express();
  mini.use(limiter);
  mini.get('/x', (req, res) => res.json({ ok: true }));
  return mini;
}

beforeEach(() => {
  mockLimit.mockReset();
});

describe('rate limiter middleware (unit)', () => {
  it('lets the request through under the limit, and sets RateLimit-* headers', async () => {
    mockLimit.mockResolvedValue({ success: true, limit: 20, remaining: 19, reset: Date.now() + 1000 });
    const res = await request(miniApp(authLimiter)).get('/x');
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBe('20');
    expect(res.headers['ratelimit-remaining']).toBe('19');
  });

  it('429s with the configured message once the limit is exceeded', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 20, remaining: 0, reset: Date.now() + 1000 });
    const res = await request(miniApp(authLimiter)).get('/x');
    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/auth attempts/i);
  });

  it('fails open — lets the request through — when the Redis check rejects', async () => {
    mockLimit.mockRejectedValue(new Error('ECONNREFUSED: upstash unreachable'));
    const res = await request(miniApp(authLimiter)).get('/x');
    expect(res.status).toBe(200);
  });
});

describe('global limiter wiring — SEC-05', () => {
  it('applies to a route that previously had no limiter at all (the old dead /api mount)', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 100, remaining: 0, reset: Date.now() + 1000 });
    // /admin/leads has no route-specific limiter of its own — a 429 here can
    // only come from the global one, proving it now actually runs (it used
    // to be mounted at '/api', which the frontend rewrite strips before the
    // request reaches this backend, so it never fired for anything).
    const res = await request(app).get('/admin/leads');
    expect(res.status).toBe(429);
  });

  it('never blocks GET /health regardless of the limiter result (mounted before it)', async () => {
    mockLimit.mockResolvedValue({ success: false, limit: 100, remaining: 0, reset: Date.now() + 1000 });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});
