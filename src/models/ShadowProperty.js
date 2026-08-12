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
  location: {
    displayName: { type: String },
    cityName: { type: String },
    locationCascade: [{ type: String }],
  },
  userProvidedSpecs: {
    budgetBracket: { type: String },
    actualAmount: { type: Number },
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
      schools: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
      hospitals: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
      parks: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
      gyms: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
      cafes: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
      restaurants: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
      worship: [{ name: String, distanceM: Number, lat: Number, lng: Number, placeId: String }],
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
    // ─── Derived signals (computed post-fetch, no extra API cost) ───────────
    livabilityIndex: {
      score: Number,
      grade: String,
      breakdown: mongoose.Schema.Types.Mixed,
    },
    maturityScore: {
      score: Number,
      band:  String,
      counts: mongoose.Schema.Types.Mixed,
    },
    solarSavings: {
      annualSavingsRs: Number,
      annualKwh:       Number,
      dailyKwh:        Number,
      panelKw:         Number,
      displayText:     String,
    },
    infrastructureMomentum: {
      signals: [{
        title:           String,
        url:             String,
        source:          String,
        publishedAt:     Date,
        matchedKeywords: [String],
      }],
      hasSignals: Boolean,
      count:      Number,
    },
    landHistory: {
      floodRisk:         String,
      floodRiskScore:    Number,
      waterOccurrence:   Number,
      nearestWaterBodyM: Number,
      reason:            String,
      hasHistoricalWater: Boolean,
      source:            String,
    },
    terrain: {
      elevationM:         Number,
      surroundingMedianM: Number,
      relativeM:          Number,
      localReliefM:       Number,
      terrainPosition:    String,
      drainageRisk:       String,
      drainageScore:      Number,
      reason:             String,
      confidence:         String,
      samplesUsed:        Number,
      source:             String,
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
