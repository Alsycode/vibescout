// FILE: test/unit/sec02PaymentWebhook.test.js
// PURPOSE: SEC-02 — proves the payment webhook is signature-verified and that
// unlock is idempotent no matter which channel (client /verify vs Razorpay's
// /webhook) arrives first, arrives twice, or races the other. Models and the
// Razorpay SDK are mocked (see test/unit/sec01OwnershipBinding.test.js for why
// this repo mocks rather than hitting a real DB here — same constraint).

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';

const { mockOrdersCreate, mockValidateWebhookSignature } = vi.hoisted(() => ({
  mockOrdersCreate: vi.fn(),
  mockValidateWebhookSignature: vi.fn(),
}));

vi.mock('razorpay', () => {
  const RazorpayMock = vi.fn().mockImplementation(() => ({
    orders: { create: mockOrdersCreate },
  }));
  RazorpayMock.validateWebhookSignature = mockValidateWebhookSignature;
  return { default: RazorpayMock };
});

vi.mock('../../src/models/Payment.js', () => ({
  default: { create: vi.fn(), findOne: vi.fn(), findOneAndUpdate: vi.fn(), exists: vi.fn() },
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
const sessionId = 'vs_1700000000000_abcdef123456';
const orderId = 'order_abc123';
const paymentId = 'pay_xyz789';
const authCookie = `vb_session=${signToken({ userId, email: 'a@b.com', name: 'A', role: 'user' })}`;

function validVerifySignature() {
  return crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

beforeEach(() => {
  vi.clearAllMocks();
  ShadowProperty.findOne.mockResolvedValue(null);
});

describe('POST /payment/create-order — SEC-02', () => {
  it('persists a Payment record alongside the Razorpay order', async () => {
    Payment.exists.mockResolvedValue(false); // PERF-4 — "already unlocked" check, was User.findById(...).unlockedReports
    mockOrdersCreate.mockResolvedValue({ id: orderId, amount: 19900, currency: 'INR' });
    Payment.create.mockResolvedValue({});

    const res = await request(app).post('/payment/create-order').set('Cookie', authCookie).send({ sessionId });

    expect(res.status).toBe(200);
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, sessionId, razorpayOrderId: orderId, amount: 19900, currency: 'INR' }),
    );
  });
});

describe('POST /payment/verify — SEC-02', () => {
  it('rejects an invalid signature before touching Payment', async () => {
    const res = await request(app)
      .post('/payment/verify')
      .set('Cookie', authCookie)
      .send({ sessionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: 'not-the-real-signature' });

    expect(res.status).toBe(400);
    expect(Payment.findOne).not.toHaveBeenCalled();
  });

  it('404/400s when no matching Payment order exists', async () => {
    Payment.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/payment/verify')
      .set('Cookie', authCookie)
      .send({ sessionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: validVerifySignature() });

    expect(res.status).toBe(400);
  });

  it('flips the Payment to paid and unlocks the report on a valid signature', async () => {
    Payment.findOne.mockResolvedValue({ _id: 'p1', userId, sessionId, razorpayOrderId: orderId });
    Payment.findOneAndUpdate.mockResolvedValue({ _id: 'p1' });

    const res = await request(app)
      .post('/payment/verify')
      .set('Cookie', authCookie)
      .send({ sessionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: validVerifySignature() });

    expect(res.status).toBe(200);
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1', status: { $ne: 'paid' } },
      { $set: { razorpayPaymentId: paymentId, status: 'paid', source: 'verify' } },
    );
    // PERF-4 — unlockReport() no longer writes User.unlockedReports[]; "paid"
    // is the Payment.findOneAndUpdate above. unlockReport()'s remaining job
    // (analytics) still runs, scoped by sessionId+userId same as before.
    expect(ShadowProperty.findOne).toHaveBeenCalledWith({ sessionId, userId });
  });
});

describe('POST /payment/webhook — SEC-02', () => {
  const capturedPayload = {
    event: 'payment.captured',
    payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: 19900, currency: 'INR', notes: { userId, sessionId } } } },
  };

  it('rejects a request with no signature header', async () => {
    const res = await request(app).post('/payment/webhook').send(capturedPayload);
    expect(res.status).toBe(400);
    expect(mockValidateWebhookSignature).not.toHaveBeenCalled();
  });

  it('rejects an invalid signature', async () => {
    mockValidateWebhookSignature.mockReturnValue(false);
    const res = await request(app).post('/payment/webhook').set('X-Razorpay-Signature', 'bad-sig').send(capturedPayload);
    expect(res.status).toBe(400);
    expect(Payment.findOne).not.toHaveBeenCalled();
  });

  it('ignores non-capture events (still 200s so Razorpay does not retry forever)', async () => {
    mockValidateWebhookSignature.mockReturnValue(true);
    const res = await request(app)
      .post('/payment/webhook')
      .set('X-Razorpay-Signature', 'good-sig')
      .send({ event: 'payment.failed', payload: {} });
    expect(res.status).toBe(200);
    expect(Payment.findOne).not.toHaveBeenCalled();
  });

  it('unlocks on a valid payment.captured event', async () => {
    mockValidateWebhookSignature.mockReturnValue(true);
    Payment.findOne.mockResolvedValue({ _id: 'p1', userId, sessionId, razorpayOrderId: orderId });
    Payment.findOneAndUpdate.mockResolvedValue({ _id: 'p1', userId, sessionId });

    const res = await request(app).post('/payment/webhook').set('X-Razorpay-Signature', 'good-sig').send(capturedPayload);

    expect(res.status).toBe(200);
    expect(Payment.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: 'p1', status: { $ne: 'paid' } },
      { $set: { razorpayPaymentId: paymentId, status: 'paid', source: 'webhook' } },
      { new: true },
    );
    // PERF-4 — same as /verify above: "paid" is the findOneAndUpdate call
    // itself now; unlockReport()'s remaining job is the analytics lookup.
    expect(ShadowProperty.findOne).toHaveBeenCalledWith({ sessionId, userId });
  });

  it('is idempotent on a duplicate delivery (already paid) — still 200s, does not error, unlock stays a no-op re-run', async () => {
    mockValidateWebhookSignature.mockReturnValue(true);
    Payment.findOne.mockResolvedValue({ _id: 'p1', userId, sessionId, razorpayOrderId: orderId, status: 'paid' });
    // The { status: { $ne: 'paid' } } filter no longer matches — real Mongo returns null here.
    Payment.findOneAndUpdate.mockResolvedValue(null);

    const res = await request(app).post('/payment/webhook').set('X-Razorpay-Signature', 'good-sig').send(capturedPayload);

    expect(res.status).toBe(200);
    // Unlock (the analytics side-effect) is still invoked — safe to repeat,
    // it does no write of its own — but no second Payment doc is created.
    expect(ShadowProperty.findOne).toHaveBeenCalledTimes(1);
    expect(Payment.create).not.toHaveBeenCalled();
  });

  it('reconstructs a missing Payment record from the order notes rather than dropping the event', async () => {
    mockValidateWebhookSignature.mockReturnValue(true);
    Payment.findOne.mockResolvedValue(null);
    Payment.create.mockResolvedValue({ _id: 'p2', userId, sessionId, razorpayOrderId: orderId });
    Payment.findOneAndUpdate.mockResolvedValue({ _id: 'p2', userId, sessionId });

    const res = await request(app).post('/payment/webhook').set('X-Razorpay-Signature', 'good-sig').send(capturedPayload);

    expect(res.status).toBe(200);
    expect(Payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId, sessionId, razorpayOrderId: orderId }),
    );
    expect(ShadowProperty.findOne).toHaveBeenCalledWith({ sessionId, userId });
  });
});
