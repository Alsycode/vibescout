// FILE: test/unit/perf7ProviderGuard.test.js
// PURPOSE: PERF-7 — proves providerGuard's three protections work in isolation:
// per-provider concurrency capping, the circuit breaker opening after repeated
// failures (and short-circuiting further calls without invoking the task), and
// the daily spend cap forcing every caller to its fallback once spent.

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  guardedCall,
  ProviderCapExceededError,
  _resetProviderGuardState,
  _setDailyCountForTest,
} from '../../src/lib/providerGuard.js';

beforeEach(() => {
  _resetProviderGuardState();
});

describe('providerGuard — concurrency cap', () => {
  it('never runs more than N tasks concurrently for a capped provider', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const task = () => new Promise((resolve) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      setTimeout(() => { inFlight -= 1; resolve('ok'); }, 20);
    });

    // 'Nominatim (OSM)' is capped at 1 in providerGuard.js
    await Promise.all(Array.from({ length: 5 }, () => guardedCall('Nominatim (OSM)', task)));

    expect(maxInFlight).toBe(1);
  });

  it('an uncapped provider runs tasks in parallel, not serialized', async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const task = () => new Promise((resolve) => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      setTimeout(() => { inFlight -= 1; resolve('ok'); }, 20);
    });

    await Promise.all(Array.from({ length: 5 }, () => guardedCall('Some Unlisted Provider', task)));

    expect(maxInFlight).toBeGreaterThan(1);
  });
});

describe('providerGuard — circuit breaker', () => {
  it('opens after repeated failures and then skips the task entirely', async () => {
    const failingTask = vi.fn().mockRejectedValue(new Error('boom'));

    // volumeThreshold=5, errorThresholdPercentage=50 — enough consecutive
    // failures on a fresh provider name trips it open.
    for (let i = 0; i < 6; i++) {
      await expect(guardedCall('Flaky Test Provider', failingTask)).rejects.toThrow();
    }
    const callsBeforeOpen = failingTask.mock.calls.length;
    expect(callsBeforeOpen).toBeGreaterThan(0);

    failingTask.mockClear();
    await expect(guardedCall('Flaky Test Provider', failingTask)).rejects.toThrow();
    // Breaker is open — the task itself must not have been invoked again.
    expect(failingTask).not.toHaveBeenCalled();
  });

  it('a healthy provider is unaffected by another provider tripping', async () => {
    const okTask = vi.fn().mockResolvedValue('fine');
    await expect(guardedCall('Healthy Test Provider', okTask)).resolves.toBe('fine');
    expect(okTask).toHaveBeenCalledTimes(1);
  });
});

describe('providerGuard — daily spend cap', () => {
  it('rejects with ProviderCapExceededError without calling the task once spent', async () => {
    const task = vi.fn().mockResolvedValue('called');

    // 'Groq' has a configured DAILY_CAP in providerGuard.js — fast-forward its
    // in-memory counter to one below the cap so the next call trips it.
    _setDailyCountForTest('Groq', 19999);
    await expect(guardedCall('Groq', task)).resolves.toBe('called'); // 20000th — allowed, hits the cap
    expect(task).toHaveBeenCalledTimes(1);

    task.mockClear();
    await expect(guardedCall('Groq', task)).rejects.toBeInstanceOf(ProviderCapExceededError);
    expect(task).not.toHaveBeenCalled();
  });

  it('an uncapped provider never rejects this way no matter how many times called', async () => {
    const task = vi.fn().mockResolvedValue('called');
    for (let i = 0; i < 10; i++) {
      await expect(guardedCall('Uncapped Provider', task)).resolves.toBe('called');
    }
    expect(task).toHaveBeenCalledTimes(10);
  });

  it('ProviderCapExceededError carries the provider name', () => {
    const err = new ProviderCapExceededError('Groq');
    expect(err.name).toBe('ProviderCapExceededError');
    expect(err.provider).toBe('Groq');
    expect(err.message).toContain('Groq');
  });
});
