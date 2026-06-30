// FILE: src/routes/funnel.routes.js
// PURPOSE: Consumer funnel routes — save step data, get progress, create lead on completion

import { Router } from 'express';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import ShadowProperty from '../models/ShadowProperty.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { computeAllVerdicts } from '../services/verdictEngine.service.js';
import { computeLeadScore } from '../services/leadScore.service.js';
import { trackFunnelStep, trackFunnelAbandon, trackAmenityPreference } from '../services/analytics.service.js';
import {
  logFunnelEvent,
  getStepCompletionRates,
  getAvgTimePerStep,
  getErrorRateByStep,
  getDeviceComparison,
  getRecentEvents,
} from '../services/funnelAnalytics.service.js';

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

    trackFunnelStep(req.user.userId, sessionId, stepNum);

    // Track amenity preferences when step5 is saved
    if (stepNum === 5 && Array.isArray(data.amenityPriorities)) {
      const user = await User.findById(req.user.userId).select('preferences.step6');
      trackAmenityPreference(req.user.userId, sessionId, {
        amenityPriorities: data.amenityPriorities,
        communityPreference: user?.preferences?.step6?.communityPreference ?? null,
      });
    }

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
        phone: user.phone ?? null,
        propertyName: sp.name ?? null,
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

// POST /funnel/analytics — log step event (enter/exit/error)
router.post('/analytics', requireAuth, async (req, res, next) => {
  try {
    const { sessionId, step, action, timeSpentMs, errorMessage, deviceType } = req.body;

    if (!sessionId || step === undefined || !action) {
      return res.status(400).json({ error: 'sessionId, step, and action are required' });
    }

    if (!['enter', 'exit', 'error'].includes(action)) {
      return res.status(400).json({ error: 'action must be enter, exit, or error' });
    }

    await logFunnelEvent(
      req.user.userId,
      sessionId,
      step,
      action,
      timeSpentMs ?? null,
      errorMessage ?? null,
      deviceType ?? 'desktop',
    );

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /funnel/analytics — admin only, get aggregated funnel stats
router.get('/analytics', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const daysBack = parseInt(req.query.daysBack ?? '7', 10);

    const [completionRates, avgTimePerStep, errorRates, deviceComparison, recentEvents] = await Promise.all([
      getStepCompletionRates(daysBack),
      getAvgTimePerStep(daysBack),
      getErrorRateByStep(daysBack),
      getDeviceComparison(daysBack),
      getRecentEvents(daysBack, 50),
    ]);

    res.json({
      daysBack,
      completionRates,
      avgTimePerStep,
      errorRates,
      deviceComparison,
      recentEvents,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
