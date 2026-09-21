// FILE: src/routes/payment.routes.js
// PURPOSE: Razorpay payment — create order and verify signature for report unlock

import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAuth } from '../middleware/auth.middleware.js';
import { paymentLimiter, webhookLimiter } from '../middleware/rateLimiter.js';
import ShadowProperty from '../models/ShadowProperty.js';
import Payment from '../models/Payment.js';
import { trackReportUnlocked } from '../services/analytics.service.js';

const router = Router();

const log = (tag, msg, data) => {
  const ts = new Date().toISOString();
  if (data !== undefined) {
    console.log(`[${ts}] [Payment:${tag}] ${msg}`, data);
  } else {
    console.log(`[${ts}] [Payment:${tag}] ${msg}`);
  }
};

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

log('Init', 'RAZORPAY_KEY_ID set?', !!keyId);
log('Init', 'RAZORPAY_KEY_SECRET set?', !!keySecret);

const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

const REPORT_PRICE_PAISE = 19900; // ₹199

// PERF-4 — "unlocked" is now Payment.status==='paid' (was User.unlockedReports[]
// via $addToSet). The callers below (/verify, /webhook) already flip that
// status themselves before calling this, so all that's left here is the
// analytics side-effect. /dev-unlock is the one caller with no real Payment
// doc yet — it creates one first (see below) so this stays a single code path.
function unlockReport(userId, sessionId) {
  return ShadowProperty.findOne({ sessionId, userId })
    .then(sp => {
      if (sp) {
        trackReportUnlocked(userId, sessionId, {
          listingType: sp.userProvidedSpecs?.listingType ?? null,
          budgetBracket: sp.userProvidedSpecs?.budgetBracket ?? null,
          bhk: sp.userProvidedSpecs?.bhk ?? null,
          location: { suburb: sp.name ?? null, city: null, lat: sp.coordinates?.lat ?? null, lng: sp.coordinates?.lng ?? null },
        });
      }
    })
    .catch(() => {});
}

// POST /payment/create-order
router.post('/create-order', paymentLimiter, requireAuth, async (req, res, next) => {
  log('create-order', 'Request received', { userId: req.user?.userId, body: req.body });
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      log('create-order', 'FAIL — missing sessionId');
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // PERF-4 — was User.findById(...).unlockedReports.includes(sessionId);
    // Payment is the source of truth for "paid" now, and this needs no User
    // fields at all, so no User query on this hot path anymore.
    const alreadyPaid = await Payment.exists({ userId: req.user.userId, sessionId, status: 'paid' });
    if (alreadyPaid) {
      log('create-order', 'FAIL — already unlocked', sessionId);
      return res.status(400).json({ error: 'Report already unlocked' });
    }

    log('create-order', 'Creating Razorpay order', { amount: REPORT_PRICE_PAISE, sessionId });
    const order = await razorpay.orders.create({
      amount: REPORT_PRICE_PAISE,
      currency: 'INR',
      receipt: `report_${sessionId.slice(0, 20)}`,
      notes: { sessionId, userId: req.user.userId },
    });

    // SEC-02 — persist before responding so the webhook (which may arrive
    // before the client's /verify call, or if the tab closes) always has a
    // Payment doc to key its idempotent unlock off of.
    await Payment.create({
      userId: req.user.userId,
      sessionId,
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });

    log('create-order', 'Order created', { orderId: order.id, amount: order.amount });
    res.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    log('create-order', 'ERROR', { message: err.message, code: err.statusCode, description: err.error?.description });
    next(err);
  }
});

// POST /payment/verify — browser-side confirmation. Not the source of truth
// (the webhook is, see below) but unlocks immediately when the tab is still
// open, rather than waiting on webhook delivery.
router.post('/verify', paymentLimiter, requireAuth, async (req, res, next) => {
  try {
    const { sessionId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!sessionId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing required payment fields' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, userId: req.user.userId, sessionId });
    if (!payment) {
      return res.status(400).json({ error: 'Order not found' });
    }

    // Idempotent flip to 'paid' — only the first caller (this /verify request
    // or a webhook delivery that beat it here) actually transitions the doc;
    // a second arrival (retry, or the other channel) just falls through to
    // the (idempotent) unlock below without double-processing.
    await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: 'paid' } },
      { $set: { razorpayPaymentId: razorpay_payment_id, status: 'paid', source: 'verify' } },
    );

    await unlockReport(req.user.userId, sessionId);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /payment/webhook — source of truth. Razorpay calls this server-to-server
// once a payment actually captures, independent of whether the customer's tab
// is still open. Verified via HMAC signature (RAZORPAY_WEBHOOK_SECRET), keyed
// idempotent on razorpayOrderId so retried/duplicate deliveries never
// double-unlock.
router.post('/webhook', webhookLimiter, async (req, res, next) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !secret || !req.rawBody) {
      log('webhook', 'FAIL — missing signature, secret, or raw body');
      return res.status(400).json({ error: 'Invalid webhook request' });
    }

    const valid = Razorpay.validateWebhookSignature(req.rawBody.toString(), signature, secret);
    if (!valid) {
      log('webhook', 'FAIL — signature mismatch');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = req.body?.event;
    if (event !== 'payment.captured' && event !== 'order.paid') {
      // Acknowledge — we only act on capture events, everything else is a no-op.
      return res.status(200).json({ received: true });
    }

    const paymentEntity = req.body?.payload?.payment?.entity;
    const razorpayOrderId = paymentEntity?.order_id;
    const razorpayPaymentId = paymentEntity?.id;
    const notesUserId = paymentEntity?.notes?.userId;
    const notesSessionId = paymentEntity?.notes?.sessionId;

    if (!razorpayOrderId || !razorpayPaymentId) {
      log('webhook', 'FAIL — missing order/payment id in payload');
      return res.status(400).json({ error: 'Malformed webhook payload' });
    }

    let payment = await Payment.findOne({ razorpayOrderId });
    if (!payment && notesUserId && notesSessionId) {
      // Guards against the rare case where /create-order's Payment.create()
      // failed after the Razorpay order itself succeeded — reconstruct from
      // the order notes rather than silently dropping a real payment.
      payment = await Payment.create({
        userId: notesUserId,
        sessionId: notesSessionId,
        razorpayOrderId,
        amount: paymentEntity.amount,
        currency: paymentEntity.currency,
      });
    }

    if (!payment) {
      log('webhook', 'FAIL — no Payment record and no usable order notes', { razorpayOrderId });
      return res.status(200).json({ received: true }); // ack — retrying won't help without notes
    }

    const updated = await Payment.findOneAndUpdate(
      { _id: payment._id, status: { $ne: 'paid' } },
      { $set: { razorpayPaymentId, status: 'paid', source: 'webhook' } },
      { new: true },
    );

    // updated is null when this event was already processed (by /verify or a
    // prior webhook delivery) — unlock is still safe to (re-)run, it's a no-op.
    await unlockReport(payment.userId, payment.sessionId);

    log('webhook', 'Processed', { razorpayOrderId, razorpayPaymentId, alreadyProcessed: !updated });
    res.status(200).json({ received: true });
  } catch (err) {
    next(err);
  }
});

// POST /payment/dev-unlock — TEST ONLY. Skips Razorpay and unlocks the report
// directly. Lets you test the unlocked report without completing a real/test
// gateway payment.
// SEC-09 — gated on the same DEV_UNLOCK flag as /dev/seed-report (devTest.routes.js)
// and the frontend's "skip payment" button (NEXT_PUBLIC_DEV_UNLOCK), rather than
// NODE_ENV. Was previously the only one of the three gated by NODE_ENV==='production'
// instead — harmless in a correctly configured prod deploy, but a staging/preview
// environment (NODE_ENV unset or 'staging') would leave this endpoint open while the
// other two dev backdoors stayed closed. One flag, one meaning, everywhere.
// validateEnv.js asserts at boot that DEV_UNLOCK can never be 'true' when
// NODE_ENV==='production', so this can't silently ship live either.
router.post('/dev-unlock', paymentLimiter, requireAuth, async (req, res, next) => {
  if (process.env.DEV_UNLOCK !== 'true') {
    return res.status(403).json({ error: 'Dev unlock not enabled.' });
  }
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    // PERF-4 — unlockReport() no longer writes anything itself (that's now
    // Payment.status==='paid', set by /verify and /webhook before they call
    // it); this is the one caller with no real payment behind it, so it
    // creates the Payment doc — a synthetic razorpayOrderId satisfies the
    // required+unique field, source:'dev' keeps it distinguishable from a
    // real payment for reconciliation.
    const alreadyPaid = await Payment.exists({ userId: req.user.userId, sessionId, status: 'paid' });
    if (!alreadyPaid) {
      await Payment.create({
        userId: req.user.userId,
        sessionId,
        razorpayOrderId: `dev_${sessionId}_${Date.now()}`,
        amount: REPORT_PRICE_PAISE,
        currency: 'INR',
        status: 'paid',
        source: 'dev',
      });
    }

    await unlockReport(req.user.userId, sessionId);
    log('dev-unlock', 'Report unlocked WITHOUT payment (dev only)', { sessionId, userId: req.user.userId });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
