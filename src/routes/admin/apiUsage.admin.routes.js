// FILE: src/routes/admin/apiUsage.admin.routes.js
// PURPOSE: Admin endpoints — outbound third-party API call volume + rough monthly-bill estimate.

import { Router } from 'express';
import { requireAdminAuth } from '../../middleware/auth.middleware.js';
import { getMonthlyUsage, getAvailableMonths, getDailySeries } from '../../services/apiUsage.service.js';

const router = Router();
router.use(requireAdminAuth);

// GET /admin/api-usage?month=YYYY-MM
router.get('/', async (req, res, next) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month ?? '') ? req.query.month : undefined;
    const [usage, months] = await Promise.all([
      getMonthlyUsage(month),
      getAvailableMonths(),
    ]);
    res.json({ ...usage, availableMonths: months });
  } catch (err) {
    next(err);
  }
});

// GET /admin/api-usage/daily?days=30
router.get('/daily', async (req, res, next) => {
  try {
    const days = Math.min(90, Math.max(7, parseInt(req.query.days ?? '30', 10)));
    res.json({ days, series: await getDailySeries(days) });
  } catch (err) {
    next(err);
  }
});

export default router;
