// FILE: src/services/analytics.service.js
// PURPOSE: Fire-and-forget analytics logging. Never throws — never blocks a request.

import AnalyticsEvent from '../models/AnalyticsEvent.js';

function log(type, payload) {
  AnalyticsEvent.create({ type, ...payload }).catch(() => {});
}

export function trackFunnelStep(userId, sessionId, step) {
  log('funnel_step_complete', { userId, sessionId, step });
}

export function trackFunnelAbandon(userId, sessionId, lastCompletedStep) {
  log('funnel_abandon', { userId, sessionId, step: lastCompletedStep });
}

export function trackReportGenerated(userId, sessionId, { listingType, budgetBracket, bhk, location, verdictObject }) {
  log('report_generated', {
    userId,
    sessionId,
    listingType,
    budgetBracket,
    bhk: bhk ?? null,
    location,
    overallVerdict: verdictObject.overallVerdict ?? null,
    totalRedFlags: verdictObject.totalRedFlags ?? 0,
    totalCautions: verdictObject.totalCautions ?? 0,
    totalPasses: verdictObject.totalPasses ?? 0,
  });
}

export function trackReportUnlocked(userId, sessionId, { listingType, budgetBracket, bhk, location }) {
  log('report_unlocked', { userId, sessionId, listingType, budgetBracket, bhk: bhk ?? null, location });
}

export function trackAmenityPreference(userId, sessionId, { amenityPriorities, communityPreference }) {
  log('amenity_preference', { userId, sessionId, amenityPriorities, communityPreference });
}
