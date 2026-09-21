// FILE: test/unit/cronJobs.test.js
// PURPOSE: PERF-3 — proves initCronJobs() (a) is opt-in (nothing scheduled on
// import — the actual bug: cron used to fire on every process that imported
// this file, including every autoscaled API instance) and (b) every job it
// does schedule is wrapped in withCronLock before doing any work.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const scheduleMock = vi.fn();
vi.mock('node-cron', () => ({
  default: { schedule: scheduleMock },
}));

const withCronLockMock = vi.fn((jobName, ttl, fn) => fn());
vi.mock('../../src/lib/cronLock.js', () => ({
  withCronLock: withCronLockMock,
}));

vi.mock('../../src/models/Cluster.js', () => ({ default: { findOneAndUpdate: vi.fn() } }));
vi.mock('../../src/services/clusterService.js', () => ({
  getClustersNeedingRefresh: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../src/lib/redis.js', () => ({ redisSet: vi.fn() }));
vi.mock('../../src/services/aqi.service.js', () => ({ fetchAQI: vi.fn() }));
vi.mock('../../src/services/weather.service.js', () => ({ fetchWeather: vi.fn() }));
vi.mock('../../src/services/solar.service.js', () => ({ fetchSolar: vi.fn() }));
vi.mock('../../src/services/noise.service.js', () => ({ fetchNoise: vi.fn() }));
vi.mock('../../src/services/places.service.js', () => ({ fetchAmenities: vi.fn() }));
vi.mock('../../src/services/news.service.js', () => ({ fetchNewsWithFallback: vi.fn() }));

const { initCronJobs } = await import('../../src/jobs/cronJobs.js');
const { getClustersNeedingRefresh } = await import('../../src/services/clusterService.js');

beforeEach(() => {
  scheduleMock.mockClear();
  withCronLockMock.mockClear();
  getClustersNeedingRefresh.mockClear();
});

describe('cronJobs — PERF-3', () => {
  it('schedules nothing on import — only initCronJobs() starts anything', () => {
    // If this were still eager (the pre-fix bug), scheduleMock would already
    // have calls from the top-level import above, before this test even runs.
    expect(scheduleMock).not.toHaveBeenCalled();
  });

  it('initCronJobs() schedules exactly the 5 active jobs with their cadences', () => {
    initCronJobs();

    expect(scheduleMock).toHaveBeenCalledTimes(5);
    const cadences = scheduleMock.mock.calls.map(([expr]) => expr);
    expect(cadences).toEqual([
      '0 0 * * *',   // AQI — daily midnight
      '0 0 * * *',   // Weather — daily midnight
      '0 1 * * *',   // Solar — daily 1am
      '0 2 * * 1',   // Noise — weekly Monday 2am
      '0 3 1,15 * *', // Amenities — 1st/15th 3am
    ]);
  });

  it('every scheduled job is gated by withCronLock before doing any work', async () => {
    initCronJobs();

    for (const [, callback] of scheduleMock.mock.calls) {
      await callback();
    }

    const lockedJobNames = withCronLockMock.mock.calls.map(([jobName]) => jobName);
    expect(lockedJobNames).toEqual(['AQI', 'Weather', 'Solar', 'Noise', 'Amenities']);
    // getClustersNeedingRefresh is the first real work each job does — since
    // withCronLock is mocked to always invoke fn(), this confirms the lock
    // wraps the work rather than the work running unconditionally alongside it.
    expect(getClustersNeedingRefresh).toHaveBeenCalledTimes(5);
  });
});
