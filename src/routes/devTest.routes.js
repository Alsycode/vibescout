// FILE: src/routes/devTest.routes.js
// PURPOSE: Dev-only route to seed a full test report without going through the UI funnel.
//          Gated by DEV_UNLOCK=true env var — always 403 in production.
//          Does NOT touch the existing funnel, analyze, or report routes.

import { Router } from 'express';
import crypto from 'crypto';
import ShadowProperty from '../models/ShadowProperty.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { assignCluster } from '../services/clusterService.js';
import { runPipeline } from '../services/intelligencePipeline.service.js';
import { computeAllVerdicts } from '../services/verdictEngine.service.js';
import { fetchCommuteRoute } from '../services/commute.service.js';
import { callGroq } from '../services/groq.service.js';
import { validateGroqOutput } from '../services/groqValidator.service.js';
import { buildTemplateReport, NEWS_TEMPLATES } from '../services/reportTemplates.service.js';
import { redisSet } from '../lib/redis.js';

const router = Router();

// ── Gate: all routes in this file require DEV_UNLOCK ─────────────────────────

router.use((req, res, next) => {
  if (process.env.DEV_UNLOCK !== 'true') {
    return res.status(403).json({ error: 'Dev unlock not enabled.' });
  }
  next();
});

// ── Default test data (Koramangala, Bangalore) ────────────────────────────────

const DEFAULTS = {
  lat:              12.9352,
  lng:              77.6245,
  propertyName:     'Koramangala, Bangalore',
  cityName:         'Bengaluru',
  locationCascade:  ['Koramangala', 'Bengaluru'],
  listingType:      'sale',
  budgetBracket:    '60L–1Cr',
  bhk:              '2BHK',
  floor:            '4–7',
};

const TEST_PREFERENCES = {
  step1: {
    wfhStatus:          'hybrid',
    workplaceLat:       12.9716,
    workplaceLng:       77.5946,
    commuteMode:        'driving',
    maxCommuteMinutes:  30,
    workplaceCity:      'Bengaluru',
  },
  step2: { confirmed: true },
  step3: { noiseSensitivity: 'moderate', aqiSensitivity: 'moderate' },
  step4: { facingDirection: 'East', vastuPreference: 'No' },
  step5: { amenityPriorities: ['schools', 'parks', 'cafes'] },
  step6: { communityPreference: 'family' },
  step7: {
    monthlyHouseholdIncome: '1L–2L',
    downPaymentBracket:     '20L–50L',
    investmentIntent:       'primary',
  },
};

// ── Financial scoring (mirrors report.routes.js) ──────────────────────────────

const INCOME_MIDPOINTS = {
  'Under 25K':  20000,  '25K–50K':  37500,  '50K–1L':   75000,
  '1L–2L':     150000,  '2L–3L':   250000,  'Above 3L': 350000,
};
const SALE_PRICE_MIDPOINTS = {
  'Under 30L':   2000000, '30L–60L':  4500000, '60L–1Cr':   8000000,
  '1Cr–1.5Cr': 12500000, '1.5Cr–2Cr': 17500000, '2Cr–3Cr': 25000000,
  '3Cr–5Cr':   40000000, 'Above 5Cr': 65000000,
};
const RENT_MIDPOINTS = {
  'Under 10K':  7500, '10K–20K': 15000, '20K–35K': 27500,
  '35K–50K':  42500, '50K–75K': 62500, '75K–1L':  87500, 'Above 1L': 125000,
};
const DOWN_PAYMENT_MIDPOINTS = {
  'Under 5L':  250000, '5L–10L':  750000, '10L–20L': 1500000,
  '20L–50L': 3500000, '50L–1Cr': 7500000, 'Above 1Cr': 12500000,
};

function computeFinancialScores(userProvidedSpecs, preferences) {
  const income        = INCOME_MIDPOINTS[preferences.step7?.monthlyHouseholdIncome] ?? 75000;
  const listingType   = userProvidedSpecs.listingType;
  const budgetBracket = userProvidedSpecs.budgetBracket;

  if (listingType === 'rent') {
    const rent                = RENT_MIDPOINTS[budgetBracket] ?? 25000;
    const monthlyRentPercent  = Math.round((rent / income) * 100);
    const rentStressFreeScore = Math.max(0, Math.min(100, Math.round(100 - (monthlyRentPercent / 60) * 100)));
    return {
      monthlyRentPercent, rentStressFreeScore,
      monthlyIncome: income, estimatedRent: rent,
      rentToIncomeRatio: monthlyRentPercent,
      annualRentBurden: `₹${(rent * 12).toLocaleString('en-IN')} / yr`,
    };
  }

  const price            = SALE_PRICE_MIDPOINTS[budgetBracket] ?? 8000000;
  const rawDownPayment   = DOWN_PAYMENT_MIDPOINTS[preferences.step7?.downPaymentBracket] ?? Math.round(price * 0.20);
  const downPayment      = Math.min(rawDownPayment, price);
  const loan             = Math.max(0, price - downPayment);
  const emi              = loan * 0.009;
  const emiPercent       = income > 0 ? Math.round((emi / income) * 100) : 0;
  const downPaymentPercent = Math.round((downPayment / price) * 100);
  const stressFreeScore  = Math.max(0, Math.min(100, Math.round(100 - (emiPercent / 80) * 100)));
  return {
    emiPercent, stressFreeScore,
    monthlyIncome: income, estimatedEMI: Math.round(emi), propertyPrice: price,
    affordabilityRatio: emiPercent,
    emiEstimate: `₹${Math.round(emi).toLocaleString('en-IN')}`,
    downPaymentPercent, downPayment, loanAmount: loan,
  };
}

// ── POST /dev/seed-report ─────────────────────────────────────────────────────
// Body (all optional — defaults to Koramangala):
//   lat, lng, propertyName, cityName
//   listingType, budgetBracket, bhk, floor
//   preferences (partial — merged over TEST_PREFERENCES)

router.post('/seed-report', requireAuth, async (req, res, next) => {
  try {
    const body = req.body ?? {};

    // Merge body params over defaults
    const lat            = parseFloat(body.lat)            || DEFAULTS.lat;
    const lng            = parseFloat(body.lng)            || DEFAULTS.lng;
    const propertyName   = body.propertyName               || DEFAULTS.propertyName;
    const cityName       = body.cityName                   || DEFAULTS.cityName;
    const locationCascade = body.locationCascade           || DEFAULTS.locationCascade;
    const listingType    = body.listingType                || DEFAULTS.listingType;
    const budgetBracket  = body.budgetBracket              || DEFAULTS.budgetBracket;
    const bhk            = body.bhk                        || DEFAULTS.bhk;
    const floor          = body.floor                      || DEFAULTS.floor;

    // Merge user-supplied preferences over test defaults
    const preferences = {
      ...TEST_PREFERENCES,
      ...(body.preferences ?? {}),
      step1: { ...TEST_PREFERENCES.step1, ...(body.preferences?.step1 ?? {}) },
      step3: { ...TEST_PREFERENCES.step3, ...(body.preferences?.step3 ?? {}) },
      step4: { ...TEST_PREFERENCES.step4, ...(body.preferences?.step4 ?? {}) },
      step5: { ...TEST_PREFERENCES.step5, ...(body.preferences?.step5 ?? {}) },
      step6: { ...TEST_PREFERENCES.step6, ...(body.preferences?.step6 ?? {}) },
      step7: { ...TEST_PREFERENCES.step7, ...(body.preferences?.step7 ?? {}) },
    };

    // ── 1. Assign cluster ───────────────────────────────────────────────────
    const clusterId = await assignCluster(lat, lng);
    const sessionId = `vs_dev_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // ── 2. Create ShadowProperty ────────────────────────────────────────────
    const sp = await ShadowProperty.create({
      sessionId,
      name: propertyName,
      coordinates: { lat, lng },
      confirmedByUser: true,
      clusterId,
      userProvidedSpecs: { budgetBracket, bhk, floor, listingType },
      status: 'fetching',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // ── 3. Run intelligence pipeline (awaited — dev is OK with the wait) ────
    console.log(`[DevTest] Running pipeline for session ${sessionId}…`);
    await runPipeline(sp._id, lat, lng, clusterId, cityName, locationCascade);
    console.log(`[DevTest] Pipeline complete for session ${sessionId}`);

    // ── 4. Re-fetch SP with pipeline results ────────────────────────────────
    const freshSP = await ShadowProperty.findById(sp._id);
    if (!freshSP || freshSP.status !== 'completed') {
      return res.status(500).json({ error: 'Pipeline did not complete successfully.' });
    }

    // ── 5. Fetch commute route ───────────────────────────────────────────────
    const workplaceLat = preferences.step1?.workplaceLat;
    const workplaceLng = preferences.step1?.workplaceLng;
    let commuteRoute   = null;
    if (preferences.step1?.wfhStatus !== 'full-time' && workplaceLat && workplaceLng) {
      commuteRoute = await fetchCommuteRoute(
        lat, lng, workplaceLat, workplaceLng,
        preferences.step1?.commuteMode,
      );
    }

    // ── 6. Compute verdicts + financial scores ───────────────────────────────
    const verdictObject   = computeAllVerdicts(freshSP, preferences, {
      realCommuteMins: commuteRoute?.durationMinutes ?? null,
    });
    const financialScores = computeFinancialScores({ budgetBracket, bhk, floor, listingType }, preferences);

    // ── 7. Call Groq for labels ──────────────────────────────────────────────
    const factSheet = {
      ...verdictObject, ...financialScores,
      wfhStatus:           preferences.step1?.wfhStatus,
      facingDirection:     preferences.step4?.facingDirection,
      vastuPreference:     preferences.step4?.vastuPreference,
      communityPreference: preferences.step6?.communityPreference,
      listingType,
      newsHeadlines: freshSP.intelligence.localNews?.headlines?.map(h => h.title) ?? [],
      newsCount:     freshSP.intelligence.localNews?.headlines?.length ?? 0,
    };

    const groqRaw    = await callGroq(factSheet, listingType, preferences.step7?.investmentIntent);
    const groqLabels = validateGroqOutput(groqRaw, factSheet, listingType)
      ?? buildTemplateReport(verdictObject, listingType);

    // ── 8. Build report object ───────────────────────────────────────────────
    // Spread amenities as plain objects so lat/lng are preserved in the response
    const amenitiesRaw = freshSP.intelligence.amenities?.toObject
      ? freshSP.intelligence.amenities.toObject()
      : freshSP.intelligence.amenities;

    const report = {
      sessionId,
      propertyName,
      propertyLat:  lat,
      propertyLng:  lng,
      listingType,
      bhk,
      floor,
      generatedAt:  new Date(),
      headline:     verdictObject.headline,
      matchKeywords: groqLabels.matchKeywords,
      verdict:      groqLabels.verdict,
      signals: {
        noise: {
          ...freshSP.intelligence.noise?.toObject?.() ?? freshSP.intelligence.noise,
          estimatedDb:    verdictObject.estimatedDb,
          rawEstimatedDb: verdictObject.rawNoiseDb,
          category:       verdictObject.floorNoiseReduction > 0
            ? `Floor-adjusted · ${verdictObject.floorBand}`
            : freshSP.intelligence.noise?.category,
          verdict: verdictObject.noiseVerdict,
          label:   groqLabels.noiseLabel,
        },
        aqi: {
          ...freshSP.intelligence.aqi?.toObject?.() ?? freshSP.intelligence.aqi,
          verdict: verdictObject.aqiVerdict,
          label:   groqLabels.aqiLabel,
        },
        solar: {
          ...freshSP.intelligence.solar?.toObject?.() ?? freshSP.intelligence.solar,
          verdict: verdictObject.solarVerdict,
          label:   groqLabels.solarLabel,
        },
        amenities: {
          ...amenitiesRaw,
          verdict: verdictObject.amenityVerdict,
          label:   groqLabels.amenityLabel,
        },
        commute: {
          estimatedMins:  verdictObject.estimatedCommuteMins,
          verdict:        verdictObject.commuteVerdict,
          label:          groqLabels.commuteLabel,
          polylinePoints: commuteRoute?.polylinePoints ?? null,
          propertyLat:    lat,
          propertyLng:    lng,
          workplaceLat:   workplaceLat ?? null,
          workplaceLng:   workplaceLng ?? null,
        },
        budget: {
          bracket: budgetBracket,
          verdict: verdictObject.budgetVerdict,
          label:   groqLabels.budgetLabel,
        },
        localNews: {
          ...freshSP.intelligence.localNews?.toObject?.() ?? freshSP.intelligence.localNews,
          label: groqLabels.newsLabel
            ?? (freshSP.intelligence.localNews?.headlines?.length
              ? NEWS_TEMPLATES.has_headlines(freshSP.intelligence.localNews.headlines.length)
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
      },
      financial:     financialScores,
      financialNote: listingType === 'sale' ? groqLabels.financialNote : groqLabels.rentalNote,
      dataSource:    freshSP.dataSource,
      summary: {
        totalRedFlags: verdictObject.totalRedFlags,
        totalCautions: verdictObject.totalCautions,
        totalPasses:   verdictObject.totalPasses,
      },
    };

    // ── 9. Save to user reportHistory + Redis ───────────────────────────────
    const shareToken = crypto.randomBytes(16).toString('hex');
    const user = await User.findById(req.user.userId);

    await User.updateOne(
      { _id: req.user.userId, 'reportHistory.sessionId': { $ne: sessionId } },
      {
        $push: {
          reportHistory: {
            sessionId,
            listingType,
            propertyName,
            reportSnapshot: report,
            shareToken,
            generatedAt: new Date(),
          },
        },
        $addToSet: { unlockedReports: sessionId },
      },
    );

    await redisSet(`report:${sessionId}`, JSON.stringify(report), 604800);

    console.log(`[DevTest] Report ready — sessionId: ${sessionId}`);

    res.json({
      ok:          true,
      sessionId,
      shareToken,
      propertyName,
      amenitySample: {
        schools: (amenitiesRaw?.schools ?? []).slice(0, 2).map(p => ({
          name: p.name, distanceM: p.distanceM, lat: p.lat, lng: p.lng,
        })),
        parks: (amenitiesRaw?.parks ?? []).slice(0, 2).map(p => ({
          name: p.name, distanceM: p.distanceM, lat: p.lat, lng: p.lng,
        })),
      },
    });
  } catch (err) {
    console.error('[DevTest] seed-report error:', err);
    next(err);
  }
});

export default router;
