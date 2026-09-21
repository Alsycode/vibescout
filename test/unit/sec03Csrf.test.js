// FILE: test/unit/sec03Csrf.test.js
// PURPOSE: SEC-03 — proves the Origin/Referer allowlist rejects cross-site
// state-changing requests before they reach any route, while leaving safe
// methods and non-browser callers (no Origin/Referer at all) untouched.
// Unit-tests the middleware directly, then proves it's actually wired into
// src/app.js against a real route (no model mocking needed — CSRF rejection
// happens before any DB call).

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { csrfProtection } from '../../src/middleware/csrf.js';

// The app-level tests below only need to prove requests reach (or are
// rejected before reaching) the route — not exercise real login logic — so
// mock User rather than hang on an unconnected Mongoose call.
vi.mock('../../src/models/User.js', () => ({
  default: { findOne: vi.fn().mockResolvedValue(null) },
}));

const app = (await import('../../src/app.js')).default;

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe('csrfProtection (unit)', () => {
  const middleware = csrfProtection(['https://app.example.com']);

  it('allows GET/HEAD/OPTIONS regardless of Origin', () => {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const next = vi.fn();
      const res = mockRes();
      middleware({ method, headers: { origin: 'https://evil.example' } }, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('rejects a POST with a mismatched Origin', () => {
    const next = vi.fn();
    const res = mockRes();
    middleware({ method: 'POST', headers: { origin: 'https://evil.example' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows a POST with a matching Origin', () => {
    const next = vi.fn();
    const res = mockRes();
    middleware({ method: 'POST', headers: { origin: 'https://app.example.com' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('falls back to the Referer origin when Origin is absent', () => {
    const next = vi.fn();
    const res = mockRes();
    middleware({ method: 'POST', headers: { referer: 'https://app.example.com/some/page?x=1' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects a mismatched Referer origin', () => {
    const next = vi.fn();
    const res = mockRes();
    middleware({ method: 'POST', headers: { referer: 'https://evil.example/x' } }, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('allows a POST with neither Origin nor Referer (non-browser client)', () => {
    const next = vi.fn();
    const res = mockRes();
    middleware({ method: 'POST', headers: {} }, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('treats an unparseable Referer as absent rather than throwing', () => {
    const next = vi.fn();
    const res = mockRes();
    middleware({ method: 'POST', headers: { referer: 'not a url' } }, res, next);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('CSRF wired into the app — SEC-03', () => {
  // FRONTEND_URL is backfilled to http://localhost:3000 in test/setup.js.
  const allowedOrigin = process.env.FRONTEND_URL;

  it('403s a state-changing route when Origin is a foreign site', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Origin', 'https://evil.example')
      .send({ email: 'a@b.com', password: 'x' });
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/origin/i);
  });

  it('does not 403 the same route when Origin matches FRONTEND_URL', async () => {
    const res = await request(app)
      .post('/auth/login')
      .set('Origin', allowedOrigin)
      .send({ email: 'a@b.com', password: 'x' });
    // Passes CSRF; may still fail downstream (no DB in this test), just not with 403.
    expect(res.status).not.toBe(403);
  });

  it('does not 403 a request with no Origin/Referer at all', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'x' });
    expect(res.status).not.toBe(403);
  });

  it('never 403s a GET request regardless of Origin', async () => {
    const res = await request(app).get('/health').set('Origin', 'https://evil.example');
    expect(res.status).toBe(200);
  });
});
