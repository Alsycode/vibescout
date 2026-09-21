# Production Deployment Checklist

Everything required to get Vibescout live and working in production. This is the
**deployment-day** checklist — accounts, secrets, infra, deploy steps, smoke tests.

For *"is the code actually ready"* (security fixes, test coverage, load testing),
see [TEST_PROGRESS.md](TEST_PROGRESS.md) — its milestone summary is reproduced in
[§0](#0-code-readiness-gate) below so you don't have to cross-reference for the
go/no-go call. For deep how-to on any infra step, see [DEPLOYMENT.md](DEPLOYMENT.md)
(this file is the checklist; that file is the walkthrough).

---

## 0. Code readiness gate

**Check this before touching infrastructure.** Deploying is pointless if the code
underneath isn't ready — full detail and evidence in [TEST_PROGRESS.md](TEST_PROGRESS.md).

| Phase | Status | Meaning |
|---|---|---|
| A — Foundations (test infra, CI, boot safety, HTTP hardening, unit tests) | 🟡 | Done except: CI has never run on a real GitHub PR (nothing pushed yet); Stage 1 static analysis/dependency hygiene not started. |
| B — Launch-blocking security (SEC-01..09) | ✅ | All done — IDOR, payment webhook idempotency, CSRF, JWT-in-body, Redis rate limiting, error leakage, image proxy, security headers, dev-backdoor gating. |
| C — Concurrency (PERF-1..7) | 🟡 | PERF-1 (job queue), PERF-2 (shared rate limits), PERF-3 (cron single-owner), PERF-4 (Report/Payment collections), PERF-5 (Mongo pool/index audit) done. PERF-6 (Redis metering batching), PERF-7 (circuit breakers) **not started**. |
| D — Verify (integration tests, security pass, E2E, load, chaos) | ⬜ | **Not started at all.** No DB-backed integration tests, no Playwright E2E, no load test, no chaos test. |
| E — Polish & sign-off (observability, a11y/SEO/Lighthouse, medium security, go/no-go) | ⬜ | **Not started at all.** No Sentry, no structured logging, no metrics/alerts, no legal pages beyond Terms/Privacy/Pricing. |

**Bottom line:** the app is safe to deploy in the sense that the launch-blocking
*security* holes are closed and the pipeline won't fall over under load — but there
is **no integration/E2E/load-test evidence yet**, **no monitoring**, and **two required
legal pages are missing** (Razorpay requires them — see §7). Decide explicitly whether
you're doing a soft launch with close manual monitoring, or holding for Phase D/E.

---

## 1. Accounts & external services

Create/verify an account and grab credentials for each before touching the server:

| Service | Used for | Where to get the key |
|---|---|---|
| DigitalOcean / Linode / Hetzner (or similar) | Backend VPS, Ubuntu 22.04, min 1 GB RAM | Provider console |
| [MongoDB Atlas](https://cloud.mongodb.com) | Primary database | M0 free tier is enough to start |
| [Upstash](https://upstash.com) | Redis — cache, rate limiting, **and** the PERF-1 job queue | One database, two connection strings (see §3) |
| [Vercel](https://vercel.com) | Frontend hosting | Auto-detects Next.js |
| Google Cloud Console | Places API, Place Details, Maps JS, Geocoding, Air Quality | Two keys — server (IP-restricted) + browser (referrer-restricted), see SEC-18 note in §9 |
| [Razorpay](https://razorpay.com) | Payments | Key ID/secret + a webhook secret (Settings → Webhooks) |
| [GROQ](https://console.groq.com) | AI label generation | Free tier: 6,000 tokens/min, 500,000/day |
| OpenAQ, OpenWeatherMap, WAQI, GNews.io, NewsAPI.org, data.gov.in (CPCB) | Environmental/news signals | Each has a free tier — see [DEPLOYMENT.md §1.4](DEPLOYMENT.md) for limits |
| A domain (e.g. `vibescout.com`) + DNS access | `vibescout.com` (frontend) + `api.vibescout.com` (backend) | Your registrar |

---

## 2. MongoDB Atlas setup

- [ ] M0 cluster created, database named `vibescout`
- [ ] Database user created with read/write access
- [ ] VPS IP added to the Atlas IP allowlist (not `0.0.0.0/0` in production)
- [ ] Connection string copied: `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/vibescout`
- [ ] **Indexes created** (run in `mongosh` or Atlas Data Explorer — full list in [DEPLOYMENT.md §2](DEPLOYMENT.md)):
  - [ ] `shadowproperties.sessionId` unique
  - [ ] `shadowproperties.expiresAt` TTL (`expireAfterSeconds: 0`) — **critical**, without this ShadowProperty docs accumulate forever
  - [ ] `clusters.clusterId` unique, `clusters.{centroidLat,centroidLng}`, `clusters.lastSearchedAt` (PERF-5)
  - [ ] `users.email` unique
  - [ ] `leads.sessionId` unique, `leads.{scoreTier,listingType}`, `leads.stage`, `leads.createdAt` desc, `leads.assignedBrokerId` (last two: PERF-5)
  - [ ] `brokers.email` unique
  - [ ] `reports.sessionId` unique, `reports.shareToken` unique, `reports.{userId,generatedAt}` (PERF-4)
  - [ ] `payments.{userId,sessionId}` compound (PERF-4 — in addition to `razorpayOrderId`/`razorpayPaymentId` unique from SEC-02)
  - [ ] `analyticsevents.createdAt` TTL 180d, `funnelAnalytics.timestamp` TTL 180d (PERF-5 — both were unbounded before)
- [ ] Atlas alerts enabled: connection count > 80, disk usage > 80%
- [ ] Slow-query profiler enabled (threshold 100ms)
- [ ] **Not yet done anywhere in this codebase:** an automated backup + a *tested* restore (Stage 9.5 in the readiness plan). Atlas M0 has no automated backups — either upgrade to a paid tier or script your own `mongodump` cron before you have real user data you can't afford to lose.
- [ ] **If upgrading an existing deployment** (PERF-4, one-time): after indexes exist, run `node scripts/migrateReportsAndUnlocks.js --dry-run` then without `--dry-run` — copies `User.reportHistory[]`/`unlockedReports[]` into the new `Report`/`Payment` collections. Skip on a fresh install. See [DEPLOYMENT.md §3.4](DEPLOYMENT.md).
- [ ] **If upgrading an existing deployment** (PERF-5, cleanup, non-blocking): 5 collections (`shadowproperties`, `clusters`, `users`, `leads`, `brokers`) plus `blogposts` used to each declare one index twice — the code no longer does, but existing databases still physically carry both copies (`autoIndex` only adds, never drops). Run `db.<collection>.getIndexes()` and drop the redundant one on each — see [DEPLOYMENT.md §2](DEPLOYMENT.md) note. No correctness impact either way, just wasted write overhead until cleaned up.

## 3. Upstash Redis setup

One database, two different connection methods — both required:

- [ ] Redis database created (region closest to your VPS)
- [ ] REST URL + REST token copied (Dashboard → your DB → "REST API" tab) → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` — used for caching and rate limiting
- [ ] **TCP connection string copied** (Dashboard → your DB → "Redis Connect" tab, a `rediss://default:<password>@<host>:<port>` URL) → `UPSTASH_REDIS_URL` — used **only** by the PERF-1 job queue (BullMQ needs a real Redis connection; the REST API can't provide one). Same database — nothing new to provision, just a different string.
- [ ] Daily command count monitored (free tier: 10,000/day) — set an alert at 80%

## 4. VPS provisioning

- [ ] Ubuntu 22.04 VPS provisioned, min 1 GB RAM
- [ ] `git`, `build-essential`, `curl` installed
- [ ] Node.js 22 LTS installed via nvm
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] Nginx installed
- [ ] Certbot installed (`certbot`, `python3-certbot-nginx`)

---

## 5. Environment variables

### Backend `.env` (on the VPS)

All required — the app **will refuse to boot** (`validateEnv.js`, exits with code 1
and an itemized error list) if any of the first group is missing or malformed:

- [ ] `PORT` — `3001`
- [ ] `NODE_ENV` — `production`
- [ ] `MONGODB_URI` — Atlas connection string, `/vibescout` database
- [ ] `UPSTASH_REDIS_REST_URL` — Upstash REST endpoint
- [ ] `UPSTASH_REDIS_REST_TOKEN` — Upstash REST token
- [ ] `UPSTASH_REDIS_URL` — Upstash TCP connection string (PERF-1 — see §3)
- [ ] `FRONTEND_URL` — `https://vibescout.com` (no trailing slash — CORS/CSRF match it exactly)
- [ ] `RAZORPAY_KEY_ID` — **`rzp_live_*`**, not `rzp_test_*`
- [ ] `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET` — from Razorpay dashboard → Settings → Webhooks (see §8 for the webhook itself)
- [ ] `GOOGLE_PLACES_API_KEY` — server key, IP-restricted to the VPS (see §9)
- [ ] `GROQ_API_KEY`
- [ ] `JWT_SECRET` — **≥ 32 characters**, high entropy: `openssl rand -hex 32`
- [ ] `COOKIE_DOMAIN` — `.vibescout.com` (leading dot, for cross-subdomain cookies)

Strongly recommended (the app boots without these but the dependent feature silently
degrades — you'll get a boot-time warning, not a failure):
- [ ] `OPENAQ_API_KEY`, `OPENWEATHER_API_KEY`, `WAQI_API_KEY`, `GNEWS_API_KEY`, `NEWSAPI_API_KEY`, `CPCB_API_KEY`
- [ ] `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — blog/image uploads
- [ ] `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` — password-reset email; unset means reset emails are silently skipped, not an error

Dev-only — **must be unset or `false` in production**, and the app now enforces this
at boot (SEC-09 — `process.exit(1)` if `NODE_ENV=production` and `DEV_UNLOCK=true`):
- [ ] `DEV_UNLOCK` — absent or `false`

### Vercel environment variables (frontend)

- [ ] `NEXT_PUBLIC_API_URL` — `https://api.vibescout.com`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Google Maps JS key, **browser** key (referrer-restricted, see §9), Maps JS API enabled
- [ ] `NEXT_PUBLIC_DEV_UNLOCK` — absent or `false` — gates the "skip payment" button and the `/dev/test-report` page; must not be `true` in the production build

---

## 6. Deploy

### Backend (VPS)

- [ ] `git clone` into `/var/www/vibescout-api`, `npm install`
- [ ] `.env` created and filled (§5)
- [ ] `pm2 start server.js --name vibescout-api`
- [ ] **`pm2 start worker.js --name vibescout-worker`** — PERF-1's pipeline worker. `/analyze/start` only enqueues a job; without this process running, no property analysis ever completes. As of PERF-3, this is also the **only** place cron runs (AQI/Weather/Solar/Noise/Amenities refreshes) — `server.js` no longer starts cron at all. Two separate processes, never the same one.
- [ ] `pm2 save` + `pm2 startup` (survive reboot)
- [ ] `pm2 status` shows **both** `vibescout-api` and `vibescout-worker` as `online`

### Seed data (first deploy only, after indexes exist)

Run in order from `/var/www/vibescout-api`:
- [ ] `node scripts/seedClusters.js` — evergreen cluster data (live API calls, 2-3 min; needs all API keys already in `.env`)
- [ ] `node scripts/seedUsers.js` — seed accounts (**change the seeded admin password immediately after first login**)
- [ ] `node scripts/seedShadowProperties.js`, `node scripts/seedLeads.js` — optional demo data

### Nginx + SSL

- [ ] `/etc/nginx/sites-available/vibescout-api` reverse-proxies `api.vibescout.com` → `localhost:3001` (full config in [DEPLOYMENT.md §5.2](DEPLOYMENT.md))
- [ ] Symlinked into `sites-enabled`, `nginx -t` passes, reloaded
- [ ] `certbot --nginx -d api.vibescout.com` issued a certificate
- [ ] `certbot.timer` active (auto-renewal)
- [ ] `curl https://api.vibescout.com/health` → 200

### Frontend (Vercel)

- [ ] `vercel --prod` deployed (or connected via Git for auto-deploy on push)
- [ ] Env vars set in Vercel dashboard (§5)
- [ ] Custom domain `vibescout.com` → Vercel; `www.vibescout.com` → CNAME
- [ ] DNS: `api.vibescout.com` → A record → VPS IP

---

## 7. Legal / compliance pages

Razorpay requires these to be present and linked before they'll process live
payments — **two are currently missing**:

- [x] Terms
- [x] Privacy
- [x] Pricing
- [ ] **Refund/Cancellation policy — missing, must add**
- [ ] **Contact page — missing, must add**

---

## 8. Razorpay production cutover

- [ ] Switched from test mode (`rzp_test_*`) to live mode (`rzp_live_*`) keys in `.env`
- [ ] Webhook configured in the Razorpay dashboard pointing at `https://api.vibescout.com/payment/webhook`, subscribed to `payment.captured` and `order.paid`
- [ ] Webhook secret copied into `RAZORPAY_WEBHOOK_SECRET`
- [ ] A real (small) live payment run through end-to-end before announcing launch
- [ ] Legal pages from §7 are live and linked (Razorpay can suspend an account that's missing them)

---

## 9. Third-party key hardening

- [ ] Google server key (`GOOGLE_PLACES_API_KEY`) — restricted by IP to the VPS's address, not open
- [ ] Google browser key (`NEXT_PUBLIC_GOOGLE_MAPS_KEY`) — restricted by HTTP referrer to `vibescout.com`/`www.vibescout.com`
- [ ] Billing alerts set on the Google Cloud project (SEC-18 in the readiness plan — not yet done; a leaked/misused key currently has no spend ceiling)
- [ ] Confirmed no `rzp_test_*` keys, no dev API keys, remain in the production `.env`

---

## 10. Post-deploy smoke tests

Run all of these after every deploy, not just the first one. Full step-by-step is in
[DEPLOYMENT.md §8](DEPLOYMENT.md); short form:

- [ ] Property search → `/analyze/start` → redirected to funnel; `pm2 logs vibescout-worker` shows the pipeline job start and finish within 60s (PERF-1 — this now runs in the **worker** process, not the API process)
- [ ] Full funnel → report renders, no hallucinated city names, GROQ labels reference only real factSheet values
- [ ] Share link opens in an incognito window, read-only, no JWT cookie sent
- [ ] Owner report reloads from `reportHistory` without regenerating
- [ ] Admin panel shows the lead from the completed funnel with correct scoring
- [ ] All 28 evergreen clusters show "Fresh" in `/admin/clusters` (re-run `seedClusters.js` if not)
- [ ] Redis key `session:<sessionId>:intelligence`... — **note:** this key was removed as dead code during hardening; verify instead via `report:<sessionId>` (TTL ~604800s) and `cluster:<id>:AQI`/`Solar`/`Weather` (TTL ~86400s) in the Upstash Data Browser
- [ ] LocalNewsCard shows at least one headline for a Koramangala/Whitefield property
- [ ] A real payment (small, live mode) unlocks a report end-to-end

---

## 11. Monitoring — what exists vs. what's missing

**Exists today:**
- [ ] PM2 logs (`pm2 logs vibescout-api`, `pm2 logs vibescout-worker`) — set up log rotation (`pm2 install pm2-logrotate`), untouched by default and will fill disk over time
- [ ] `pm2 monit` for interactive CPU/memory
- [ ] Atlas connection-count/disk alerts (§2)
- [ ] Upstash daily-command alert (§3)
- [ ] GROQ token usage dashboard (console.groq.com)
- [ ] Nginx access/error logs

**Missing — not built yet (Observability / PERF-11 in the readiness plan, all ⬜):**
- [ ] Error tracking (Sentry or equivalent) — right now a production crash is only visible in `pm2 logs`, nothing pages anyone
- [ ] Structured logging with request-id correlation (the backend already stamps `X-Request-Id` on every response and logs it — there's just no log aggregation/search on top of it yet)
- [ ] Uptime monitor hitting `GET /health` (the endpoint exists and works — nothing is polling it externally)
- [ ] Queue-depth visibility for the PERF-1 pipeline queue — no dashboard; in a pinch, inspect `bull:pipeline:*` keys directly in the Upstash Data Browser, or `pm2 logs vibescout-worker` for repeated job failures
- [ ] Alerting thresholds (error rate, p95 latency, queue depth, external API spend, Mongo pool saturation)

**Recommendation:** stand up at minimum an uptime monitor on `/health` and Sentry
before real user traffic — these are cheap, fast, and the single biggest gap between
"deployed" and "someone finds out when it breaks."

---

## 12. Final pre-launch gate

Straight from the readiness plan's own Stage 9 — don't skip these:

- [ ] `NODE_ENV=production`, `DEV_UNLOCK` unset, `/dev/*` routes not mounted, `NEXT_PUBLIC_DEV_UNLOCK` unset — **enforced at boot** as of SEC-09, but confirm the actual deployed `.env` matches
- [ ] Runbook exists: how to roll back a deploy, rotate a leaked key, disable payments, put up a maintenance page, re-drive a stuck pipeline job
- [ ] Mongo backup + a **tested** restore (§2 — not done)
- [ ] Security checklist 100% Critical/High closed (§0 — Phase B is; Phase C is partial)
- [ ] Go/no-go call made with eyes open about what's in §0's gaps — this checklist gets you *deployed*, not necessarily *load-tested, monitored, and legally complete*

---

*Generated 2026-09-16 against the state in [TEST_PROGRESS.md](TEST_PROGRESS.md). Re-check
§0 before relying on this — that file is the live source of truth and will drift ahead
of this snapshot as more of Phases C/D/E get done.*
