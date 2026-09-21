// FILE: test/unit/sec01OwnershipBinding.test.js
// PURPOSE: SEC-01 — proves every ShadowProperty query touched by this fix is
// scoped to { sessionId, userId }, so one account can never read or mutate
// another account's in-flight analysis session. Models are mocked rather than
// hitting a real DB: this repo's test/helpers/db.js refuses to connect unless
// MONGODB_URI names a "*_test" database, which isn't provisioned in this
// environment yet (tracked as the Stage 0 exit-gate / Stage 3 prerequisite) —
// mocking the model is what keeps this a real regression test in the meantime.
// A true DB-backed integration pass belongs to Stage 3.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/models/ShadowProperty.js', () => ({
  default: {
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock('../../src/models/User.js', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    updateOne: vi.fn(),
  },
}));

// PERF-4 — GET /report/generate's "no ShadowProperty, check permanent
// record" fallback now reads Report (was User.reportHistory[]) — mocked so
// this test never opens a real DB connection.
vi.mock('../../src/models/Report.js', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('../../src/models/Payment.js', () => ({
  default: { exists: vi.fn(), find: vi.fn() },
}));

// /analyze/start's cluster assignment is unrelated to what SEC-01 changed —
// stub it out so the route doesn't try to hit a real (disconnected) Mongo via
// the Cluster model just to reach the ShadowProperty.create() call under test.
vi.mock('../../src/services/clusterService.js', () => ({
  assignCluster: vi.fn().mockResolvedValue('12.97_77.59'),
}));

// PERF-1 — /analyze/start now enqueues onto a real BullMQ/ioredis queue
// instead of calling runPipeline() directly; mock it so this test never opens
// a real Redis TCP connection (unrelated to what SEC-01 tests).
vi.mock('../../src/queues/pipelineQueue.js', () => ({
  enqueuePipelineJob: vi.fn().mockResolvedValue({ id: 'job-1' }),
}));

const ShadowProperty = (await import('../../src/models/ShadowProperty.js')).default;
const User = (await import('../../src/models/User.js')).default;
const Report = (await import('../../src/models/Report.js')).default;
const { signToken } = await import('../../src/services/token.service.js');
const app = (await import('../../src/app.js')).default;

// Chained Mongoose-query mock: `.select(...).lean()` (any order/repeat) → resolvedValue.
function leanQuery(resolvedValue) {
  const q = {};
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockResolvedValue(resolvedValue);
  return q;
}

const userId = '507f1f77bcf86cd799439011';
const otherUsersSessionId = 'vs_1700000000000_abcdef123456';
const authCookie = `vb_session=${signToken({ userId, email: 'a@b.com', name: 'A', role: 'user' })}`;

beforeEach(() => {
  vi.clearAllMocks();
  User.findByIdAndUpdate.mockResolvedValue({});
});

describe('POST /analyze/:sessionId/context — SEC-01', () => {
  const validBody = {
    budgetBracket: '20K–35K', actualAmount: 25000, bhk: '2BHK', floor: 'Ground', listingType: 'rent',
  };

  it('404s (not 403) when the session belongs to a different user', async () => {
    ShadowProperty.findOneAndUpdate.mockResolvedValue(null); // real Mongo returns null on a filter mismatch too
    const res = await request(app)
      .post(`/analyze/${otherUsersSessionId}/context`)
      .set('Cookie', authCookie)
      .send(validBody);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('scopes the update query by both sessionId and the authenticated userId', async () => {
    ShadowProperty.findOneAndUpdate.mockResolvedValue(null);
    await request(app)
      .post(`/analyze/${otherUsersSessionId}/context`)
      .set('Cookie', authCookie)
      .send(validBody);
    expect(ShadowProperty.findOneAndUpdate).toHaveBeenCalledWith(
      { sessionId: otherUsersSessionId, userId },
      expect.anything(),
      expect.anything(),
    );
  });

  it('succeeds when the session does belong to the authenticated user', async () => {
    ShadowProperty.findOneAndUpdate.mockResolvedValue({ sessionId: otherUsersSessionId, userProvidedSpecs: validBody });
    const res = await request(app)
      .post(`/analyze/${otherUsersSessionId}/context`)
      .set('Cookie', authCookie)
      .send(validBody);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('POST /funnel/save (complete) — SEC-01', () => {
  const body = { sessionId: otherUsersSessionId, step: 8, data: { investmentIntent: 'live-in' }, complete: true };

  it('404s when the session belongs to a different user', async () => {
    ShadowProperty.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/funnel/save')
      .set('Cookie', authCookie)
      .send(body);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Session not found');
  });

  it('scopes the lookup by both sessionId and the authenticated userId', async () => {
    ShadowProperty.findOne.mockResolvedValue(null);
    await request(app).post('/funnel/save').set('Cookie', authCookie).send(body);
    expect(ShadowProperty.findOne).toHaveBeenCalledWith({ sessionId: otherUsersSessionId, userId });
  });
});

describe('GET /report/generate — SEC-01', () => {
  it('404s when the session belongs to a different user and nothing is cached in the caller\'s own Report history', async () => {
    ShadowProperty.findOne.mockResolvedValue(null);
    Report.findOne.mockReturnValue(leanQuery(null)); // caller's own (empty) history — no leak of the other user's cached snapshot
    const res = await request(app)
      .get(`/report/generate?sessionId=${otherUsersSessionId}`)
      .set('Cookie', authCookie);
    expect(res.status).toBe(404);
    expect(res.body.status).toBe('not_found');
  });

  it('scopes both the ShadowProperty and Report lookups by sessionId and the authenticated userId', async () => {
    ShadowProperty.findOne.mockResolvedValue(null);
    Report.findOne.mockReturnValue(leanQuery(null));
    await request(app).get(`/report/generate?sessionId=${otherUsersSessionId}`).set('Cookie', authCookie);
    expect(ShadowProperty.findOne).toHaveBeenCalledWith({ sessionId: otherUsersSessionId, userId });
    expect(Report.findOne).toHaveBeenCalledWith({ sessionId: otherUsersSessionId, userId });
  });
});

describe('POST /analyze/start — SEC-01', () => {
  it('binds the newly-created ShadowProperty to the authenticated user', async () => {
    ShadowProperty.create.mockResolvedValue({ _id: 'sp1' });
    ShadowProperty.findByIdAndUpdate.mockResolvedValue({});
    User.findByIdAndUpdate.mockResolvedValue({});
    await request(app)
      .post('/analyze/start')
      .set('Cookie', authCookie)
      .send({ lat: 12.9716, lng: 77.5946, name: 'Test Property', confirmed: true });
    expect(ShadowProperty.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId }),
    );
  });
});
