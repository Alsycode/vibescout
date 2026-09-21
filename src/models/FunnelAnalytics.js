// FILE: src/models/FunnelAnalytics.js
// PURPOSE: Track user funnel progression — step entry/exit times, errors, device type

import mongoose from 'mongoose';

const FunnelAnalyticsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  step: { type: Number, required: true, min: 0, max: 9 }, // 0=context, 1-8=steps
  action: {
    type: String,
    enum: ['enter', 'exit', 'error', 'abandon'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  timeSpentMs: { type: Number, default: null }, // Only for 'exit' and 'error'
  errorMessage: { type: String, default: null }, // Only for 'error'
  deviceType: { type: String, enum: ['mobile', 'desktop', 'tablet'], default: 'desktop' },
  userAgent: { type: String, default: null },
}, {
  timestamps: true,
  collection: 'funnelAnalytics',
});

// Compound index for efficient filtering: user + session + step
FunnelAnalyticsSchema.index({ userId: 1, sessionId: 1, step: 1, timestamp: 1 });

// PERF-5 — one index doing two jobs: services the `{timestamp: {$gte}}`
// range queries every funnelAnalytics.service.js function runs, and expires
// documents after 180 days (this collection had no TTL/retention at all
// before). Replaces what used to be two separate single-field indexes on
// this same field (a plain `index: true` on the field above, plus a
// standalone `{timestamp: -1}` — redundant since either direction serves a
// range/sort query on a single-field index equally well).
FunnelAnalyticsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export default mongoose.model('FunnelAnalytics', FunnelAnalyticsSchema);
