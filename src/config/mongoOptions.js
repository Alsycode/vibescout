// FILE: src/config/mongoOptions.js
// PURPOSE: PERF-5 — mongoose.connect(uri) had no options anywhere in this repo:
// no pool bounds (Mongoose/the driver's own defaults — maxPoolSize 100 — are
// sized for nothing in particular, not this app's actual concurrency), no
// server-selection/socket timeouts (a network blip could hang a query
// indefinitely instead of failing fast), no explicit retryWrites.
//
// Two processes, two pool sizes: server.js (the API) serves many concurrent
// HTTP requests — worker.js (PERF-1) only ever has PIPELINE_CONCURRENCY (8)
// pipeline jobs in flight plus a handful of cron jobs, so it needs far fewer
// connections. Both share every other option.

const BASE_OPTIONS = {
  minPoolSize: 5,
  serverSelectionTimeoutMS: 5000, // fail fast if Mongo is unreachable, not hang
  socketTimeoutMS: 45000, // kill a query stuck on a dead socket instead of hanging forever
  retryWrites: true,
};

export const apiMongoOptions = { ...BASE_OPTIONS, maxPoolSize: 20 };
export const workerMongoOptions = { ...BASE_OPTIONS, maxPoolSize: 10 };
