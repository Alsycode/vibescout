// FILE: src/services/clusterService.js
// PURPOSE: Geographic clustering with haversine distance, cluster CRUD, and freshness queries

import Cluster from '../models/Cluster.js';
import { EVERGREEN_CLUSTER_IDS } from '../data/evergreenClusters.js';

export const CLUSTER_RADIUS_M = 1500; // named constant — do not hardcode elsewhere

// coord1, coord2: { lat, lng }
export function haversineKm(coord1, coord2) {
  const R = 6371;
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLng = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function haversineM(lat1, lng1, lat2, lng2) {
  return haversineKm({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 }) * 1000;
}

// Creates or updates a cluster document; always updates lastSearchedAt
export async function upsertCluster(lat, lng) {
  const snappedLat = parseFloat(lat.toFixed(2));
  const snappedLng = parseFloat(lng.toFixed(2));
  const clusterId = `${snappedLat}_${snappedLng}`;

  await Cluster.findOneAndUpdate(
    { clusterId },
    {
      $setOnInsert: { centroidLat: snappedLat, centroidLng: snappedLng },
      $set: { lastSearchedAt: new Date() },
    },
    { upsert: true, new: true }
  );

  return clusterId;
}

// Finds the nearest existing cluster within CLUSTER_RADIUS_M; creates new one if none found
export async function assignCluster(lat, lng) {
  // SF-05: Bounding box pre-filter instead of full table scan
  // ±0.05° ≈ ±5.5km — safely covers CLUSTER_RADIUS_M (1500m) with margin
  const BBOX_DEG = 0.05;
  const nearbyClusters = await Cluster.find({
    centroidLat: { $gte: lat - BBOX_DEG, $lte: lat + BBOX_DEG },
    centroidLng: { $gte: lng - BBOX_DEG, $lte: lng + BBOX_DEG },
  });

  let nearest = null;
  let minDist = Infinity;

  for (const c of nearbyClusters) {
    const d = haversineM(lat, lng, c.centroidLat, c.centroidLng);
    if (d < minDist) {
      minDist = d;
      nearest = c;
    }
  }

  if (nearest && minDist <= CLUSTER_RADIUS_M) return nearest.clusterId;
  return upsertCluster(lat, lng);
}

// Returns evergreen clusters + clusters searched within the last 7 days (no duplicates)
export async function getAllActiveClusters() {
  const evergreenClusters = await Cluster.find({
    clusterId: { $in: EVERGREEN_CLUSTER_IDS },
  });
  const recentClusters = await Cluster.find({
    lastSearchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    clusterId: { $nin: EVERGREEN_CLUSTER_IDS },
  });
  return [...evergreenClusters, ...recentClusters];
}

const SIGNAL_CACHE_FIELD = {
  AQI: 'cachedAQI',
  Weather: 'cachedWeather',
  Solar: 'cachedSolar',
  Noise: 'cachedNoise',
  Amenities: 'cachedAmenities',
};

// Returns active clusters whose cached signal is older than ttlSeconds (or never fetched)
export async function getClustersNeedingRefresh(signalType, ttlSeconds) {
  const cacheField = SIGNAL_CACHE_FIELD[signalType];
  if (!cacheField) return [];

  const cutoff = new Date(Date.now() - ttlSeconds * 1000);
  const active = await getAllActiveClusters();

  return active.filter((c) => {
    const updatedAt = c[cacheField]?.updatedAt;
    return !updatedAt || updatedAt < cutoff;
  });
}
