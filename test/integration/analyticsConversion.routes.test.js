// FILE: test/integration/analyticsConversion.routes.test.js
// PURPOSE: Stage 3 — GET /admin/analytics/conversion computes conversionPct
//          correctly from raw report_generated/report_unlocked events,
//          including a 50% case (2 generated, 1 unlocked for the same
//          listingType+bhk+budgetBracket combo).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const { agent, setupDb, teardownDb, adminCookieFor } = await import('./helpers.js');
const { seedUsers } = await import('../fixtures/seedData.js');
const AnalyticsEvent = (await import('../../src/models/AnalyticsEvent.js')).default;

describe('GET /admin/analytics/conversion', () => {
  let users;
  let cookie;

  beforeAll(async () => {
    ({ users } = await setupDb());
    cookie = adminCookieFor(users.admin);

    // Combo A: 2 generated, 1 unlocked -> 50%
    await AnalyticsEvent.insertMany([
      { type: 'report_generated', sessionId: 'conv-a-1', listingType: 'sale', bhk: '2BHK', budgetBracket: '60L-1Cr' },
      { type: 'report_generated', sessionId: 'conv-a-2', listingType: 'sale', bhk: '2BHK', budgetBracket: '60L-1Cr' },
      { type: 'report_unlocked', sessionId: 'conv-a-1', listingType: 'sale', bhk: '2BHK', budgetBracket: '60L-1Cr' },
      // Combo B: 1 generated, 1 unlocked -> 100%
      { type: 'report_generated', sessionId: 'conv-b-1', listingType: 'rent', bhk: '1BHK', budgetBracket: '10K-20K' },
      { type: 'report_unlocked', sessionId: 'conv-b-1', listingType: 'rent', bhk: '1BHK', budgetBracket: '10K-20K' },
      // Combo C: 1 generated, 0 unlocked -> 0%
      { type: 'report_generated', sessionId: 'conv-c-1', listingType: 'sale', bhk: '3BHK', budgetBracket: '1Cr-1.5Cr' },
    ]);
  });

  afterAll(async () => {
    await teardownDb();
  });

  it('computes a 50% row when half of a combo\'s generated reports were unlocked', async () => {
    const res = await agent.get('/admin/analytics/conversion?daysBack=30').set('Cookie', cookie);
    expect(res.status).toBe(200);

    const rowA = res.body.rows.find(
      (r) => r.listingType === 'sale' && r.bhk === '2BHK' && r.budgetBracket === '60L-1Cr'
    );
    expect(rowA).toMatchObject({ reportsGenerated: 2, reportsUnlocked: 1, conversionPct: 50 });
  });

  it('computes 100% and 0% rows for fully-unlocked and never-unlocked combos', async () => {
    const res = await agent.get('/admin/analytics/conversion?daysBack=30').set('Cookie', cookie);

    const rowB = res.body.rows.find(
      (r) => r.listingType === 'rent' && r.bhk === '1BHK' && r.budgetBracket === '10K-20K'
    );
    expect(rowB).toMatchObject({ reportsGenerated: 1, reportsUnlocked: 1, conversionPct: 100 });

    const rowC = res.body.rows.find(
      (r) => r.listingType === 'sale' && r.bhk === '3BHK' && r.budgetBracket === '1Cr-1.5Cr'
    );
    expect(rowC).toMatchObject({ reportsGenerated: 1, reportsUnlocked: 0, conversionPct: 0 });
  });
});
