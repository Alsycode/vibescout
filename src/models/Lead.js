// FILE: src/models/Lead.js
// PURPOSE: Permanent scored lead created on funnel completion — captures user intent and property verdict

import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const LeadSchema = new mongoose.Schema({
  userId: { type: ObjectId, ref: 'User', required: true },
  shadowPropertyId: { type: ObjectId, ref: 'ShadowProperty', required: true },
  sessionId: { type: String, required: true, unique: true },
  clusterId: { type: String, required: true },
  listingType: { type: String, enum: ['sale', 'rent'], required: true },
  // Full snapshot copied from ShadowProperty at lead creation
  // ShadowProperty expires in 24h — Lead is permanent record
  preferences: Object, // full copy of user.preferences at lead creation
  userProvidedSpecs: Object, // copy of shadowProperty.userProvidedSpecs
  verdictObject: Object, // output of computeAllVerdicts — stored for broker view
  // Derived budget bracket for verdict — normalised single field
  budgetBracket: String,
  compositeScore: { type: Number, min: 0, max: 100 },
  scoreTier: { type: String, enum: ['hot', 'warm', 'lukewarm', 'cold'] },
  scoreBreakdown: Object,
  dataSource: Object,
  // copied from ShadowProperty.dataSource at lead creation
  // Pipeline stage — auction-aligned, no CRM stages
  stage: {
    type: String,
    enum: ['new', 'listed', 'sold', 'expired'],
    default: 'new',
    // new → lead created, not yet auctioned
    // listed → admin listed it, auction live (Phase 2)
    // sold → winning bid paid, broker assigned (Phase 2)
    // expired → auction ended with no bids (Phase 2)
  },
  assignedBrokerId: { type: ObjectId, ref: 'Broker', default: null },
  // set automatically when auction closes — never manually by admin
  // PHASE 2 — auction fields (precise schema, no logic in Phase 1)
  auction: {
    status: { type: String, enum: ['new', 'listed', 'sold', 'expired'], default: 'new' },
    startTime: Date,
    endTime: Date,
    reservePrice: Number,
    winningBrokerId: { type: ObjectId, ref: 'Broker', default: null },
    winningBid: { type: Number, default: null },
    razorpayOrderId: { type: String, default: null },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

LeadSchema.index({ sessionId: 1 }, { unique: true });
LeadSchema.index({ scoreTier: 1, listingType: 1 });
LeadSchema.index({ stage: 1 });

const Lead = mongoose.model('Lead', LeadSchema);

export default Lead;
