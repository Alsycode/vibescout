// FILE: src/routes/payment.routes.js
// PURPOSE: Razorpay payment — create order and verify signature for report unlock

import { Router } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { requireAuth } from '../middleware/auth.middleware.js';
import User from '../models/User.js';

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

const REPORT_PRICE_PAISE = 9900; // ₹99

// POST /payment/create-order
router.post('/create-order', requireAuth, async (req, res, next) => {
  log('create-order', 'Request received', { userId: req.user?.userId, body: req.body });
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      log('create-order', 'FAIL — missing sessionId');
      return res.status(400).json({ error: 'sessionId is required' });
    }

    log('create-order', 'Looking up user', req.user.userId);
    const user = await User.findById(req.user.userId);
    log('create-order', 'User found?', !!user);

    if (user?.unlockedReports?.includes(sessionId)) {
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

    log('create-order', 'Order created', { orderId: order.id, amount: order.amount });
    res.json({ id: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    log('create-order', 'ERROR', { message: err.message, code: err.statusCode, description: err.error?.description });
    next(err);
  }
});

// POST /payment/verify
router.post('/verify', requireAuth, async (req, res, next) => {
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

    await User.findByIdAndUpdate(req.user.userId, {
      $addToSet: { unlockedReports: sessionId },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
