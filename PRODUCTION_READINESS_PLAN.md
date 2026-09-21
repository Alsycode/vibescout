# Haum — Production Readiness Plan

Owner: engineering · Status: DRAFT for review · Last updated: 2026-09-10

Covers three things you asked for:

1. **Test plan** — what we test and how, to be executed together in stages.
2. **Security issues already in the codebase** — prioritised, with file locations and fixes.
3. **Performance & concurrency plan** — the app must survive many simultaneous users.

Part 4 is the recommended execution order (what blocks launch vs. what can follow).

---

## Current state (baseline facts)

| Area | State |
|---|---|
| Automated tests | **None.** No test runner, no test files, no CI. |
| Backend | Express 4, single process, `node --watch` in dev, `node server.js` in prod. |
| Auth | JWT in `httpOnly` cookie (`vb_session`), 7-day expiry, no revocation. |
| Rate limiting | `express-rate-limit` with **in-memory store** (per-instance, resets on deploy). |
| Background work | `runPipeline()` is **fire-and-forget**, unbounded, ~12 external API calls each. |
| Cron | `node-cron` **in-process** — every instance runs every job. |
| Data model | `User.reportHistory[]` holds full report JSON snapshots inline (unbounded array). |
| External APIs | Google Places/Air Quality, Groq, GNews/NewsAPI, Nominatim, Overpass, Open-Meteo, OpenTopoData, JRC. Cached in Redis + Mongo at cluster level. |
| Payments | Razorpay, **client-callback verification only, no webhook**. |
| Observability | `console.*` only. No error tracking, metrics, structured logs, or healthcheck. |

---

# PART 1 — TEST PLAN

Ten stages. We run them roughly in order; each has an entry gate and an exit gate.
Nothing below requires production data — everything runs against a disposable test DB + Redis namespace.

## Stage 0 — Test infrastructure (prerequisite)

Before functional testing we need somewhere to run it.

- [ ] Add `.env.example` documenting every required variable (no secrets).
- [ ] Create an **isolated test environment**: separate Mongo database (`haum_test`), separate Redis (or key prefix), Razorpay **test** keys, throwaway Google key with low quota or a mock.
- [ ] Backend: add `vitest` + `supertest`. `npm run test`, `npm run test:watch`, `npm run test:coverage`.
- [ ] Frontend: add `vitest` + `@testing-library/react` for units; `@playwright/test` for E2E.
- [ ] Add a **seed script** that creates: 1 admin user, 2 normal users, 1 completed ShadowProperty + report, 1 unlocked report.
- [ ] Add **GitHub Actions CI**: on every PR run lint + typecheck + backend tests + frontend unit tests + `npm audit --audit-level=high`. Block merge on failure.
- [ ] Add a **mock layer** for external APIs (nock / MSW) so tests are deterministic and free.

**Exit gate:** `npm run test` runs green with 3+ trivial tests; CI is green on a draft PR.

## Stage 1 — Static analysis & dependency hygiene

- [ ] `npm audit` (root + frontend) — triage every High/Critical.
- [ ] Pin `^` ranges that matter (`multer`, `cloudinary`, `nodemailer`, `framer-motion`, `lucide-react`).
- [ ] ESLint with `eslint-plugin-security` on backend; fix or annotate findings.
- [ ] `npm run build` (frontend) must pass with **no type errors** and no `use client` boundary warnings.
- [ ] Grep for leftover debug: `dev-unlock`, `DEV_UNLOCK`, `console.log` of secrets/PII, hard-coded URLs, `TODO/FIXME/HACK`.
- [ ] Confirm `frontend/app/(app)/dev/*` and `src/routes/devTest.routes.js` cannot mount in production (see SEC-09).

**Exit gate:** clean audit (or documented exceptions), clean build, no dev artifacts reachable in prod config.

## Stage 2 — Unit tests (pure logic — highest ROI, do first)

These functions decide the product output and money math. Table-driven tests, no I/O.

| Module | What to assert |
|---|---|
| `verdictEngine.service.js` | Every verdict key (`noise/aqi/solar/amenity/commute/budget/vastu/community`) across pass/caution/red_flag boundaries; floor-noise reduction; `totalRedFlags/Cautions/Passes` counting; `derivedCharacter`; headline generation. |
| `reportTemplates.service.js` | Fallback string for every verdict + edge inputs (null distances, missing sensitivity). |
| `report.routes.js#computeFinancialScores` | Rent & sale paths; every income/price/down-payment bracket midpoint; `emiPercent`, `downPaymentPercent`, `rentToIncomeRatio` clamping to 0–100; `actualAmount` override; divide-by-zero on zero income. |
| `baselineResolver.service.js#compareRentToBaseline` | Above/below/at baseline; unknown city; unknown BHK. |
| `livability / maturity / solarSavings / infrastructureMomentum` | Score boundaries, grade/band cutoffs, empty inputs → sane defaults; solar savings null when peak sun hours ≤ 0. |
| `jrc.service.js#classifyFloodRisk` | occurrence thresholds (5/20/50), nearest-water thresholds (100/300/500), both-null → Low. |
| `terrain.service.js` | coastal vs inland branch; flat-terrain downgrade; `MIN_LAND_SAMPLES` → returns null; relative-elevation bands. |
| `groqValidator.service.js` | Rejects location names, over-length sentences, invalid keywords, non-JSON, injection in `factSheet`; falls back to template. |
| `leadScore.service.js` | Composite score + tier boundaries; missing preference steps. |
| `token.service.js` | sign→verify round-trip; expired token rejected; tampered token rejected; wrong-secret rejected. |
| `clusterService.js#assignCluster` | Same coords → same cluster; cluster reuse vs. create. |

**Target:** 90%+ line coverage on `verdictEngine`, `reportTemplates`, financial math, `groqValidator`. **Exit gate:** all green in CI.

## Stage 3 — API integration tests (supertest against a real test DB)

For **every** route: happy path, each validation error, **authn** (no cookie → 401), **authz** (wrong role → 403; wrong owner → 403/404), and malformed body.

**Auth**
- [ ] register: success; duplicate email; weak password; missing phone; email normalised to lowercase.
- [ ] login: success sets `vb_session` cookie with `httpOnly`, `secure` (prod), `sameSite`; wrong password; unknown email; **response body must NOT contain the raw JWT** (see SEC-04).
- [ ] logout clears cookie; `/auth/me` requires auth and never returns `passwordHash`.
- [ ] forgot-password: always 200 (no user enumeration); token created & hashed (after SEC-12); reset-password with valid/expired/invalid token; password rotates `tokenVersion` (after SEC-13).
- [ ] profile / change-password require auth; change-password requires correct current password.

**Analyze / Funnel** (ownership is the theme — see SEC-01)
- [ ] `/analyze/start`: requires `confirmed:true`; rejects non-India coords; needs name; creates ShadowProperty **bound to `req.user`**; returns before pipeline; India bounding box edges.
- [ ] `/analyze/:sessionId/context`: **user A cannot mutate user B's session** → expect 403/404.
- [ ] `/analyze/:sessionId/status`: decide — should this require auth? (currently public). Test the chosen behaviour.
- [ ] `/funnel/save`: step 1–8 validation; `complete` without all steps → 400; `complete` twice → **exactly one Lead** (needs idempotency, see PERF-4); user A cannot complete against user B's session.
- [ ] `/funnel/progress`, `/funnel/analytics` (POST) auth; `/funnel/analytics` (GET) admin-only.

**Report**
- [ ] `/report/generate`: pending → `{status:'pending'}`; stuck >5 min → 500; incomplete funnel → 400; success shape (all `signals.*` keys, `financial`, `summary`, `dataSource`); Redis cache hit path; **user A cannot generate/read against user B's sessionId** (see SEC-01).
- [ ] `/report` (list) returns only caller's reports, metadata only.
- [ ] `/report/:sessionId` with valid share token → readonly; wrong/absent token → 403; owner path works with **both** `vb_session` and `vb_token` (see SEC-17).

**Payment** (Razorpay test mode)
- [ ] `/payment/create-order`: auth; missing sessionId; already-unlocked → 400; returns `{id,amount,currency}`; amount == `REPORT_PRICE_PAISE`.
- [ ] `/payment/verify`: valid signature → unlock; **tampered signature → 400 and NO unlock**; replay same payload → still exactly one unlock (idempotent).
- [ ] Webhook endpoint (after PERF/SEC fix): valid `X-Razorpay-Signature` → unlock; bad signature → 401; unknown order → 200 no-op; unlock is idempotent with `/verify`.
- [ ] `/payment/dev-unlock`: 403 when `NODE_ENV=production`.

**Admin** (all under `requireAuth + requireAdmin`)
- [ ] Every `/admin/*` route: no cookie → 401; normal user → 403; admin → 200.
- [ ] Pagination clamped (`limit`, `page`, `daysBack` cannot request absurd ranges — see SEC-15).

**Exit gate:** 100% of routes have authn + authz + validation tests passing.

## Stage 4 — Security test pass (see Part 2 for the issue list)

- [ ] **IDOR sweep** — for every route taking `:sessionId` / `:id`, prove cross-user access is denied.
- [ ] **CSRF** — from a different origin, attempt `POST /auth/password`, `/analyze/start`, `/payment/create-order` with a valid cookie; expect rejection (after SEC-03 lands).
- [ ] **Rate limits** — script 25 logins/min from one IP → 429; verify the limiter works with **2 backend instances** sharing state (after PERF-2).
- [ ] **Injection** — Mongo operator injection in `email`, `sessionId`, query params (`{"$gt":""}`); NoSQL via JSON body; header injection into reset email.
- [ ] **Auth token** — `alg:none` token; token signed with wrong key; expired token; token with elevated `role` claim re-signed with guessed/empty secret.
- [ ] **Error leakage** — force a 500 (e.g. DB down) and confirm the response body is generic, not a stack/driver message (after SEC-06).
- [ ] **Headers** — assert `helmet` headers present (HSTS, X-Content-Type-Options, frame-ancestors, Referrer-Policy) (after SEC-08).
- [ ] **Image proxy** — `GET /_next/image?url=https://attacker.example/x` must be refused (after SEC-07).
- [ ] **Secrets** — confirm no API key or JWT in any HTTP response, client bundle (except the intentionally public `NEXT_PUBLIC_GOOGLE_MAPS_KEY`), or log line.
- [ ] **Google keys** — verify server key is IP-restricted and browser key is HTTP-referrer + API restricted in Google Cloud console.
- [ ] Run **OWASP ZAP baseline scan** against staging; triage.

**Exit gate:** no Critical/High findings open; Mediums have owners + dates.

## Stage 5 — Frontend E2E (Playwright, against staging)

Critical user journeys, desktop + mobile viewport:

- [ ] Register → land on analyze.
- [ ] Analyze: search place → confirm → property context form → funnel steps 1–8 → report pending → report renders.
- [ ] Report paywall: preview shows headline/keywords/flag counts; click Unlock → Razorpay **test** checkout → success → full `ReportViewer` renders with every section.
- [ ] Payment dismissed / failed → error message, no unlock, can retry.
- [ ] Share link (readonly) opens report without login; tamper token → 404.
- [ ] My Reports lists the report; re-open is instant (cache); PDF/share bar works.
- [ ] Profile edit, change password, logout, login again.
- [ ] Auth guard: hitting `/analyze` logged-out redirects to `/login`.
- [ ] 401 mid-session (expire cookie) → redirect to login (except payment/me per interceptor).
- [ ] Admin dashboard loads for admin, 403/redirect for normal user.

**Exit gate:** all journeys green in CI on 2 browsers (Chromium, WebKit) + 1 mobile profile.

## Stage 6 — Load & concurrency tests (k6 or Artillery, against staging)

Staging must mirror prod topology (≥2 API instances, real Redis, Mongo Atlas tier).

**Scenarios**
| # | Scenario | Load | Pass criteria |
|---|---|---|---|
| L1 | Read-heavy: report GET (cache hit) + `/auth/me` + list | 200 RPS, 10 min | p95 < 300 ms, error rate < 0.5%, CPU < 70% |
| L2 | Auth burst: login/register | 50 RPS, 5 min | p95 < 800 ms (bcrypt cost 12 is CPU-bound — measure), no event-loop stalls |
| L3 | **Analyze storm**: `/analyze/start` → funnel → `/report/generate` | 20 concurrent new sessions, ramped | Pipeline queue depth bounded; **no external API 429s**; no socket-exhaustion errors; memory flat |
| L4 | Payment: create-order + verify | 10 RPS | p95 < 1 s; zero double-unlocks |
| L5 | Soak | L1 mix at 50% for 2 h | No memory growth, no FD leak, no unbounded Redis key growth |
| L6 | Spike | 0 → 300 RPS in 30 s | Autoscale kicks in; graceful 429s not 5xx; recovers within 2 min |

**Instrument during runs:** event-loop lag, Mongo pool checkout wait, Redis command latency, outbound-request concurrency per provider, GC pauses.

**Exit gate:** L1–L6 meet criteria on the target instance count; we know the RPS ceiling per instance and the autoscale trigger.

## Stage 7 — Resilience / chaos

- [ ] **Groq down / 500 / slow (>10 s)** → report still generates via template fallback.
- [ ] **Google Places quota exceeded (429)** → amenities fall back to cluster cache / seed; no user-facing crash; circuit breaker opens (after PERF-7).
- [ ] **Nominatim / Overpass timeout** → pipeline completes with partial data; `dataSource` reflects fallback.
- [ ] **Redis unavailable** → cache misses degrade to live/DB; rate limiting fails **closed or open** per explicit decision; app does not 500 everywhere.
- [ ] **Mongo primary failover** (Atlas test) → requests retry, no data loss, connection pool recovers.
- [ ] **Pipeline worker killed mid-run** → ShadowProperty not stuck (TTL recovery works); job retried from queue (after PERF-1).
- [ ] **Deploy during traffic** → graceful shutdown drains in-flight requests, no 502s (after PERF-8).
- [ ] **Razorpay webhook retried** (Razorpay retries on non-2xx) → idempotent, one unlock.

## Stage 8 — Non-functional

- [ ] **Accessibility**: axe scan on funnel + report + paywall; keyboard-only funnel completion; contrast on the dark theme; focus traps in modals.
- [ ] **SEO/meta**: `lib/metadata.ts` correct per route; OG tags on blog + report share; sitemap/robots; no `noindex` leak on marketing pages; canonical URLs.
- [ ] **Performance (Lighthouse)**: marketing pages ≥ 90 perf; report page interactive < 3.5 s on mid mobile; check `jspdf`/`html2canvas`/`leaflet`/`three` are dynamically imported and not in the initial bundle.
- [ ] **Cross-browser**: Chrome, Safari, Firefox, Edge; iOS Safari + Android Chrome.
- [ ] **Email**: password-reset email renders in Gmail/Outlook/Apple Mail; links use the production domain; SPF/DKIM/DMARC pass.
- [ ] **Legal/compliance pages present & linked** (Razorpay requirement): Terms ✅, Privacy ✅, **Refund/Cancellation ❌ (add)**, **Contact ❌ (add)**, Pricing ✅.
- [ ] **Data retention**: ShadowProperty TTL (24 h) verified; analytics/funnel events have TTL; report snapshots retained deliberately.

## Stage 9 — Pre-launch regression & sign-off

- [ ] Full E2E suite green on the release candidate.
- [ ] Load test re-run on the exact prod configuration.
- [ ] Security checklist 100% (Critical/High closed).
- [ ] Runbook exists: how to roll back, rotate a leaked key, disable payments, put up maintenance page, re-drive stuck pipelines.
- [ ] Backups: Mongo automated backup + a tested restore.
- [ ] Monitoring dashboards + alerts live (error rate, p95, queue depth, external spend, uptime).
- [ ] `NODE_ENV=production`, `DEV_UNLOCK` unset, dev routes not mounted, `NEXT_PUBLIC_DEV_UNLOCK` unset — asserted at boot.
- [ ] Go/no-go meeting.

---

# PART 2 — SECURITY ISSUES (already present)

Severity: **Critical** = fix before launch, exploitable for data/money loss. **High** = fix before launch. **Medium** = fix in first patch window. **Low** = backlog.

## CRITICAL

### SEC-01 — No ownership binding between users and sessions (IDOR)
`ShadowProperty` has no `userId` field (`src/models/ShadowProperty.js`). These routes act on **any** `sessionId` from **any** authenticated account:
- `POST /analyze/:sessionId/context` — `ShadowProperty.findOneAndUpdate({ sessionId }, …)` — overwrite another user's property specs.
- `POST /funnel/save` (`complete` branch) — `ShadowProperty.findOne({ sessionId })` then `Lead.create(...)` — inject leads against someone else's session.
- `GET /report/generate?sessionId=` — generates a report from another session's intelligence using the caller's preferences, saved to the caller's history.
- `GET /analyze/:sessionId/status` — unauthenticated session-existence oracle.

`sessionId` is `vs_<ms>_<12 hex>` (~48 bits) and travels in URLs, share links, and logs.

**Fix:** add `userId: { type: ObjectId, ref: 'User', required: true, index: true }` to `ShadowProperty`; set it in `/analyze/start`; every downstream query becomes `{ sessionId, userId: req.user.userId }`. Return 404 (not 403) on mismatch to avoid confirming existence. Add an integration test per route.

### SEC-02 — Payments: no webhook, no idempotency, client-trust only
Unlock happens **only** when the browser calls `POST /payment/verify` (`src/routes/payment.routes.js`). If the tab closes after payment succeeds, the user is charged and gets nothing → chargebacks + support load. `/payment/*` also has **no rate limiter**.

**Fix:**
- Add `POST /payment/webhook` verifying `X-Razorpay-Signature` against `RAZORPAY_WEBHOOK_SECRET`; handle `payment.captured` / `order.paid` as the source of truth; unlock by the `sessionId` in `order.notes`.
- Make unlock **idempotent** keyed on `razorpay_payment_id` (store a `Payment` doc with a unique index). `/verify` and the webhook must converge to exactly one unlock.
- Add a payment rate limiter.
- Persist `Payment` records (amount, status, order id, payment id, user, session, timestamps) for reconciliation.

### SEC-03 — CSRF on state-changing endpoints
Auth is cookie-only. Production cookie is `sameSite: 'none'` (`src/routes/auth.routes.js` `COOKIE_OPTIONS`). No CSRF token, no Origin/Referer check. A malicious page can POST to `/auth/profile`, `/auth/password`, `/auth/reset-password`, `/analyze/start`, `/funnel/save`, `/payment/create-order` with the victim's ambient cookie.

**Fix (layered):**
- Add an **Origin/Referer allowlist** middleware on all non-GET routes (reject if `Origin` not in `{FRONTEND_URL}`).
- Because the frontend talks to the API **same-origin through the Next `/api/*` rewrite**, switch the cookie to `sameSite: 'lax'` (or `strict` for auth) unless a real cross-site client exists. Re-test the whole auth flow after the change.
- If any genuine cross-site use remains, add a double-submit CSRF token.

## HIGH

### SEC-04 — Raw JWT returned in login/register response body
`/auth/register` and `/auth/login` return `{ token, user }` **and** set the `httpOnly` cookie. Returning the token to JS defeats `httpOnly` and invites `localStorage` storage → XSS can exfiltrate it.
**Fix:** return only `{ user: {...safe fields} }`; the cookie is the sole transport. Remove any frontend code reading the body token (`js-cookie` is a dependency — audit its use).

### SEC-05 — Rate limiting is in-memory and partly dead
`express-rate-limit` default `MemoryStore` → not shared across instances, resets every deploy. `apiLimiter` is mounted at `/api` but no routes are under `/api` (frontend rewrite strips it) → **the global 100/15min limiter does nothing**. `/funnel`, `/payment`, `/posts` have no limiter.
**Fix:** `rate-limit-redis` backed by the existing Upstash; apply a sane global limiter at the router root; add per-route limiters for `/payment`, `/funnel`, `/analyze` (already), `/auth` (already). Decide fail-open vs fail-closed if Redis is down.

### SEC-06 — Error handler leaks internal messages
`src/middleware/errorHandler.js` sends `{ error: err.message }` for every error including 500s → Mongo/driver/third-party messages reach the client.
**Fix:** in production, 5xx returns a generic message + a correlation id; full detail goes to the logger/Sentry only. Keep 4xx messages (they're intentional).

### SEC-07 — Next.js image optimizer is an open proxy
`frontend/next.config.js`: `images.remotePatterns: [{ protocol:'https', hostname:'**' }]` → `/_next/image?url=<any https>` will fetch and proxy arbitrary URLs (SSRF-lite, bandwidth/cost abuse, using your IP as a relay).
**Fix:** whitelist actual hosts — `res.cloudinary.com`, `picsum.photos`, `*.googleusercontent.com`, `lh3.googleusercontent.com`, news image CDNs you actually use.

### SEC-08 — No security headers
No `helmet`. Missing HSTS, `X-Content-Type-Options`, `X-Frame-Options` / CSP `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`.
**Fix:** add `helmet()` on the API; set security headers on the Next app (`next.config.js` `headers()` or middleware). Define a CSP for the frontend (report-only first, then enforce).

### SEC-09 — Dev backdoors gated only by env vars, inconsistently
`/dev/seed-report` (`src/routes/devTest.routes.js`) grants `$addToSet: { unlockedReports }` — **free unlocked reports** — gated only by `DEV_UNLOCK==='true'`. `/payment/dev-unlock` is gated by a **different** flag (`NODE_ENV==='production'`). Frontend shows a "skip payment" button on `NEXT_PUBLIC_DEV_UNLOCK==='true'`.
**Fix:** one hard gate. Assert at server boot: if `NODE_ENV==='production'` then `DEV_UNLOCK` must be unset or the process exits. Exclude `devTest.routes.js` from the production build/image. Remove the frontend dev button from prod bundles.

## MEDIUM

### SEC-10 — No startup validation of required env
Missing `JWT_SECRET`, `MONGODB_URI`, `UPSTASH_*`, `RAZORPAY_*`, Google keys fail silently or at first request.
**Fix:** a `config.js` that validates presence (and `JWT_SECRET` length ≥ 32) on boot and exits with a clear message otherwise.

### SEC-11 — `jwt.verify` without algorithm pin
`src/services/token.service.js` — add `{ algorithms: ['HS256'] }` to `verifyToken`. Also set `issuer`/`audience` and verify them.

### SEC-12 — Password reset token stored in plaintext + weak policy
`resetToken` saved raw in the User doc (`src/routes/auth.routes.js`). A DB dump = usable reset links for 1 hour. Min password length is **6**. `/auth/register` returns 409 for existing email → user enumeration.
**Fix:** store `sha256(token)`, compare hashes, single-use. Raise min length to 8–10 + block obvious values. Make register's duplicate response generic or rate-limit + captcha.

### SEC-13 — JWT not revocable; stale role/password for up to 7 days
Logout only clears the cookie client-side; a stolen token works for 7 days. Password change doesn't invalidate existing tokens. Admin demotion doesn't take effect until expiry (role is read from the token claim).
**Fix:** add `tokenVersion` to User, include in the JWT, bump on password change / "log out everywhere" / role change, and check it in `requireAuth` (one indexed `findById` with `.select('tokenVersion role')`). Consider shortening to 24 h.

### SEC-14 — Unbounded external `fetch` in the request path
`analyze.routes.js#getCoordinatesFromPlaceId` and `#reverseGeocode` use bare `fetch` with no timeout; `getCoordinatesFromPlaceId` is awaited inside `/analyze/start`. A slow upstream stalls the worker.
**Fix:** route through `fetchWithTimeout` (also gives you the usage metering for free).

### SEC-15 — Unclamped pagination / range params
`page`, `limit` (admin routes), `daysBack` (`/funnel/analytics`, analytics admin) are `parseInt`'d without an upper bound → expensive aggregations on demand.
**Fix:** clamp (`limit` ≤ 100, `daysBack` ≤ 90, `page` ≥ 1).

### SEC-16 — No input-schema validation / no Mongo sanitisation
Routes hand-check `req.body`. Object injection into queries is mostly incidental-safe today but fragile (`email.toLowerCase()` throws on an object → 500, not a clean 400).
**Fix:** `zod` schema per route (body/params/query) + `express-mongo-sanitize`. Reject unknown keys.

### SEC-17 — Inconsistent cookie check in `GET /report/:sessionId`
That route checks only `req.cookies?.vb_token`, while the middleware and the rest of the app accept `vb_session` **or** `vb_token`. Authenticated users with only `vb_session` may fail this route.
**Fix:** use the shared `requireAuth` middleware everywhere; delete the bespoke check.

### SEC-18 — Google key posture
One `GOOGLE_PLACES_API_KEY` serves Places + Place Details + Air Quality (server). `NEXT_PUBLIC_GOOGLE_MAPS_KEY` is in the browser bundle (expected).
**Fix:** server key → IP-restricted to the backend egress IPs + restricted to the 3 APIs it needs. Browser key → HTTP-referrer-restricted to the production domain + Maps JS/Places only. Separate keys, separate quotas, billing alerts.

## LOW / hygiene

- **SEC-19** No `/health` / `/healthz` endpoint for LB + uptime checks.
- **SEC-20** No graceful shutdown (SIGTERM) — deploys drop in-flight requests and pipeline work.
- **SEC-21** `console.*` logging only; user emails logged; no levels, no redaction, no request id.
- **SEC-22** No CI dependency scanning; several floating `^` ranges.
- **SEC-23** Report share tokens never expire and can't be revoked.
- **SEC-24** `express.json()` has no explicit size limit (defaults to 100 kb — set it to ~32 kb explicitly).
- **SEC-25** CORS `origin` is a single string from `FRONTEND_URL`; if unset the `cors` package becomes permissive. Pin to an explicit array; fail boot if unset.

---

# PART 3 — PERFORMANCE & CONCURRENCY PLAN

Goal: many simultaneous users without blowing external API budgets, exhausting the event loop, or growing documents unboundedly. Ordered by impact.

### PERF-1 — Move `runPipeline` into a real job queue  ⚠️ biggest risk
Today `/analyze/start` calls `runPipeline(...).catch(...)` fire-and-forget. 100 concurrent analyses → ~100 pipelines × ~12 external calls = **~1,200 concurrent outbound requests**, socket exhaustion, external 429s, OOM. No retry, no backpressure, work lost on restart.

**Fix:**
- Add **BullMQ** (Redis-backed, already have Upstash — or a small dedicated Redis) or a hosted queue.
- `/analyze/start` enqueues `{ shadowPropertyId, lat, lng, clusterId, ... }` and returns immediately.
- A **worker process** consumes with **bounded concurrency** (start at 5–10), exponential backoff, max attempts, dead-letter queue.
- Job status drives the existing `status` field; the 5-min TTL recovery stays as a backstop.
- Report generation (`/report/generate`) can stay inline (it's cheap once intelligence exists) or also be queued if Groq latency hurts p95.

### PERF-2 — Shared rate-limit store
(Also SEC-05.) In-memory limiter is per-instance. Move to `rate-limit-redis`. Without this, horizontal scaling silently multiplies every limit by the instance count.

### PERF-3 — Cron must run on exactly one instance
`src/jobs/cronJobs.js` runs in-process; every instance runs every job → N× external spend and racing writes to the same cluster docs.
**Fix:** run cron **only in the worker process** (guard with `if (process.env.ROLE === 'worker')`), or acquire a Redis lock (`SET cron:lock:<job> NX EX <window>`) before each run. Never run cron on the autoscaled API instances.

### PERF-4 — Get large/unbounded data out of the User document
`User.reportHistory[]` stores **full report JSON snapshots inline**, `unlockedReports[]` grows forever, and `User.findById(req.user.userId)` (called on most authed requests) loads all of it. Path to the 16 MB doc limit and heavy hydration on every request.

**Fix:**
- New `Report` collection: `{ userId, sessionId, listingType, propertyName, snapshot, shareToken, paid, generatedAt }`, indexes on `{ userId, generatedAt }` and unique `{ sessionId }` and `{ shareToken }`.
- New `Unlock`/`Payment` collection instead of `unlockedReports[]`.
- Migration script for existing users.
- Replace broad `User.findById(...)` with `.select()` + `.lean()` on hot paths; only load `preferences` where needed.
- Also add `Lead.create` idempotency (unique `{ sessionId }` or `{ userId, sessionId }`) — currently a double funnel-complete makes duplicate leads.

### PERF-5 — MongoDB connection & index tuning
`mongoose.connect(uri)` has no options.
**Fix:** `maxPoolSize` (20–50 per instance, tuned to Atlas tier), `minPoolSize: 5`, `serverSelectionTimeoutMS: 5000`, `socketTimeoutMS: 45000`, `retryWrites: true`.
**Index audit:** `Lead` (`createdAt`, `scoreTier`, `listingType`, `stage`), `AnalyticsEvent` / `FunnelAnalytics` (query fields + a TTL so they don't grow forever), `Cluster` (geo lookup path in `assignCluster`), `BlogPost` (slug unique, published filter). Run each admin/list query through `.explain()` and kill collection scans.

### PERF-6 — Redis usage: `recordApiCall` write amplification
`fetchWithTimeout` calls `recordApiCall` on **every** outbound request → ~6 Redis commands each, ~70+ per report. Upstash bills per request.
**Fix:** accumulate counters in-process and flush a batched pipeline every 10–30 s (and on shutdown); or sample (record 1 in N). Keep it strictly fire-and-forget.

### PERF-7 — Protect external APIs: circuit breakers + per-provider caps
**Fix:**
- Wrap each provider in a **circuit breaker** (`opossum`): after M failures, open for a cooldown and skip straight to fallback — stops hammering a down/rate-limited provider.
- **Per-provider concurrency limiter** (`p-limit`): e.g. Google Places ≤ 3 in flight globally, **Nominatim ≤ 1** (their fair-use is ~1 req/s — under load you *will* get banned; throttle hard or self-host).
- Tighten/verify cache TTLs; add a **short negative cache** (e.g. 10 min) for failed lookups so a bad coordinate doesn't retry the whole waterfall on every request.
- Daily **spend circuit breaker**: if a provider's day counter exceeds a threshold, force fallback and alert.

### PERF-8 — HTTP layer hardening
- `compression()` middleware (gzip/br) for JSON responses (report payloads are large).
- `express.json({ limit: '32kb' })`, `urlencoded({ limit: '32kb' })`.
- Per-request timeout middleware (e.g. 15 s) returning 503 instead of hanging a worker.
- `server.keepAliveTimeout = 65000; server.headersTimeout = 66000;` (behind ALB/proxy).
- **Graceful shutdown**: on SIGTERM stop accepting, drain in-flight, close Mongo/Redis, exit — no 502s on deploy.
- Add `/health` (process up + Mongo ping + Redis ping) and `/ready`.

### PERF-9 — Caching & response shaping
- Report GET for the owner: `Cache-Control: private, max-age=60` (snapshot is immutable once generated).
- `/auth/me`: cache per-user for ~30 s (or skip the DB hit by trusting the token for name/role and only hitting DB for `tokenVersion`).
- Marketing/blog pages: ISR / long `s-maxage` + CDN.
- Ensure the report Redis cache (`report:{sessionId}`, 7 d) is checked before any recompute (it is) and that Mongo `Report` is the fallback.

### PERF-10 — Frontend performance
- Fix `images.remotePatterns` (SEC-07) and add `Cache-Control: public, max-age=31536000, immutable` for hashed static assets.
- Confirm `jspdf`, `html2canvas`, `leaflet`, `react-leaflet`, `three` are **dynamically imported** and absent from the initial bundle (`IntelligenceMapCard` already uses `next/dynamic` — verify the rest). Run `@next/bundle-analyzer`.
- Lazy-load below-the-fold report cards; `ReportViewer.jsx` is ~66 KB of component code.
- Serve behind a CDN; enable Brotli.
- Remove the `"Updated some ago"` placeholder string in `ReportViewer.jsx`.

### PERF-11 — Observability (needed to run any of the above safely)
- **Error tracking**: Sentry on API + frontend, with release tagging and the correlation id from SEC-06.
- **Structured logging**: `pino` with levels, request id, no PII; ship to a log store.
- **Metrics**: RED (rate/errors/duration) per route, queue depth & job duration, external-call count/latency per provider, Mongo pool wait, event-loop lag. `prom-client` → Grafana, or a hosted APM.
- **Uptime**: external monitor hitting `/health` every minute.
- **Dashboards + alerts**: error rate > 1%, p95 > 1 s, queue depth > 100, any provider day-spend over budget, Mongo connections > 80%.

### PERF-12 — Deployment topology & capacity
- **API tier**: ≥ 2 stateless instances behind a load balancer, autoscale on CPU + p95 latency. Stateless is already true once PERF-2/PERF-3 land.
- **Worker tier**: 1–2 instances running the BullMQ worker + cron (single-owner).
- **Redis**: Upstash (managed) — watch the per-request billing after PERF-6.
- **MongoDB**: Atlas M10+ with alerting and automated backups + a **tested restore**.
- **Frontend**: Vercel or equivalent managed Next host + CDN.
- Establish SLOs: e.g. 99.5% availability, p95 read < 300 ms, report-ready < 30 s p90, and load-test to find the per-instance RPS ceiling.

---

# PART 4 — RECOMMENDED EXECUTION ORDER

### Phase A — Foundations (do first, unblocks everything)
1. Stage 0 test infra + `.env.example` + CI.
2. SEC-10 env validation, SEC-19 `/health`, SEC-20 graceful shutdown, PERF-8 HTTP hardening.
3. Stage 2 unit tests for `verdictEngine`, financial math, `groqValidator` (protects behaviour while we refactor).

### Phase B — Launch-blocking security
4. SEC-01 ownership binding (schema + all routes + tests).
5. SEC-02 payment webhook + idempotency + `Payment` model.
6. SEC-03 CSRF (Origin check + `sameSite` change) and re-test auth.
7. SEC-04 stop returning JWT in body.
8. SEC-05 / PERF-2 Redis rate limiting.
9. SEC-06 error handler, SEC-07 image allowlist, SEC-08 helmet, SEC-09 unify dev gate.

### Phase C — Concurrency (launch-blocking for "many users")
10. PERF-1 job queue + worker process.
11. PERF-3 cron single-owner.
12. PERF-4 `Report`/`Payment` collections + migration + narrow queries.
13. PERF-5 Mongo pool + index audit.
14. PERF-7 circuit breakers + per-provider caps (Nominatim especially).
15. PERF-6 Redis metering batching.

### Phase D — Verify
16. Stage 3 API integration tests (full authz/authn coverage).
17. Stage 4 security test pass + ZAP.
18. Stage 5 Playwright E2E.
19. Stage 6 load tests on prod-shaped staging → tune autoscale.
20. Stage 7 chaos.

### Phase E — Polish & sign-off
21. PERF-11 observability live.
22. Stage 8 non-functional (a11y, SEO, Lighthouse, email, legal pages).
23. SEC-11/12/13/14/15/16/17/18 medium fixes.
24. Stage 9 regression + go/no-go.

### Can follow launch (with monitoring in place)
SEC-21..25 hygiene, PERF-9 fine-grained caching, PERF-10 bundle trimming beyond the essentials, share-token expiry (SEC-23).
