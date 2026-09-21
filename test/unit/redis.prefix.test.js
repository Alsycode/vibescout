// FILE: test/unit/redis.prefix.test.js
import { describe, it, expect, vi, afterEach } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('redis prefixKey', () => {
  it('is a no-op when REDIS_KEY_PREFIX is unset', async () => {
    vi.stubEnv('REDIS_KEY_PREFIX', '');
    vi.resetModules();
    const { prefixKey } = await import('../../src/lib/redis.js');
    expect(prefixKey('report:abc')).toBe('report:abc');
  });

  it('namespaces keys when REDIS_KEY_PREFIX is set', async () => {
    vi.stubEnv('REDIS_KEY_PREFIX', 'haum_test:');
    vi.resetModules();
    const { prefixKey } = await import('../../src/lib/redis.js');
    expect(prefixKey('report:abc')).toBe('haum_test:report:abc');
  });
});
