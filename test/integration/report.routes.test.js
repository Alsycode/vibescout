// FILE: test/integration/report.routes.test.js
// PURPOSE: Stage 3 — /report: list (own reports only), /generate (auth,
//          validation, ownership, incomplete-funnel guard), and /:sessionId
//          (share-token readonly path vs. owner path, SEC-01/SEC-17).
//
// The full /generate happy path (Groq call + commute/places fetch + Redis
// cache) needs the seeded user's funnel preferences (step1/3/4/5/7) filled
// in, which the seed fixture deliberately leaves empty (it's Stage 2's job
// to unit-test computeAllVerdicts/computeFinancialScores directly) — so this
// suite exercises every reachable branch up to and including that "funnel
// incomplete" 400, not the full external-API-backed generation itself.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { agent, setupDb, teardownDb, sessionCookieFor } from './helpers.js';
import { seedSessions, seedShareToken } from '../fixtures/seedData.js';

describe('report routes', () => {
  let users;

  beforeAll(async () => {
    ({ users } = await setupDb());
  });

  afterAll(async () => {
    await teardownDb();
  });

  describe('GET /report', () => {
    it('requires auth', async () => {
      expect((await agent.get('/report')).status).toBe(401);
    });

    it('returns only the caller\'s own reports', async () => {
      const res = await agent.get('/report').set('Cookie', sessionCookieFor(users.user1));
      expect(res.status).toBe(200);
      expect(res.body.reports.some(r => r.sessionId === seedSessions.completed)).toBe(true);
      expect(res.body.reports.find(r => r.sessionId === seedSessions.completed).paid).toBe(true);
    });

    it('a different user sees none of user1\'s reports', async () => {
      const res = await agent.get('/report').set('Cookie', sessionCookieFor(users.user2));
      expect(res.status).toBe(200);
      expect(res.body.reports.some(r => r.sessionId === seedSessions.completed)).toBe(false);
    });
  });

  describe('GET /report/generate', () => {
    it('requires auth', async () => {
      const res = await agent.get('/report/generate').query({ sessionId: seedSessions.completed });
      expect(res.status).toBe(401);
    });

    it('requires a sessionId query param', async () => {
      const res = await agent.get('/report/generate').set('Cookie', sessionCookieFor(users.user1));
      expect(res.status).toBe(400);
    });

    it('user A cannot generate/read against user B\'s sessionId (SEC-01)', async () => {
      const res = await agent.get('/report/generate').set('Cookie', sessionCookieFor(users.user2)).query({ sessionId: seedSessions.completed });
      expect(res.status).toBe(404);
      expect(res.body.status).toBe('not_found');
    });

    it('404s a completely unknown sessionId', async () => {
      const res = await agent.get('/report/generate').set('Cookie', sessionCookieFor(users.user1)).query({ sessionId: 'vs_totally_unknown' });
      expect(res.status).toBe(404);
    });

    // Reaches redisGet() (a real fetch to the dummy Upstash REST host in
    // .env.test) before failing over — the first such lookup in a process can
    // take longer than vitest's 5s default while DNS resolution fails, so
    // this one test gets a longer allowance rather than raising it globally.
    it('400s with "incomplete" for the owner when funnel preferences are not filled in', async () => {
      const res = await agent.get('/report/generate').set('Cookie', sessionCookieFor(users.user1)).query({ sessionId: seedSessions.completed });
      expect(res.status).toBe(400);
      expect(res.body.status).toBe('incomplete');
    }, 20000);

    it('400s "incomplete" (context not submitted) for the locked session, which has no userProvidedSpecs', async () => {
      const ShadowProperty = (await import('../../src/models/ShadowProperty.js')).default;
      await ShadowProperty.updateOne({ sessionId: seedSessions.locked }, { $unset: { userProvidedSpecs: 1 } });
      const res = await agent.get('/report/generate').set('Cookie', sessionCookieFor(users.user1)).query({ sessionId: seedSessions.locked });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /report/:sessionId', () => {
    it('valid share token -> 200 readonly, no auth needed', async () => {
      const res = await agent.get(`/report/${seedSessions.completed}`).query({ share: seedShareToken });
      expect(res.status).toBe(200);
      expect(res.body.readonly).toBe(true);
    });

    it('wrong share token -> 403', async () => {
      const res = await agent.get(`/report/${seedSessions.completed}`).query({ share: 'not-the-real-token' });
      expect(res.status).toBe(403);
    });

    it('no share token, no auth -> 401', async () => {
      const res = await agent.get(`/report/${seedSessions.completed}`);
      expect(res.status).toBe(401);
    });

    it('owner path works with vb_session cookie', async () => {
      const res = await agent.get(`/report/${seedSessions.completed}`).set('Cookie', sessionCookieFor(users.user1));
      expect(res.status).toBe(200);
      expect(res.body.paid).toBe(true);
    });

    it('a different authenticated user gets 404 for someone else\'s report', async () => {
      const res = await agent.get(`/report/${seedSessions.completed}`).set('Cookie', sessionCookieFor(users.user2));
      expect(res.status).toBe(404);
    });
  });
});
