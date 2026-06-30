// FILE: src/services/funnelAnalytics.service.js
// PURPOSE: Funnel analytics aggregations — completion rates, time per step, error rates, device split

import FunnelAnalytics from '../models/FunnelAnalytics.js';

const STEP_LABELS = {
  0: 'Context',
  1: 'Commute',
  2: 'Lifestyle',
  3: 'Environment',
  4: 'Home Usage',
  5: 'Amenities',
  6: 'Community',
  7: 'Financial',
  8: 'Review',
};

export async function getStepCompletionRates(daysBack = 7) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Get unique sessions that entered each step
  const pipeline = [
    { $match: { timestamp: { $gte: since }, action: 'enter' } },
    { $group: { _id: '$step', uniqueSessions: { $addToSet: '$sessionId' } } },
    { $project: { step: '$_id', uniqueCount: { $size: '$uniqueSessions' }, _id: 0 } },
    { $sort: { step: 1 } },
  ];

  const results = await FunnelAnalytics.aggregate(pipeline);

  // Map to completion rates (step 1 = 100%, step 2 = (users who reached step 2 / users who reached step 1) * 100, etc.)
  const stepCounts = {};
  results.forEach(r => {
    stepCounts[r.step] = r.uniqueCount;
  });

  const completionRates = [];
  let prevCount = null;
  for (const step of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const count = stepCounts[step] ?? 0;
    const rate = prevCount ? (count / prevCount) * 100 : 100;
    const dropoff = prevCount ? Math.round(((prevCount - count) / prevCount) * 100) : 0;

    completionRates.push({
      step,
      label: STEP_LABELS[step],
      usersReached: count,
      completionRate: Math.round(rate),
      dropoffPercent: dropoff,
    });

    if (count > 0) prevCount = count;
  }

  return completionRates;
}

export async function getAvgTimePerStep(daysBack = 7) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const pipeline = [
    { $match: { timestamp: { $gte: since }, action: 'exit', timeSpentMs: { $ne: null } } },
    {
      $group: {
        _id: '$step',
        avgMs: { $avg: '$timeSpentMs' },
        maxMs: { $max: '$timeSpentMs' },
        allMs: { $push: '$timeSpentMs' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const results = await FunnelAnalytics.aggregate(pipeline);

  return results.map(r => {
    const sorted = [...r.allMs].sort((a, b) => a - b);
    const medianMs = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const p95Ms = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
    return {
      step: r._id,
      label: STEP_LABELS[r._id],
      avgSeconds: Math.round(r.avgMs / 1000),
      medianSeconds: Math.round(medianMs / 1000),
      p95Seconds: Math.round(p95Ms / 1000),
      maxSeconds: Math.round(r.maxMs / 1000),
      sampleSize: r.count,
    };
  });
}

export async function getErrorRateByStep(daysBack = 7) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Total attempts per step
  const totalPipeline = [
    { $match: { timestamp: { $gte: since }, action: { $in: ['exit', 'error'] } } },
    { $group: { _id: '$step', total: { $sum: 1 } } },
  ];
  const totals = await FunnelAnalytics.aggregate(totalPipeline);
  const totalByStep = {};
  totals.forEach(t => { totalByStep[t._id] = t.total; });

  // Error attempts per step
  const errorPipeline = [
    { $match: { timestamp: { $gte: since }, action: 'error' } },
    { $group: { _id: '$step', errorCount: { $sum: 1 }, errors: { $push: '$errorMessage' } } },
  ];
  const errors = await FunnelAnalytics.aggregate(errorPipeline);

  return errors.map(e => ({
    step: e._id,
    label: STEP_LABELS[e._id],
    errorCount: e.errorCount,
    totalAttempts: totalByStep[e._id] || 0,
    errorRate: totalByStep[e._id] ? Math.round((e.errorCount / totalByStep[e._id]) * 100) : 0,
    topErrors: e.errors.slice(0, 3), // Top 3 error messages
  }));
}

export async function getDeviceComparison(daysBack = 7) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  // Get completion by device type (users who reached step 8)
  const pipeline = [
    { $match: { timestamp: { $gte: since }, step: 8, action: 'enter' } },
    { $group: { _id: '$deviceType', completions: { $addToSet: '$sessionId' } } },
    { $project: { deviceType: '$_id', completionCount: { $size: '$completions' }, _id: 0 } },
  ];

  const completions = await FunnelAnalytics.aggregate(pipeline);
  const completionByDevice = {};
  completions.forEach(c => { completionByDevice[c.deviceType] = c.completionCount; });

  // Get total sessions per device
  const totalPipeline = [
    { $match: { timestamp: { $gte: since }, action: 'enter', step: 1 } },
    { $group: { _id: '$deviceType', sessions: { $addToSet: '$sessionId' } } },
    { $project: { deviceType: '$_id', totalCount: { $size: '$sessions' }, _id: 0 } },
  ];

  const totals = await FunnelAnalytics.aggregate(totalPipeline);

  return totals.map(t => ({
    deviceType: t.deviceType,
    totalSessions: t.totalCount,
    completions: completionByDevice[t.deviceType] || 0,
    completionRate: t.totalCount ? Math.round((completionByDevice[t.deviceType] || 0) / t.totalCount * 100) : 0,
  }));
}

export async function getRecentEvents(daysBack = 7, limit = 100) {
  const since = new Date();
  since.setDate(since.getDate() - daysBack);

  const events = await FunnelAnalytics.find({ timestamp: { $gte: since } })
    .populate('userId', 'name email phone')
    .sort({ timestamp: -1 })
    .limit(limit);

  return events.map(e => ({
    userId: e.userId?._id,
    userName: e.userId?.name,
    userEmail: e.userId?.email,
    sessionId: e.sessionId,
    step: e.step,
    stepLabel: STEP_LABELS[e.step],
    action: e.action,
    timestamp: e.timestamp,
    timeSpentSeconds: e.timeSpentMs ? Math.round(e.timeSpentMs / 1000) : null,
    errorMessage: e.errorMessage,
    deviceType: e.deviceType,
  }));
}

export async function logFunnelEvent(userId, sessionId, step, action, timeSpentMs = null, errorMessage = null, deviceType = 'desktop') {
  try {
    const event = new FunnelAnalytics({
      userId,
      sessionId,
      step,
      action,
      timeSpentMs,
      errorMessage,
      deviceType,
      timestamp: new Date(),
    });
    await event.save();
  } catch (err) {
    console.error('[FunnelAnalytics] Log error:', err.message);
  }
}
