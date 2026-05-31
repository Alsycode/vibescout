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
    score: Number,
    estimatedDb: Number,
    category: String,
    profile: {
      morning: String,
      afternoon: String,
      night: String,
    },
    source: { type: String, enum: ['howloud', 'estimated'] },
    updatedAt: Date,
  },
  cachedAmenities: {
    schools: [{ name: String, distance: Number, placeId: String }],
    hospitals: [{ name: String, distance: Number, placeId: String }],
    gyms: [{ name: String, distance: Number, placeId: String }],
    restaurants: [{ name: String, distance: Number, placeId: String }],
    parks: [{ name: String, distance: Number, placeId: String }],
    worship: [{ name: String, distance: Number, placeId: String }],
    cafes: [{ name: String, distance: Number, placeId: String }],
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

ClusterSchema.index({ clusterId: 1 }, { unique: true });
ClusterSchema.index({ centroidLat: 1, centroidLng: 1 });

const Cluster = mongoose.model('Cluster', ClusterSchema);

export default Cluster;
