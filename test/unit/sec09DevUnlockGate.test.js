// FILE: test/unit/sec09DevUnlockGate.test.js
// PURPOSE: SEC-09 — proves POST /payment/dev-unlock (a free, no-payment report
// unlock) is now gated by the same DEV_UNLOCK flag as the other dev backdoors
// (/dev/seed-report, the frontend "skip payment" button), instead of the old
// NODE_ENV==='production' check — which left it open in any non-production
// environment (staging, an unset NODE_ENV) even when DEV_UNLOCK was never set.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

// PERF-4 — payment.routes.js no longer imports User at all; dev-unlock now
// creates its own Payment doc (source:'dev') since it bypasses the real
// Razorpay flow that normally flips Payment.status to 'paid'.
vi.mock('../../src/models/Payment.js', () => ({
  default: { exists: vi.fn(), create: vi.fn() },
}));
vi.mock('../../src/models/ShadowProperty.js', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('../../src/services/analytics.service.js', () => ({
  trackReportUnlocked: vi.fn(),
}));

const Payment = (await import('../../src/models/Payment.js')).default;
const ShadowProperty = (await import('../../src/models/ShadowProperty.js')).default;
const { signToken } = await import('../../src/services/token.service.js');
const app = (await import('../../src/app.js')).default;

const userId = '507f1f77bcf86cd799439011';
const authCookie = `vb_session=${signToken({ userId, email: 'a@b.com', name: 'A', role: 'user' })}`;

beforeEach(() => {
  vi.clearAllMocks();
  Payment.exists.mockResolvedValue(false);
  Payment.create.mockResolvedValue({});
  ShadowProperty.findOne.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /payment/dev-unlock gate — SEC-09', () => {
  it('is refused with DEV_UNLOCK unset, even outside production', async () => {
    vi.stubEnv('DEV_UNLOCK', undefined);
    vi.stubEnv('NODE_ENV', 'development');

    const res = await request(app)
      .post('/payment/dev-unlock')
      .set('Cookie', authCookie)
      .send({ sessionId: 'vs_123' });

    expect(res.status).toBe(403);
    expect(Payment.create).not.toHaveBeenCalled();
  });

  it('is refused with NODE_ENV=production even when DEV_UNLOCK is left on by mistake — same posture as before', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('DEV_UNLOCK', 'true');

    const res = await request(app)
      .post('/payment/dev-unlock')
      .set('Cookie', authCookie)
      .send({ sessionId: 'vs_123' });

    // Route-level: DEV_UNLOCK='true' alone lets the handler proceed — the
    // real backstop for this combination is validateEnv's boot-time exit,
    // proven separately in validateEnv.test.js. This just confirms the gate
    // reads DEV_UNLOCK, not NODE_ENV.
    expect(res.status).not.toBe(403);
  });

  it('proceeds with DEV_UNLOCK=true in a non-production environment', async () => {
    vi.stubEnv('DEV_UNLOCK', 'true');
    vi.stubEnv('NODE_ENV', 'test');

    const res = await request(app)
      .post('/payment/dev-unlock')
      .set('Cookie', authCookie)
      .send({ sessionId: 'vs_123' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true });
    // PERF-4 — was User.findByIdAndUpdate($addToSet unlockedReports); dev-unlock
    // now creates its own Payment doc since there's no real payment behind it.
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, sessionId: 'vs_123', status: 'paid', source: 'dev' }),
    );
  });
});
