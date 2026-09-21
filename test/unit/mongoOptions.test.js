// FILE: test/unit/mongoOptions.test.js
// PURPOSE: PERF-5 — regression guard for the connection-pool/timeout options
// server.js and worker.js pass to mongoose.connect(); previously none.

import { describe, it, expect } from 'vitest';
import { apiMongoOptions, workerMongoOptions } from '../../src/config/mongoOptions.js';

describe('mongoOptions — PERF-5', () => {
  it('both processes set fail-fast timeouts and retryWrites', () => {
    for (const opts of [apiMongoOptions, workerMongoOptions]) {
      expect(opts.serverSelectionTimeoutMS).toBe(5000);
      expect(opts.socketTimeoutMS).toBe(45000);
      expect(opts.retryWrites).toBe(true);
      expect(opts.minPoolSize).toBe(5);
    }
  });

  it('the API process gets a larger pool than the worker — it serves concurrent HTTP requests, not a bounded job queue', () => {
    expect(apiMongoOptions.maxPoolSize).toBeGreaterThan(workerMongoOptions.maxPoolSize);
  });

  it('maxPoolSize is always >= minPoolSize for both', () => {
    expect(apiMongoOptions.maxPoolSize).toBeGreaterThanOrEqual(apiMongoOptions.minPoolSize);
    expect(workerMongoOptions.maxPoolSize).toBeGreaterThanOrEqual(workerMongoOptions.minPoolSize);
  });
});
