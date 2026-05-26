// FILE: src/routes/analyze.routes.js
// PURPOSE: Consumer analyze routes — start analysis, submit context, check status

import { Router } from 'express';
import crypto from 'crypto';
import ShadowProperty from '../models/ShadowProperty.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { assignCluster } from '../services/clusterService.js';
import { runPipeline } from '../services/intelligencePipeline.service.js';

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
  const url = `https://nominatim.openstreetmap.org/reverse`
    + `?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Vibescout/1.0' } });
  const data = await res.json();
  return { displayName: data.display_name ?? 'Selected location' };
}

const VALID_BHK = ['1BHK', '2BHK', '3BHK', '4BHK+', 'Studio', 'Villa', 'Plot', 'PG'];
const VALID_FLOOR = ['Ground', '1–3', '4–7', '8–15', '16+', 'Top Floor', 'Unknown'];
const VALID_LISTING_TYPE = ['sale', 'rent'];
const VALID_SALE_BRACKETS = [
  'Under 30L', '30L–60L', '60L–1Cr', '1Cr–1.5Cr',
  '1.5Cr–2Cr', '2Cr–3Cr', '3Cr–5Cr', 'Above 5Cr',
];
const VALID_RENT_BRACKETS = [
  'Under 10K', '10K–20K', '20K–35K', '35K–50K',
  '50K–75K', '75K–1L', 'Above 1L',
];

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
    try {
      const geo = await reverseGeocode(lat, lng);
      if (geo.displayName && geo.displayName !== 'Selected location') {
        const parts = geo.displayName.split(',').map(p => p.trim());
        cityName = parts.find(p => p.length > 2 && !p.match(/^\d/)) || name;
      }
    } catch {
      // fallback to name
    }

    runPipeline(sp._id, lat, lng, clusterId, cityName).catch(err => {
      console.error(`[Pipeline] Error for session ${sessionId}:`, err.message);
    });
  } catch (err) {
    next(err);
  }
});

// POST /analyze/:sessionId/context
router.post('/:sessionId/context', requireAuth, async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { budgetBracket, bhk, floor, listingType } = req.body;

    if (!VALID_LISTING_TYPE.includes(listingType)) {
      return res.status(400).json({ error: 'Invalid listingType — must be sale or rent' });
    }

    if (!VALID_BHK.includes(bhk)) {
      return res.status(400).json({ error: 'Invalid bhk value' });
    }

    if (!VALID_FLOOR.includes(floor)) {
      return res.status(400).json({ error: 'Invalid floor value' });
    }

    const validBrackets = listingType === 'sale' ? VALID_SALE_BRACKETS : VALID_RENT_BRACKETS;
    if (!validBrackets.includes(budgetBracket)) {
      return res.status(400).json({ error: 'Invalid budgetBracket for selected listingType' });
    }

    const sp = await ShadowProperty.findOneAndUpdate(
      { sessionId },
      { userProvidedSpecs: { budgetBracket, bhk, floor, listingType } },
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
