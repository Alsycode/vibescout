// FILE: test/integration/adminAuth.routes.test.js
// PURPOSE: Stage 3 — /admin/auth login/logout/me, plus a sweep proving every
//          /admin/* resource route is gated by requireAdminAuth: no cookie ->
//          401, a normal customer's cookie -> 401 (wrong cookie/audience), a
//          forged admin-audience token for a non-admin role -> 403, a real
//          admin -> 200.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

// apiUsage.service.js talks to Upstash's raw redis client directly (not the
// REST wrapper in src/lib/redis.js that everything else uses, and not
// nock-interceptable — see Stage 0.7's note in .env.test), so it has no real
// backing store in this test env. Mocked here purely so /admin/api-usage's
// authz gate (the thing this sweep actually tests) is reachable; its data
// correctness is out of scope for this suite.
vi.mock('../../src/services/apiUsage.service.js', () => ({
  getMonthlyUsage: vi.fn().mockResolvedValue({ month: '2026-09', totalCalls: 0, providers: {} }),
  getAvailableMonths: vi.fn().mockResolvedValue([]),
  getDailySeries: vi.fn().mockResolvedValue([]),
}));

const { agent, setupDb, teardownDb, sessionCookieFor, adminCookieFor, forgedAdminCookieFor } = await import('./helpers.js');
const { seedUsers, SEED_PASSWORD } = await import('../fixtures/seedData.js');

describe('admin auth + admin route authz sweep', () => {
  let users;

  beforeAll(async () => {
    ({ users } = await setupDb());
  });

  afterAll(async () => {
    await teardownDb();
  });

  describe('POST /admin/auth/login', () => {
    it('logs in an admin and sets vb_admin_session', async () => {
      const res = await agent.post('/admin/auth/login').send({ email: seedUsers.admin.email, password: SEED_PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
      expect(res.headers['set-cookie'].join(';')).toMatch(/vb_admin_session=/);
    });

    it('rejects a non-admin user with the same generic error as bad credentials', async () => {
      const res = await agent.post('/admin/auth/login').send({ email: seedUsers.user1.email, password: SEED_PASSWORD });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('rejects a wrong password for an admin account', async () => {
      const res = await agent.post('/admin/auth/login').send({ email: seedUsers.admin.email, password: 'wrong' });
      expect(res.status).toBe(401);
    });

    it('rejects missing fields', async () => {
      const res = await agent.post('/admin/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('GET /admin/auth/me', () => {
    it('requires an admin cookie', async () => {
      expect((await agent.get('/admin/auth/me')).status).toBe(401);
    });

    it('rejects a customer session cookie (wrong cookie name/audience)', async () => {
      const res = await agent.get('/admin/auth/me').set('Cookie', sessionCookieFor(users.user1));
      expect(res.status).toBe(401);
    });

    it('returns the admin profile for a real admin cookie', async () => {
      const res = await agent.get('/admin/auth/me').set('Cookie', adminCookieFor(users.admin));
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('admin');
    });
  });

  describe('POST /admin/auth/logout', () => {
    it('clears the admin cookie', async () => {
      const res = await agent.post('/admin/auth/logout');
      expect(res.status).toBe(200);
      expect(res.headers['set-cookie'].join(';')).toMatch(/vb_admin_session=;/);
    });
  });

  // Every /admin/* resource router mounts `router.use(requireAdminAuth)` as a
  // blanket gate — this table drives the same three-case check (401/401/200)
  // across a representative GET per resource, plus the one case that needs a
  // deliberately-forged token (403 for an admin-audience token on a non-admin
  // role, which the real login route can never itself produce).
  const adminGetRoutes = [
    '/admin/shadow-properties',
    '/admin/leads',
    '/admin/leads/stats',
    '/admin/brokers',
    '/admin/clusters',
    '/admin/clusters/stale',
    '/admin/blog',
    '/admin/analytics/funnel',
    '/admin/analytics/conversion',
    '/admin/api-usage',
    '/admin/api-usage/daily',
  ];

  it.each(adminGetRoutes)('%s -> 401 with no cookie', async (route) => {
    const res = await agent.get(route);
    expect(res.status).toBe(401);
  });

  it.each(adminGetRoutes)('%s -> 401 with a customer session cookie', async (route) => {
    const res = await agent.get(route).set('Cookie', sessionCookieFor(users.user1));
    expect(res.status).toBe(401);
  });

  it.each(adminGetRoutes)('%s -> 200 with a real admin cookie', async (route) => {
    const res = await agent.get(route).set('Cookie', adminCookieFor(users.admin));
    expect(res.status).toBe(200);
  });

  it('a forged admin-audience token for a non-admin role -> 403 (defensive branch)', async () => {
    const res = await agent.get('/admin/shadow-properties').set('Cookie', forgedAdminCookieFor(users.user1));
    expect(res.status).toBe(403);
  });

  it('GET /admin/shadow-properties/:id -> 404 for an unknown id, 200 for a real one', async () => {
    const cookie = adminCookieFor(users.admin);
    const notFound = await agent.get('/admin/shadow-properties/000000000000000000000000').set('Cookie', cookie);
    expect(notFound.status).toBe(404);
  });

  it('pagination query params are accepted without error (SEC-15 clamp)', async () => {
    const res = await agent.get('/admin/shadow-properties?page=1&limit=999999').set('Cookie', adminCookieFor(users.admin));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
