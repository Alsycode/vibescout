// FILE: src/models/Cluster.js
// PURPOSE: Geographic cluster document caching environment signals for a 1500m radius zone

import mongoose from 'mongoose';

const ClusterSchema = new mongoose.Schema({
  clusterId: { type: String, required: true, unique: true },
  // format: '{lat_2dp}_{lng_2dp}' e.g. '9.93_76.26'
  centroidLat: { type: Number, required: true },
  centroidLng: { type: Number, required: true },
  cachedAQI: {
    aqi: Number,
    pm25: Number,
    category: String,
    updatedAt: Date,
  },
  cachedWeather: {
    temp: Number,
    humidity: Number,
    description: String,
    updatedAt: Date,
  },
  cachedSolar: {
    peakSunHours: Number,
    morningScore: Number,
    wfhLightScore: Number,
    acSavingsEstimate: Number,
    solarPanelViability: String,
    updatedAt: Date,
  },
  cachedNoise: {
    // Core fields — kept for verdictEngine backward-compat
    estimatedDb:    Number,
    category:       String,
    // New fields from Noise Risk Engine v1
    noiseRiskScore: Number,
    confidence:     { type: String, enum: ['high', 'medium', 'low'] },
    factors: [{
      feature:           String,
      distanceMeters:    Number,
      scoreContribution: Number,
    }],
    explanation: [String],
    source: {
      type: String,
      enum: ['osm_live', 'osm_cache', 'ai_estimation', 'estimated'],
    },
    updatedAt: Date,
  },
  cachedAmenities: {
    schools: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    hospitals: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    gyms: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    restaurants: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    parks: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    worship: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    cafes: [{ name: String, distance: Number, distanceM: Number, placeId: String, lat: Number, lng: Number }],
    updatedAt: Date,
  },
  // PATCH #9 — cachedNews field added
  cachedNews: {
    headlines: [{
      title: String,
      url: String,
      source: String,
      publishedAt: Date,
      snippet: String,
    }],
    source: { type: String, enum: ['gnews', 'newsapi', 'google-rss', 'fallback'] },
    updatedAt: Date,
  },
  propertyCount: { type: Number, default: 0 },
  lastSearchedAt: Date,
  // updated every time a ShadowProperty resolves this cluster
  // drives Tier 2 freshness — clusters searched within 7 days get cron refresh
  createdAt: { type: Date, default: Date.now },
});

// PERF-5 — clusterId's field-level `unique: true` above already creates this
// exact index; a second explicit .index() call for it was a redundant
// duplicate (Mongoose warned on every boot — removed, not added, here).
ClusterSchema.index({ centroidLat: 1, centroidLng: 1 });
// getAllActiveClusters() — run by every cron job (clusterService.js) — had
// no index support for this at all; a full collection scan on every run.
ClusterSchema.index({ lastSearchedAt: 1 });

const Cluster = mongoose.model('Cluster', ClusterSchema);

export default Cluster;
