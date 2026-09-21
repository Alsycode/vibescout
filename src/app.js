// FILE: src/app.js
// PURPOSE: Build and export the configured Express app (middleware + routes).
//          NO side effects: no DB connection, no cron, no app.listen().
//          server.js wires those around this. Tests import this directly.

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler.js';
import { requestId } from './middleware/requestId.js';
import { requestTimeout } from './middleware/requestTimeout.js';
import { csrfProtection } from './middleware/csrf.js';
import { apiLimiter, authLimiter, adminAuthLimiter, analyzeLimiter, reportLimiter, funnelLimiter } from './middleware/rateLimiter.js';

import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import analyzeRoutes from './routes/analyze.routes.js';
import funnelRoutes from './routes/funnel.routes.js';
import reportRoutes from './routes/report.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminAuthRoutes from './routes/admin/auth.admin.routes.js';
import shadowPropertiesAdminRoutes from './routes/admin/shadowProperties.admin.routes.js';
import leadsAdminRoutes from './routes/admin/leads.admin.routes.js';
import brokersAdminRoutes from './routes/admin/brokers.admin.routes.js';
import clustersAdminRoutes from './routes/admin/clusters.admin.routes.js';
import blogAdminRoutes from './routes/admin/blog.admin.routes.js';
import analyticsAdminRoutes from './routes/admin/analytics.admin.routes.js';
import apiUsageAdminRoutes from './routes/admin/apiUsage.admin.routes.js';
import postsRoutes from './routes/posts.routes.js';

const app = express();

// SEC-05 — trust exactly one reverse-proxy hop (LB/CDN) so req.ip resolves to
// the real client rather than the proxy, which the Redis-backed rate
// limiters below key on. A no-op locally/direct-connect (no X-Forwarded-For
// to trust in the first place).
app.set('trust proxy', 1);

// SEC-06 — first, so every response (including errors) carries one, and the
// error handler always has req.id available regardless of where a request
// failed.
app.use(requestId);

// SEC-08 — this is a pure JSON API (no route renders HTML — verified: no
// `res.send`/`res.redirect`/`text/html` anywhere under src/), so CSP's
// default-src 'none' can't break a real page; it's defense-in-depth against
// an HTML response ever slipping out (e.g. a framework default error page).
// frame-ancestors 'none' + frameguard 'deny' mean this API can never be
// framed. Permissions-Policy has no helmet default (dropped after v5), so
// it's set explicitly — the API uses none of these browser features itself.
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'no-referrer' },
}));
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()'
  );
  next();
});

app.use(compression());
app.use(requestTimeout(15000));

// SEC-19 — unauthenticated, unrate-limited health checks for LB / uptime monitors
app.use(healthRoutes);

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());
// SEC-02 — the Razorpay webhook needs the exact raw request bytes to verify
// X-Razorpay-Signature (re-serializing req.body can produce different bytes
// than what Razorpay signed). Capture them alongside normal JSON parsing
// rather than adding a second body-parser mounted ahead of this one.
app.use(express.json({ limit: '32kb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

// SEC-03 — reject cross-site state-changing requests before they reach any
// route (auth is ambient-cookie-based, so this is the CSRF layer). Applied
// after body/cookie parsing but before every mutating route, including the
// Razorpay webhook — that request has no Origin/Referer at all, so it passes
// through untouched (see csrf.js) and is authenticated by its own signature.
app.use(csrfProtection([process.env.FRONTEND_URL]));

// SEC-05 — global backstop for every route. Previously mounted at '/api',
// which the Next.js rewrite strips before the request reaches this backend
// (see frontend/next.config.js) — it never actually applied to anything.
app.use(apiLimiter);

app.use('/auth', authLimiter, authRoutes);
app.use('/analyze', analyzeLimiter, analyzeRoutes);
app.use('/funnel', funnelLimiter, funnelRoutes);
app.use('/report', reportLimiter, reportRoutes);
app.use('/payment', paymentRoutes);
app.use('/admin/auth', adminAuthLimiter, adminAuthRoutes);
app.use('/admin/shadow-properties', shadowPropertiesAdminRoutes);
app.use('/admin/leads', leadsAdminRoutes);
app.use('/admin/brokers', brokersAdminRoutes);
app.use('/admin/clusters', clustersAdminRoutes);
app.use('/admin/blog', blogAdminRoutes);
app.use('/admin/analytics', analyticsAdminRoutes);
app.use('/admin/api-usage', apiUsageAdminRoutes);
app.use('/posts', postsRoutes);

// Dev-only route — only imported + mounted when DEV_UNLOCK=true
if (process.env.DEV_UNLOCK === 'true') {
  const devTestRoutes = (await import('./routes/devTest.routes.js')).default;
  app.use('/dev', devTestRoutes);
  console.log('[Server] Dev test routes mounted at /dev');
}

app.use(errorHandler);

export default app;
