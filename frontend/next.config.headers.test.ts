// FILE: frontend/next.config.headers.test.ts
// PURPOSE: SEC-08 — regression guard on next.config.js's headers(): the
// enforced security headers (HSTS, nosniff, frame-ancestors, Referrer-Policy,
// Permissions-Policy) must stay present, and CSP must stay Report-Only until
// a deliberate follow-up promotes it to enforcing (see the comment in
// next.config.js for why: inline styles + no nonce plumbing yet).

import { describe, it, expect } from 'vitest';
import nextConfig from './next.config.js';

describe('next.config.js headers() — SEC-08', () => {
  it('applies to every route', async () => {
    const entries = await nextConfig.headers();
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe('/:path*');
  });

  it('sets the enforced security headers', async () => {
    const [{ headers }] = await nextConfig.headers();
    const byKey = Object.fromEntries(headers.map((h: { key: string; value: string }) => [h.key, h.value]));

    expect(byKey['Strict-Transport-Security']).toMatch(/max-age=31536000/);
    expect(byKey['X-Content-Type-Options']).toBe('nosniff');
    expect(byKey['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(byKey['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(byKey['Permissions-Policy']).toMatch(/geolocation=\(\)/);
  });

  it('ships CSP as Report-Only, not enforcing, until nonces/inline-style audit lands', async () => {
    const [{ headers }] = await nextConfig.headers();
    const keys = headers.map((h: { key: string }) => h.key);

    expect(keys).toContain('Content-Security-Policy-Report-Only');
    expect(keys).not.toContain('Content-Security-Policy');
  });

  it("CSP covers this app's actual external resources (Google Maps, Razorpay, Google Fonts)", async () => {
    const [{ headers }] = await nextConfig.headers();
    const csp = headers.find((h: { key: string }) => h.key === 'Content-Security-Policy-Report-Only').value;

    expect(csp).toMatch(/script-src[^;]*maps\.googleapis\.com/);
    expect(csp).toMatch(/script-src[^;]*checkout\.razorpay\.com/);
    expect(csp).toMatch(/style-src[^;]*fonts\.googleapis\.com/);
    expect(csp).toMatch(/font-src[^;]*fonts\.gstatic\.com/);
    expect(csp).toMatch(/frame-src[^;]*checkout\.razorpay\.com/);
  });
});
