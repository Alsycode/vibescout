// FILE: src/routes/funnel.routes.js
// PURPOSE: Consumer funnel routes — save step data, get progress, create lead on completion

import { Router } from 'express';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import ShadowProperty from '../models/ShadowProperty.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { computeAllVerdicts } from '../services/verdictEngine.service.js';
import { computeLeadScore } from '../services/leadScore.service.js';

const router = Router();

// POST /funnel/save
router.post('/save', requireAuth, async (req, res, next) => {
  try {
    const { sessionId, step, data, complete } = req.body;

    if (!sessionId || !step || !data) {
      return res.status(400).json({ error: 'sessionId, step, and data are required' });
    }

    const stepNum = parseInt(step, 10);
    if (isNaN(stepNum) || stepNum < 1 || stepNum > 8) {
      return res.status(400).json({ error: 'Step must be between 1 and 8' });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      [`preferences.step${stepNum}`]: data,
    });

    if (complete) {
      const sp = await ShadowProperty.findOne({ sessionId });
      if (!sp) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const user = await User.findById(req.user.userId);
      const preferences = user.preferences;

      // FAIL-02: Guard against incomplete preferences before verdict computation
      if (!preferences?.step1 || !preferences?.step3 || !preferences?.step4 || !preferences?.step5 || !preferences?.step7) {
        return res.status(400).json({ error: 'Funnel steps incomplete. Please complete all steps before submitting.' });
      }

      const verdictObject = computeAllVerdicts(sp, preferences);
      const { compositeScore, tier, breakdown } = computeLeadScore(preferences, sp, verdictObject);

      await Lead.create({
        userId: req.user.userId,
        shadowPropertyId: sp._id,
        sessionId,
        clusterId: sp.clusterId,
        listingType: sp.userProvidedSpecs.listingType,
        preferences,
        userProvidedSpecs: sp.userProvidedSpecs,
        budgetBracket: sp.userProvidedSpecs.budgetBracket,
        verdictObject,
        compositeScore,
        scoreTier: tier,
        scoreBreakdown: breakdown,
        dataSource: sp.dataSource,
        stage: 'new',
      });

      return res.json({ ok: true, sessionId });
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /funnel/progress
router.get('/progress', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select('preferences');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ preferences: user.preferences });
  } catch (err) {
    next(err);
  }
});

export default router;
