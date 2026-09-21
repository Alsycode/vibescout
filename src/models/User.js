// FILE: src/models/User.js
// PURPOSE: User account with funnel preferences and permanent report history

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: null },
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
  // PERF-4 — reportHistory[] and unlockedReports[] used to live here: every
  // report's full JSON snapshot inline on the account document, growing
  // without bound toward Mongo's 16MB doc limit, and hydrated on every
  // User.findById(...) even when the request had nothing to do with reports.
  // Moved to their own collections: see src/models/Report.js (one doc per
  // report) and src/models/Payment.js (status:'paid' is now the source of
  // truth for "unlocked", replacing unlockedReports[]).
  // Deliberately not removed from existing documents in the database —
  // scripts/migrateReportsAndUnlocks.js copies the data out; the old fields
  // are just inert once the schema (here) no longer declares them, so
  // nothing reads or writes them going forward.
  resetToken:       { type: String, default: null },
  resetTokenExpiry: { type: Date,   default: null },
  createdAt: { type: Date, default: Date.now },
});

// PERF-5 — email's field-level `unique: true` above already creates this
// index; removed the redundant duplicate .index() call that used to be here.

const User = mongoose.model('User', UserSchema);

export default User;
