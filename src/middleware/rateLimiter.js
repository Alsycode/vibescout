// FILE: src/middleware/rateLimiter.js
// PURPOSE: SEC-05/PERF-2 — Redis-backed (Upstash) rate limiters, shared across
// every backend instance. Replaces express-rate-limit's default in-memory
// store, which resets on every deploy and — worse — is invisible across
// horizontally-scaled instances (each one silently gets its own private
// quota, multiplying every limit by the instance count).
//
// Fail-open by design: if Upstash is slow or unreachable, requests are let
// through rather than the whole API going down because a secondary defense
// (this is defense-in-depth, not the auth boundary) had a bad moment. Bounded
// two ways — the SDK's own `timeout` races the real check against a short
// clock and resolves `{success:true}` if it loses; a try/catch around the
// call covers outright errors (DNS failure, Upstash down) that reject before
// that timeout fires.

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '../lib/redis.js';

// Bounds every rate-limit check to at most this long before failing open —
// Upstash REST typically responds in well under 100ms, so this only bites
// during a real outage/network problem.
const REDIS_CHECK_TIMEOUT_MS = 500;

function createLimiter({ max, window, prefix, message }) {
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, window),
    prefix: `ratelimit:${prefix}`,
    analytics: false,
    timeout: REDIS_CHECK_TIMEOUT_MS,
  });

  return async function rateLimitMiddleware(req, res, next) {
    try {
      // IP-based, matching the previous express-rate-limit behavior and the
      // plan's own test scenario ("25 logins/min from one IP"). Requires
      // `app.set('trust proxy', ...)` (set in app.js) to see the real client
      // IP rather than a load balancer's, once deployed behind one.
      const identifier = req.ip;
      const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

      res.setHeader('RateLimit-Limit', limit);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', reset);

      if (!success) {
        return res.status(429).json({ error: message });
      }
      next();
    } catch (err) {
      console.error(`[RateLimiter:${prefix}] Redis error — failing open:`, err.message);
      next();
    }
  };
}

// Global backstop — mounted at the app root (see app.js). The old
// `apiLimiter` was mounted at '/api', which the Next.js rewrite strips
// before the request ever reaches this backend, so it never actually
// limited anything; this one applies to every request.
export const apiLimiter = createLimiter({
  max: 100,
  window: '15 m',
  prefix: 'global',
  message: 'Too many requests, please try again later.',
});

export const authLimiter = createLimiter({
  max: 20,
  window: '15 m',
  prefix: 'auth',
  message: 'Too many auth attempts, please try again later.',
});

// Stricter than authLimiter — admin login is a higher-value brute-force target.
export const adminAuthLimiter = createLimiter({
  max: 5,
  window: '15 m',
  prefix: 'admin-auth',
  message: 'Too many admin login attempts, please try again later.',
});

export const analyzeLimiter = createLimiter({
  max: 30,
  window: '60 m',
  prefix: 'analyze',
  message: 'Too many analysis requests, please try again later.',
});

export const reportLimiter = createLimiter({
  max: 60,
  window: '60 m',
  prefix: 'report',
  message: 'Too many report requests, please try again later.',
});

// SEC-02 — /payment had no limiter at all. Applied per-authenticated-user
// route (create-order/verify/dev-unlock), not the webhook (that's protected
// by signature verification and called by Razorpay's own infrastructure).
export const paymentLimiter = createLimiter({
  max: 20,
  window: '15 m',
  prefix: 'payment',
  message: 'Too many payment requests, please try again later.',
});

// Generous, IP-based — guards the webhook endpoint against basic flooding
// before it spends CPU on signature verification / a DB lookup, without
// risking dropped legitimate delivery retries from Razorpay.
export const webhookLimiter = createLimiter({
  max: 120,
  window: '1 m',
  prefix: 'webhook',
  message: 'Too many webhook requests.',
});

// SEC-05 — /funnel had no limiter at all.
export const funnelLimiter = createLimiter({
  max: 60,
  window: '15 m',
  prefix: 'funnel',
  message: 'Too many funnel requests, please try again later.',
});
