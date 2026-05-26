// FILE: scripts/seedLeads.js
// PURPOSE: Seed 2 Lead documents linked to the first 2 ShadowProperties. Run after seedShadowProperties.

import 'dotenv/config';
import mongoose from 'mongoose';
import Lead from '../src/models/Lead.js';
import User from '../src/models/User.js';
import ShadowProperty from '../src/models/ShadowProperty.js';

// Pre-crafted preferences snapshots for the 2 seed leads
const PREFERENCES_1 = {
  listingTypeContext: 'sale',
  sessionId: null, // filled at runtime
  step1: {
    wfhStatus: 'no',
    workplaceLat: 12.9716,
    workplaceLng: 77.5946,
    commuteMode: 'car',
    maxCommuteMinutes: 45,
  },
  step2: { lifestyleType: 'professional' },
  step3: { aqiSensitivity: 'Moderate', noiseSensitivity: 'Moderate' },
  step4: { vastuPreference: 'No preference', facingDirection: 'East' },
  step5: { amenityPriorities: ['gyms', 'cafes', 'parks', 'hospitals', 'schools'] },
  step6: { communityPreference: 'Active nightlife' },
  step7: {
    monthlyHouseholdIncome: '1L–2L',
    availableDownPayment: '20L–50L',
    loanPreApproved: true,
    investmentIntent: 'Primary residence',
  },
};

const PREFERENCES_2 = {
  listingTypeContext: 'rent',
  sessionId: null,
  step1: {
    wfhStatus: 'hybrid',
    workplaceLat: 9.9312,
    workplaceLng: 76.2673,
    commuteMode: 'two_wheeler',
    maxCommuteMinutes: 30,
  },
  step2: { lifestyleType: 'family' },
  step3: { aqiSensitivity: 'Sensitive', noiseSensitivity: 'High' },
  step4: { vastuPreference: 'Yes', facingDirection: 'East' },
  step5: { amenityPriorities: ['schools', 'hospitals', 'parks', 'gyms', 'cafes'] },
  step6: { communityPreference: 'Family-heavy area' },
  step7: {
    monthlyHouseholdIncome: '50K–1L',
    preferredLeaseDuration: '11 months',
    petsOwned: false,
    furnishingPreference: 'Semi-furnished',
    moveInTimeline: 'within_1_month',
  },
};

// Pre-computed verdict objects for the 2 seed leads
const VERDICT_1 = {
  noiseVerdict: 'caution',
  aqiVerdict: 'caution',
  solarVerdict: 'pass',
  amenityVerdict: 'pass',
  commuteVerdict: 'pass',
  budgetVerdict: 'caution',
  headline: 'Mostly clear with some cautions — review before committing',
  totalRedFlags: 0,
  totalCautions: 3,
  totalPasses: 3,
  estimatedCommuteMins: 28,
};

const VERDICT_2 = {
  noiseVerdict: 'pass',
  aqiVerdict: 'pass',
  solarVerdict: 'pass',
  amenityVerdict: 'pass',
  commuteVerdict: 'pass',
  budgetVerdict: 'pass',
  headline: 'Strong match across all signals — high confidence location',
  totalRedFlags: 0,
  totalCautions: 0,
  totalPasses: 6,
  estimatedCommuteMins: 18,
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seedLeads] Connected to MongoDB');

  const user = await User.findOne({ email: 'user1@vibescout.com' });
  if (!user) {
    console.error('[seedLeads] user1@vibescout.com not found — run seedUsers.js first');
    await mongoose.disconnect();
    process.exit(1);
  }

  // Pick first 2 completed ShadowProperties (one sale, one rent)
  const saleSP = await ShadowProperty.findOne({ status: 'completed', 'userProvidedSpecs.listingType': 'sale' });
  const rentSP = await ShadowProperty.findOne({ status: 'completed', 'userProvidedSpecs.listingType': 'rent' });

  if (!saleSP || !rentSP) {
    console.error('[seedLeads] ShadowProperty documents not found — run seedShadowProperties.js first');
    await mongoose.disconnect();
    process.exit(1);
  }

  const LEADS = [
    {
      sp: saleSP,
      preferences: { ...PREFERENCES_1, sessionId: saleSP.sessionId },
      verdictObject: VERDICT_1,
      compositeScore: 68,
      scoreTier: 'warm',
      scoreBreakdown: { budget: 15, financial: 14, lifestyle: 12, environmental: 6, commute: 10, readiness: 5, location: 6 },
    },
    {
      sp: rentSP,
      preferences: { ...PREFERENCES_2, sessionId: rentSP.sessionId },
      verdictObject: VERDICT_2,
      compositeScore: 84,
      scoreTier: 'hot',
      scoreBreakdown: { budget: 25, financial: 18, lifestyle: 13, environmental: 10, commute: 10, readiness: 5, location: 3 },
    },
  ];

  let created = 0;
  for (const l of LEADS) {
    const existing = await Lead.findOne({ sessionId: l.sp.sessionId });
    if (existing) {
      console.log(`[seedLeads] Skipping ${l.sp.name} — lead already exists`);
      continue;
    }

    await Lead.create({
      userId: user._id,
      shadowPropertyId: l.sp._id,
      sessionId: l.sp.sessionId,
      clusterId: l.sp.clusterId,
      listingType: l.sp.userProvidedSpecs.listingType,
      preferences: l.preferences,
      userProvidedSpecs: l.sp.userProvidedSpecs,
      budgetBracket: l.sp.userProvidedSpecs.budgetBracket,
      verdictObject: l.verdictObject,
      compositeScore: l.compositeScore,
      scoreTier: l.scoreTier,
      scoreBreakdown: l.scoreBreakdown,
      dataSource: l.sp.dataSource,
      stage: 'new',
    });
    console.log(`[seedLeads] Created lead: ${l.sp.name} — tier: ${l.scoreTier} (${l.compositeScore})`);
    created++;
  }

  console.log(`[seedLeads] Done. Created ${created} leads.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seedLeads] Fatal error:', err);
  process.exit(1);
});
