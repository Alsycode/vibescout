// FILE: test/smoke/app.smoke.test.js
// Proves the Express app can be imported and driven by supertest with no DB.
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('app smoke', () => {
  it('protected admin route returns 401 without a session cookie', async () => {
    const res = await request(app).get('/admin/leads');
    expect(res.status).toBe(401);
  });

  it('unknown route returns 404', async () => {
    const res = await request(app).get('/definitely-not-a-route');
    expect(res.status).toBe(404);
  });

  it('GET /health is 200 with no DB/Redis connection', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /ready is 503 when Mongo is unreachable', async () => {
    // Mongo is never connected in this test process (src/app.js has no DB side
    // effects — see test/helpers/db.js). Redis may reach the real Upstash
    // instance if a developer's real .env is loaded as a fallback, so only
    // assert the invariant that matters: no Mongo connection => not ready.
    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('unavailable');
    expect(res.body.mongo).toBe('down');
  });
});
