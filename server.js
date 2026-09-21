// FILE: server.js
// PURPOSE: Runtime bootstrap — load env, connect MongoDB, start cron, listen.
//          The Express app itself lives in src/app.js (imported below) so tests
//          can mount it without DB / cron / listen side effects.

import 'dotenv/config';
import './src/config/validateEnv.js'; // SEC-10 — exits(1) before anything else runs if env is invalid
import mongoose from 'mongoose';

import { apiMongoOptions } from './src/config/mongoOptions.js';
import { shutdownApiUsage } from './src/services/apiUsage.service.js';
import app from './src/app.js';
// PERF-3 — cron no longer starts here. This process is autoscaled (multiple
// API instances behind a load balancer); cron now runs only in worker.js,
// the single designated owner, guarded further by a Redis lock in case that
// process itself is ever scaled out. See src/jobs/cronJobs.js.

const PORT = process.env.PORT || 3001;

// SEC-20 — graceful shutdown: stop accepting new connections, let in-flight
// requests drain, close Mongo, then exit. No dropped 502s on deploy.
// Registered up front (not inside the connect().then()) so a signal that
// arrives while still connecting to Mongo is also handled cleanly, instead
// of falling through to Node's default (immediate, non-graceful) behavior.
let server = null;
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[Server] ${signal} received — shutting down gracefully`);

  const forceExit = setTimeout(() => {
    console.error('[Server] Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  const finish = async (err) => {
    if (err) console.error('[Server] Error closing HTTP server:', err.message);
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

  if (server) {
    server.close(finish);
  } else {
    finish();
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

mongoose.connect(process.env.MONGODB_URI, apiMongoOptions)
  .then(() => {
    console.log('[MongoDB] Connected');
    server = app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
    });

    // PERF-8 — tuned for running behind a load balancer / proxy
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  })
  .catch((err) => {
    console.error('[MongoDB] Connection failed:', err.message);
    process.exit(1);
  });

export default app;
