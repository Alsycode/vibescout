// FILE: src/routes/admin/revenue.admin.routes.js
// PURPOSE: Admin revenue endpoint — money collected from report unlocks, from Payment docs.
// Real revenue = status 'paid' AND source in verify/webhook/migration; source 'dev'
// (DEV_UNLOCK backdoor) is excluded so test unlocks never inflate the numbers.

import { Router } from 'express';
import { requireAdminAuth } from '../../middleware/auth.middleware.js';
import Payment from '../../models/Payment.js';

const router = Router();
router.use(requireAdminAuth);

const REAL_PAID = { status: 'paid', source: { $in: ['verify', 'webhook', 'migration'] } };
const PAID_DATE = { $ifNull: ['$paidAt', '$updatedAt'] };
const paiseToRupees = (p) => Math.round(((p ?? 0) / 100) * 100) / 100;

// GET /admin/revenue?daysBack=30
router.get('/', async (req, res, next) => {
  try {
    const parsed = parseInt(req.query.daysBack ?? '30', 10);
    const daysBack = Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 365) : 30;
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    const [allTime, period, daily, abandoned, recent] = await Promise.all([
      Payment.aggregate([
        { $match: REAL_PAID },
        { $group: { _id: null, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: REAL_PAID },
        { $addFields: { paidDate: PAID_DATE } },
        { $match: { paidDate: { $gte: since } } },
        { $group: { _id: null, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: REAL_PAID },
        { $addFields: { paidDate: PAID_DATE } },
        { $match: { paidDate: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidDate', timezone: 'Asia/Kolkata' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Orders started in the period that never captured — checkout drop-off.
      Payment.countDocuments({ status: { $in: ['created', 'failed'] }, createdAt: { $gte: since } }),
      Payment.find(REAL_PAID)
        .sort({ paidAt: -1, updatedAt: -1 })
        .limit(25)
        .populate('userId', 'name email')
        .lean(),
    ]);

    const periodRevenue = period[0]?.revenue ?? 0;
    const periodCount = period[0]?.count ?? 0;

    // Fill days with no payments so the chart has a continuous x-axis.
    const byDay = new Map(daily.map((d) => [d._id, d]));
    const series = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const key = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const hit = byDay.get(key);
      series.push({ date: key, revenue: paiseToRupees(hit?.revenue), payments: hit?.count ?? 0 });
    }

    res.json({
      daysBack,
      currency: 'INR',
      allTime: { revenue: paiseToRupees(allTime[0]?.revenue), payments: allTime[0]?.count ?? 0 },
      period: {
        revenue: paiseToRupees(periodRevenue),
        payments: periodCount,
        avgOrderValue: periodCount > 0 ? paiseToRupees(periodRevenue / periodCount) : 0,
        abandonedCheckouts: abandoned,
      },
      series,
      recent: recent.map((p) => ({
        id: p._id,
        paidAt: p.paidAt ?? p.updatedAt,
        amount: paiseToRupees(p.amount),
        source: p.source,
        sessionId: p.sessionId,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId ?? null,
        user: p.userId ? { name: p.userId.name, email: p.userId.email } : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
