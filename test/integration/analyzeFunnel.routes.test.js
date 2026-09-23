// FILE: test/integration/analyzeFunnel.routes.test.js
// PURPOSE: Stage 3 — /analyze and /funnel: ownership/IDOR (SEC-01) is the
//          theme, plus validation and authn on the happy paths.
//
// enqueuePipelineJob is mocked so /analyze/start never opens a real BullMQ/
// ioredis TCP connection in tests — the route fires it without awaiting the
// result, so a real connection attempt (to the dummy UPSTASH_REDIS_URL in
// .env.test) would otherwise dangle past the test run.

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';

vi.mock('../../src/queues/pipelineQueue.js', () => ({
  enqueuePipelineJob: vi.fn().mockResolvedValue({ id: 'mock-job' }),
}));

const { agent, setupDb, teardownDb, sessionCookieFor } = await import('./helpers.js');
const { seedSessions } = await import('../fixtures/seedData.js');

describe('analyze + funnel ownership', () => {
  let users;

  beforeAll(async () => {
    ({ users } = await setupDb());
  });

  afterAll(async () => {
    await teardownDb();
  });

  describe('POST /analyze/start', () => {
    it('requires auth', async () => {
      const res = await agent.post('/analyze/start').send({ confirmed: true, lat: 12.9, lng: 77.6, name: 'X' });
      expect(res.status).toBe(401);
    });

    it('requires confirmed:true', async () => {
      const res = await agent.post('/analyze/start').set('Cookie', sessionCookieFor(users.user1)).send({ lat: 12.9, lng: 77.6, name: 'X' });
      expect(res.status).toBe(400);
    });

    it('rejects coordinates outside India', async () => {
      const res = await agent.post('/analyze/start').set('Cookie', sessionCookieFor(users.user1))
        .send({ confirmed: true, lat: 40.7, lng: -74.0, name: 'NYC' }); // New York
      expect(res.status).toBe(400);
    });

    it('rejects a missing name', async () => {
      const res = await agent.post('/analyze/start').set('Cookie', sessionCookieFor(users.user1))
        .send({ confirmed: true, lat: 12.9, lng: 77.6 });
      expect(res.status).toBe(400);
    });

    it('creates a ShadowProperty bound to the creating user (SEC-01)', async () => {
      const res = await agent.post('/analyze/start').set('Cookie', sessionCookieFor(users.user2))
        .send({ confirmed: true, lat: 12.9352, lng: 77.6245, name: 'A New Place' });
      expect(res.status).toBe(200);
      expect(res.body.sessionId).toMatch(/^vs_/);

      const ShadowProperty = (await import('../../src/models/ShadowProperty.js')).default;
      const sp = await ShadowProperty.findOne({ sessionId: res.body.sessionId });
      expect(sp.userId.toString()).toBe(users.user2._id.toString());
    });

    it('accepts India bounding-box edge coordinates', async () => {
      const res = await agent.post('/analyze/start').set('Cookie', sessionCookieFor(users.user1))
        .send({ confirmed: true, lat: 6.5, lng: 68.1, name: 'Edge' });
      expect(res.status).toBe(200);
    });
  });

  describe('POST /analyze/:sessionId/context — ownership', () => {
    const validContext = { budgetBracket: '1Cr–1.5Cr', actualAmount: 12000000, bhk: '2BHK', floor: '4–7', listingType: 'sale' };

    it('requires auth', async () => {
      const res = await agent.post(`/analyze/${seedSessions.completed}/context`).send(validContext);
      expect(res.status).toBe(401);
    });

    it('user A cannot mutate user B\'s session (404, not 403 — SEC-01)', async () => {
      const res = await agent.post(`/analyze/${seedSessions.completed}/context`).set('Cookie', sessionCookieFor(users.user2)).send(validContext);
      expect(res.status).toBe(404);
    });

    it('the owner can update their own session', async () => {
      const res = await agent.post(`/analyze/${seedSessions.completed}/context`).set('Cookie', sessionCookieFor(users.user1)).send(validContext);
      expect(res.status).toBe(200);
    });

    it('rejects an invalid listingType', async () => {
      const res = await agent.post(`/analyze/${seedSessions.completed}/context`).set('Cookie', sessionCookieFor(users.user1))
        .send({ ...validContext, listingType: 'lease' });
      expect(res.status).toBe(400);
    });

    it('rejects a budget bracket that does not match the listing type', async () => {
      const res = await agent.post(`/analyze/${seedSessions.completed}/context`).set('Cookie', sessionCookieFor(users.user1))
        .send({ ...validContext, budgetBracket: 'Under 10K' }); // a rent bracket, listingType=sale
      expect(res.status).toBe(400);
    });
  });

  describe('GET /analyze/:sessionId/status', () => {
    it('is public and returns status for a known session', async () => {
      const res = await agent.get(`/analyze/${seedSessions.completed}/status`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('completed');
    });

    it('404s for an unknown session', async () => {
      const res = await agent.get('/analyze/vs_bogus_session/status');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /funnel/save', () => {
    it('requires auth', async () => {
      const res = await agent.post('/funnel/save').send({ sessionId: seedSessions.completed, step: 1, data: { x: 1 } });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /funnel/progress', () => {
    it('requires auth', async () => {
      expect((await agent.get('/funnel/progress')).status).toBe(401);
    });

    it('returns the caller\'s own preferences', async () => {
      const res = await agent.get('/funnel/progress').set('Cookie', sessionCookieFor(users.user1));
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('preferences');
    });
  });

  describe('GET /funnel/analytics (admin-only despite requireAuth-only route)', () => {
    it('requires auth', async () => {
      expect((await agent.get('/funnel/analytics')).status).toBe(401);
    });

    it('rejects a non-admin authenticated user with 403', async () => {
      const res = await agent.get('/funnel/analytics').set('Cookie', sessionCookieFor(users.user1));
      expect(res.status).toBe(403);
    });

    it('allows an admin user (customer session, role checked server-side)', async () => {
      const res = await agent.get('/funnel/analytics').set('Cookie', sessionCookieFor(users.admin));
      expect(res.status).toBe(200);
    });
  });

  describe('POST /funnel/save — step validation and completion idempotency', () => {
    it('rejects a missing step/data', async () => {
      const res = await agent.post('/funnel/save').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.completed });
      expect(res.status).toBe(400);
    });

    it('rejects an out-of-range step', async () => {
      const res = await agent.post('/funnel/save').set('Cookie', sessionCookieFor(users.user1))
        .send({ sessionId: seedSessions.completed, step: 9, data: { x: 1 } });
      expect(res.status).toBe(400);
    });

    it('saves a valid step for the authenticated user', async () => {
      const res = await agent.post('/funnel/save').set('Cookie', sessionCookieFor(users.user1))
        .send({ sessionId: seedSessions.completed, step: 1, data: { wfhStatus: 'full-time' } });
      expect(res.status).toBe(200);
    });

    it('user A cannot complete against user B\'s session (404)', async () => {
      const res = await agent.post('/funnel/save').set('Cookie', sessionCookieFor(users.user2))
        .send({ sessionId: seedSessions.completed, step: 1, data: { wfhStatus: 'full-time' }, complete: true });
      expect(res.status).toBe(404);
    });
  });
});
