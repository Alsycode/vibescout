// FILE: src/routes/admin/analytics.admin.routes.js
// PURPOSE: Admin analytics endpoints — funnel drop-off, conversion, verdict feedback, amenity preferences

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import AnalyticsEvent from '../../models/AnalyticsEvent.js';
import User from '../../models/User.js';
import ShadowProperty from '../../models/ShadowProperty.js';
import { getStepCompletionRates, getAvgTimePerStep, getErrorRateByStep, getDeviceComparison } from '../../services/funnelAnalytics.service.js';

const router = Router();
router.use(requireAuth, requireAdmin);

function sinceDate(daysBack) {
  return new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);
}

// GET /admin/analytics/funnel
// Drop-off rates per step from FunnelAnalytics (with timing + device breakdown)
router.get('/funnel', async (req, res, next) => {
  try {
    const daysBack = parseInt(req.query.daysBack ?? '7', 10);
    const [completionRates, avgTime, errorRates, deviceSplit] = await Promise.all([
      getStepCompletionRates(daysBack),
      getAvgTimePerStep(daysBack),
      getErrorRateByStep(daysBack),
      getDeviceComparison(daysBack),
    ]);
    res.json({ daysBack, completionRates, avgTimePerStep: avgTime, errorRates, deviceComparison: deviceSplit });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/conversion
// Which location+BHK combos generate reports vs unlock (pay) — conversion funnel
router.get('/conversion', async (req, res, next) => {
  try {
    const daysBack = parseInt(req.query.daysBack ?? '30', 10);
    const since = sinceDate(daysBack);

    const [generated, unlocked] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { type: 'report_generated', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { bhk: '$bhk', budgetBracket: '$budgetBracket', listingType: '$listingType' },
            count: { $sum: 1 },
          },
        },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { type: 'report_unlocked', createdAt: { $gte: since } } },
        {
          $group: {
            _id: { bhk: '$bhk', budgetBracket: '$budgetBracket', listingType: '$listingType' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build a lookup key → unlock count map
    const unlockedMap = {};
    for (const u of unlocked) {
      const key = `${u._id.listingType}|${u._id.bhk}|${u._id.budgetBracket}`;
      unlockedMap[key] = u.count;
    }

    const rows = generated.map(g => {
      const key = `${g._id.listingType}|${g._id.bhk}|${g._id.budgetBracket}`;
      const unlockedCount = unlockedMap[key] ?? 0;
      return {
        listingType: g._id.listingType,
        bhk: g._id.bhk,
        budgetBracket: g._id.budgetBracket,
        reportsGenerated: g.count,
        reportsUnlocked: unlockedCount,
        conversionPct: g.count > 0 ? Math.round((unlockedCount / g.count) * 100) : 0,
      };
    }).sort((a, b) => b.conversionPct - a.conversionPct);

    res.json({ daysBack, rows });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/verdict-feedback
// Pass/Caution/RedFlag verdict breakdown vs unlock rate — signals if verdict thresholds need tuning
router.get('/verdict-feedback', async (req, res, next) => {
  try {
    const daysBack = parseInt(req.query.daysBack ?? '30', 10);
    const since = sinceDate(daysBack);

    const [generated, unlocked] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: { type: 'report_generated', createdAt: { $gte: since }, overallVerdict: { $ne: null } } },
        { $group: { _id: '$overallVerdict', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { type: 'report_unlocked', createdAt: { $gte: since } } },
        { $group: { _id: null, sessions: { $addToSet: '$sessionId' } } },
      ]),
    ]);

    const unlockedSessions = new Set(unlocked[0]?.sessions ?? []);

    // For each verdict, count how many generated sessions later got unlocked
    const verdictUnlocked = await AnalyticsEvent.aggregate([
      { $match: { type: 'report_generated', createdAt: { $gte: since }, overallVerdict: { $ne: null } } },
      {
        $group: {
          _id: '$overallVerdict',
          sessions: { $addToSet: '$sessionId' },
        },
      },
    ]);

    const unlockedByVerdict = {};
    for (const v of verdictUnlocked) {
      unlockedByVerdict[v._id] = v.sessions.filter(s => unlockedSessions.has(s)).length;
    }

    const rows = generated.map(g => ({
      verdict: g._id,
      reportsGenerated: g.count,
      reportsUnlocked: unlockedByVerdict[g._id] ?? 0,
      unlockRatePct: g.count > 0 ? Math.round(((unlockedByVerdict[g._id] ?? 0) / g.count) * 100) : 0,
    }));

    res.json({ daysBack, rows });
  } catch (err) {
    next(err);
  }
});

// GET /admin/analytics/amenity-weights
// Popularity of amenity priorities and community preferences — informs verdictEngine weight tuning
router.get('/amenity-weights', async (req, res, next) => {
  try {
    const daysBack = parseInt(req.query.daysBack ?? '30', 10);
    const since = sinceDate(daysBack);

    const [amenityRows, communityRows] = await Promise.all([
      // Rank 1 amenity priority (first element = top priority)
      AnalyticsEvent.aggregate([
        { $match: { type: 'amenity_preference', createdAt: { $gte: since }, amenityPriorities: { $exists: true, $ne: [] } } },
        { $project: { topPriority: { $arrayElemAt: ['$amenityPriorities', 0] }, secondPriority: { $arrayElemAt: ['$amenityPriorities', 1] } } },
        {
          $facet: {
            top1: [{ $group: { _id: '$topPriority', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
            top2: [{ $group: { _id: '$secondPriority', count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          },
        },
      ]),
      AnalyticsEvent.aggregate([
        { $match: { type: 'amenity_preference', createdAt: { $gte: since }, communityPreference: { $ne: null } } },
        { $group: { _id: '$communityPreference', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      daysBack,
      amenityPriority1: amenityRows[0]?.top1 ?? [],
      amenityPriority2: amenityRows[0]?.top2 ?? [],
      communityPreferences: communityRows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /admin/analytics/backfill
// One-time backfill: creates AnalyticsEvent records from existing User.reportHistory and unlockedReports.
// Safe to run multiple times — skips sessions already tracked. Returns counts of what was created.
router.post('/backfill', async (req, res, next) => {
  try {
    const users = await User.find({}, 'reportHistory unlockedReports').lean();

    // Collect all sessionIds already tracked so we don't double-insert
    const existingGenerated = new Set(
      (await AnalyticsEvent.find({ type: 'report_generated' }, 'sessionId').lean()).map(e => e.sessionId)
    );
    const existingUnlocked = new Set(
      (await AnalyticsEvent.find({ type: 'report_unlocked' }, 'sessionId').lean()).map(e => e.sessionId)
    );

    const toInsert = [];

    for (const user of users) {
      const userId = user._id;

      // report_generated — from reportHistory
      for (const entry of (user.reportHistory ?? [])) {
        const { sessionId, listingType, generatedAt, reportSnapshot } = entry;
        if (!sessionId || existingGenerated.has(sessionId)) continue;

        // Pull verdict from snapshot if present
        const verdict = reportSnapshot?.verdictObject ?? reportSnapshot?.verdict ?? null;
        const sp = await ShadowProperty.findOne({ sessionId }, 'userProvidedSpecs name coordinates').lean();

        toInsert.push({
          type: 'report_generated',
          userId,
          sessionId,
          listingType: listingType ?? sp?.userProvidedSpecs?.listingType ?? undefined,
          budgetBracket: sp?.userProvidedSpecs?.budgetBracket ?? undefined,
          bhk: sp?.userProvidedSpecs?.bhk ?? undefined,
          location: sp ? { suburb: sp.name ?? null, city: null, lat: sp.coordinates?.lat ?? null, lng: sp.coordinates?.lng ?? null } : undefined,
          overallVerdict: verdict?.overallVerdict ?? undefined,
          totalRedFlags: verdict?.totalRedFlags ?? undefined,
          totalCautions: verdict?.totalCautions ?? undefined,
          totalPasses: verdict?.totalPasses ?? undefined,
          createdAt: generatedAt ?? new Date(),
        });
        existingGenerated.add(sessionId);
      }

      // report_unlocked — from unlockedReports
      for (const sessionId of (user.unlockedReports ?? [])) {
        if (!sessionId || existingUnlocked.has(sessionId)) continue;

        const sp = await ShadowProperty.findOne({ sessionId }, 'userProvidedSpecs name coordinates').lean();
        // Also grab generatedAt from reportHistory if available
        const histEntry = (user.reportHistory ?? []).find(r => r.sessionId === sessionId);

        toInsert.push({
          type: 'report_unlocked',
          userId,
          sessionId,
          listingType: sp?.userProvidedSpecs?.listingType ?? undefined,
          budgetBracket: sp?.userProvidedSpecs?.budgetBracket ?? undefined,
          bhk: sp?.userProvidedSpecs?.bhk ?? undefined,
          location: sp ? { suburb: sp.name ?? null, city: null, lat: sp.coordinates?.lat ?? null, lng: sp.coordinates?.lng ?? null } : undefined,
          createdAt: histEntry?.generatedAt ?? new Date(),
        });
        existingUnlocked.add(sessionId);
      }
    }

    if (toInsert.length > 0) {
      await AnalyticsEvent.insertMany(toInsert, { ordered: false });
    }

    const generated = toInsert.filter(e => e.type === 'report_generated').length;
    const unlocked  = toInsert.filter(e => e.type === 'report_unlocked').length;
    res.json({ ok: true, inserted: { report_generated: generated, report_unlocked: unlocked } });
  } catch (err) {
    next(err);
  }
});

export default router;
