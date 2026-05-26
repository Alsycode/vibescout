// FILE: src/jobs/cronJobs.js
// PURPOSE: Scheduled cron jobs to refresh cluster-level environment signals on defined cadences

import cron from 'node-cron';
import Cluster from '../models/Cluster.js';
import { getClustersNeedingRefresh } from '../services/clusterService.js';
import { redisSet } from '../lib/redis.js';
import { fetchAQI } from '../services/aqi.service.js';
import { fetchWeather } from '../services/weather.service.js';
import { fetchSolar } from '../services/solar.service.js';
import { fetchNoise } from '../services/noise.service.js';
import { fetchAmenities } from '../services/places.service.js';
import { fetchNewsWithFallback } from '../services/news.service.js';

async function processBatch(items, batchSize, delayMs, fn) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(fn));
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
}

// AQI — daily at midnight, 5 clusters per batch, 1000ms delay
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron:AQI] Starting daily AQI refresh');
  try {
    const clusters = await getClustersNeedingRefresh('AQI', 86400);
    console.log(`[Cron:AQI] ${clusters.length} clusters need refresh`);
    await processBatch(clusters, 5, 1000, async (cluster) => {
      try {
        const data = await fetchAQI(cluster.centroidLat, cluster.centroidLng, null, null);
        if (!data) return;
        await redisSet(`cluster:${cluster.clusterId}:AQI`, JSON.stringify(data), 86400);
        await Cluster.findOneAndUpdate(
          { clusterId: cluster.clusterId },
          { cachedAQI: { ...data, updatedAt: new Date() } }
        );
      } catch (err) {
        console.error(`[Cron:AQI] ${cluster.clusterId}:`, err.message);
      }
    });
    console.log('[Cron:AQI] Done');
  } catch (err) {
    console.error('[Cron:AQI] Fatal error:', err.message);
  }
});

// Weather — daily at midnight, 10 clusters per batch, 1000ms delay
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron:Weather] Starting daily Weather refresh');
  try {
    const clusters = await getClustersNeedingRefresh('Weather', 86400);
    console.log(`[Cron:Weather] ${clusters.length} clusters need refresh`);
    await processBatch(clusters, 10, 1000, async (cluster) => {
      try {
        const data = await fetchWeather(cluster.centroidLat, cluster.centroidLng, null, null);
        if (!data) return;
        await redisSet(`cluster:${cluster.clusterId}:Weather`, JSON.stringify(data), 86400);
        await Cluster.findOneAndUpdate(
          { clusterId: cluster.clusterId },
          { cachedWeather: { ...data, updatedAt: new Date() } }
        );
      } catch (err) {
        console.error(`[Cron:Weather] ${cluster.clusterId}:`, err.message);
      }
    });
    console.log('[Cron:Weather] Done');
  } catch (err) {
    console.error('[Cron:Weather] Fatal error:', err.message);
  }
});

// Solar — daily at 1am, 10 clusters per batch, 500ms delay
cron.schedule('0 1 * * *', async () => {
  console.log('[Cron:Solar] Starting daily Solar refresh');
  try {
    const clusters = await getClustersNeedingRefresh('Solar', 86400);
    console.log(`[Cron:Solar] ${clusters.length} clusters need refresh`);
    await processBatch(clusters, 10, 500, async (cluster) => {
      try {
        const data = await fetchSolar(cluster.centroidLat, cluster.centroidLng, null);
        if (!data) return;
        await redisSet(`cluster:${cluster.clusterId}:Solar`, JSON.stringify(data), 86400);
        await Cluster.findOneAndUpdate(
          { clusterId: cluster.clusterId },
          { cachedSolar: { ...data, updatedAt: new Date() } }
        );
      } catch (err) {
        console.error(`[Cron:Solar] ${cluster.clusterId}:`, err.message);
      }
    });
    console.log('[Cron:Solar] Done');
  } catch (err) {
    console.error('[Cron:Solar] Fatal error:', err.message);
  }
});

// Noise — weekly Monday at 2am, 5 clusters per batch, 2000ms delay
cron.schedule('0 2 * * 1', async () => {
  console.log('[Cron:Noise] Starting weekly Noise refresh');
  try {
    const clusters = await getClustersNeedingRefresh('Noise', 604800);
    console.log(`[Cron:Noise] ${clusters.length} clusters need refresh`);
    await processBatch(clusters, 5, 2000, async (cluster) => {
      try {
        const data = await fetchNoise(cluster.centroidLat, cluster.centroidLng, null);
        if (!data) return;
        await redisSet(`cluster:${cluster.clusterId}:Noise`, JSON.stringify(data), 604800);
        await Cluster.findOneAndUpdate(
          { clusterId: cluster.clusterId },
          { cachedNoise: { ...data, updatedAt: new Date() } }
        );
      } catch (err) {
        console.error(`[Cron:Noise] ${cluster.clusterId}:`, err.message);
      }
    });
    console.log('[Cron:Noise] Done');
  } catch (err) {
    console.error('[Cron:Noise] Fatal error:', err.message);
  }
});

// Amenities — 1st and 15th of month at 3am, 3 clusters per batch, 2000ms delay
cron.schedule('0 3 1,15 * *', async () => {
  console.log('[Cron:Amenities] Starting bi-monthly Amenities refresh');
  try {
    const clusters = await getClustersNeedingRefresh('Amenities', 1296000);
    console.log(`[Cron:Amenities] ${clusters.length} clusters need refresh`);
    await processBatch(clusters, 3, 2000, async (cluster) => {
      try {
        const data = await fetchAmenities(cluster.centroidLat, cluster.centroidLng, null);
        if (!data) return;
        await redisSet(`cluster:${cluster.clusterId}:Amenities`, JSON.stringify(data), 1296000);
        await Cluster.findOneAndUpdate(
          { clusterId: cluster.clusterId },
          { cachedAmenities: { ...data, updatedAt: new Date() } }
        );
      } catch (err) {
        console.error(`[Cron:Amenities] ${cluster.clusterId}:`, err.message);
      }
    });
    console.log('[Cron:Amenities] Done');
  } catch (err) {
    console.error('[Cron:Amenities] Fatal error:', err.message);
  }
});

// News — daily at 4am (optional — improves cache hit rate; pipeline live-fetch is primary path)
// cron.schedule('0 4 * * *', async () => {
//   console.log('[Cron:News] Starting daily News cache warm');
//   try {
//     const clusters = await getClustersNeedingRefresh('News', 86400);
//     await processBatch(clusters, 5, 2000, async (cluster) => {
//       try {
//         const data = await fetchNewsWithFallback(cluster.clusterId, null);
//         if (!data) return;
//         await Cluster.findOneAndUpdate(
//           { clusterId: cluster.clusterId },
//           { cachedNews: { ...data, updatedAt: new Date() } }
//         );
//       } catch (err) {
//         console.error(`[Cron:News] ${cluster.clusterId}:`, err.message);
//       }
//     });
//   } catch (err) {
//     console.error('[Cron:News] Fatal error:', err.message);
//   }
// });
