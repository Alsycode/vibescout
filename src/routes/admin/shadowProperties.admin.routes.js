// FILE: src/routes/admin/shadowProperties.admin.routes.js
// PURPOSE: Admin read-only routes for ShadowProperty — list with filters, detail with full intelligence

import { Router } from 'express';
import ShadowProperty from '../../models/ShadowProperty.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// GET /admin/shadow-properties — list with optional filters
router.get('/', async (req, res, next) => {
  try {
    const { status, listingType, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (listingType) filter['userProvidedSpecs.listingType'] = listingType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [docs, total] = await Promise.all([
      ShadowProperty.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-__v'),
      ShadowProperty.countDocuments(filter),
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

// GET /admin/shadow-properties/:id — detail with full intelligence
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await ShadowProperty.findById(req.params.id).select('-__v');
    if (!doc) return res.status(404).json({ error: 'ShadowProperty not found' });
    res.json({ data: doc });
  } catch (err) {
    next(err);
  }
});

export default router;
