// FILE: test/unit/pipelineWorker.test.js
// PURPOSE: PERF-1 — proves the job processor calls runPipeline with the job's
// data, and that createPipelineWorker() wires bounded concurrency onto a
// dedicated (not shared) Redis connection. Mocks 'bullmq'/ioredis entirely.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const runPipelineMock = vi.fn().mockResolvedValue(undefined);
vi.mock('../../src/services/intelligencePipeline.service.js', () => ({
  runPipeline: runPipelineMock,
}));

const WorkerMock = vi.fn().mockImplementation(() => ({
  on: vi.fn(),
}));
vi.mock('bullmq', () => ({
  Worker: WorkerMock,
  Queue: vi.fn(),
}));

const createWorkerConnectionMock = vi.fn().mockReturnValue({ dedicated: true });
vi.mock('../../src/lib/queueConnection.js', () => ({
  createWorkerConnection: createWorkerConnectionMock,
  getQueueConnection: vi.fn(),
}));

const { processPipelineJob, createPipelineWorker } = await import('../../src/workers/pipelineWorker.service.js');
const { PIPELINE_QUEUE_NAME } = await import('../../src/queues/pipelineQueue.js');

beforeEach(() => {
  runPipelineMock.mockClear();
  WorkerMock.mockClear();
  createWorkerConnectionMock.mockClear();
});

describe('processPipelineJob — PERF-1', () => {
  it('calls runPipeline with the job data fields, in order', async () => {
    const job = {
      id: 'job-1',
      attemptsMade: 0,
      data: {
        shadowPropertyId: 'sp1', sessionId: 'vs_1', lat: 12.9, lng: 77.6,
        clusterId: '12.97_77.59', cityName: 'Bengaluru', locationCascade: ['Koramangala'],
      },
    };

    await processPipelineJob(job);

    expect(runPipelineMock).toHaveBeenCalledWith('sp1', 12.9, 77.6, '12.97_77.59', 'Bengaluru', ['Koramangala']);
  });

  it('lets a thrown error propagate (so BullMQ retries per the queue policy)', async () => {
    runPipelineMock.mockRejectedValueOnce(new Error('Mongo down'));
    const job = { id: 'job-2', attemptsMade: 0, data: { shadowPropertyId: 'sp2', sessionId: 'vs_2' } };

    await expect(processPipelineJob(job)).rejects.toThrow('Mongo down');
  });
});

describe('createPipelineWorker — PERF-1', () => {
  it('wires the pipeline queue with bounded concurrency on a dedicated connection', () => {
    createPipelineWorker();

    expect(WorkerMock).toHaveBeenCalledWith(
      PIPELINE_QUEUE_NAME,
      processPipelineJob,
      expect.objectContaining({ concurrency: 8, connection: { dedicated: true } }),
    );
    // Never the shared producer connection — a worker blocks on its connection.
    expect(createWorkerConnectionMock).toHaveBeenCalledTimes(1);
  });

  it('accepts a custom concurrency', () => {
    createPipelineWorker({ concurrency: 3 });

    expect(WorkerMock).toHaveBeenCalledWith(
      PIPELINE_QUEUE_NAME,
      processPipelineJob,
      expect.objectContaining({ concurrency: 3 }),
    );
  });
});
