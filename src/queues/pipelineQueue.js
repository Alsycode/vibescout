// FILE: src/queues/pipelineQueue.js
// PURPOSE: PERF-1 — BullMQ queue for the intelligence pipeline. Replaces the
// old fire-and-forget `runPipeline(...).catch(...)` in analyze.routes.js:
// 100 concurrent /analyze/start calls used to mean ~100 pipelines running at
// once (each ~12 external calls) with no bound, no retry, and no recovery on
// a process restart. Enqueuing here returns immediately; a separate worker
// process (worker.js → src/workers/pipelineWorker.js) drains the queue with
// bounded concurrency.

import { Queue } from 'bullmq';
import { getQueueConnection } from '../lib/queueConnection.js';

export const PIPELINE_QUEUE_NAME = 'pipeline';
export const RUN_PIPELINE_JOB = 'run-pipeline';

let queue = null;

function getQueue() {
  if (!queue) {
    queue = new Queue(PIPELINE_QUEUE_NAME, { connection: getQueueConnection() });
  }
  return queue;
}

/**
 * @param {{ shadowPropertyId: string, sessionId: string, lat: number, lng: number,
 *           clusterId: string, cityName: string, locationCascade: string[] | null }} data
 */
export async function enqueuePipelineJob(data) {
  return getQueue().add(RUN_PIPELINE_JOB, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 3600 }, // 1h — enough to debug a recent run, doesn't grow forever
    removeOnFail: { age: 7 * 24 * 3600 }, // 7d — acts as the dead-letter queue for inspection
  });
}
