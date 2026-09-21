// FILE: src/lib/cronLock.js
// PURPOSE: PERF-3 — distributed lock so a cron job runs on exactly one process,
// even if the worker process (the only place cron now runs — see
// src/jobs/cronJobs.js) is ever scaled to more than one instance. Without
// this, N instances all firing the same '0 0 * * *' schedule means N×
// external API spend and racing writes to the same Cluster docs.

import { redis, prefixKey } from './redis.js';

/**
 * Attempts to acquire the named lock via Redis SET NX EX. Returns true if
 * this call acquired it (the job should run), false otherwise (another
 * instance is already running it, or the lock check itself failed).
 *
 * Fails closed on a Redis error: these jobs just refresh a cache, so
 * skipping one run and letting the next scheduled run retry is cheaper and
 * safer than risking a double-run while Redis is degraded anyway.
 */
export async function acquireCronLock(jobName, ttlSeconds) {
  try {
    const result = await redis.set(prefixKey(`cron:lock:${jobName}`), '1', { nx: true, ex: ttlSeconds });
    return result === 'OK';
  } catch (err) {
    console.error(`[CronLock] ${jobName} — lock check failed, skipping this run:`, err.message);
    return false;
  }
}

/** Runs `fn` only if the lock is acquired; otherwise logs and no-ops. */
export async function withCronLock(jobName, ttlSeconds, fn) {
  const acquired = await acquireCronLock(jobName, ttlSeconds);
  if (!acquired) {
    console.log(`[Cron:${jobName}] Skipped — lock held by another instance (or lock check failed)`);
    return;
  }
  await fn();
}
