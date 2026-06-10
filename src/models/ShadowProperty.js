// FILE: src/models/ShadowProperty.js
// PURPOSE: Temporary working document for a user-triggered property audit session

import mongoose from 'mongoose';

const ShadowPropertySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  placeId: { type: String, default: null },
  name: { type: String, required: true },
  coordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  confirmedByUser: { type: Boolean, default: false },
  clusterId: { type: String },
  userProvidedSpecs: {
    budgetBracket: { type: String },
    bhk: {
      type: String,
      enum: ['1BHK', '2BHK', '3BHK', '4BHK+', 'Studio', 'Villa', 'Plot', 'PG'],
    },
    floor: {
      type: String,
      enum: ['Ground', '1–3', '4–7', '8–15', '16+', 'Top Floor', 'Unknown'],
    },
    listingType: { type: String, enum: ['sale', 'rent'] },
  },
  intelligence: {
    aqi: {
      value: Number,
      category: String,
      source: { type: String, enum: ['live', 'cache', 'city_average', 'seasonal'] },
    },
    noise: {
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
        enum: ['live', 'cache', 'estimated', 'osm_live', 'osm_cache', 'ai_estimation'],
      },
    },
    solar: {
      peakSunHours: Number,
      morningScore: Number,
      wfhLightScore: Number,
      acSavingsEstimate: Number,
      solarPanelViability: String,
      viability: String,
      source: { type: String, enum: ['live', 'cache', 'computed'] },
    },
    weather: {
      temp: Number,
      humidity: Number,
      description: String,
      source: { type: String, enum: ['live', 'cache', 'seasonal'] },
    },
    amenities: {
      schools: [{ name: String, distanceM: Number }],
      hospitals: [{ name: String, distanceM: Number }],
      parks: [{ name: String, distanceM: Number }],
      gyms: [{ name: String, distanceM: Number }],
      cafes: [{ name: String, distanceM: Number }],
      restaurants: [{ name: String, distanceM: Number }],
      worship: [{ name: String, distanceM: Number }],
      source: { type: String, enum: ['live', 'cache', 'seed'] },
    },
    // ShadowProperty stores localNews inline
    localNews: {
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
  },
  dataSource: {
    aqi: String,
    noise: String,
    solar: String,
    weather: String,
    amenities: String,
    localNews: String,
  },
  status: {
    type: String,
    enum: ['fetching', 'completed', 'failed'],
    default: 'fetching',
  },
  expiresAt: { type: Date, required: true },
  // set to Date.now() + 24h at creation
  // ShadowProperty is a temporary working document
  // Lead copies all important data at creation — ShadowProperty deletion loses nothing
  createdAt: { type: Date, default: Date.now },
});

ShadowPropertySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
ShadowPropertySchema.index({ sessionId: 1 }, { unique: true });

const ShadowProperty = mongoose.model('ShadowProperty', ShadowPropertySchema);

export default ShadowProperty;
