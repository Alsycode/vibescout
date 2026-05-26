# Vibescout — Claude Code Build Instructions

## Standing rules (apply to every session)
- Full spec is in MASTER_PROMPT.md at repo root — read it before writing any code
- No TypeScript. .js and .jsx only
- No placeholders, no TODOs, no // rest of code here
- ES Modules throughout (import/export, no require)
- Tailwind v4 only, no tailwind.config.js
- Every file starts with // FILE: path and // PURPOSE: description
- Package versions: use exactly what's in Section 9 of MASTER_PROMPT.md
- End every part with: --- END OF PART [N] ---

---

## PART 1 — Backend Foundation

**Files:**
- package.json
- .env.example
- server.js
- src/middleware/errorHandler.js

**Read from MASTER_PROMPT.md:** Section 6 (CORS config, cookie-parser rule), Section 8 (env vars), Section 9 (exact package versions)

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 1 — Backend Foundation.
- package.json: Express backend, ES Modules ("type": "module"), exact versions from Section 9
- .env.example: every variable listed in Section 8, no real values
- server.js: Express init, CORS config exactly as specified in Section 6, cookie-parser registered before all routes, rate limiter, error handler, all route files mounted, cron jobs imported
- errorHandler.js: catches all unhandled errors, returns { error: message } JSON

No TypeScript. No placeholders. ES Modules only.

---

## PART 2 — Backend Middleware + Models A

**Files:**
- src/middleware/rateLimiter.js
- src/models/ShadowProperty.js
- src/models/Cluster.js
- src/models/User.js

**Read from MASTER_PROMPT.md:** Section 2 (all three schemas), Section 4 (TTL index rule)

**Dependencies built:** Part 1

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 2 — Middleware + Models A.
- rateLimiter.js: express-rate-limit, sensible limits per route group
- ShadowProperty.js: exact schema from Section 2, TTL index on expiresAt, unique index on sessionId, 'failed' status does NOT exist in enum
- Cluster.js: exact schema from Section 2 including cachedNews field, unique index on clusterId
- User.js: exact schema from Section 2, reportHistory as array with no cap, unique index on email

---

## PART 3 — Backend Models B

**Files:**
- src/models/Lead.js
- src/models/Broker.js
- src/models/LeadAuction.js

**Read from MASTER_PROMPT.md:** Section 2 (Lead, Broker, LeadAuction schemas), Section 9 (Phase 2 comment convention)

**Dependencies built:** Parts 1–2

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 3 — Models B.
- Lead.js: exact schema from Section 2, all Phase 2 auction fields present with // PHASE 2 comments, no active auction logic, all indexes
- Broker.js: exact schema, bidHistory present with // PHASE 2 comment
- LeadAuction.js: full schema defined, entire file marked // PHASE 2 — no logic, schema only

---

## PART 4 — Clustering Algorithm

**Files:**
- src/services/clusterService.js

**Read from MASTER_PROMPT.md:** Section 4 (cluster system, CLUSTER_RADIUS_M, two-tier freshness, assignCluster logic, upsertCluster, getAllActiveClusters, getClustersNeedingRefresh), Section 5 (clusterService exports list)

**Dependencies built:** Parts 1–3

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 4 — Cluster Service.
Export exactly: haversineKm, assignCluster, upsertCluster, getAllActiveClusters, getClustersNeedingRefresh.
CLUSTER_RADIUS_M = 1500 as named constant — never hardcoded elsewhere.
assignCluster: finds nearest existing cluster within radius, creates new one if none found.
upsertCluster: updates lastSearchedAt on every call.
getAllActiveClusters: evergreen clusters + searched within 7 days.
getClustersNeedingRefresh: checks updatedAt against ttlSeconds param per signal type.

---

## PART 5 — Environment Services A

**Files:**
- src/services/aqi.service.js
- src/services/noise.service.js

**Read from MASTER_PROMPT.md:** Section 4 (AQI waterfall, Noise waterfall, dataSource values), Section 5 (API endpoints, params, timeouts for AQI and Noise)

**Dependencies built:** Parts 1–4

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 5 — Environment Services A.

aqi.service.js — implement full 4-level waterfall:
1. OpenAQ live (5s timeout)
2. Cluster MongoDB cache
3. CPCB city average via data.gov.in
4. cityAQIAverages.js seasonal lookup (city → state → national_default)
Never return null. Always return { value, category, source }.

noise.service.js — implement full waterfall:
1. HowLoud at EXACT property coordinates (5s timeout), score formula: dB = 110 - score
2. Cluster MongoDB cached noise
3. GROQ estimate — input shape: { nearbyPlaceTypes, floorLevel, roadProximity } — NEVER send coordinates to GROQ
GROQ returns { estimatedDb } stored with source: 'estimated'.
Never return null.

---

## PART 6 — Environment Services B

**Files:**
- src/services/solar.service.js
- src/services/weather.service.js
- src/services/places.service.js
- src/services/news.service.js

**Read from MASTER_PROMPT.md:** Section 4 (Solar/Weather/Amenities/News waterfalls, dataSource values), Section 5 (all API endpoints and params for these four)

**Dependencies built:** Parts 1–5

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 6 — Environment Services B.

solar.service.js: Open-Meteo waterfall → cluster cache → estimateSolarFromLatitude(lat, facing). Formula in Section 4. Never null.

weather.service.js: OpenWeatherMap → cluster cache → cityWeatherAverages.js lookup. Never null.

places.service.js: Google Places Nearby Search at EXACT coordinates → cluster cache → seed amenities. Returns all 7 types. Never null.

news.service.js: 4-level waterfall (GNews → NewsAPI → Google RSS → empty array with source:'fallback'). fetchNewsWithFallback(clusterId, cityName). Cache key: cluster:{clusterId}:news EX 86400. Never throws. Always returns { headlines: [...], source }.

---

## PART 7A — Verdict Engine

**Files:**
- src/services/verdictEngine.service.js

**Read from MASTER_PROMPT.md:** Section 3 (Layer 1 — all verdict functions with exact logic and thresholds, computeAllVerdicts, generateHeadline, COMMUTE_SPEEDS, AMENITY_THRESHOLDS, deriveUserBudgetBracket)

**Dependencies built:** Parts 1–6

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 7a — Verdict Engine. This is the most critical service.
Implement exactly as specified in Section 3 Layer 1:
- noiseVerdict, aqiVerdict, solarVerdict, amenityVerdict, commuteVerdict, budgetVerdict
- deriveUserBudgetBracket
- generateHeadline (pure JS — GROQ never touches this)
- computeAllVerdicts (master function)
All thresholds exactly as written in Section 3. No deviation.
localNews has no verdict function — add comment noting this.
haversineKm imported from clusterService.

---

## PART 7B — Anti-Hallucination Layer

**Files:**
- src/services/groqValidator.service.js
- src/services/reportTemplates.service.js
- src/services/groq.service.js

**Read from MASTER_PROMPT.md:** Section 3 (Layer 2 GROQ input/output shapes, system prompt verbatim, Layer 3 validator, template strings, BANNED_WORDS, ALLOWED_KEYWORDS, ALLOWED_OUTPUT_KEYS)

**Dependencies built:** Parts 1–7a

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 7b — Anti-hallucination layer.

groq.service.js: callGroq(factSheet, listingType). Model: llama3-8b-8192. Temperature: 0.1. Max tokens: 500. GROQ system prompt used verbatim from Section 3. JSON parse with cleanup pattern from Section 6 rule #11.

groqValidator.service.js: validateGroqOutput exactly as Section 3 Layer 3. Strips unknown keys, filters matchKeywords to ALLOWED_KEYWORDS only, max 3. Returns null on parse failure → triggers template fallback.

reportTemplates.service.js: all template functions from Section 3 exactly — NOISE_TEMPLATES, AQI_TEMPLATES, SOLAR_TEMPLATES, BUDGET_TEMPLATES, AMENITY_TEMPLATES, COMMUTE_TEMPLATES, NEWS_TEMPLATES. buildTemplateReport() assembles full fallback object.

---

## PART 8 — Lead Scoring

**Files:**
- src/services/leadScore.service.js

**Read from MASTER_PROMPT.md:** Section 5 (computeLeadScore, LIFESTYLE_WEIGHTS, computeLifestyleMatch, scoring breakdown, tier thresholds, computeStressScore note)

**Dependencies built:** Parts 1–7b

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 8 — Lead Scoring.
Implement computeLeadScore(preferences, shadowProperty, verdictObject).
LIFESTYLE_WEIGHTS exactly as Section 5.
computeStressScore implemented inline — derives financial stress from income bracket vs property budget bracket.
Tier: hot ≥80, warm ≥60, lukewarm ≥40, cold <40.
Score capped at 100.
Export: computeLeadScore, computeStressScore.

---

## PART 9A — Intelligence Pipeline (Waterfalls)

**Files:**
- src/services/intelligencePipeline.service.js (part 1 of 2)

**Read from MASTER_PROMPT.md:** Section 4 (all waterfall chains, dataSource values, Redis key structure), Section 5 (pipeline service spec)

**Dependencies built:** Parts 1–8

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 9a — Intelligence Pipeline waterfalls.
This is part 1 of intelligencePipeline.service.js.
Implement and export:
- getOrFetchClusterSignal(clusterId, lat, lng, signalType, cityName)
- fetchNoiseWithFallback(lat, lng, clusterId, cityName)
- fetchAmenitiesWithFallback(lat, lng, clusterId, cityName)
- fetchNewsWithFallback(clusterId, cityName)
- getFallbackSignal(signalType, lat, lng, cityName)

Each function: independent 5s timeout, never returns null, always sets source field.
Do NOT write runPipeline yet — that is Part 9b.

---

## PART 9B — Intelligence Pipeline (Orchestrator)

**Files:**
- src/services/intelligencePipeline.service.js (part 2 of 2 — append to existing file)

**Read from MASTER_PROMPT.md:** Section 2 (ShadowProperty status update), Section 4 (Redis key: session:{sessionId}:intelligence EX 7200), Section 5 (runPipeline spec, Promise.all structure)

**Dependencies built:** Parts 1–9a

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 9b — Intelligence Pipeline orchestrator.
Append runPipeline(shadowPropertyId, lat, lng, clusterId, cityName) to intelligencePipeline.service.js.
Promise.all across all 6 signals: aqi, noise, solar, weather, amenities, localNews.
On complete: write single Redis key session:{sessionId}:intelligence EX 7200.
Update ShadowProperty: intelligence object, dataSource object, status: 'completed'.
Update Cluster.lastSearchedAt.
'failed' status does not exist — pipeline always completes via waterfall.

---

## PART 10 — Backend Auth

**Files:**
- src/services/token.service.js
- src/middleware/auth.middleware.js
- src/routes/auth.routes.js

**Read from MASTER_PROMPT.md:** Section 6 (auth routes, JWT payload, cookie config, protected routes list)

**Dependencies built:** Parts 1–9b

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 10 — Auth.
JWT payload: { userId, email, name, role }.
Cookie: vb_token, httpOnly: true, secure: true in prod, sameSite: 'lax'.
auth.routes.js: POST /auth/register, POST /auth/login, POST /auth/logout, GET /auth/me.
auth.middleware.js: requireAuth, requireAdmin — used on protected routes.
token.service.js: sign and verify JWT helpers.

---

## PART 11 — Consumer Routes A

**Files:**
- src/routes/analyze.routes.js

**Read from MASTER_PROMPT.md:** Section 6 (POST /analyze/start full logic, POST /analyze/:sessionId/context, GET /analyze/:sessionId/status, geocoding functions verbatim), Section 3 (validateIndiaCoordinates)

**Dependencies built:** Parts 1–10

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 11 — Analyze routes.
Inline geocoding functions: getCoordinatesFromPlaceId, validateIndiaCoordinates, reverseGeocode — exact implementations from Section 5.
POST /analyze/start: confirmed must be true, India bounding box check, assignCluster, create ShadowProperty, fire runPipeline non-blocking (do NOT await), return { sessionId, shadowPropertyId } immediately.
POST /analyze/:sessionId/context: validates all 4 fields as enums, stores budgetBracket as single normalised field.
GET /analyze/:sessionId/status: returns { status, dataSource }.

---

## PART 12 — Consumer Routes B

**Files:**
- src/routes/funnel.routes.js

**Read from MASTER_PROMPT.md:** Section 6 (POST /funnel/save full logic, GET /funnel/progress, complete flag behavior)

**Dependencies built:** Parts 1–11

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 12 — Funnel routes.
POST /funnel/save: saves step data to user.preferences. When complete=true: computeAllVerdicts + computeLeadScore + Lead.create with full snapshot. Return { ok: true, sessionId }.
GET /funnel/progress: returns user.preferences.
All routes: requireAuth middleware.

---

## PART 13 — Consumer Routes C

**Files:**
- src/routes/report.routes.js

**Read from MASTER_PROMPT.md:** Section 6 (GET /report/generate full logic, GET /report/:sessionId, factSheet construction, report object structure, shareToken generation), Section 3 (newsHeadlines + newsCount in factSheet, PATCH #12 localNews in report object)

**Dependencies built:** Parts 1–12

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 13 — Report routes.
computeFinancialScores implemented inline.
GET /report/generate: full logic from Section 6 — pipeline pending check, Redis fast path, GROQ call, validateGroqOutput, template fallback, report object assembly, shareToken generation, push to User.reportHistory, Redis cache EX 604800.
factSheet includes newsHeadlines and newsCount.
report.signals.localNews included per Section 6 PATCH #12.
GET /report/:sessionId: share token path + owner path both implemented.

---

## PART 14 — Admin Routes A

**Files:**
- src/routes/admin/shadowProperties.admin.routes.js
- src/routes/admin/leads.admin.routes.js

**Read from MASTER_PROMPT.md:** Section 6 (admin routes for shadow properties and leads, read-only note for leads in Phase 1)

**Dependencies built:** Parts 1–13

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 14 — Admin Routes A.
All routes: requireAuth + requireAdmin.
shadowProperties: GET list (filter by status, listingType), GET detail with full intelligence.
leads: GET list (filter by scoreTier, listingType, stage), GET /stats aggregate, GET detail with verdictObject.
Leads panel is READ-ONLY in Phase 1. No PATCH routes for stage, assign, or notes.

---

## PART 15 — Admin Routes B + Cron

**Files:**
- src/routes/admin/brokers.admin.routes.js
- src/routes/admin/clusters.admin.routes.js
- src/jobs/cronJobs.js

**Read from MASTER_PROMPT.md:** Section 6 (broker and cluster admin routes), Section 5 (cron job specs — schedules, batch sizes, delays for all 5 jobs)

**Dependencies built:** Parts 1–14

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 15 — Admin Routes B + Cron.
brokers: full CRUD, isActive toggle, GET leads by broker.
clusters: GET all with freshness, GET stale only, POST /:id/refresh with ?types= query param.
cronJobs.js: all 5 cron jobs with exact schedules and batch sizes from Section 5. processBatch helper as specified. Each job: try/catch per cluster, console.error on failure, never throws globally. News cron: included but commented out.

---

## PART 16 — Frontend Foundation

**Files:**
- package.json (frontend)
- next.config.js
- postcss.config.js
- app/globals.css

**Read from MASTER_PROMPT.md:** Section 2.5 (FULL globals.css — all tokens, animations, keyframes, utility classes), Section 9 (exact frontend package versions)

**Dependencies built:** All backend parts

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 16 — Frontend Foundation.
package.json: Next.js 15.2.0, React 19, Tailwind 4.0.0, exact versions from Section 9.
next.config.js: standard App Router config, no src dir.
postcss.config.js: @tailwindcss/postcss only.
globals.css: FULL implementation of Section 2.5 — every CSS token, every keyframe, every utility class, base styles, scrollbar, selection. Section 8 CSS is REMOVED. Use only Section 2.5 tokens.

---

## PART 17 — Root + Route Group Layouts

**Files:**
- app/layout.jsx
- app/(marketing)/layout.jsx
- app/(app)/layout.jsx
- lib/auth.js

**Read from MASTER_PROMPT.md:** Section 7 (app architecture, route groups, Google Maps script note), Section 6 (JWT cookie name: vb_token)

**Dependencies built:** Part 16

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 17 — Layouts.
app/layout.jsx: root layout, Outfit font, noise overlay div.
(marketing)/layout.jsx: SSR, no auth, no socket. Google Maps JS Script tag with libraries=places and strategy="beforeInteractive" — required for LocationSearch Path A.
(app)/layout.jsx: client layout, auth guard wrapper. Socket.IO only initialised here, never in marketing layout.
lib/auth.js: getUser() helper reading vb_token cookie server-side.

---

## PART 18 — Shared Components + API Layer

**Files:**
- components/Navbar.jsx
- components/AuthGuard.jsx
- lib/api.js
- hooks/useAnalyze.js

**Read from MASTER_PROMPT.md:** Section 2.5 (Navbar glass surface spec), Section 7 (component list)

**Dependencies built:** Parts 16–17

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 18 — Shared components + API layer.
Navbar.jsx: glass surface, blur(24px), border-bottom only, Section 2.5 tokens throughout.
AuthGuard.jsx: checks auth, redirects to /login if no token.
lib/api.js: axios instance pointing to NEXT_PUBLIC_API_URL, withCredentials: true, interceptors for 401 redirect.
useAnalyze.js: manages sessionId state, calls /analyze/start, polls /analyze/:id/status.

---

## PART 19 — Auth Pages

**Files:**
- app/(app)/login/page.jsx
- app/(app)/register/page.jsx

**Read from MASTER_PROMPT.md:** Section 2.5 (glass-input, btn-primary, full design system)

**Dependencies built:** Parts 16–18

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 19 — Auth pages.
Both pages: 'use client', centered glass-elevated card on void background.
All inputs: glass-input class, gold focus ring.
Buttons: btn-primary.
On success: store token, redirect to /funnel or /admin based on role.
No opaque backgrounds anywhere.

---

## PART 20 — Analyze Page

**Files:**
- components/LocationSearch.jsx
- components/LocationConfirmMap.jsx
- app/(marketing)/analyze/page.jsx

**Read from MASTER_PROMPT.md:** Section 1 (Step 1 — 3-path geocoding, confirmation step), Section 7 (LocationSearch spec, Leaflet dynamic import pattern)

**Dependencies built:** Parts 16–19

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 20 — Analyze page.
LocationSearch.jsx: 'use client'. Path A: Google Places Autocomplete. Path B: LeafletPinMap (dynamic import, ssr:false, extracted component). Path C: manual lat/lng fields. All paths → onResolved({ lat, lng, name, placeId? }).
LocationConfirmMap.jsx: Leaflet map, pin at resolved coords, "Confirm this location" button. Dynamic import only.
analyze/page.jsx: minimalist search, uses LocationSearch, on confirm calls POST /analyze/start, redirects to /funnel?sessionId=xxx.

---

## PART 21 — Context Screen + Funnel Foundation

**Files:**
- components/ContextScreen.jsx
- hooks/useFunnel.js

**Read from MASTER_PROMPT.md:** Section 1 (Step 3 — context screen fields, budget brackets, BHK enum, floor enum), Section 7 (ContextScreen spec, frontend normalisation of budgetBracket)

**Dependencies built:** Parts 16–20

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 21 — Context screen + funnel hook.
ContextScreen.jsx: For Sale/For Rent toggle. Budget dropdown (shows sale or rent brackets based on toggle). BHK dropdown. Floor dropdown. All 4 required. On submit: normalise to single budgetBracket field, POST /analyze/:sessionId/context, advance to funnel Step 1.
useFunnel.js: manages current step, step data, listingTypeContext, calls POST /funnel/save per step, handles complete=true on Step 8.

---

## PART 22 — Funnel Step Components

**Files:**
- components/FunnelStep.jsx

**Read from MASTER_PROMPT.md:** Section 1 (Steps 1–8 exact fields, WFH toggle logic, Step 7 sale/rent branching), Section 7 (FunnelStep spec, workplace LocationSearch note)

**Dependencies built:** Parts 16–21

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 22 — FunnelStep.jsx.
All 8 steps fully implemented — no placeholders.
Step 1: WFH full-time toggle hides workplace + commute fields. Workplace uses same LocationSearch component. All 3 geocoding paths available.
Step 7: renders sale fields OR rent fields based on listingTypeContext from useFunnel.
Step 8: review screen, no new data, confirm triggers complete=true in useFunnel.
Design: glass-card, max-w-md, btn-primary pinned to bottom, fadeUp animation per step.

---

## PART 23 — Funnel Page

**Files:**
- app/(app)/funnel/page.jsx

**Read from MASTER_PROMPT.md:** Section 1 (Steps 3–4 flow), Section 7 (funnel page architecture)

**Dependencies built:** Parts 16–22

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 23 — Funnel page.
'use client'. Reads sessionId from URL query param.
Shows ContextScreen first if context not yet submitted.
Then renders FunnelStep for current step (1–8) using useFunnel.
Step transitions: current fades out (200ms), next fades up (400ms). Vertical only — no horizontal slide.
On Step 8 confirm: redirect to /report/[sessionId].

---

## PART 24 — Report Components A

**Files:**
- components/report/VerdictBadge.jsx
- components/report/DataSourceLabel.jsx
- components/report/AeroSonicCard.jsx
- components/report/SolarPathCard.jsx

**Read from MASTER_PROMPT.md:** Section 2.5 (VerdictBadge token mapping §20, DataSourceLabel §19, card surface rules §8), Section 7 (component specs)

**Dependencies built:** Parts 16–23

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 24 — Report Components A.
VerdictBadge.jsx: translucent pill per Section 2.5 §20 token table. No opaque fills.
DataSourceLabel.jsx: news-aware source map from Section 7. SILENT_SOURCES set. Never shows 'unavailable'.
AeroSonicCard.jsx: noise + AQI combined card. glass-card, overline label, verdict badge, data source label. Banned words never appear.
SolarPathCard.jsx: solar viability card. Same structure. Peak sun hours + viability string.

---

## PART 25 — Report Components B

**Files:**
- components/report/CommunityPulseCard.jsx
- components/report/HyperPersonalCard.jsx
- components/report/FinancialCard.jsx
- components/report/RentalFitCard.jsx
- components/report/LocalNewsCard.jsx

**Read from MASTER_PROMPT.md:** Section 2.5 (card variants §8, financial card env-blue accent), Section 7 (component specs, LocalNewsCard PATCH #17)

**Dependencies built:** Parts 16–24

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 25 — Report Components B.
CommunityPulseCard.jsx: "Community intelligence coming soon" placeholder card. glass-card, consistent styling.
HyperPersonalCard.jsx: commute verdict + estimated minutes + lifestyle summary.
FinancialCard.jsx: sale only — financial scores, budget verdict, financialNote. env-blue accent line.
RentalFitCard.jsx: rent only — rental fit scores, rentalNote.
LocalNewsCard.jsx: renders headlines array. If empty (source:'fallback'): shows "No recent local headlines found." Never blank, never shows 'unavailable'.

---

## PART 26 — Report Viewer + Share

**Files:**
- components/report/ReportViewer.jsx
- components/report/VibeSummaryCard.jsx
- components/SharePDFBar.jsx
- app/(marketing)/report/[sessionId]/page.jsx

**Read from MASTER_PROMPT.md:** Section 1 (Step 6 — report viewing, conditional auth logic), Section 2.5 (scroll storytelling §7, VibeSummaryCard glass-elevated + glow-gold-lg), Section 7 (ReportViewer layout, 4-chapter structure, IntersectionObserver pattern)

**Dependencies built:** Parts 16–25

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 26 — Report viewer + share.
ReportViewer.jsx: 4-chapter scroll structure from Section 2.5 §7. IntersectionObserver + .reveal + stagger-children. Chapter order: VibeSummary → AeroSonic → Solar → LocalNews → HyperPersonal → CommunityPulse → Financial/Rental → SharePDFBar. FinancialCard or RentalFitCard based on listingType.
VibeSummaryCard.jsx: glass-elevated, glow-gold-lg, headline, matchKeywords pills, verdict, flag count.
SharePDFBar.jsx: copies share URL to clipboard. PDF: html2canvas + jsPDF. Hidden when readonly=true.
report/[sessionId]/page.jsx: server component, conditional auth from Section 1 Step 6. await params, await searchParams.

---

## PART 27 — Landing Page

**Files:**
- app/(marketing)/page.jsx

**Read from MASTER_PROMPT.md:** Section 2.5 (landing page atmosphere — noise overlay, particle field max 12, gradient-hero, scan line NOT on landing), Section 1 (platform overview — "user brings property, app brings intelligence")

**Dependencies built:** Parts 16–26

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 27 — Landing page.
Cinematic dark landing. Sections: hero → how it works → signal preview → CTA.
Hero: particle field (max 12, JS-generated with CSS vars --dx --dy), gradient-hero radial wash, noise-overlay.
Copy communicates "audit any property you find" — not a listing browser.
CTA: links to /analyze.
IntersectionObserver on all sections (.reveal).
prefers-reduced-motion: particles disabled, noise static.

---

## PART 28 — Admin Layout + Shared Components

**Files:**
- app/(app)/admin/layout.jsx
- components/admin/AdminSidebar.jsx
- components/admin/StatCard.jsx
- components/admin/DataTable.jsx

**Read from MASTER_PROMPT.md:** Section 7 (AdminSidebar nav structure with Phase 2 greyed items, broker-portal stub note), Section 2.5 (admin panel glass rules — blur cap 16px, minimal glow, no gradients)

**Dependencies built:** Parts 16–27

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 28 — Admin layout + shared components.
admin/layout.jsx: requireAdmin check server-side, AdminSidebar + main content area.
AdminSidebar.jsx: exact nav structure from Section 7. Phase 2 items (Auction Market, Bid History): opacity-40, cursor-not-allowed, no Link — div only.
StatCard.jsx: glass-subtle, single accent-colored number, glow-gold-sm on number only.
DataTable.jsx: reusable table, glass-card, row hover per Section 2.5 §9, border-b between rows.

---

## PART 29 — Admin Dashboard + Shadow Properties

**Files:**
- app/(app)/admin/page.jsx
- app/(app)/admin/shadow-properties/page.jsx
- app/(app)/admin/shadow-properties/[id]/page.jsx

**Read from MASTER_PROMPT.md:** Section 7 (admin dashboard — 4 StatCards, shadow properties panel spec)

**Dependencies built:** Parts 16–28

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 29 — Admin dashboard + shadow properties.
admin/page.jsx: 4 StatCards (Total Audits, Leads by tier, Active Brokers, Cluster Health). Data from GET /admin/leads/stats.
shadow-properties/page.jsx: DataTable, filter by status + listingType. Read-only.
shadow-properties/[id]/page.jsx: full intelligence detail. All 5 signal values + dataSource per signal. await params.

---

## PART 30 — Admin Leads Panel

**Files:**
- app/(app)/admin/leads/page.jsx
- app/(app)/admin/leads/[id]/page.jsx
- components/admin/LeadScoreBar.jsx
- components/admin/LeadSignalCard.jsx

**Read from MASTER_PROMPT.md:** Section 7 (admin leads panel — read-only, filters, lead detail structure with signal card layout)

**Dependencies built:** Parts 16–29

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 30 — Admin leads panel.
leads/page.jsx: DataTable, filter by tier/listingType/stage. No edit actions — read only.
leads/[id]/page.jsx: verdictObject display, scoreBreakdown, dataSource. await params.
LeadScoreBar.jsx: visual score bar 0–100, color shifts by tier (hot/warm/lukewarm/cold).
LeadSignalCard.jsx: signal name, raw value, user preference, VerdictBadge, DataSourceLabel per signal.

---

## PART 31 — Admin Brokers + Clusters + Broker Portal Stub

**Files:**
- app/(app)/admin/brokers/page.jsx
- app/(app)/admin/brokers/[id]/page.jsx
- app/(app)/admin/clusters/page.jsx
- components/admin/ClusterHealthBadge.jsx
- app/(app)/broker-portal/layout.jsx

**Read from MASTER_PROMPT.md:** Section 7 (broker CRUD, cluster panel with freshness, broker-portal stub spec), Section 9 (Phase 2 integration hooks)

**Dependencies built:** Parts 16–30

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 31 — Admin brokers + clusters + broker portal stub.
brokers/page.jsx + [id]/page.jsx: full CRUD, isActive toggle, assigned leads view.
clusters/page.jsx: list all clusters, freshness indicators, manual refresh button per cluster.
ClusterHealthBadge.jsx: visual badge showing fresh/stale/cold state.
broker-portal/layout.jsx: "Broker portal coming in Phase 2" message. Full auth guard applied. No active UI.

---

## PART 32 — Static Data + Seed Scripts

**Files:**
- src/data/evergreenClusters.js
- src/data/cityCenters.js
- src/data/cityAQIAverages.js
- src/data/cityWeatherAverages.js
- scripts/seedClusters.js
- scripts/seedShadowProperties.js
- scripts/seedLeads.js
- scripts/seedUsers.js

**Read from MASTER_PROMPT.md:** Section 4 (evergreenClusters full list, cityCenters, cityLandmarks removed), Section 8 (seed scripts, run order, sample data specs)

**Dependencies built:** All previous parts

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 32 — Static data + seed scripts.
evergreenClusters.js: exact cluster IDs from Section 4.
cityCenters.js: exact coordinates from Section 4. This replaces cityLandmarks.js.
cityAQIAverages.js: state-wise monthly averages structure — kerala, karnataka, tamilnadu, maharashtra, delhi, uttarpradesh + national_default fallback.
cityWeatherAverages.js: same structure for weather.
seedUsers.js: 3 accounts exactly as Section 8.
seedShadowProperties.js: 10 documents, 5 sale + 5 rent, real Indian coords from evergreen zones, realistic intelligence values, mixed dataSource.
seedLeads.js: 2 documents linked to 2 shadow properties. Run after seedShadowProperties.
seedClusters.js: iterates EVERGREEN_CLUSTER_IDS, upsertCluster + fetch all 5 signals live + store MongoDB + Redis.
Run order: seedUsers → seedShadowProperties → seedLeads.

---

## PART 33 — Deployment

**Files:**
- DEPLOYMENT.md

**Read from MASTER_PROMPT.md:** Section 10 (full deployment checklist, Nginx config, Vercel config, smoke tests, monitoring)

**Dependencies built:** All parts

**Instructions:**
You are building Vibescout. Read MASTER_PROMPT.md.
Build Part 33 — DEPLOYMENT.md.
Cover exactly: infrastructure setup, MongoDB index creation commands, backend PM2 deploy steps, seed script run order, Nginx config block, certbot SSL, Vercel frontend deploy, env var checklist for both backend and Vercel, all 8 smoke tests from Section 10, monitoring setup.
Production-ready. No placeholders.

---

## Session recovery template
If a session ends mid-part, start the next session with:

You are building Vibescout. Read MASTER_PROMPT.md.
We are resuming Part [N] — [NAME].
Already written in this part: [list files done]
Still needed: [list remaining files]
Continue from where we left off. No placeholders. No TypeScript.