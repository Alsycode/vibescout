// FILE: src/routes/report.routes.js
// PURPOSE: Consumer report routes — generate report with GROQ + template fallback, retrieve by session or share token

import { Router } from 'express';
import crypto from 'crypto';
import ShadowProperty from '../models/ShadowProperty.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { redisGet, redisSet } from '../lib/redis.js';
import { computeAllVerdicts } from '../services/verdictEngine.service.js';
import { fetchCommuteRoute } from '../services/commute.service.js';
import { trackReportGenerated, trackFunnelAbandon } from '../services/analytics.service.js';
import { callGroq } from '../services/groq.service.js';
import { validateGroqOutput } from '../services/groqValidator.service.js';
import { buildTemplateReport, NEWS_TEMPLATES } from '../services/reportTemplates.service.js';

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

function computeFinancialScores(userProvidedSpecs, preferences) {
  const income = INCOME_MIDPOINTS[preferences.step7?.monthlyHouseholdIncome] ?? 75000;
  const listingType = userProvidedSpecs.listingType;
  const budgetBracket = userProvidedSpecs.budgetBracket;

  if (listingType === 'rent') {
    const rent = RENT_MIDPOINTS[budgetBracket] ?? 25000;
    const monthlyRentPercent = Math.round((rent / income) * 100);
    const rentStressFreeScore = Math.max(0, Math.min(100, Math.round(100 - (monthlyRentPercent / 60) * 100)));
    return {
      monthlyRentPercent,
      rentStressFreeScore,
      monthlyIncome: income,
      estimatedRent: rent,
      // field names expected by RentalFitCard
      rentToIncomeRatio: monthlyRentPercent,
      annualRentBurden: `₹${(rent * 12).toLocaleString('en-IN')} / yr`,
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
    const user = await User.findById(req.user.userId).select('reportHistory unlockedReports');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const reports = (user.reportHistory ?? [])
      .map(({ sessionId, listingType, propertyName, generatedAt, shareToken }) => ({
        sessionId,
        listingType,
        propertyName,
        generatedAt,
        shareToken,
        paid: user.unlockedReports?.includes(sessionId) ?? false,
      }))
      .sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));

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

    const sp = await ShadowProperty.findOne({ sessionId });

    if (!sp) {
      const user = await User.findById(req.user.userId);
      const cached = user?.reportHistory?.find(r => r.sessionId === sessionId);
      if (cached) {
        const paid = user?.unlockedReports?.includes(sessionId) ?? false;
        return res.json({ report: cached.reportSnapshot, paid });
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

    const user = await User.findById(req.user.userId);
    const paid = user?.unlockedReports?.includes(sessionId) ?? false;

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
    if (wfhStatus !== 'full-time' && workplaceLat && workplaceLng) {
      commuteRoute = await fetchCommuteRoute(
        sp.coordinates.lat, sp.coordinates.lng,
        workplaceLat, workplaceLng,
        preferences.step1?.commuteMode,
      );
    }

    const verdictObject = computeAllVerdicts(sp, preferences, {
      realCommuteMins: commuteRoute?.durationMinutes ?? null,
    });
    const financialScores = computeFinancialScores(sp.userProvidedSpecs, preferences);

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

    // RACE-03: Atomic push with duplicate guard — only push if sessionId not already in reportHistory
    const shareToken = crypto.randomBytes(16).toString('hex');

    const updateResult = await User.updateOne(
      { _id: req.user.userId, 'reportHistory.sessionId': { $ne: sessionId } },
      {
        $push: {
          reportHistory: {
            sessionId,
            listingType: sp.userProvidedSpecs.listingType,
            propertyName: sp.name,
            reportSnapshot: report,
            shareToken,
            generatedAt: new Date(),
          },
        },
      },
    );

    // If duplicate suppressed (modifiedCount === 0), fetch existing entry's shareToken
    let finalShareToken = shareToken;
    if (updateResult.modifiedCount === 0) {
      const existingUser = await User.findById(req.user.userId);
      const existingEntry = existingUser?.reportHistory?.find(r => r.sessionId === sessionId);
      finalShareToken = existingEntry?.shareToken ?? shareToken;
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

    if (share) {
      const owner = await User.findOne({
        'reportHistory.sessionId': sessionId,
        'reportHistory.shareToken': share,
      });
      if (!owner) {
        return res.status(403).json({ error: 'Invalid share token' });
      }
      const entry = owner.reportHistory.find(r => r.sessionId === sessionId);
      return res.json({ report: entry.reportSnapshot, readonly: true });
    }

    if (!req.cookies?.vb_token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { verifyToken } = await import('../services/token.service.js');
    const decoded = verifyToken(req.cookies.vb_token);
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    const entry = user.reportHistory.find(r => r.sessionId === sessionId);
    if (!entry) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const paid = user.unlockedReports?.includes(sessionId) ?? false;
    res.json({ report: entry.reportSnapshot, shareToken: entry.shareToken, paid });
  } catch (err) {
    next(err);
  }
});

export default router;
