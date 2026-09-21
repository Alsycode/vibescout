// FILE: src/models/Report.js
// PURPOSE: PERF-4 — one document per generated report, replacing
// User.reportHistory[] (which stored every user's full report JSON inline on
// their account document — unbounded growth toward Mongo's 16MB doc limit,
// and heavy hydration on every User.findById(...) even for requests that
// have nothing to do with reports).
//
// "Paid" status is deliberately NOT stored here — it lives on Payment
// (status: 'paid'), which already exists (SEC-02) and is written
// independently of whether a Report doc exists yet (payment can complete via
// webhook before/without the report ever being (re-)generated). Duplicating
// a paid flag on both documents would just be two places that could drift.

import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, unique: true },
  listingType: { type: String, default: null },
  propertyName: { type: String, default: null },
  // Full rendered report JSON — permanent record, source of truth after the
  // originating ShadowProperty expires (24h TTL).
  snapshot: { type: Object, required: true },
  // crypto.randomBytes(16).toString('hex') — 32 hex chars, 128-bit entropy.
  shareToken: { type: String, required: true, unique: true },
  generatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// "My reports" listing, newest first.
ReportSchema.index({ userId: 1, generatedAt: -1 });

const Report = mongoose.model('Report', ReportSchema);

export default Report;
