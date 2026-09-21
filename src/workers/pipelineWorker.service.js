// FILE: src/workers/pipelineWorker.service.js
// PURPOSE: PERF-1 — the BullMQ job processor for the intelligence pipeline,
// kept separate from the Worker wiring below so it's unit-testable without a
// real Redis connection (see test/unit/pipelineWorker.test.js).

import { Worker } from 'bullmq';
import { PIPELINE_QUEUE_NAME } from '../queues/pipelineQueue.js';
import { runPipeline } from '../services/intelligencePipeline.service.js';
import { createWorkerConnection } from '../lib/queueConnection.js';

// Bounded concurrency — was unbounded (one pipeline per incoming request,
// each ~12 external calls) before PERF-1. Start conservative; raise once
// PERF-7's per-provider caps/circuit breakers are in place.
const DEFAULT_CONCURRENCY = 8;

export async function processPipelineJob(job) {
  const { shadowPropertyId, sessionId, lat, lng, clusterId, cityName, locationCascade } = job.data;
  console.log(`[PipelineWorker] job ${job.id} — starting session ${sessionId} (attempt ${job.attemptsMade + 1})`);
  await runPipeline(shadowPropertyId, lat, lng, clusterId, cityName, locationCascade);
  console.log(`[PipelineWorker] job ${job.id} — done session ${sessionId}`);
}

export function createPipelineWorker({ concurrency = DEFAULT_CONCURRENCY } = {}) {
  const worker = new Worker(PIPELINE_QUEUE_NAME, processPipelineJob, {
    connection: createWorkerConnection(),
    concurrency,
  });

  worker.on('completed', (job) => {
    console.log(`[PipelineWorker] completed ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    // Job is `undefined` if it failed before even being processed (e.g. a
    // connection drop) — BullMQ's own contract, guard for it.
    const attempts = job ? `${job.attemptsMade}/${job.opts.attempts}` : '?';
    console.error(`[PipelineWorker] job ${job?.id} failed (attempt ${attempts}):`, err.message);
  });

  worker.on('error', (err) => {
    // Worker/connection-level errors (not job failures) — e.g. Redis dropped.
    console.error('[PipelineWorker] worker error:', err.message);
  });

  return worker;
}
