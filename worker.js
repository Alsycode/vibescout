// FILE: worker.js
// PURPOSE: PERF-1 — separate process that drains the pipeline queue. Deployed
// as a second PM2 process alongside server.js (see DEPLOYMENT.md), never
// co-located with the API process — the whole point is bounding pipeline
// concurrency independently of how many API requests are coming in.
// PERF-3 — also cron's single owner (src/jobs/cronJobs.js#initCronJobs): the
// API process is autoscaled, so cron can't safely live there (N instances ×
// every job); this process is the one designated place it runs, backstopped
// by a Redis lock in cronJobs.js in case this process is itself ever scaled out.
// Intentionally does NOT import src/app.js or app.listen(): this process
// holds a Mongo connection, a BullMQ Worker, and cron — no HTTP server.

import 'dotenv/config';
import './src/config/validateEnv.js'; // exits(1) before anything else runs if env is invalid
import mongoose from 'mongoose';

import { workerMongoOptions } from './src/config/mongoOptions.js';
import { createPipelineWorker } from './src/workers/pipelineWorker.service.js';
import { initCronJobs } from './src/jobs/cronJobs.js'; // PERF-3 — cron's single owner
import { shutdownApiUsage } from './src/services/apiUsage.service.js';

let worker = null;
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Worker] ${signal} received — shutting down gracefully`);

  const forceExit = setTimeout(() => {
    console.error('[Worker] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 30000); // BullMQ jobs in flight (a pipeline run) can take longer than an HTTP request
  forceExit.unref();

  const finish = async (err) => {
    if (err) console.error('[Worker] Error closing worker:', err.message);
    try {
      await shutdownApiUsage(); // PERF-6 — flush the in-process API-usage counters
    } catch (usageErr) {
      console.error('[ApiUsage] Error flushing on shutdown:', usageErr.message);
    }
    try {
      await mongoose.connection.close();
      console.log('[MongoDB] Connection closed');
    } catch (closeErr) {
      console.error('[MongoDB] Error closing connection:', closeErr.message);
    }
    clearTimeout(forceExit);
    process.exit(err ? 1 : 0);
  };

  if (worker) {
    // BullMQ's close() waits for in-flight jobs to finish before resolving.
    worker.close().then(() => finish()).catch(finish);
  } else {
    finish();
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

mongoose.connect(process.env.MONGODB_URI, workerMongoOptions)
  .then(() => {
    console.log('[MongoDB] Connected');
    worker = createPipelineWorker();
    console.log('[Worker] Pipeline worker started');
    initCronJobs();
  })
  .catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });
