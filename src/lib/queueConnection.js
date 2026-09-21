// FILE: src/lib/queueConnection.js
// PURPOSE: PERF-1 — ioredis connection factory for BullMQ. Separate from
// src/lib/redis.js (Upstash's REST client, used for caching/rate-limit
// counters): BullMQ needs a real Redis TCP connection (blocking commands +
// Lua scripts), which the REST API cannot provide. Upstash's dashboard
// exposes a TCP endpoint ("Redis Connect" tab, a rediss:// URL) on the same
// database used for the REST client — no separate Redis instance needed.

import IORedis from 'ioredis';

let connection = null;

// One shared connection for Queue producers (the API process, adding jobs).
// A Worker (see src/workers/pipelineWorker.js) must use its own dedicated
// connection — BullMQ's rule, since a worker blocks on it.
export function getQueueConnection() {
  if (!connection) {
    connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
    });
  }
  return connection;
}

// Workers call this directly (never getQueueConnection) so each worker
// process has its own dedicated, non-shared connection.
export function createWorkerConnection() {
  return new IORedis(process.env.UPSTASH_REDIS_URL, {
    maxRetriesPerRequest: null,
  });
}
