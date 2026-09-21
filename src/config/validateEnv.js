// FILE: src/config/validateEnv.js
// PURPOSE: SEC-10 — validate required environment variables at process boot so a
//          misconfigured deploy fails loudly and immediately, instead of failing
//          silently or only on the first request that happens to need the var.

// Vars the app cannot run without. Missing any of these is a boot-time fatal error.
const REQUIRED_VARS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'UPSTASH_REDIS_URL', // PERF-1 — TCP (rediss://) endpoint for BullMQ; same Upstash DB, "Redis Connect" tab
  'FRONTEND_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'GOOGLE_PLACES_API_KEY',
  'GROQ_API_KEY',
];

// Vars a feature degrades without, but the process can still start. Logged as a
// warning, never fatal.
const RECOMMENDED_VARS = [
  'OPENAQ_API_KEY',
  'OPENWEATHER_API_KEY',
  'WAQI_API_KEY',
  'GNEWS_API_KEY',
  'NEWSAPI_API_KEY',
  'CPCB_API_KEY',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'EMAIL_HOST',
];

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Pure check — takes an env object (defaults to process.env) and returns
 * { ok, errors, warnings }. No process.exit here so it's unit-testable.
 */
export function checkEnv(env = process.env) {
  const errors = [];
  const warnings = [];

  for (const key of REQUIRED_VARS) {
    if (!env[key] || String(env[key]).trim() === '') {
      errors.push(`Missing required env var: ${key}`);
    }
  }

  if (env.JWT_SECRET && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    errors.push(
      `JWT_SECRET is ${env.JWT_SECRET.length} chars — must be at least ${MIN_JWT_SECRET_LENGTH}. ` +
      `Generate one: openssl rand -base64 48`,
    );
  }

  // SEC-09 — DEV_UNLOCK gates two backend routes (POST /dev/seed-report and
  // POST /payment/dev-unlock — free, no-payment report unlocks) and the
  // frontend's "skip payment" button. A single hard gate at boot: it's
  // physically impossible to run with NODE_ENV=production and these dev
  // backdoors enabled, regardless of what any individual route checks.
  if (env.NODE_ENV === 'production' && env.DEV_UNLOCK === 'true') {
    errors.push('DEV_UNLOCK must not be "true" when NODE_ENV=production — it enables unauthenticated free report unlocks.');
  }

  for (const key of RECOMMENDED_VARS) {
    if (!env[key] || String(env[key]).trim() === '') {
      warnings.push(`Recommended env var not set: ${key} (a dependent feature will be degraded/disabled)`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Boot-time entry point. Logs warnings, and on failure logs every error and
 * exits(1) — except under NODE_ENV=test, where it throws instead so a test can
 * assert on it without killing the test process.
 */
export function validateEnv(env = process.env) {
  const result = checkEnv(env);

  for (const w of result.warnings) console.warn(`[Config] ${w}`);

  if (!result.ok) {
    console.error('[Config] Invalid environment — refusing to start:');
    for (const e of result.errors) console.error(`[Config]   - ${e}`);
    if (env.NODE_ENV === 'test') {
      throw new Error(`Invalid environment: ${result.errors.join('; ')}`);
    }
    process.exit(1);
  }

  return result;
}

// Side-effecting default export for `import './config/validateEnv.js'` in server.js.
if (process.env.NODE_ENV !== 'test') {
  validateEnv();
}
