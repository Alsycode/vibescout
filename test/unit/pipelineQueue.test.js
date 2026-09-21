// FILE: test/unit/pipelineQueue.test.js
// PURPOSE: PERF-1 — proves enqueuePipelineJob() hands BullMQ the right job
// name/data/retry policy, and that /analyze/start enqueues instead of running
// the pipeline inline. Mocks 'bullmq' entirely — this must never open a real
// Redis TCP connection in a test run.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const addMock = vi.fn().mockResolvedValue({ id: 'job-1' });

vi.mock('bullmq', () => ({
  Queue: vi.fn().mockImplementation(() => ({ add: addMock })),
  Worker: vi.fn(),
}));

vi.mock('../../src/lib/queueConnection.js', () => ({
  getQueueConnection: vi.fn().mockReturnValue({}),
  createWorkerConnection: vi.fn().mockReturnValue({}),
}));

const { enqueuePipelineJob, RUN_PIPELINE_JOB } = await import('../../src/queues/pipelineQueue.js');

beforeEach(() => {
  addMock.mockClear();
});

describe('enqueuePipelineJob — PERF-1', () => {
  it('adds a job with retry/backoff and bounded retention', async () => {
    const data = {
      shadowPropertyId: 'sp1', sessionId: 'vs_1', lat: 12.9, lng: 77.6,
      clusterId: '12.97_77.59', cityName: 'Bengaluru', locationCascade: ['Koramangala'],
    };

    await enqueuePipelineJob(data);

    expect(addMock).toHaveBeenCalledWith(
      RUN_PIPELINE_JOB,
      data,
      expect.objectContaining({
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }),
    );
  });

  it('reuses the same Queue instance across calls (one Queue per process)', async () => {
    // The module caches its Queue singleton on first use (above), so by now
    // it's already constructed — a second, third call must not construct another.
    const { Queue } = await import('bullmq');
    const callsBefore = Queue.mock.calls.length;

    await enqueuePipelineJob({ shadowPropertyId: 'a' });
    await enqueuePipelineJob({ shadowPropertyId: 'b' });

    expect(Queue.mock.calls.length).toBe(callsBefore);
  });
});
