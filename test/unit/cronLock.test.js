// FILE: test/unit/cronLock.test.js
// PURPOSE: PERF-3 — proves the cron lock actually gates execution: acquired
// → runs, not acquired → skipped, and a Redis error fails closed (skips)
// rather than letting two instances race.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const setMock = vi.fn();
vi.mock('../../src/lib/redis.js', () => ({
  redis: { set: setMock },
  prefixKey: (key) => `test:${key}`,
}));

const { acquireCronLock, withCronLock } = await import('../../src/lib/cronLock.js');

beforeEach(() => {
  setMock.mockReset();
});

describe('acquireCronLock — PERF-3', () => {
  it('acquires with SET NX EX on the prefixed key', async () => {
    setMock.mockResolvedValue('OK');
    const acquired = await acquireCronLock('AQI', 1800);

    expect(acquired).toBe(true);
    expect(setMock).toHaveBeenCalledWith('test:cron:lock:AQI', '1', { nx: true, ex: 1800 });
  });

  it('returns false when another instance already holds the lock (NX miss → null)', async () => {
    setMock.mockResolvedValue(null);
    expect(await acquireCronLock('AQI', 1800)).toBe(false);
  });

  it('fails closed — a Redis error is treated as lock-not-acquired, not thrown', async () => {
    setMock.mockRejectedValue(new Error('Upstash down'));
    await expect(acquireCronLock('AQI', 1800)).resolves.toBe(false);
  });
});

describe('withCronLock — PERF-3', () => {
  it('runs fn when the lock is acquired', async () => {
    setMock.mockResolvedValue('OK');
    const fn = vi.fn().mockResolvedValue(undefined);

    await withCronLock('Weather', 1800, fn);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not run fn when the lock is not acquired', async () => {
    setMock.mockResolvedValue(null);
    const fn = vi.fn();

    await withCronLock('Weather', 1800, fn);

    expect(fn).not.toHaveBeenCalled();
  });
});
