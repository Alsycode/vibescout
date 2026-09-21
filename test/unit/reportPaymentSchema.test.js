// FILE: test/unit/reportPaymentSchema.test.js
// PURPOSE: PERF-4 — regression guard for the indexes report.routes.js and
// payment.routes.js's duplicate-guard/share-link/paid-lookup logic depends
// on. No mocking — imports the real Mongoose models/schemas directly (no DB
// connection needed to inspect a schema's declared indexes).

import { describe, it, expect } from 'vitest';
import Report from '../../src/models/Report.js';
import Payment from '../../src/models/Payment.js';

describe('Report schema — PERF-4', () => {
  it('sessionId is unique — GET /report/generate\'s duplicate guard depends on this', () => {
    expect(Report.schema.path('sessionId').options.unique).toBe(true);
  });

  it('shareToken is unique — GET /report/:sessionId?share= depends on this', () => {
    expect(Report.schema.path('shareToken').options.unique).toBe(true);
  });

  it('has a {userId, generatedAt} index for the "my reports" listing', () => {
    const indexes = Report.schema.indexes().map(([fields]) => fields);
    expect(indexes).toContainEqual({ userId: 1, generatedAt: -1 });
  });
});

describe('Payment schema — PERF-4', () => {
  it('has a compound {userId, sessionId} index — the "is this paid" lookup runs on every report list/generate/detail request', () => {
    const indexes = Payment.schema.indexes().map(([fields]) => fields);
    expect(indexes).toContainEqual({ userId: 1, sessionId: 1 });
  });

  it('source enum includes "dev" and "migration"', () => {
    const enumValues = Payment.schema.path('source').enumValues;
    expect(enumValues).toEqual(expect.arrayContaining(['verify', 'webhook', 'dev', 'migration']));
  });
});
