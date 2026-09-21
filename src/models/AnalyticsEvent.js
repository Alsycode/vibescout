// FILE: src/models/AnalyticsEvent.js
// PURPOSE: Stores silent analytics events for funnel drop-off, conversion, verdict feedback, and amenity preference tracking

import mongoose from 'mongoose';

const AnalyticsEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'funnel_step_complete',   // user completed a funnel step
      'funnel_abandon',         // user stopped mid-funnel (inferred at report gen if steps missing)
      'report_generated',       // report was generated — captures verdict + location + BHK
      'report_unlocked',        // user paid and unlocked a report
      'amenity_preference',     // user's amenity priority order from step5
    ],
  },

  // --- shared fields ---
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },

  // --- funnel_step_complete / funnel_abandon ---
  step: { type: Number }, // 1–7

  // --- report_generated + report_unlocked ---
  listingType: { type: String, enum: ['sale', 'rent'] },
  budgetBracket: { type: String },
  bhk: { type: String },
  location: {
    suburb: String,
    city: String,
    lat: Number,
    lng: Number,
  },

  // --- report_generated only ---
  overallVerdict: { type: String, enum: ['pass', 'caution', 'red_flag'] },
  totalRedFlags: { type: Number },
  totalCautions: { type: Number },
  totalPasses: { type: Number },

  // --- amenity_preference only ---
  amenityPriorities: { type: [String] }, // ordered, top priority first
  communityPreference: { type: String },
}, { versionKey: false });

// Compound indexes for common query patterns
AnalyticsEventSchema.index({ type: 1, createdAt: -1 });
AnalyticsEventSchema.index({ type: 1, listingType: 1, 'location.city': 1 });
// PERF-5 — this grew unbounded before (no TTL anywhere on this collection).
// A single-field index services both range queries on createdAt alone and
// the TTL expiry; replaces the plain `index: true` that used to be on the
// field above rather than adding a second, redundant plain index on it.
// 180 days — comfortably past the admin dashboard's longest `daysBack`
// default (30) with room for ad-hoc longer lookbacks, while still bounding
// growth. Adjust here if retention needs change; no other code depends on it.
AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);

export default AnalyticsEvent;
