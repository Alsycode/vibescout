// FILE: scripts/seedClusters.js
// PURPOSE: Seed all evergreen clusters — upsert document, fetch 5 signals live, store MongoDB + Redis

import 'dotenv/config';
import mongoose from 'mongoose';
import Cluster from '../src/models/Cluster.js';
import { EVERGREEN_CLUSTER_IDS } from '../src/data/evergreenClusters.js';
import { upsertCluster } from '../src/services/clusterService.js';
import { fetchAQI } from '../src/services/aqi.service.js';
import { fetchWeather } from '../src/services/weather.service.js';
import { fetchSolar } from '../src/services/solar.service.js';
import { fetchNoise } from '../src/services/noise.service.js';
import { fetchAmenities } from '../src/services/places.service.js';
import { fetchNewsWithFallback } from '../src/services/news.service.js';
import { redisSet } from '../src/lib/redis.js';

// Maps cluster ID prefix to a human-readable city name for news waterfall
const CLUSTER_CITY_MAP = {
  '10.10': 'kochi',   '9.97': 'kochi',    '9.93': 'kochi',
  '10.02': 'kochi',   '10.00': 'kochi',
  '12.97': 'bangalore', '12.93': 'bangalore', '12.90': 'bangalore',
  '13.01': 'bangalore', '12.84': 'bangalore',
  '19.07': 'mumbai',  '19.12': 'mumbai',  '19.05': 'mumbai',  '19.01': 'mumbai',
  '17.44': 'hyderabad', '17.43': 'hyderabad', '17.49': 'hyderabad', '17.39': 'hyderabad',
  '13.08': 'chennai', '12.98': 'chennai', '13.06': 'chennai',
  '18.55': 'pune',    '18.52': 'pune',    '18.59': 'pune',
  '28.63': 'delhi',   '28.47': 'gurugram', '28.53': 'noida',
};

function parseCentroid(clusterId) {
  const [lat, lng] = clusterId.split('_').map(Number);
  return { lat, lng };
}

function getCityName(clusterId) {
  const latPrefix = clusterId.split('_')[0];
  return CLUSTER_CITY_MAP[latPrefix] ?? 'india';
}

async function seedCluster(clusterId) {
  const { lat, lng } = parseCentroid(clusterId);
  const cityName = getCityName(clusterId);

  // 1. Create/update cluster document
  await upsertCluster(lat, lng);
  console.log(`  [upsert] ${clusterId}`);

  const updates = { lastSearchedAt: new Date() };
  const redisBatch = [];

  // 2. Fetch AQI
  try {
    const aqi = await fetchAQI(lat, lng, clusterId, cityName);
    if (aqi) {
      updates.cachedAQI = { aqi: aqi.value, category: aqi.category, updatedAt: new Date() };
      redisBatch.push({ key: `cluster:${clusterId}:AQI`, value: JSON.stringify(aqi), ex: 86400 });
      console.log(`  [AQI]   ${clusterId} — ${aqi.value} (${aqi.source})`);
    }
  } catch (err) {
    console.error(`  [AQI]   ${clusterId} failed:`, err.message);
  }

  // 3. Fetch Weather
  try {
    const weather = await fetchWeather(lat, lng, clusterId, cityName);
    if (weather) {
      updates.cachedWeather = { temp: weather.temp, humidity: weather.humidity, updatedAt: new Date() };
      redisBatch.push({ key: `cluster:${clusterId}:Weather`, value: JSON.stringify(weather), ex: 86400 });
      console.log(`  [Wthr]  ${clusterId} — ${weather.temp}°C (${weather.source})`);
    }
  } catch (err) {
    console.error(`  [Wthr]  ${clusterId} failed:`, err.message);
  }

  // 4. Fetch Solar
  try {
    const solar = await fetchSolar(lat, lng, clusterId);
    if (solar) {
      updates.cachedSolar = {
        peakSunHours: solar.peakSunHours,
        morningScore: solar.morningScore,
        wfhLightScore: solar.wfhLightScore,
        acSavingsEstimate: solar.acSavingsEstimate,
        solarPanelViability: solar.viability,
        updatedAt: new Date(),
      };
      redisBatch.push({ key: `cluster:${clusterId}:Solar`, value: JSON.stringify(solar), ex: 86400 });
      console.log(`  [Solar] ${clusterId} — ${solar.peakSunHours}h (${solar.source})`);
    }
  } catch (err) {
    console.error(`  [Solar] ${clusterId} failed:`, err.message);
  }

  // 5. Fetch Noise (cluster centroid, no specific floor context)
  try {
    const noise = await fetchNoise(lat, lng, clusterId);
    if (noise) {
      updates.cachedNoise = {
        estimatedDb: noise.estimatedDb,
        category: noise.category,
        source: noise.source === 'live' ? 'howloud' : 'estimated',
        updatedAt: new Date(),
      };
      redisBatch.push({ key: `cluster:${clusterId}:Noise`, value: JSON.stringify(noise), ex: 604800 });
      console.log(`  [Noise] ${clusterId} — ${noise.estimatedDb}dB (${noise.source})`);
    }
  } catch (err) {
    console.error(`  [Noise] ${clusterId} failed:`, err.message);
  }

  // 6. Fetch Amenities (centroid coords)
  try {
    const amenities = await fetchAmenities(lat, lng, clusterId);
    if (amenities) {
      updates.cachedAmenities = {
        schools:    (amenities.schools   ?? []).map((p) => ({ name: p.name, distance: p.distanceM, placeId: p.placeId ?? null })),
        hospitals:  (amenities.hospitals ?? []).map((p) => ({ name: p.name, distance: p.distanceM, placeId: p.placeId ?? null })),
        gyms:       (amenities.gyms      ?? []).map((p) => ({ name: p.name, distance: p.distanceM, placeId: p.placeId ?? null })),
        parks:      (amenities.parks     ?? []).map((p) => ({ name: p.name, distance: p.distanceM, placeId: p.placeId ?? null })),
        cafes:      (amenities.cafes     ?? []).map((p) => ({ name: p.name, distance: p.distanceM, placeId: p.placeId ?? null })),
        updatedAt: new Date(),
      };
      redisBatch.push({ key: `cluster:${clusterId}:Amenities`, value: JSON.stringify(amenities), ex: 1209600 });
      console.log(`  [Amen]  ${clusterId} — ${amenities.source}`);
    }
  } catch (err) {
    console.error(`  [Amen]  ${clusterId} failed:`, err.message);
  }

  // 7. Fetch News
  try {
    const news = await fetchNewsWithFallback(clusterId, cityName);
    if (news) {
      updates.cachedNews = {
        headlines: news.headlines ?? [],
        source: news.source,
        updatedAt: new Date(),
      };
      console.log(`  [News]  ${clusterId} — ${news.headlines.length} headlines (${news.source})`);
    }
  } catch (err) {
    console.error(`  [News]  ${clusterId} failed:`, err.message);
  }

  // 3. Persist to MongoDB
  await Cluster.findOneAndUpdate(
    { clusterId },
    { $set: updates },
    { upsert: true }
  );

  // 4. Persist to Redis
  for (const { key, value, ex } of redisBatch) {
    await redisSet(key, value, ex);
  }

  console.log(`  [done]  ${clusterId}\n`);
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seedClusters] Connected to MongoDB');
  console.log(`[seedClusters] Seeding ${EVERGREEN_CLUSTER_IDS.length} evergreen clusters...\n`);

  let ok = 0;
  let failed = 0;

  for (const clusterId of EVERGREEN_CLUSTER_IDS) {
    try {
      await seedCluster(clusterId);
      ok++;
    } catch (err) {
      console.error(`[seedClusters] Cluster ${clusterId} failed entirely:`, err.message);
      failed++;
    }
    // Small delay between clusters to respect API rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`[seedClusters] Complete. Success: ${ok} / Failed: ${failed}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seedClusters] Fatal error:', err);
  process.exit(1);
});
