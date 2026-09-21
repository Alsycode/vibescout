// FILE: src/routes/report.routes.js
// PURPOSE: Consumer report routes — generate report with GROQ + template fallback, retrieve by session or share token

import { Router } from 'express';
import crypto from 'crypto';
import ShadowProperty from '../models/ShadowProperty.js';
import User from '../models/User.js';
import Report from '../models/Report.js';
import Payment from '../models/Payment.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { redisGet, redisSet } from '../lib/redis.js';
import { computeAllVerdicts } from '../services/verdictEngine.service.js';
import { fetchCommuteRoute } from '../services/commute.service.js';
import { fetchResidentialComplexes } from '../services/places.service.js';
import { trackReportGenerated, trackFunnelAbandon } from '../services/analytics.service.js';
import { callGroq } from '../services/groq.service.js';
import { validateGroqOutput } from '../services/groqValidator.service.js';
import { buildTemplateReport, NEWS_TEMPLATES } from '../services/reportTemplates.service.js';
import { compareRentToBaseline } from '../services/baselineResolver.service.js';

const router = Router();

const INCOME_MIDPOINTS = {
  'Under 25K':  20000,
  '25K–50K':    37500,
  '50K–1L':     75000,
  '1L–2L':     150000,
  '2L–3L':     250000,
  'Above 3L':  350000,
};

const SALE_PRICE_MIDPOINTS = {
  'Under 30L':  2000000,
  '30L–60L':    4500000,
  '60L–1Cr':    8000000,
  '1Cr–1.5Cr': 12500000,
  '1.5Cr–2Cr': 17500000,
  '2Cr–3Cr':   25000000,
  '3Cr–5Cr':   40000000,
  'Above 5Cr':  65000000,
};

const RENT_MIDPOINTS = {
  'Under 10K':  7500,
  '10K–20K':   15000,
  '20K–35K':   27500,
  '35K–50K':   42500,
  '50K–75K':   62500,
  '75K–1L':    87500,
  'Above 1L':  125000,
};

const DOWN_PAYMENT_MIDPOINTS = {
  'Under 5L':    250000,
  '5L–10L':      750000,
  '10L–20L':    1500000,
  '20L–50L':    3500000,
  '50L–1Cr':    7500000,
  'Above 1Cr': 12500000,
};

export function computeFinancialScores(userProvidedSpecs, preferences, location) {
  const income = INCOME_MIDPOINTS[preferences.step7?.monthlyHouseholdIncome] ?? 75000;
  const listingType = userProvidedSpecs.listingType;
  const budgetBracket = userProvidedSpecs.budgetBracket;

  if (listingType === 'rent') {
    const rent = userProvidedSpecs.actualAmount ?? RENT_MIDPOINTS[budgetBracket] ?? 25000;
    const monthlyRentPercent = Math.round((rent / income) * 100);
    const rentStressFreeScore = Math.max(0, Math.min(100, Math.round(100 - (monthlyRentPercent / 60) * 100)));

    let rentBaseline = null;
    if (userProvidedSpecs.actualAmount) {
      rentBaseline = compareRentToBaseline({
        cityName: location?.cityName,
        suburb: location?.locationCascade?.[0],
        bhk: userProvidedSpecs.bhk,
        actualRent: userProvidedSpecs.actualAmount,
      });
    }

    return {
      monthlyRentPercent,
      rentStressFreeScore,
      monthlyIncome: income,
      estimatedRent: rent,
      // field names expected by RentalFitCard
      rentToIncomeRatio: monthlyRentPercent,
      annualRentBurden: `₹${(rent * 12).toLocaleString('en-IN')} / yr`,
      rentBaseline,
    };
  }

  const price = SALE_PRICE_MIDPOINTS[budgetBracket] ?? 8000000;
  // Use the user's actual down payment bracket instead of assuming a flat 20%.
  const rawDownPayment = DOWN_PAYMENT_MIDPOINTS[preferences.step7?.downPaymentBracket] ?? Math.round(price * 0.20);
  const downPayment = Math.min(rawDownPayment, price);
  const loan = Math.max(0, price - downPayment);
  const emi = loan * 0.009; // ~20yr @ ~8.5%
  const emiPercent = income > 0 ? Math.round((emi / income) * 100) : 0;
  const downPaymentPercent = Math.round((downPayment / price) * 100);
  const stressFreeScore = Math.max(0, Math.min(100, Math.round(100 - (emiPercent / 80) * 100)));
  return {
    // existing fields (kept for compatibility + GROQ fact sheet)
    emiPercent,
    stressFreeScore,
    monthlyIncome: income,
    estimatedEMI: Math.round(emi),
    propertyPrice: price,
    // consumed by FinancialCard — names must match the component
    affordabilityRatio: emiPercent,
    emiEstimate: `₹${Math.round(emi).toLocaleString('en-IN')}`,
    downPaymentPercent,
    downPayment,
    loanAmount: loan,
  };
}

// FAIL-02: Guard against incomplete funnel preferences before verdict computation
function validatePreferencesComplete(preferences) {
  const missing = [];
  if (!preferences?.step1?.wfhStatus) missing.push('step1 (commute)');
  if (!preferences?.step3?.noiseSensitivity || !preferences?.step3?.aqiSensitivity) missing.push('step3 (sensitivities)');
  if (!preferences?.step4?.facingDirection) missing.push('step4 (property details)');
  if (!Array.isArray(preferences?.step5?.amenityPriorities)) missing.push('step5 (amenity priorities)');
  if (!preferences?.step7?.monthlyHouseholdIncome) missing.push('step7 (income)');
  return missing;
}

// GET /report — list caller's reports (metadata only, no snapshot)
router.get('/', requireAuth, async (req, res, next) => {
  try {
    // PERF-4 — Report is its own collection now (was User.reportHistory[]);
    // "paid" comes from Payment (was User.unlockedReports[]) via one query
    // for the whole page rather than a per-report lookup.
    const [reportDocs, paidPayments] = await Promise.all([
      Report.find({ userId: req.user.userId })
        .select('sessionId listingType propertyName generatedAt shareToken')
        .sort({ generatedAt: -1 })
        .lean(),
      Payment.find({ userId: req.user.userId, status: 'paid' }).select('sessionId').lean(),
    ]);

    const paidSessionIds = new Set(paidPayments.map(p => p.sessionId));
    const reports = reportDocs.map(({ sessionId, listingType, propertyName, generatedAt, shareToken }) => ({
      sessionId,
      listingType,
      propertyName,
      generatedAt,
      shareToken,
      paid: paidSessionIds.has(sessionId),
    }));

    res.json({ reports });
  } catch (err) {
    next(err);
  }
});

// GET /report/generate
router.get('/generate', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId query parameter is required' });
    }

    const sp = await ShadowProperty.findOne({ sessionId, userId: req.user.userId }); // SEC-01

    if (!sp) {
      // PERF-4 — ShadowProperty has a 24h TTL; Report is the permanent record.
      const cached = await Report.findOne({ sessionId, userId: req.user.userId }).select('snapshot').lean();
      if (cached) {
        const paid = !!(await Payment.exists({ userId: req.user.userId, sessionId, status: 'paid' }));
        return res.json({ report: cached.snapshot, paid });
      }
      return res.status(404).json({ status: 'not_found' });
    }

    if (sp.status === 'fetching') {
      // RACE-01: TTL-based recovery — treat as failed if stuck for over 5 minutes
      const ageMs = Date.now() - new Date(sp.createdAt).getTime();
      if (ageMs > 5 * 60 * 1000) {
        return res.status(500).json({ status: 'failed', message: 'Intelligence fetch timed out. Please try again.' });
      }
      return res.json({ status: 'pending', retryAfter: 3 });
    }

    // RACE-01: Explicit failed status from pipeline
    if (sp.status === 'failed') {
      return res.status(500).json({ status: 'failed', message: 'Intelligence fetch failed. Please try again.' });
    }

    // SF-04 + RACE-02: Ensure property context is submitted before generating report
    if (!sp.userProvidedSpecs?.listingType || !sp.userProvidedSpecs?.budgetBracket) {
      return res.status(400).json({ status: 'incomplete', message: 'Property context (listing type and budget) not yet submitted.' });
    }

    // PERF-4 — only preferences is needed from User on this path now.
    const [user, paid] = await Promise.all([
      User.findById(req.user.userId).select('preferences'),
      Payment.exists({ userId: req.user.userId, sessionId, status: 'paid' }).then(Boolean),
    ]);

    const redisCached = await redisGet(`report:${sessionId}`);
    if (redisCached) {
      const parsed = typeof redisCached === 'string' ? JSON.parse(redisCached) : redisCached;
      return res.json({ report: parsed, paid });
    }

    const preferences = user.preferences;

    // FAIL-02: Validate all required preference steps before verdict computation
    const missingSteps = validatePreferencesComplete(preferences);
    if (missingSteps.length > 0) {
      // Infer last completed step from which keys are present
      const stepKeys = ['step1', 'step2', 'step3', 'step4', 'step5', 'step6', 'step7'];
      const lastDone = stepKeys.reduce((acc, k) => (preferences?.[k] ? parseInt(k.replace('step', ''), 10) : acc), 0);
      trackFunnelAbandon(req.user.userId, sessionId, lastDone);
      return res.status(400).json({ status: 'incomplete', message: `Funnel steps incomplete: ${missingSteps.join(', ')}` });
    }

    // Fetch real commute route via Google Directions — replaces Haversine estimate
    const wfhStatus  = preferences.step1?.wfhStatus;
    const workplaceLat = preferences.step1?.workplaceLat;
    const workplaceLng = preferences.step1?.workplaceLng;
    let commuteRoute = null;
    let nearbyComplexes = { items: [], count: 0, source: 'unavailable' };
    if (wfhStatus !== 'full-time' && workplaceLat && workplaceLng) {
      [commuteRoute, nearbyComplexes] = await Promise.all([
        fetchCommuteRoute(
          sp.coordinates.lat, sp.coordinates.lng,
          workplaceLat, workplaceLng,
          preferences.step1?.commuteMode,
        ),
        fetchResidentialComplexes(workplaceLat, workplaceLng),
      ]);
    }

    const verdictObject = computeAllVerdicts(sp, preferences, {
      realCommuteMins: commuteRoute?.durationMinutes ?? null,
    });
    const financialScores = computeFinancialScores(sp.userProvidedSpecs, preferences, sp.location);

    const factSheet = {
      ...verdictObject,
      ...financialScores,
      wfhStatus:           preferences.step1?.wfhStatus,
      facingDirection:     preferences.step4?.facingDirection,
      vastuPreference:     preferences.step4?.vastuPreference,
      communityPreference: preferences.step6?.communityPreference,
      listingType:         sp.userProvidedSpecs.listingType,
      newsHeadlines: sp.intelligence.localNews?.headlines?.map(h => h.title) ?? [],
      newsCount:     sp.intelligence.localNews?.headlines?.length ?? 0,
    };

    const groqRaw = await callGroq(factSheet, sp.userProvidedSpecs.listingType, preferences.step7?.investmentIntent);
    const groqLabels = validateGroqOutput(groqRaw, factSheet, sp.userProvidedSpecs.listingType)
      ?? buildTemplateReport(verdictObject, sp.userProvidedSpecs.listingType);

    const report = {
      sessionId,
      propertyName: sp.name,
      propertyLat: sp.coordinates?.lat ?? null,
      propertyLng: sp.coordinates?.lng ?? null,
      listingType: sp.userProvidedSpecs.listingType,
      bhk: sp.userProvidedSpecs.bhk ?? null,
      floor: sp.userProvidedSpecs.floor ?? null,
      generatedAt: new Date(),
      headline: verdictObject.headline,
      matchKeywords: groqLabels.matchKeywords,
      verdict: groqLabels.verdict,
      signals: {
        noise: {
          ...sp.intelligence.noise,
          estimatedDb: verdictObject.estimatedDb,        // floor-adjusted figure
          rawEstimatedDb: verdictObject.rawNoiseDb,
          category: verdictObject.floorNoiseReduction > 0
            ? `Floor-adjusted · ${verdictObject.floorBand}`
            : sp.intelligence.noise.category,
          verdict: verdictObject.noiseVerdict,
          label: groqLabels.noiseLabel,
        },
        aqi: {
          ...sp.intelligence.aqi,
          verdict: verdictObject.aqiVerdict,
          label: groqLabels.aqiLabel,
        },
        solar: {
          ...sp.intelligence.solar,
          verdict: verdictObject.solarVerdict,
          label: groqLabels.solarLabel,
        },
        amenities: {
          ...sp.intelligence.amenities,
          verdict: verdictObject.amenityVerdict,
          label: groqLabels.amenityLabel,
        },
        commute: {
          estimatedMins: verdictObject.estimatedCommuteMins,
          verdict: verdictObject.commuteVerdict,
          label: groqLabels.commuteLabel,
          polylinePoints: commuteRoute?.polylinePoints ?? null,
          propertyLat: sp.coordinates?.lat ?? null,
          propertyLng: sp.coordinates?.lng ?? null,
          workplaceLat: workplaceLat ?? null,
          workplaceLng: workplaceLng ?? null,
        },
        nearbyComplexes: {
          ...nearbyComplexes,
          workplaceLat: workplaceLat ?? null,
          workplaceLng: workplaceLng ?? null,
        },
        budget: {
          bracket: sp.userProvidedSpecs.budgetBracket,
          verdict: verdictObject.budgetVerdict,
          label: groqLabels.budgetLabel,
        },
        localNews: {
          ...sp.intelligence.localNews,
          label: groqLabels.newsLabel
            ?? (sp.intelligence.localNews?.headlines?.length
              ? NEWS_TEMPLATES.has_headlines(sp.intelligence.localNews.headlines.length)
              : NEWS_TEMPLATES.no_headlines()),
        },
        vastu: {
          facingDirection: preferences.step4?.facingDirection ?? null,
          vastuPreference: preferences.step4?.vastuPreference ?? null,
          verdict:         verdictObject.vastuVerdict,
          label:           groqLabels.vastuLabel,
        },
        community: {
          derivedCharacter: verdictObject.derivedCharacter,
          userPreference:   preferences.step6?.communityPreference ?? null,
          verdict:          verdictObject.communityMatchVerdict,
          label:            groqLabels.communityLabel,
          counts:           verdictObject.communityAmenityCounts,
        },
        derivedSignals: {
          livabilityIndex:        sp.intelligence.livabilityIndex        ?? null,
          maturityScore:          sp.intelligence.maturityScore          ?? null,
          solarSavings:           sp.intelligence.solarSavings           ?? null,
          infrastructureMomentum: sp.intelligence.infrastructureMomentum ?? null,
          landHistory:            sp.intelligence.landHistory            ?? null,
          terrain:                sp.intelligence.terrain                ?? null,
        },
      },
      financial: financialScores,
      financialNote: sp.userProvidedSpecs.listingType === 'sale'
        ? groqLabels.financialNote
        : groqLabels.rentalNote,
      dataSource: sp.dataSource,
      summary: {
        totalRedFlags: verdictObject.totalRedFlags,
        totalCautions: verdictObject.totalCautions,
        totalPasses: verdictObject.totalPasses,
      },
    };

    // RACE-03: unique index on Report.sessionId is the duplicate guard now —
    // a concurrent/duplicate /generate for the same session hits E11000
    // instead of racing an array push; fetch the winner's shareToken either way.
    const shareToken = crypto.randomBytes(16).toString('hex');
    let finalShareToken = shareToken;

    try {
      await Report.create({
        userId: req.user.userId,
        sessionId,
        listingType: sp.userProvidedSpecs.listingType,
        propertyName: sp.name,
        snapshot: report,
        shareToken,
        generatedAt: new Date(),
      });
    } catch (err) {
      if (err.code !== 11000) throw err;
      const existing = await Report.findOne({ sessionId, userId: req.user.userId }).select('shareToken').lean();
      finalShareToken = existing?.shareToken ?? shareToken;
    }

    trackReportGenerated(req.user.userId, sessionId, {
      listingType: sp.userProvidedSpecs.listingType,
      budgetBracket: sp.userProvidedSpecs.budgetBracket,
      bhk: sp.userProvidedSpecs.bhk ?? null,
      location: {
        suburb: sp.name ?? null,
        city: null,
        lat: sp.coordinates?.lat ?? null,
        lng: sp.coordinates?.lng ?? null,
      },
      verdictObject,
    });

    await redisSet(`report:${sessionId}`, JSON.stringify(report), 604800);

    res.json({ report, shareToken: finalShareToken, paid });
  } catch (err) {
    next(err);
  }
});

// GET /report/:sessionId
router.get('/:sessionId', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { share } = req.query;

    if (share && typeof share !== 'string') {
      return res.status(400).json({ error: 'Invalid share token' });
    }

    if (share) {
      // PERF-4 — no need to find the owning User first; Report is keyed
      // directly by sessionId+shareToken now.
      const entry = await Report.findOne({ sessionId, shareToken: share }).select('snapshot').lean();
      if (!entry) {
        return res.status(403).json({ error: 'Invalid share token' });
      }
      return res.json({ report: entry.snapshot, readonly: true });
    }

    // SEC-04 — vb_session (httpOnly) is the current cookie; vb_token is kept
    // as a fallback only so sessions issued before that change don't get
    // logged out early (it's still signature-verified below, same as
    // auth.middleware.js's requireAuth). See SEC-17 for folding this route
    // onto the shared requireAuth middleware.
    const sessionToken = req.cookies?.vb_session ?? req.cookies?.vb_token;
    if (!sessionToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { verifyToken } = await import('../services/token.service.js');
    const decoded = verifyToken(sessionToken);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // PERF-4 — user-existence check kept for the same "account was deleted"
    // 401 this route always gave; Report itself is looked up separately
    // (already implicitly scoped to decoded.userId — a cross-user sessionId
    // just won't match and 404s, same IDOR posture as SEC-01's other fixes).
    const [user, entry] = await Promise.all([
      User.findById(decoded.userId).select('_id').lean(),
      Report.findOne({ sessionId, userId: decoded.userId }).select('snapshot shareToken').lean(),
    ]);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    if (!entry) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const paid = !!(await Payment.exists({ userId: decoded.userId, sessionId, status: 'paid' }));
    res.json({ report: entry.snapshot, shareToken: entry.shareToken, paid });
  } catch (err) {
    next(err);
  }
});

export default router;
