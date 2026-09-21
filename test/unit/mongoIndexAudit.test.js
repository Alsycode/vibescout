// FILE: test/unit/mongoIndexAudit.test.js
// PURPOSE: PERF-5 — regression guard for the exact bug this audit found and
// fixed: 5 models (Cluster, Lead, User, Broker, ShadowProperty) each declared
// the same unique index twice — once via a field's `unique: true`, again via
// an explicit `.index()` call for the identical key pattern — which Mongoose
// warns about on every boot ("[MONGOOSE] Warning: Duplicate schema index on
// {...} found") and which wastes index-build/maintenance work on every
// write. No live DB connection needed — Mongoose computes a schema's full
// index list (field-level + explicit) independent of any connection.

import { describe, it, expect } from 'vitest';
import Report from '../../src/models/Report.js';
import Payment from '../../src/models/Payment.js';
import ShadowProperty from '../../src/models/ShadowProperty.js';
import Cluster from '../../src/models/Cluster.js';
import Lead from '../../src/models/Lead.js';
import LeadAuction from '../../src/models/LeadAuction.js';
import User from '../../src/models/User.js';
import Broker from '../../src/models/Broker.js';
import BlogPost from '../../src/models/BlogPost.js';
import AnalyticsEvent from '../../src/models/AnalyticsEvent.js';
import FunnelAnalytics from '../../src/models/FunnelAnalytics.js';

const MODELS = { Report, Payment, ShadowProperty, Cluster, Lead, LeadAuction, User, Broker, BlogPost, AnalyticsEvent, FunnelAnalytics };

describe('no duplicate index key-patterns on any model — PERF-5', () => {
  for (const [name, Model] of Object.entries(MODELS)) {
    it(`${name} declares each index key pattern at most once`, () => {
      const keyPatterns = Model.schema.indexes().map(([fields]) => JSON.stringify(fields));
      const seen = new Set();
      const duplicates = keyPatterns.filter((k) => (seen.has(k) ? true : (seen.add(k), false)));
      expect(duplicates).toEqual([]);
    });
  }
});

describe('Cluster schema — PERF-5', () => {
  it('has a lastSearchedAt index — getAllActiveClusters() runs on every cron job', () => {
    const indexes = Cluster.schema.indexes().map(([fields]) => fields);
    expect(indexes).toContainEqual({ lastSearchedAt: 1 });
  });
});

describe('Lead schema — PERF-5', () => {
  it('has a createdAt index for GET /admin/leads\' default sort', () => {
    const indexes = Lead.schema.indexes().map(([fields]) => fields);
    expect(indexes).toContainEqual({ createdAt: -1 });
  });

  it('has an assignedBrokerId index for the broker-detail Lead.find(...)', () => {
    const indexes = Lead.schema.indexes().map(([fields]) => fields);
    expect(indexes).toContainEqual({ assignedBrokerId: 1 });
  });
});

describe('AnalyticsEvent / FunnelAnalytics TTL — PERF-5', () => {
  it('AnalyticsEvent has a TTL index on createdAt (180 days) — was unbounded', () => {
    const [, opts] = AnalyticsEvent.schema.indexes().find(([fields]) => fields.createdAt === 1) ?? [];
    expect(opts?.expireAfterSeconds).toBe(180 * 24 * 60 * 60);
  });

  it('FunnelAnalytics has a TTL index on timestamp (180 days) — was unbounded', () => {
    const [, opts] = FunnelAnalytics.schema.indexes()
      .find(([fields]) => JSON.stringify(fields) === JSON.stringify({ timestamp: 1 })) ?? [];
    expect(opts?.expireAfterSeconds).toBe(180 * 24 * 60 * 60);
  });
});
