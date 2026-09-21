// FILE: test/unit/sec08SecurityHeaders.test.js
// PURPOSE: SEC-08 — proves every API response carries the helmet-driven
// security headers (HSTS, X-Content-Type-Options, frame-ancestors,
// Referrer-Policy, Permissions-Policy, X-Frame-Options), including on error
// responses (the exit-gate scenario in PRODUCTION_READINESS_PLAN.md).

import { describe, it, expect } from 'vitest';
import request from 'supertest';

const app = (await import('../../src/app.js')).default;

describe('security headers (helmet) — SEC-08', () => {
  it('a normal response carries HSTS, nosniff, frame-ancestors, Referrer-Policy, Permissions-Policy', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['strict-transport-security']).toMatch(/max-age=31536000/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toMatch(/frame-ancestors 'none'/);
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['referrer-policy']).toBe('no-referrer');
    expect(res.headers['permissions-policy']).toMatch(/geolocation=\(\)/);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('a 404 (unmatched route) still carries the security headers', async () => {
    const res = await request(app).get('/this-route-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.headers['strict-transport-security']).toBeTypeOf('string');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('DENY');
  });
});
