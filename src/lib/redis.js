// FILE: src/lib/redis.js
// PURPOSE: Upstash Redis client with safe get/set helpers

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function redisGet(key) {
  try {
    return await redis.get(key);
  } catch (err) {
    console.error('[Redis] GET error:', err.message);
    return null;
  }
}

export async function redisSet(key, value, exSeconds) {
  try {
    await redis.set(key, value, { ex: exSeconds });
  } catch (err) {
    console.error('[Redis] SET error:', err.message);
  }
}

export { redis };
