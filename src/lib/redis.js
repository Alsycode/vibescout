// FILE: src/lib/redis.js
// PURPOSE: Upstash Redis client with safe get/set helpers

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Optional namespace for every key written through redisGet/redisSet.
// Empty in dev/prod (no behaviour change); set to e.g. "haum_test:" so test
// runs sharing a dev Upstash DB never collide with real cache entries.
// NOTE: the raw `redis` client export (used by apiUsage.service.js) is NOT
// prefixed — mock outbound HTTP in tests or use a dedicated test Upstash DB.
const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || '';

export function prefixKey(key) {
  return KEY_PREFIX + key;
}

export async function redisGet(key) {
  try {
    return await redis.get(prefixKey(key));
  } catch (err) {
    console.error('[Redis] GET error:', err.message);
    return null;
  }
}

export async function redisSet(key, value, exSeconds) {
  try {
    await redis.set(prefixKey(key), value, { ex: exSeconds });
  } catch (err) {
    console.error('[Redis] SET error:', err.message);
  }
}

export { redis };
