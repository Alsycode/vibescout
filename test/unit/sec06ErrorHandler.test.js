// FILE: test/unit/sec06ErrorHandler.test.js
// PURPOSE: SEC-06 — proves a 5xx no longer leaks the raw error message to the
// client in production (generic message + correlation id instead), while 4xx
// bodies (intentional, written by route handlers) and non-production 5xx
// bodies are untouched. Also proves every response carries an X-Request-Id.

import { describe, it, expect, vi, afterEach } from 'vitest';
import request from 'supertest';
import { errorHandler } from '../../src/middleware/errorHandler.js';
import { requestId } from '../../src/middleware/requestId.js';

vi.mock('../../src/models/User.js', () => ({
  default: { findOne: vi.fn() },
}));

const User = (await import('../../src/models/User.js')).default;
const app = (await import('../../src/app.js')).default;

function mockRes() {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('errorHandler (unit)', () => {
  it('a 500 in production returns a generic message + requestId, not err.message', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const err = new Error('MongoServerError: connection to 10.0.4.2:27017 refused');
    const req = { id: 'req-123' };
    const res = mockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', requestId: 'req-123' });
  });

  it('a 500 outside production still returns err.message (dev/test debugging)', () => {
    vi.stubEnv('NODE_ENV', 'test');
    const err = new Error('MongoServerError: connection refused');
    const req = { id: 'req-456' };
    const res = mockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'MongoServerError: connection refused', requestId: 'req-456' });
  });

  it('a 4xx keeps its intentional message even in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const err = Object.assign(new Error('Invalid payment signature'), { status: 400 });
    const req = { id: 'req-789' };
    const res = mockRes();

    errorHandler(err, req, res, () => {});

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payment signature', requestId: 'req-789' });
  });
});

describe('requestId (unit)', () => {
  it('generates an id, ignoring any client-supplied X-Request-Id, and sets the response header', () => {
    const req = { get: () => 'client-supplied-id' };
    const res = { setHeader: vi.fn() };
    const next = vi.fn();

    requestId(req, res, next);

    expect(req.id).toBeTypeOf('string');
    expect(req.id).not.toBe('client-supplied-id');
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', req.id);
    expect(next).toHaveBeenCalledOnce();
  });
});

describe('wired into the app — SEC-06', () => {
  it('every response carries an X-Request-Id header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-request-id']).toBeTypeOf('string');
    expect(res.headers['x-request-id'].length).toBeGreaterThan(0);
  });

  it('an unexpected route error is generic in production but still carries requestId', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    User.findOne.mockRejectedValue(new Error('MongoServerError: connection to 10.0.4.2:27017 refused'));

    const res = await request(app).post('/auth/login').send({ email: 'a@b.com', password: 'x' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Internal server error');
    expect(res.body.error).not.toMatch(/Mongo|10\.0\.4\.2/);
    expect(res.body.requestId).toBeTypeOf('string');
    expect(res.headers['x-request-id']).toBe(res.body.requestId);
  });
});
