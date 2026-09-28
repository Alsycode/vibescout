// FILE: src/routes/analyze.routes.js
// PURPOSE: Consumer analyze routes — start analysis, submit context, check status

import { Router } from 'express';
import crypto from 'crypto';
import ShadowProperty from '../models/ShadowProperty.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { assignCluster } from '../services/clusterService.js';
import { enqueuePipelineJob } from '../queues/pipelineQueue.js';
import { reverseGeocodeNominatim } from '../services/geocode.service.js';

const router = Router();

function generateSessionId() {
  return `vs_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function validateIndiaCoordinates(lat, lng) {
  return lat >= 6.5 && lat <= 37.6 && lng >= 68.1 && lng <= 97.4;
}

async function getCoordinatesFromPlaceId(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json`
    + `?place_id=${placeId}&fields=geometry,name,formatted_address`
    + `&key=${process.env.GOOGLE_PLACES_API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status !== 'OK') return null;
  return {
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
    name: data.result.name,
    formattedAddress: data.result.formatted_address,
  };
}

async function reverseGeocode(lat, lng) {
  const addr = (await reverseGeocodeNominatim(lat, lng)) ?? {};
  // Most-specific → broadest: neighbourhood/suburb → city/town → district/county
  const suburb = addr.suburb || addr.neighbourhood || addr.quarter || null;
  const city   = addr.city || addr.town || null;
  const county = addr.county || addr.state_district || null;
  const locationCascade = [suburb, city, county].filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i); // deduplicate
  return {
    displayName: addr.displayName ?? 'Selected location',
    cityName: city || suburb || county || null,
    locationCascade: locationCascade.length ? locationCascade : null,
  };
}

const VALID_BHK = ['1BHK', '2BHK', '3BHK', '4BHK+', 'Studio', 'Villa', 'Plot', 'PG'];
const VALID_FLOOR = ['Ground', '1–3', '4–7', '8–15', '16+', 'Top Floor', 'Unknown'];
const VALID_LISTING_TYPE = ['sale', 'rent'];
// The user enters only the exact amount; the bracket (used by the budget verdict,
// lead scoring and analytics) is derived from it. Each entry is [exclusive upper bound, label];
// an amount exactly on a boundary falls into the higher bracket.
const SALE_BRACKET_BOUNDS = [
  [3000000, 'Under 30L'], [6000000, '30L–60L'], [10000000, '60L–1Cr'], [15000000, '1Cr–1.5Cr'],
  [20000000, '1.5Cr–2Cr'], [30000000, '2Cr–3Cr'], [50000000, '3Cr–5Cr'], [Infinity, 'Above 5Cr'],
];
const RENT_BRACKET_BOUNDS = [
  [10000, 'Under 10K'], [20000, '10K–20K'], [35000, '20K–35K'], [50000, '35K–50K'],
  [75000, '50K–75K'], [100000, '75K–1L'], [Infinity, 'Above 1L'],
];

export function deriveBudgetBracket(listingType, amount) {
  const bounds = listingType === 'sale' ? SALE_BRACKET_BOUNDS : RENT_BRACKET_BOUNDS;
  return bounds.find(([upper]) => amount < upper)[1];
}

// POST /analyze/start
router.post('/start', requireAuth, async (req, res, next) => {
  try {
    const { placeId, lat: rawLat, lng: rawLng, name, confirmed } = req.body;

    if (confirmed !== true) {
      return res.status(400).json({ error: 'Location must be confirmed by user' });
    }

    let lat = parseFloat(rawLat);
    let lng = parseFloat(rawLng);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Valid lat and lng are required' });
    }

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Property name is required' });
    }

    if (!validateIndiaCoordinates(lat, lng)) {
      return res.status(400).json({ error: 'Coordinates must be within India' });
    }

    if (placeId) {
      const placeResult = await getCoordinatesFromPlaceId(placeId);
      if (placeResult) {
        lat = placeResult.lat;
        lng = placeResult.lng;
      }
    }

    const clusterId = await assignCluster(lat, lng);

    const sessionId = generateSessionId();

    const sp = await ShadowProperty.create({
      sessionId,
      userId: req.user.userId, // SEC-01 — binds this session to the creating account
      placeId: placeId ?? null,
      name,
      coordinates: { lat, lng },
      confirmedByUser: true,
      clusterId,
      status: 'fetching',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await User.findByIdAndUpdate(req.user.userId, {
      'preferences.sessionId': sessionId,
    });

    res.json({ sessionId, shadowPropertyId: sp._id });

    let cityName = name;
    let locationCascade = null;
    try {
      const geo = await reverseGeocode(lat, lng);
      if (geo.cityName) cityName = geo.cityName;
      if (geo.locationCascade) locationCascade = geo.locationCascade;
      await ShadowProperty.findByIdAndUpdate(sp._id, {
        location: { displayName: geo.displayName, cityName, locationCascade },
      });
    } catch {
      // fallback to name
    }

    // PERF-1 — enqueue instead of running inline. A worker process (worker.js)
    // drains this with bounded concurrency; retries + backoff are BullMQ's,
    // not ours. Enqueue failure (e.g. Redis down) is logged, matching the
    // fire-and-forget posture this replaces — the response was already sent.
    enqueuePipelineJob({
      shadowPropertyId: sp._id.toString(),
      sessionId,
      lat, lng, clusterId, cityName, locationCascade,
    }).catch(err => {
      console.error(`[Pipeline] Enqueue failed for session ${sessionId}:`, err.message);
    });
  } catch (err) {
    next(err);
  }
});

// POST /analyze/:sessionId/context
router.post('/:sessionId/context', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { actualAmount, bhk, floor, listingType, sqft } = req.body;

    if (!VALID_LISTING_TYPE.includes(listingType)) {
      return res.status(400).json({ error: 'Invalid listingType — must be sale or rent' });
    }

    if (!VALID_BHK.includes(bhk)) {
      return res.status(400).json({ error: 'Invalid bhk value' });
    }

    if (!VALID_FLOOR.includes(floor)) {
      return res.status(400).json({ error: 'Invalid floor value' });
    }

    const parsedAmount = Number(actualAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'actualAmount must be a positive number' });
    }
    const budgetBracket = deriveBudgetBracket(listingType, parsedAmount);

    // Built-up area (sqft) is required for sale so actualAmount can be normalized
    // to a per-sqft figure for the market-baseline comparison; not needed for rent.
    let parsedSqft = null;
    if (listingType === 'sale') {
      parsedSqft = Number(sqft);
      if (!Number.isFinite(parsedSqft) || parsedSqft <= 0) {
        return res.status(400).json({ error: 'sqft (built-up area) must be a positive number for sale listings' });
      }
    }

    const sp = await ShadowProperty.findOneAndUpdate(
      { sessionId, userId: req.user.userId }, // SEC-01 — an owner mismatch reads as not-found, not 403
      { userProvidedSpecs: { budgetBracket, actualAmount: parsedAmount, sqft: parsedSqft, bhk, floor, listingType } },
      { new: true }
    );

    if (!sp) {
      return res.status(404).json({ error: 'Session not found' });
    }

    await User.findByIdAndUpdate(req.user.userId, {
      'preferences.listingTypeContext': listingType,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /analyze/:sessionId/status
router.get('/:sessionId/status', async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const sp = await ShadowProperty.findOne({ sessionId });

    if (!sp) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ status: sp.status, dataSource: sp.dataSource });
  } catch (err) {
    next(err);
  }
});

export default router;
