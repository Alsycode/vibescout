// FILE: src/models/User.js
// PURPOSE: User account with funnel preferences and permanent report history

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    // Phase 2 adds 'broker' to this enum
    default: 'user',
  },
  preferences: {
    listingTypeContext: { type: String, enum: ['sale', 'rent'] },
    sessionId: String,
    // wfhStatus carried from step1 into step4 — stored here
    step1: {
      wfhStatus: String, // 'full-time' | 'hybrid' | 'no'
      workplaceLat: Number, // null if wfhStatus === 'full-time'
      workplaceLng: Number,
      commuteMode: String, // 'walking'|'two_wheeler'|'auto_rickshaw'|'car'|'public_transport'
      maxCommuteMinutes: Number,
    },
    step2: {
      lifestyleType: String, // 'remote'|'family'|'student'|'professional'|'retired'
    },
    step3: {
      aqiSensitivity: String, // 'Sensitive'|'Moderate'|'Low'
      noiseSensitivity: String, // 'High'|'Moderate'|'Low'
    },
    step4: {
      vastuPreference: String,
      facingDirection: String,
    },
    step5: {
      amenityPriorities: [String],
      // ordered array e.g. ['schools','hospitals','parks','gyms','cafes']
      // top 2 drive amenityVerdict
    },
    step6: {
      communityPreference: String,
    },
    step7: {
      // sale fields
      monthlyHouseholdIncome: String,
      availableDownPayment: String,
      loanPreApproved: Boolean,
      investmentIntent: String,
      // rent fields
      preferredLeaseDuration: String,
      petsOwned: Boolean,
      furnishingPreference: String,
      moveInTimeline: String,
    },
  },
  reportHistory: [{
    sessionId: String,
    listingType: String,
    propertyName: String,
    reportSnapshot: Object,
    // full rendered report JSON — permanent record
    // source of truth after ShadowProperty expires
    shareToken: String,
    // crypto.randomBytes(16).toString('hex') — 32 chars, 128-bit entropy
    // stored here — validated by matching sessionId + shareToken
    generatedAt: Date,
  }],
  unlockedReports: [{ type: String }],
  // sessionIds that have been paid for
  createdAt: { type: Date, default: Date.now },
});

UserSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', UserSchema);

export default User;
