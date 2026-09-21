// FILE: test/unit/perf6ApiUsageBatching.test.js
// PURPOSE: PERF-6 — proves recordApiCall accumulates counts in-process instead
// of writing to Redis on every outbound call, and that shutdownApiUsage flushes
// the accumulator as one pipelined write so counts aren't lost on shutdown.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const hincrbyMock = vi.fn();
const expireMock = vi.fn();
const saddMock = vi.fn();
const execMock = vi.fn().mockResolvedValue([]);

const pipelineMock = vi.fn(() => ({
  hincrby: hincrbyMock,
  expire: expireMock,
  sadd: saddMock,
  exec: execMock,
}));

vi.mock('../../src/lib/redis.js', () => ({
  redis: { pipeline: pipelineMock },
}));

const { recordApiCall, shutdownApiUsage } = await import('../../src/services/apiUsage.service.js');

beforeEach(async () => {
  // Drain anything left pending by the previous test (the accumulator is a
  // module-level singleton, shared across tests in this file) before resetting
  // the mocks so each test starts from a clean slate.
  await shutdownApiUsage();
  hincrbyMock.mockClear();
  expireMock.mockClear();
  saddMock.mockClear();
  execMock.mockClear();
  pipelineMock.mockClear();
});

describe('recordApiCall — PERF-6 batching', () => {
  it('does not touch Redis synchronously — writes are deferred to the flush', () => {
    recordApiCall('https://api.groq.com/openai/v1/chat/completions', { ok: true });
    expect(pipelineMock).not.toHaveBeenCalled();
  });

  it('shutdownApiUsage flushes accumulated counts as one pipelined write', async () => {
    recordApiCall('https://api.groq.com/openai/v1/chat/completions', { ok: true });
    recordApiCall('https://api.groq.com/openai/v1/chat/completions', { ok: true });
    recordApiCall('https://api.groq.com/openai/v1/chat/completions', { ok: false });

    await shutdownApiUsage();

    expect(pipelineMock).toHaveBeenCalledTimes(1);
    // 3 calls (2 ok + 1 err) collapsed into a single pipelined write per counter,
    // not 3 separate round-trip pipelines — the point of batching.
    expect(hincrbyMock).toHaveBeenCalledWith(expect.stringContaining('apiusage:month:'), 'Groq', 3);
    expect(hincrbyMock).toHaveBeenCalledWith(expect.stringContaining('apiusage:month:'), 'Groq:ok', 2);
    expect(hincrbyMock).toHaveBeenCalledWith(expect.stringContaining('apiusage:month:'), 'Groq:err', 1);
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('a flush with nothing pending is a no-op', async () => {
    await shutdownApiUsage();
    expect(pipelineMock).not.toHaveBeenCalled();
  });

  it('counts for different providers are tracked independently', async () => {
    recordApiCall('https://api.groq.com/x', { ok: true });
    recordApiCall('https://nominatim.openstreetmap.org/reverse', { ok: true });

    await shutdownApiUsage();

    expect(hincrbyMock).toHaveBeenCalledWith(expect.stringContaining('apiusage:month:'), 'Groq', 1);
    expect(hincrbyMock).toHaveBeenCalledWith(expect.stringContaining('apiusage:month:'), 'Nominatim (OSM)', 1);
  });
});
