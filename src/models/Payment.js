// FILE: src/models/Payment.js
// PURPOSE: SEC-02 — durable record of a Razorpay payment, keyed for idempotent
// unlock. /payment/verify (client) and /payment/webhook (Razorpay, source of
// truth) both converge on this doc so a report is unlocked exactly once
// regardless of which arrives first, last, or is retried.

import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  // Set once the payment is captured — either by /verify or the webhook.
  // Unique+sparse: absent while status is 'created', so multiple pending
  // orders don't collide, but no two Payment docs can ever record the same
  // captured payment.
  razorpayPaymentId: { type: String, default: null, unique: true, sparse: true },
  status: { type: String, enum: ['created', 'paid', 'failed'], default: 'created', index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  // Which channel actually flipped this to 'paid' — for reconciliation.
  // 'dev' — POST /payment/dev-unlock (DEV_UNLOCK gate). 'migration' — backfilled
  // by scripts/migrateReportsAndUnlocks.js from the pre-PERF-4 User.unlockedReports[].
  source: { type: String, enum: ['verify', 'webhook', 'dev', 'migration', null], default: null },
}, { timestamps: true });

// PERF-4 — "is sessionId X paid for by user Y" is now the canonical way to
// check report-unlock status (report.routes.js, payment.routes.js), read on
// every report list/generate/detail request — a compound index keeps that a
// single index scan instead of falling back to just the userId index.
PaymentSchema.index({ userId: 1, sessionId: 1 });

export default mongoose.model('Payment', PaymentSchema);
