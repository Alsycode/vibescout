// FILE: test/setup.js
// PURPOSE: Global test bootstrap. Loads .env.test (falling back to .env) and
//          backfills safe dummy values so pure unit tests never reach real infra.
//          Actual DB connection + the "_test" guard live in test/helpers/db.js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import nock from 'nock';
import { beforeAll, afterEach, afterAll } from 'vitest';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const file of ['.env.test', '.env']) {
  const full = path.join(root, file);
  if (fs.existsSync(full)) {
    dotenv.config({ path: full });
    break;
  }
}

process.env.NODE_ENV = 'test';

// Backfill anything a module might read at import time. Never overrides a value
// the developer set in .env.test.
const defaults = {
  JWT_SECRET: 'test-jwt-secret-not-a-real-secret-min-32-chars',
  JWT_EXPIRES_IN: '7d',
  UPSTASH_REDIS_REST_URL: 'https://test-db.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'test-upstash-token',
  UPSTASH_REDIS_URL: 'rediss://default:test-token@test-db.upstash.io:6379',
  RAZORPAY_KEY_ID: 'rzp_test_dummy',
  RAZORPAY_KEY_SECRET: 'test-razorpay-secret',
  RAZORPAY_WEBHOOK_SECRET: 'test-razorpay-webhook-secret',
  FRONTEND_URL: 'http://localhost:3000',
};

for (const [key, value] of Object.entries(defaults)) {
  if (!process.env[key]) process.env[key] = value;
}

// External HTTP is never real in tests. Loopback stays open so supertest
// (src/app.js via test/smoke/*) can talk to its own ephemeral server; every
// other host must be mocked via test/mocks/externalApis.js or the request
// throws loudly (NetConnectNotAllowedError) instead of hitting a real API.
beforeAll(() => {
  nock.disableNetConnect();
  nock.enableNetConnect(/^(127\.0\.0\.1|::1|localhost)/);
});

afterEach(() => {
  nock.cleanAll();
});

afterAll(() => {
  nock.enableNetConnect();
});
