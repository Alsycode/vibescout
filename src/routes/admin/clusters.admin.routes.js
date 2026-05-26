// FILE: src/routes/admin/clusters.admin.routes.js
// PURPOSE: Admin cluster routes — list with freshness info, stale filter, manual signal refresh

import { Router } from 'express';
import Cluster from '../../models/Cluster.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware.js';
import { redisSet } from '../../lib/redis.js';
import { fetchAQI } from '../../services/aqi.service.js';
import { fetchNoise } from '../../services/noise.service.js';
import { fetchSolar } from '../../services/solar.service.js';
import { fetchWeather } from '../../services/weather.service.js';
import { fetchAmenities } from '../../services/places.service.js';

const router = Router();

router.use(requireAuth, requireAdmin);

// TTL thresholds in seconds per signal type (mirrors cron job expectations)
const SIGNAL_TTL = {
  aqi:       86400,   // 1 day
  weather:   86400,   // 1 day
  solar:     86400,   // 1 day
  noise:     604800,  // 7 days
  amenities: 1296000, // 15 days
};

function computeFreshness(cluster) {
  const now = Date.now();

  const signals = {
    aqi:       cluster.cachedAQI?.updatedAt,
    weather:   cluster.cachedWeather?.updatedAt,
    solar:     cluster.cachedSolar?.updatedAt,
    noise:     cluster.cachedNoise?.updatedAt,
    amenities: cluster.cachedAmenities?.updatedAt,
  };

  const statuses = {};
  let staleCount = 0;

  for (const [key, updatedAt] of Object.entries(signals)) {
    if (!updatedAt) {
      statuses[key] = 'cold';
      staleCount++;
      continue;
    }
    const ageSeconds = (now - new Date(updatedAt).getTime()) / 1000;
    if (ageSeconds > SIGNAL_TTL[key] * 2) {
      statuses[key] = 'cold';
      staleCount++;
    } else if (ageSeconds > SIGNAL_TTL[key]) {
      statuses[key] = 'stale';
      staleCount++;
    } else {
      statuses[key] = 'fresh';
    }
  }

  return { statuses, staleCount };
}

// GET /admin/clusters — all clusters with freshness info
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [clusters, total] = await Promise.all([
      Cluster.find({})
        .sort({ lastSearchedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .select('-__v'),
      Cluster.countDocuments(),
    ]);

    const data = clusters.map(c => ({
      ...c.toObject(),
      freshness: computeFreshness(c),
    }));

    res.json({ data, total, page: parseInt(page, 10), pages: Math.ceil(total / parseInt(limit, 10)) });
  } catch (err) {
    next(err);
  }
});

// GET /admin/clusters/stale — only stale clusters
router.get('/stale', async (req, res, next) => {
  try {
    const clusters = await Cluster.find({}).select('-__v');

    const stale = clusters
      .map(c => ({ ...c.toObject(), freshness: computeFreshness(c) }))
      .filter(c => c.freshness.staleCount > 0);

    res.json({ data: stale, total: stale.length });
  } catch (err) {
    next(err);
  }
});

// POST /admin/clusters/:id/refresh — trigger manual signal refresh
// Query: ?types=aqi,noise,solar,weather,amenities (comma-separated, all if omitted)
router.post('/:id/refresh', async (req, res, next) => {
  try {
    const cluster = await Cluster.findById(req.params.id);
    if (!cluster) return res.status(404).json({ error: 'Cluster not found' });

    const ALL_TYPES = ['aqi', 'weather', 'solar', 'noise', 'amenities'];
    const typesParam = req.query.types;
    const types = typesParam
      ? typesParam.split(',').map(t => t.trim()).filter(t => ALL_TYPES.includes(t))
      : ALL_TYPES;

    if (types.length === 0) {
      return res.status(400).json({ error: 'No valid signal types specified' });
    }

    const { centroidLat: lat, centroidLng: lng, clusterId } = cluster;
    const updates = {};
    const refreshed = [];
    const failed = [];

    await Promise.all(types.map(async (type) => {
      try {
        switch (type) {
          case 'aqi': {
            const data = await fetchAQI(lat, lng, clusterId, null);
            if (data) {
              updates.cachedAQI = { ...data, updatedAt: new Date() };
              await redisSet(`cluster:${clusterId}:AQI`, JSON.stringify(data), 86400);
              refreshed.push('aqi');
            }
            break;
          }
          case 'weather': {
            const data = await fetchWeather(lat, lng, clusterId, null);
            if (data) {
              updates.cachedWeather = { ...data, updatedAt: new Date() };
              await redisSet(`cluster:${clusterId}:Weather`, JSON.stringify(data), 86400);
              refreshed.push('weather');
            }
            break;
          }
          case 'solar': {
            const data = await fetchSolar(lat, lng, clusterId);
            if (data) {
              updates.cachedSolar = { ...data, updatedAt: new Date() };
              await redisSet(`cluster:${clusterId}:Solar`, JSON.stringify(data), 86400);
              refreshed.push('solar');
            }
            break;
          }
          case 'noise': {
            const data = await fetchNoise(lat, lng, clusterId);
            if (data) {
              updates.cachedNoise = { ...data, updatedAt: new Date() };
              await redisSet(`cluster:${clusterId}:Noise`, JSON.stringify(data), 604800);
              refreshed.push('noise');
            }
            break;
          }
          case 'amenities': {
            const data = await fetchAmenities(lat, lng, clusterId);
            if (data) {
              updates.cachedAmenities = { ...data, updatedAt: new Date() };
              await redisSet(`cluster:${clusterId}:Amenities`, JSON.stringify(data), 1296000);
              refreshed.push('amenities');
            }
            break;
          }
        }
      } catch (err) {
        console.error(`[Admin:Refresh] ${clusterId}:${type}`, err.message);
        failed.push(type);
      }
    }));

    if (Object.keys(updates).length > 0) {
      await Cluster.findByIdAndUpdate(req.params.id, { $set: updates });
    }

    res.json({ ok: true, clusterId, refreshed, failed });
  } catch (err) {
    next(err);
  }
});

export default router;
