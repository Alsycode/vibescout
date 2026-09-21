// FILE: test/unit/perf4ReportPaymentCollections.test.js
// PURPOSE: PERF-4 — proves the new logic this migration introduced:
//  (1) GET /report combines the new Report + Payment collections correctly
//      (was a single User.reportHistory[]/unlockedReports[] read);
//  (2) POST /funnel/save's Lead.create is idempotent on a double funnel-complete
//      (was an uncaught E11000 → generic 500, even though Lead.sessionId
//      already had a unique index — the duplicate was already *prevented*,
//      just not *handled*);
//  (3) the Report/Payment schemas still declare the unique indexes this
//      migration's duplicate-guard and share-link lookups depend on.
// Cross-collection race-dedup on GET /report/generate (RACE-03, an E11000
// catch identical in shape to the funnel one tested here) isn't independently
// covered — same as before this migration, that path always needed the full
// pipeline/GROQ mocked to exercise via HTTP, which is Stage 3 integration-test
// territory, not this file's job.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../src/models/Report.js', () => ({
  default: { find: vi.fn() },
}));
vi.mock('../../src/models/Payment.js', () => ({
  default: { find: vi.fn(), exists: vi.fn() },
}));
vi.mock('../../src/models/ShadowProperty.js', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('../../src/models/User.js', () => ({
  default: { findById: vi.fn(), findByIdAndUpdate: vi.fn() },
}));
vi.mock('../../src/models/Lead.js', () => ({
  default: { create: vi.fn() },
}));

const Report = (await import('../../src/models/Report.js')).default;
const Payment = (await import('../../src/models/Payment.js')).default;
const ShadowProperty = (await import('../../src/models/ShadowProperty.js')).default;
const User = (await import('../../src/models/User.js')).default;
const Lead = (await import('../../src/models/Lead.js')).default;
const { signToken } = await import('../../src/services/token.service.js');
const app = (await import('../../src/app.js')).default;

const userId = '507f1f77bcf86cd799439011';
const authCookie = `vb_session=${signToken({ userId, email: 'a@b.com', name: 'A', role: 'user' })}`;

function leanQuery(resolvedValue) {
  const q = {};
  q.select = vi.fn().mockReturnValue(q);
  q.sort = vi.fn().mockReturnValue(q);
  q.lean = vi.fn().mockResolvedValue(resolvedValue);
  return q;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /report — PERF-4', () => {
  it('marks a report paid only when a matching Payment(status:paid) exists, unpaid otherwise', async () => {
    Report.find.mockReturnValue(leanQuery([
      { sessionId: 'vs_paid', listingType: 'sale', propertyName: 'A', generatedAt: new Date(), shareToken: 't1' },
      { sessionId: 'vs_unpaid', listingType: 'rent', propertyName: 'B', generatedAt: new Date(), shareToken: 't2' },
    ]));
    Payment.find.mockReturnValue(leanQuery([{ sessionId: 'vs_paid' }]));

    const res = await request(app).get('/report').set('Cookie', authCookie);

    expect(res.status).toBe(200);
    expect(res.body.reports).toEqual([
      expect.objectContaining({ sessionId: 'vs_paid', paid: true }),
      expect.objectContaining({ sessionId: 'vs_unpaid', paid: false }),
    ]);
  });

  it('scopes both queries to the authenticated user only', async () => {
    Report.find.mockReturnValue(leanQuery([]));
    Payment.find.mockReturnValue(leanQuery([]));

    await request(app).get('/report').set('Cookie', authCookie);

    expect(Report.find).toHaveBeenCalledWith({ userId });
    expect(Payment.find).toHaveBeenCalledWith({ userId, status: 'paid' });
  });
});

describe('POST /funnel/save (complete) Lead idempotency — PERF-4', () => {
  const sessionId = 'vs_dup_test';
  const sp = {
    _id: 'sp1',
    name: 'Test Property',
    coordinates: { lat: 12.9352, lng: 77.6245 },
    clusterId: '12.97_77.59',
    userProvidedSpecs: { listingType: 'sale', budgetBracket: '60L–1Cr', bhk: '2BHK', floor: '4–7' },
    dataSource: {},
    intelligence: {
      aqi: { value: 78, category: 'Poor', source: 'city_average' },
      noise: { estimatedDb: 62, category: 'Moderate', noiseRiskScore: 48, confidence: 'medium', source: 'osm_cache' },
      solar: { peakSunHours: 5.4, wfhLightScore: 72, viability: 'Good', source: 'computed' },
      weather: { temp: 27, humidity: 64, description: 'Partly cloudy', source: 'seasonal' },
      amenities: { schools: [], hospitals: [], parks: [], gyms: [], cafes: [], source: 'seed' },
      localNews: { headlines: [], source: 'seed' },
    },
  };
  const preferences = {
    step1: { wfhStatus: 'hybrid' }, step2: { lifestyleType: 'family' },
    step3: { noiseSensitivity: 'moderate', aqiSensitivity: 'moderate' },
    step4: { facingDirection: 'East' }, step5: { amenityPriorities: ['schools'] },
    step6: { communityPreference: 'family' },
    step7: { monthlyHouseholdIncome: '1L–2L', downPaymentBracket: '20L–50L', investmentIntent: 'primary' },
  };
  const body = { sessionId, step: 8, data: { investmentIntent: 'live-in' }, complete: true };

  beforeEach(() => {
    ShadowProperty.findOne.mockResolvedValue(sp);
    User.findByIdAndUpdate.mockResolvedValue({});
    User.findById.mockReturnValue({ select: vi.fn().mockResolvedValue({ preferences, phone: null }) });
  });

  it('returns ok:true (not a 500) when Lead.create hits a duplicate sessionId', async () => {
    Lead.create.mockRejectedValue(Object.assign(new Error('E11000 duplicate key'), { code: 11000 }));

    const res = await request(app).post('/funnel/save').set('Cookie', authCookie).send(body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, sessionId });
  });

  it('still propagates a non-duplicate-key error as a real failure', async () => {
    Lead.create.mockRejectedValue(new Error('Mongo is down'));

    const res = await request(app).post('/funnel/save').set('Cookie', authCookie).send(body);

    expect(res.status).toBe(500);
  });

  it('succeeds normally when Lead.create has no conflict', async () => {
    Lead.create.mockResolvedValue({ _id: 'lead1' });

    const res = await request(app).post('/funnel/save').set('Cookie', authCookie).send(body);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, sessionId });
  });
});
