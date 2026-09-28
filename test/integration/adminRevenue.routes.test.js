// FILE: test/integration/adminRevenue.routes.test.js
// PURPOSE: GET /admin/revenue sums only real paid unlocks (verify/webhook), excludes
//          dev-unlocks and unpaid orders, and is admin-only.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const { agent, setupDb, teardownDb, adminCookieFor } = await import('./helpers.js');
const Payment = (await import('../../src/models/Payment.js')).default;

describe('GET /admin/revenue', () => {
  let users;
  let cookie;

  beforeAll(async () => {
    ({ users } = await setupDb());
    cookie = adminCookieFor(users.admin);
    const userId = users.admin._id;

    await Payment.insertMany([
      { userId, sessionId: 'rev-1', razorpayOrderId: 'order_rev_1', razorpayPaymentId: 'pay_rev_1', amount: 19900, status: 'paid', source: 'verify', paidAt: new Date() },
      { userId, sessionId: 'rev-2', razorpayOrderId: 'order_rev_2', razorpayPaymentId: 'pay_rev_2', amount: 19900, status: 'paid', source: 'webhook', paidAt: new Date() },
      // Must NOT count: dev unlock, abandoned order.
      { userId, sessionId: 'rev-3', razorpayOrderId: 'dev_rev_3', amount: 19900, status: 'paid', source: 'dev', paidAt: new Date() },
      { userId, sessionId: 'rev-4', razorpayOrderId: 'order_rev_4', amount: 19900, status: 'created' },
    ]);
  });

  afterAll(async () => {
    await teardownDb();
  });

  it('counts only real paid unlocks in rupees and reports abandoned checkouts', async () => {
    const res = await agent.get('/admin/revenue?daysBack=30').set('Cookie', cookie);
    expect(res.status).toBe(200);
    // 2 inserted above + 1 'migration' payment from the shared seed (counted: it's a real
    // historic payment). The dev and 'created' rows must be excluded.
    expect(res.body.period).toMatchObject({ revenue: 597, payments: 3, avgOrderValue: 199, abandonedCheckouts: 1 });
    expect(res.body.allTime).toMatchObject({ revenue: 597, payments: 3 });
    expect(res.body.series).toHaveLength(30);
    expect(res.body.recent.map((p) => p.source).sort()).toEqual(['migration', 'verify', 'webhook']);
  });

  it('rejects unauthenticated requests', async () => {
    const res = await agent.get('/admin/revenue');
    expect(res.status).toBe(401);
  });
});
