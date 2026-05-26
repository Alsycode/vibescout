// FILE: src/models/Broker.js
// PURPOSE: Broker profile with assigned leads and Phase 2 bid history schema

import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

const BrokerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: String,
  company: String,
  assignedCities: [String],
  activeLeads: [{ type: ObjectId, ref: 'Lead' }],
  tier: { type: String, enum: ['standard', 'premium', 'elite'], default: 'standard' },
  isActive: { type: Boolean, default: true },
  // PHASE 2 — bidding history (schema only, no logic)
  bidHistory: [{
    auctionId: { type: ObjectId, ref: 'LeadAuction' },
    leadId: { type: ObjectId, ref: 'Lead' },
    bidAmount: Number,
    razorpayPaymentId: String,
    won: Boolean,
    createdAt: Date,
  }],
  createdAt: { type: Date, default: Date.now },
});

BrokerSchema.index({ email: 1 }, { unique: true });

const Broker = mongoose.model('Broker', BrokerSchema);

export default Broker;
