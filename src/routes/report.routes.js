// FILE: src/routes/report.routes.js
// PURPOSE: Consumer report routes — generate report with GROQ + template fallback, retrieve by session or share token

import { Router } from 'express';
import crypto from 'crypto';
import ShadowProperty from '../models/ShadowProperty.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { redisGet, redisSet } from '../lib/redis.js';
import { computeAllVerdicts } from '../services/verdictEngine.service.js';
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
    };
  }

  const price = SALE_PRICE_MIDPOINTS[budgetBracket] ?? 8000000;
  const emi = price * 0.80 * 0.009;
  const emiPercent = Math.round((emi / income) * 100);
  const stressFreeScore = Math.max(0, Math.min(100, Math.round(100 - (emiPercent / 80) * 100)));
  return {
    emiPercent,
    stressFreeScore,
    monthlyIncome: income,
    estimatedEMI: Math.round(emi),
    propertyPrice: price,
  };
}

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
      return res.json({ status: 'pending', retryAfter: 3 });
    }

    const user = await User.findById(req.user.userId);
    const paid = user?.unlockedReports?.includes(sessionId) ?? false;

    const redisCached = await redisGet(`report:${sessionId}`);
    if (redisCached) {
      const parsed = typeof redisCached === 'string' ? JSON.parse(redisCached) : redisCached;
      return res.json({ report: parsed, paid });
    }

    const preferences = user.preferences;

    const verdictObject = computeAllVerdicts(sp, preferences);
    const financialScores = computeFinancialScores(sp.userProvidedSpecs, preferences);

    const factSheet = {
      ...verdictObject,
      ...financialScores,
      wfhStatus: preferences.step1?.wfhStatus,
      facingDirection: preferences.step4?.facingDirection,
      listingType: sp.userProvidedSpecs.listingType,
      newsHeadlines: sp.intelligence.localNews?.headlines?.map(h => h.title) ?? [],
      newsCount: sp.intelligence.localNews?.headlines?.length ?? 0,
    };

    const groqRaw = await callGroq(factSheet, sp.userProvidedSpecs.listingType);
    const groqLabels = validateGroqOutput(groqRaw, factSheet, sp.userProvidedSpecs.listingType)
      ?? buildTemplateReport(verdictObject, sp.userProvidedSpecs.listingType);

    const report = {
      sessionId,
      propertyName: sp.name,
      listingType: sp.userProvidedSpecs.listingType,
      generatedAt: new Date(),
      headline: verdictObject.headline,
      matchKeywords: groqLabels.matchKeywords,
      verdict: groqLabels.verdict,
      signals: {
        noise: {
          ...sp.intelligence.noise,
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

    const shareToken = crypto.randomBytes(16).toString('hex');

    await User.findByIdAndUpdate(req.user.userId, {
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
    });

    await redisSet(`report:${sessionId}`, JSON.stringify(report), 604800);

    res.json({ report, shareToken, paid });
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

    res.json({ report: entry.reportSnapshot, shareToken: entry.shareToken });
  } catch (err) {
    next(err);
  }
});

export default router;
