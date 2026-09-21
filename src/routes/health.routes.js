// FILE: src/routes/health.routes.js
// PURPOSE: SEC-19 — liveness (`/health`) + readiness (`/ready`) endpoints for
//          load balancers / uptime monitors. No auth, no rate limiting.

import express from 'express';
import mongoose from 'mongoose';
import { redis } from '../lib/redis.js';

const router = express.Router();

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}

async function checkMongo() {
  if (mongoose.connection.readyState !== 1) return false;
  try {
    await withTimeout(mongoose.connection.db.admin().ping(), 3000);
    return true;
  } catch {
    return false;
  }
}

async function checkRedis() {
  try {
    const res = await withTimeout(redis.ping(), 3000);
    return res === 'PONG';
  } catch {
    return false;
  }
}

// Liveness: process is up and able to respond. No external calls.
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// Readiness: dependencies are reachable.
router.get('/ready', async (req, res) => {
  const [mongoOk, redisOk] = await Promise.all([checkMongo(), checkRedis()]);
  const ready = mongoOk && redisOk;
  res.status(ready ? 200 : 503).json({
    status: ready ? 'ok' : 'unavailable',
    mongo: mongoOk ? 'ok' : 'down',
    redis: redisOk ? 'ok' : 'down',
  });
});

export default router;
