// FILE: src/models/LeadAuction.js
// PURPOSE: PHASE 2 — Full bidding engine ships in Phase 2. Precise schema defined now — zero migration cost at Phase 2 launch.

import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

// PHASE 2 — full bidding engine ships in Phase 2
// Precise schema defined now — zero migration cost at Phase 2 launch
const LeadAuctionSchema = new mongoose.Schema({
  leadId: { type: ObjectId, ref: 'Lead', unique: true, required: true },
  startTime: Date,
  endTime: Date,
  reservePrice: Number,
  bids: [{
    brokerId: { type: ObjectId, ref: 'Broker' },
    amount: Number,
    razorpayOrderId: String,
    razorpayPaymentId: String,
    placedAt: Date,
  }],
  currentHighBid: { type: Number, default: 0 },
  winnerId: { type: ObjectId, ref: 'Broker', default: null },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'sold', 'expired'],
    default: 'scheduled',
  },
  createdAt: { type: Date, default: Date.now },
});

const LeadAuction = mongoose.model('LeadAuction', LeadAuctionSchema);

export default LeadAuction;
