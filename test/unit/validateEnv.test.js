// FILE: test/unit/validateEnv.test.js
import { describe, it, expect } from 'vitest';
import { checkEnv, validateEnv } from '../../src/config/validateEnv.js';

const VALID_ENV = {
  MONGODB_URI: 'mongodb://localhost:27017/haum_test',
  JWT_SECRET: 'a'.repeat(32),
  UPSTASH_REDIS_REST_URL: 'https://test-db.upstash.io',
  UPSTASH_REDIS_REST_TOKEN: 'token',
  UPSTASH_REDIS_URL: 'rediss://default:token@test-db.upstash.io:6379',
  FRONTEND_URL: 'http://localhost:3000',
  RAZORPAY_KEY_ID: 'rzp_test_x',
  RAZORPAY_KEY_SECRET: 'secret',
  RAZORPAY_WEBHOOK_SECRET: 'webhook-secret',
  GOOGLE_PLACES_API_KEY: 'key',
  GROQ_API_KEY: 'key',
};

describe('checkEnv', () => {
  it('passes with every required var present and a long-enough JWT_SECRET', () => {
    const result = checkEnv(VALID_ENV);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('reports every missing required var, not just the first', () => {
    const result = checkEnv({ ...VALID_ENV, MONGODB_URI: '', GROQ_API_KEY: undefined });
    expect(result.ok).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('MONGODB_URI'),
        expect.stringContaining('GROQ_API_KEY'),
      ]),
    );
  });

  it('rejects a JWT_SECRET shorter than 32 chars', () => {
    const result = checkEnv({ ...VALID_ENV, JWT_SECRET: 'short' });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('JWT_SECRET'))).toBe(true);
  });

  it('warns (but does not fail) on missing recommended vars', () => {
    const result = checkEnv({ ...VALID_ENV, OPENAQ_API_KEY: '' });
    expect(result.ok).toBe(true);
    expect(result.warnings.some((w) => w.includes('OPENAQ_API_KEY'))).toBe(true);
  });

  // SEC-09 — one hard gate: DEV_UNLOCK can never be 'true' in production.
  it('rejects NODE_ENV=production with DEV_UNLOCK=true', () => {
    const result = checkEnv({ ...VALID_ENV, NODE_ENV: 'production', DEV_UNLOCK: 'true' });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('DEV_UNLOCK'))).toBe(true);
  });

  it('allows NODE_ENV=production with DEV_UNLOCK unset or false', () => {
    expect(checkEnv({ ...VALID_ENV, NODE_ENV: 'production' }).ok).toBe(true);
    expect(checkEnv({ ...VALID_ENV, NODE_ENV: 'production', DEV_UNLOCK: 'false' }).ok).toBe(true);
  });

  it('allows DEV_UNLOCK=true outside production', () => {
    expect(checkEnv({ ...VALID_ENV, NODE_ENV: 'development', DEV_UNLOCK: 'true' }).ok).toBe(true);
  });
});

describe('validateEnv', () => {
  it('returns the result when the env is valid', () => {
    expect(validateEnv(VALID_ENV).ok).toBe(true);
  });

  it('throws (rather than exiting the process) under NODE_ENV=test', () => {
    expect(() => validateEnv({ ...VALID_ENV, JWT_SECRET: 'x', NODE_ENV: 'test' })).toThrow(/Invalid environment/);
  });
});
