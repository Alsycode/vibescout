// FILE: test/unit/sec04NoTokenInBody.test.js
// PURPOSE: SEC-04 — proves /auth/register and /auth/login stop returning the
// raw JWT in the response body (only the httpOnly vb_session cookie carries
// it now), while still actually setting that cookie.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('bcrypt', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

vi.mock('../../src/models/User.js', () => ({
  default: { create: vi.fn(), findOne: vi.fn(), findById: vi.fn() },
}));

// PERF-4 — GET /report/:sessionId's owner path now reads Report (was
// User.reportHistory[]/unlockedReports[]) — mocked so this test never opens
// a real DB connection.
vi.mock('../../src/models/Report.js', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('../../src/models/Payment.js', () => ({
  default: { exists: vi.fn() },
}));

const bcrypt = (await import('bcrypt')).default;
const User = (await import('../../src/models/User.js')).default;
const Report = (await import('../../src/models/Report.js')).default;
const Payment = (await import('../../src/models/Payment.js')).default;
const { signToken } = await import('../../src/services/token.service.js');
const app = (await import('../../src/app.js')).default;

// Chained Mongoose-query mock: `.select(...).lean()` (any order/repeat) → resolvedValue.
function leanQuery(resolvedValue) {
  const q = {};
  q.select = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockResolvedValue(resolvedValue);
  return q;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /auth/register — SEC-04', () => {
  const body = { name: 'Alice', email: 'alice@example.com', password: 'password123', phone: '9999999999' };

  it('does not return a token in the body, but does set the vb_session cookie', async () => {
    User.findOne.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    User.create.mockResolvedValue({ _id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' });

    const res = await request(app).post('/auth/register').send(body);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user).toEqual({ id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' });
    expect(res.headers['set-cookie'].some((c) => c.startsWith('vb_session='))).toBe(true);
  });
});

// Removing vb_token issuance (above) would silently break this route if it
// still only checked req.cookies.vb_token — caught and fixed as part of this
// change, see report.routes.js. Regression-guarded here.
describe('GET /report/:sessionId — SEC-04 regression (vb_session now authenticates)', () => {
  const userId = 'u1';
  const sessionId = 'sess1';

  it('401s with neither cookie present', async () => {
    const res = await request(app).get(`/report/${sessionId}`);
    expect(res.status).toBe(401);
  });

  it('authenticates via vb_session alone (the only cookie set post-SEC-04)', async () => {
    const token = signToken({ userId, email: 'alice@example.com', name: 'Alice', role: 'user' });
    User.findById.mockReturnValue(leanQuery({ _id: userId }));
    Report.findOne.mockReturnValue(leanQuery({ snapshot: { foo: 'bar' }, shareToken: 'tok' }));
    Payment.exists.mockResolvedValue(false);

    const res = await request(app).get(`/report/${sessionId}`).set('Cookie', `vb_session=${token}`);

    expect(res.status).toBe(200);
    expect(User.findById).toHaveBeenCalledWith(userId);
  });
});

describe('POST /auth/login — SEC-04', () => {
  const body = { email: 'alice@example.com', password: 'password123' };

  it('does not return a token in the body, but does set the vb_session cookie', async () => {
    User.findOne.mockResolvedValue({ _id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user', passwordHash: 'hashed-password' });
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app).post('/auth/login').send(body);

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user).toEqual({ id: 'u1', name: 'Alice', email: 'alice@example.com', role: 'user' });
    expect(res.headers['set-cookie'].some((c) => c.startsWith('vb_session='))).toBe(true);
  });
});
