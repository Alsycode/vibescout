// FILE: src/routes/admin/leads.admin.routes.js
// PURPOSE: Admin read-only routes for Leads — list with filters, aggregate stats, lead detail

import { Router } from 'express';
import Lead from '../../models/Lead.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /admin/leads — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { scoreTier, listingType, stage, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (scoreTier) filter.scoreTier = scoreTier;
    if (listingType) filter.listingType = listingType;
    if (stage) filter.stage = stage;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [docs, total] = await Promise.all([
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-__v -preferences -verdictObject -scoreBreakdown'),
      Lead.countDocuments(filter),
    ]);

    res.json({
      data: docs,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / parseInt(limit, 10)),
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/leads/stats — aggregate stats for admin dashboard
router.get('/stats', async (req, res, next) => {
  try {
    const [tierBreakdown, listingBreakdown, stageBreakdown, total] = await Promise.all([
      Lead.aggregate([
        { $group: { _id: '$scoreTier', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$listingType', count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
      Lead.countDocuments(),
    ]);

    const byTier = { hot: 0, warm: 0, lukewarm: 0, cold: 0 };
    for (const t of tierBreakdown) {
      if (t._id) byTier[t._id] = t.count;
    }

    const byListingType = { sale: 0, rent: 0 };
    for (const l of listingBreakdown) {
      if (l._id) byListingType[l._id] = l.count;
    }

    const byStage = { new: 0, listed: 0, sold: 0, expired: 0 };
    for (const s of stageBreakdown) {
      if (s._id) byStage[s._id] = s.count;
    }

    res.json({
      total,
      byTier,
      byListingType,
      byStage,
    });
  } catch (err) {
    next(err);
  }
});

// GET /admin/leads/:id — lead detail with verdictObject
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Lead.findById(req.params.id).select('-__v');
    if (!doc) return res.status(404).json({ error: 'Lead not found' });
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
