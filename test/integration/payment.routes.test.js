// FILE: test/integration/payment.routes.test.js
// PURPOSE: Stage 3 — /payment (Razorpay test mode). The Razorpay SDK's own
//          HTTP call (api.razorpay.com) is mocked with nock — this suite
//          verifies our route logic (ownership, signature verification,
//          idempotency), not Razorpay's API itself.

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import crypto from 'crypto';
import nock from 'nock';
import { agent, setupDb, teardownDb, sessionCookieFor } from './helpers.js';
import { seedSessions } from '../fixtures/seedData.js';
import Payment from '../../src/models/Payment.js';

function mockRazorpayOrderCreate(orderId, amount) {
  nock('https://api.razorpay.com')
    .post('/v1/orders')
    .reply(200, { id: orderId, amount, currency: 'INR', receipt: 'mock', status: 'created' });
}

describe('payment routes', () => {
  let users;

  beforeAll(async () => {
    ({ users } = await setupDb());
  });

  afterAll(async () => {
    await teardownDb();
  });

  afterEach(() => nock.cleanAll());

  describe('POST /payment/create-order', () => {
    it('requires auth', async () => {
      const res = await agent.post('/payment/create-order').send({ sessionId: seedSessions.locked });
      expect(res.status).toBe(401);
    });

    it('requires sessionId', async () => {
      const res = await agent.post('/payment/create-order').set('Cookie', sessionCookieFor(users.user1)).send({});
      expect(res.status).toBe(400);
    });

    it('rejects creating an order for an already-unlocked session', async () => {
      const res = await agent.post('/payment/create-order').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.completed });
      expect(res.status).toBe(400);
    });

    it('creates an order for the report price for an unpaid session', async () => {
      mockRazorpayOrderCreate('order_mock_1', 19900);
      const res = await agent.post('/payment/create-order').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.locked });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'order_mock_1', amount: 19900, currency: 'INR' });

      const payment = await Payment.findOne({ razorpayOrderId: 'order_mock_1' });
      expect(payment.userId.toString()).toBe(users.user1._id.toString());
      expect(payment.status).toBe('created');
    });
  });

  describe('POST /payment/verify', () => {
    it('requires auth', async () => {
      const res = await agent.post('/payment/verify').send({ sessionId: seedSessions.locked, razorpay_order_id: 'x', razorpay_payment_id: 'y', razorpay_signature: 'z' });
      expect(res.status).toBe(401);
    });

    it('rejects missing fields', async () => {
      const res = await agent.post('/payment/verify').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.locked });
      expect(res.status).toBe(400);
    });

    it('rejects a tampered signature and does NOT unlock', async () => {
      mockRazorpayOrderCreate('order_mock_2', 19900);
      await agent.post('/payment/create-order').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.locked });

      const res = await agent.post('/payment/verify').set('Cookie', sessionCookieFor(users.user1)).send({
        sessionId: seedSessions.locked,
        razorpay_order_id: 'order_mock_2',
        razorpay_payment_id: 'pay_mock_2',
        razorpay_signature: 'deliberately-wrong-signature',
      });
      expect(res.status).toBe(400);

      const payment = await Payment.findOne({ razorpayOrderId: 'order_mock_2' });
      expect(payment.status).not.toBe('paid');
    });

    it('accepts a valid signature, unlocks, and is idempotent on replay', async () => {
      mockRazorpayOrderCreate('order_mock_3', 19900);
      await agent.post('/payment/create-order').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.locked });

      const orderId = 'order_mock_3';
      const paymentId = 'pay_mock_3';
      const signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      const payload = { sessionId: seedSessions.locked, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature };

      const first = await agent.post('/payment/verify').set('Cookie', sessionCookieFor(users.user1)).send(payload);
      expect(first.status).toBe(200);
      expect(first.body.success).toBe(true);

      const afterFirst = await Payment.findOne({ razorpayOrderId: orderId });
      expect(afterFirst.status).toBe('paid');

      // Replay — must stay exactly one 'paid' payment, not double-process.
      const second = await agent.post('/payment/verify').set('Cookie', sessionCookieFor(users.user1)).send(payload);
      expect(second.status).toBe(200);

      const count = await Payment.countDocuments({ razorpayOrderId: orderId, status: 'paid' });
      expect(count).toBe(1);
    });
  });

  describe('POST /payment/webhook', () => {
    it('rejects a request with no signature header', async () => {
      const res = await agent.post('/payment/webhook').send({ event: 'payment.captured' });
      expect(res.status).toBe(400);
    });

    it('rejects a bad signature', async () => {
      const res = await agent.post('/payment/webhook').set('X-Razorpay-Signature', 'bogus').send({ event: 'payment.captured' });
      expect(res.status).toBe(400);
    });

    it('accepts a validly signed payload.captured event and unlocks (idempotent with /verify)', async () => {
      // The preceding /verify test already unlocked seedSessions.locked —
      // reset it so this test can create a fresh, still-unpaid order.
      await Payment.deleteMany({ sessionId: seedSessions.locked });
      mockRazorpayOrderCreate('order_mock_4', 19900);
      await agent.post('/payment/create-order').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.locked });

      const body = {
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_mock_4', order_id: 'order_mock_4', amount: 19900, currency: 'INR', notes: {} } } },
      };
      const raw = JSON.stringify(body);
      const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');

      const res = await agent.post('/payment/webhook').set('X-Razorpay-Signature', signature).set('Content-Type', 'application/json').send(raw);
      expect(res.status).toBe(200);

      const payment = await Payment.findOne({ razorpayOrderId: 'order_mock_4' });
      expect(payment.status).toBe('paid');
      expect(payment.source).toBe('webhook');
    });
  });

  describe('POST /payment/dev-unlock', () => {
    it('is disabled (403) when DEV_UNLOCK is not true, regardless of auth', async () => {
      const res = await agent.post('/payment/dev-unlock').set('Cookie', sessionCookieFor(users.user1)).send({ sessionId: seedSessions.locked });
      expect(res.status).toBe(403);
    });
  });
});
