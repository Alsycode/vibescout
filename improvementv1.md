# VibeScout v2 — Improvement Tracker v1

Track improvements systematically. Mark items `[x]` when complete with a brief note.

---

## 🔴 Critical Bugs / Dead Features

### [ ] 1. Fix RentalFitCard dead fields
**Status:** Pending  
**Severity:** Critical (rent users see empty metrics grid)  
**What:** `RentalFitCard.jsx` reads `financial.rentToIncomeRatio` and `financial.annualRentBurden`, but `computeFinancialScores` in `src/routes/report.routes.js` returns `monthlyRentPercent` and `rentStressFreeScore` instead.

**Where to fix:**
- `src/routes/report.routes.js` — `computeFinancialScores` function (rent branch)
- Add: `rentToIncomeRatio: monthlyRentPercent` and `annualRentBurden: formatted yearly string`

**Why:** Field name mismatch from a prior refactor. Rent properties show no financial data.

---

### [ ] 2. Weather signal — wire or drop
**Status:** Pending  
**Severity:** Medium (wasted fetch)  
**What:** `src/services/intelligencePipeline.service.js` fetches weather in parallel but no report card uses it and no verdict depends on it.

**Options:**
- (A) Remove from pipeline (saves API call, simplifies)
- (B) Add a weather/climate card to the report
- (C) Use weather data in Groq prompts for livability insights

**Recommend:** Option A unless you have a specific card planned.

---

### [x] 3. Add signal timeout (prevent hanging)
**Status:** Complete (2026-06-28)  
**What:** Added 10-second timeout per signal fetch in `src/services/intelligencePipeline.service.js`. Each of the 6 signals (AQI, Noise, Solar, Weather, Amenities, LocalNews) now races against a 10s timer. If a signal times out, a pre-defined fallback object is returned instead of stalling the entire pipeline.

**Implemented:**
- Created `withTimeout()` helper function using `Promise.race`
- Added timeout fallback objects for each signal type
- Wrapped all 6 signals with `.catch()` handlers that log timeout and return fallback
- `Promise.all` now always resolves, even if individual signals time out

**Result:** Report generation will complete even if external APIs (Places, NewsAPI, AQI) hang.

---

### [x] 4. Wire rate limiter middleware
**Status:** Complete (2026-06-28)  
**What:** Wired rate limiter middleware to protect API routes from brute-force and abuse. Updated `server.js` to apply specific limiters to route groups.

**Implemented:**
- Imported `authLimiter` (20 req/15min), `analyzeLimiter` (30 req/hour), `reportLimiter` (60 req/hour) from `src/middleware/rateLimiter.js`
- Applied `authLimiter` to `/auth` routes (login brute-force protection)
- Applied `analyzeLimiter` to `/analyze` routes (resource-intensive property analysis)
- Applied `reportLimiter` to `/report` routes (expensive report generation)
- Global `apiLimiter` (100 req/15min) already applied to `/api` prefix

**Result:** App now rejects excessive requests with 429 Too Many Requests. Protects against abuse.

---

## 🟠 Phase 2/3 Features (Planned)

### [ ] 5. Verify VastuCard integration
**Status:** Pending  
**What:** Vastu logic exists in verdictEngine (`vastuVerdict` function), component exists (`frontend/components/report/VastuCard.jsx`), but verify it's wired into report page and rendering correctly.

**Check:**
- Does `ReportViewer.jsx` render `<VastuCard />` when `intel.vastu` exists?
- Does backend pass `vastu` object in report payload?
- Does card show user's facing direction preference vs verdict?

---

### [ ] 6. Revive CommunityPulseCard
**Status:** Pending  
**What:** `frontend/components/report/CommunityPulseCard.jsx` is 100% hardcoded "coming soon". Community verdict logic already exists in `verdictEngine.service.js`.

**Flow:**
1. Backend: Derive community character from amenity counts (family-friendly, young & social, mixed)
2. Pass `community` object in report payload with `verdict`, `derivedCharacter`, `userPreference`
3. Frontend: Render card showing match/mismatch + amenity counts

**Files:**
- `src/services/verdictEngine.service.js` — `communityVerdict` function (verify logic)
- `src/routes/report.routes.js` — Include community in report object
- `frontend/components/report/CommunityPulseCard.jsx` — Replace placeholder with real card

---

### [ ] 7. Add Investment Intent framing to Groq
**Status:** Pending  
**What:** `step6.investmentIntent` ("Personal Use" / "Investment" / "Both") is collected in funnel but Groq prompt doesn't branch on it.

**When:** Property is for sale AND investmentIntent is "Investment" or "Both":
- Add rental yield context to Groq prompt
- Include resale potential notes
- Frame financial metrics as investment opportunity, not just affordability

**Files:**
- `src/services/groq.service.js` — Modify prompt builder to check `investmentIntent`
- `src/routes/report.routes.js` — Pass `investmentIntent` to Groq service

---

### [ ] 8. Add RentalChecklist card
**Status:** Pending  
**What:** `step6.petsAllowed`, `step6.leasePreference`, `step6.furnishingPreference` are collected in funnel step 7 but never appear in report.

**New card:** `frontend/components/report/RentalChecklistCard.jsx`
- Show user preferences (pets allowed?, lease duration, furnishing)
- Add actionable notes per preference (e.g., "Furnished rentals harder to negotiate, check break clause")
- Show verdict: all match = pass, none match = red_flag, partial = caution

**Files:**
- Create `frontend/components/report/RentalChecklistCard.jsx`
- Wire into `ReportViewer.jsx` (render if `listingType === 'rent'`)
- Backend: ensure preferences are passed in report object

---

## 🟡 High-Value UX Improvements

### [ ] 9. Add back button to funnel
**Status:** Pending  
**What:** Funnel progression is one-directional. User can't go back to modify a prior step.

**Where:** `frontend/app/(app)/funnel/page.jsx`
- Add "← Back" button (disabled on Step 1)
- On click: decrement step, re-populate form from saved preferences
- OR: Modify sidebar to allow clicking prior steps

**Why:** Users make mistakes, want to verify prior answers. Current flow forces restart.

---

### [ ] 10. Add client-side form validation with error messages
**Status:** Pending  
**What:** No per-field validation. Submitting incomplete/invalid data fails silently.

**Where:** `frontend/components/FunnelStep.jsx` + all step components
- Add validation helper (check required fields, phone format, bracket selection)
- Show inline error messages (red text below field)
- Disable "Next" button until form is valid
- Example: "Income bracket required", "Select at least 1 amenity"

**Why:** Users don't know why submit failed. Conversion friction.

---

### [ ] 11. Replace fake StatusStrip stats with real data
**Status:** Pending  
**What:** Landing page StatusStrip shows hardcoded "847 REPORTS TODAY · LAST GENERATED: 4 MIN AGO". Fake stats kill trust.

**Replace with real numbers:**
- `847 REPORTS TODAY` → Count reports from last 24h (MongoDB aggregation)
- `LAST GENERATED: 4 MIN AGO` → Timestamp of latest report
- `BENGALURU · MUMBAI · PUNE · HYDERABAD` → Top 4 cities by report count (dynamic)

**Implementation:**
- Create `src/routes/stats.routes.js` → `GET /stats` returns `{ reportCount24h, lastReportTime, topCities }`
- Cache in Redis (5 min TTL)
- Frontend: `fetch /stats` on landing page load, update StatusStrip

**Files:**
- `frontend/app/(marketing)/page.tsx` — Fetch stats on mount, pass to `StatusStrip`
- `src/routes/stats.routes.js` — New file with stats endpoint

---

### [ ] 12. Enhance My Reports page
**Status:** Pending  
**What:** Cards show only `listingType badge + name + date`. Missing property specs, no sorting, no delete.

**Add:**
- BHK, floor, budget bracket displayed (from `userProvidedSpecs`)
- Verdict summary (pass/caution/red_flag count badge)
- "Delete report" button (with confirmation)
- Sort by: Date (default), Verdict, Property Name
- Filter by: Sale / Rent
- Search by: Property name

**Where:** `frontend/app/(app)/my-reports/page.jsx`

**Why:** Users forget what they analyzed, can't find reports, can't clean up old ones.

---

### [ ] 13. Add funnel autosave to localStorage
**Status:** Pending  
**What:** Browser crash mid-funnel = all progress lost. No recovery.

**Where:** `frontend/app/(app)/funnel/page.jsx`
- On each step save, also snapshot to `localStorage.vibescout.funnel`
- On mount: Check localStorage, offer "Resume where you left off?" or "Start fresh?"
- If resume: pre-populate all fields, jump to last step + 1

**Why:** Reduces abandonment. User doesn't re-answer all questions.

---

## 🟡 Missing Pages / Core Flows

### [x] 14. Implement password reset flow
**Status:** Complete (2026-06-28)

**Implemented:**
- Added `resetToken` + `resetTokenExpiry` fields to `src/models/User.js`
- Created `src/services/email.service.js` — Nodemailer SMTP with dev console fallback (when `EMAIL_HOST` env not set, logs link to console)
- Installed `nodemailer@9.0.1`
- Added to `src/routes/auth.routes.js`:
  - `POST /auth/forgot-password` — generates 32-byte crypto token, stores with 1hr expiry, sends email (never reveals if email exists)
  - `POST /auth/reset-password` — verifies token + expiry, bcrypt-hashes new password, clears token
  - `PUT /auth/profile` — update name/phone
  - `PUT /auth/password` — change password (requires current password verification)
- Created `frontend/app/(app)/forgot-password/page.jsx` — email entry form, shows "check your inbox" on success
- Created `frontend/app/(app)/reset-password/page.jsx` — token from URL param, new password + confirm, auto-redirects to login on success
- Added "Forgot password?" link to login page password field label row

**Env vars required for email:**
`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
Without these, reset link logs to server console (dev mode).

---

### [x] 15. Create /profile and /account pages
**Status:** Complete (2026-06-28)

**Implemented:**
- Created `frontend/app/(app)/profile/page.jsx` with:
  - Stats row: reports generated, reports unlocked, account role
  - Personal Information section: editable name + phone, read-only email
  - Change Password section: current password + new + confirm, with client validation
  - Toast notifications (success/error) on save
  - API calls to `PUT /auth/profile` and `PUT /auth/password`
- Backend endpoints added to `src/routes/auth.routes.js` (see item 14)

---

### [ ] 16. Add public blog listing page
**Status:** Pending  
**What:** Blog admin CRUD exists but no public `/blog` route. This is SEO/organic traffic sitting unused.

**`/blog` page:**
- List all published blog posts (title, excerpt, date, author, reading time)
- Sort by date (newest first)
- Search + filter by category
- Link to individual post

**`/blog/[slug]` page:**
- Full post content (markdown or rich text)
- Author info
- Publish/update date
- "Back to blog" link

**Files:**
- Create `frontend/app/(marketing)/blog/page.tsx`
- Create `frontend/app/(marketing)/blog/[slug]/page.tsx`
- Backend: Verify `GET /blog` and `GET /blog/:slug` endpoints exist

**Why:** Free SEO. Neighborhood guides, Vastu primer, AQI explainer rank for keywords + convert readers to property searches.

---

### [x] 17. Add standalone /pricing page
**Status:** Complete (2026-06-28)

**Implemented:** Created `frontend/app/(marketing)/pricing/page.tsx` with:
- ₹199 price card with animated gold border
- 12-item "What's included" checklist with green check icons
- "Not included yet" section (comparison, broker consultation)
- "Run Intelligence →" CTA
- 6-item FAQ (subscription? refund? sharing? data validity?)
- Razorpay/PCI-DSS trust badges
- Footer link updated to `/pricing`

---

### [x] 18. Add legal pages (/terms, /privacy)
**Status:** Complete (2026-06-28)

**Implemented:**
- Created `frontend/app/(marketing)/terms/page.tsx` — 12 sections covering acceptance, service description, payments (₹199 + Razorpay), accuracy, IP, prohibited use, liability, termination, governing law (Bengaluru courts)
- Created `frontend/app/(marketing)/privacy/page.tsx` — 10 sections covering data collection, third-party services (Google/Razorpay/Groq), storage (MongoDB Atlas India), cookies (HttpOnly vb_session only), user rights, retention
- Updated `frontend/components/Footer.jsx` — `/privacy` and `/terms` links now real URLs (not `#`); also updated Pricing link to `/pricing` and added Blog link

---

## 🟡 Report Value-Adds

### [x] 19. Add Amenity Summary card
**Status:** Complete (2026-06-28)  
**What:** Created detailed amenity summary card showing nearby schools, hospitals, parks, gyms, cafes with distance-based verdicts and Google Maps integration.

**Implemented:**
- Created `frontend/components/report/AmenitySummaryCard.jsx` with:
  - Categorized layout (Schools, Hospitals, Parks, Gyms, Cafes, Restaurants)
  - Top 5 places per category with name, distance, and verdict badge
  - Verdict badges: "Near" (pass ≤threshold), "Moderate" (caution), "Far" (>caution threshold)
  - Each place name is clickable link to Google Maps search at property location
  - User priorities highlighted with "Priority" badge
  - Distance legend showing threshold distances for each category
- Imported and wired into `ReportViewer.jsx` after signal cards section
- Uses coordinates from `report.propertyLat` and `report.propertyLng`
- Gracefully hides if amenities or coordinates unavailable

**Result:** Users see actionable breakdown of nearby places with distance verdicts. Can click any place to view on Google Maps. Matches existing report card styling.

---

### [ ] 20. Cache Noise signal at cluster level
**Status:** Pending  
**What:** All other signals (AQI, solar, weather) are cluster-cached. Noise hits live API every time, no fallback.

**Where:** `src/services/intelligencePipeline.service.js`
- Modify `fetchNoiseWithFallback` to check Redis cluster cache first
- If miss: fetch live, store in Redis (24h TTL) at `cluster:{clusterId}:noise`
- Add seasonal fallback if live fetch fails

**Why:** Noise fetch is slow, unprotected, and often fails for areas with poor coverage. Caching reduces latency 10x.

---

### [ ] 21. Add report comparison mode
**Status:** Pending  
**What:** Running intelligence on multiple properties has no compare mode. Side-by-side would show decision value.

**UX:**
- "Compare reports" checkbox on my-reports page
- Select 2–3 reports, open comparison view
- Side-by-side verdict summaries, financial metrics, signals
- Highlight winner per signal

**Implementation:**
- `/compare?sessions=XXX,YYY,ZZZ` page
- Fetch multiple reports, render side-by-side grid
- Consider card layout for mobile (stacked vs grid)

**Files:**
- Create `frontend/app/(app)/compare/page.tsx`
- Modify `my-reports` to add checkboxes + "Compare selected" button

---

### [ ] 22. Implement PDF export / report sharing
**Status:** Pending  
**What:** `SharePDFBar` component exists but PDF generation unclear. A downloadable PDF is a strong user ask.

**Features:**
- "Download PDF" button on report page
- PDF includes: VibeSummary, all signals, financial, map, disclaimer
- "Copy share link" button (generates short URL with token)
- Email report: `mailto:?subject=...&body=[share link]`

**Implementation options:**
- Use `react-pdf` or `html2pdf` for client-side generation
- OR: Backend service (Puppeteer) for server-side PDF
- Share token already exists in `User.reportHistory.shareToken`

**Files:**
- `frontend/components/report/SharePDFBar.jsx` — Implement full logic
- If server PDF: create `src/routes/export.routes.js` → `GET /export/report/:sessionId.pdf`

---

### [ ] 23. Wire real analytics to landing page
**Status:** Pending  
**What:** All numbers on landing page are hardcoded/fake. StatusStrip, testimonial counts, city list should be real.

**Real data points:**
- Reports generated (24h, all-time)
- Cities covered (dynamic list from reports)
- Average verdict distribution (% pass, caution, red_flag)
- User testimonials (if you have them; otherwise drop section)

**Where:** Create stats endpoint (see #11), wire into landing page sections

---

## 🟢 Strategic / Growth

### [ ] 24. Launch public blog for SEO
**Status:** Pending  
**What:** Blog infrastructure exists (admin CRUD), but no public discovery. This is free organic traffic.

**Initial posts to write (sample):**
- "Vastu for Modern Homes: What Science Says"
- "Understanding AQI: Air Quality Impact on Property Value"
- "Commute vs Amenities: What Matters Most?"
- "First-Time Buyer: How to Use VibeScout"
- "Neighborhood Guides: [City] by Vibe & Walkability"

**Where:** `/blog` (see #16)

**Why:** SEO + authority. Keywords like "best neighborhoods [city]", "Vastu guide", "AQI explained" have search volume.

---

### [ ] 25. Build MVP broker portal
**Status:** Pending  
**What:** Lead model has auction fields, broker model exists, admin routes live. Broker-facing layer is next monetization.

**Broker dashboard (`/broker-portal`):**
- View leads in assigned cluster
- See verdicts, financial scores, amenity matches
- Bid on properties (simple auction UI)
- Track deal stage (new → listed → sold → expired)

**Backend:**
- Verify Broker model is complete
- Implement `PATCH /leads/:id/bid` endpoint
- Implement `GET /broker/cluster/:clusterId/leads` endpoint

**Files:**
- `src/models/Broker.js` — Verify schema (name, email, phone, clusterId, commissionRate)
- `src/routes/leads.admin.routes.js` — Extend with broker endpoints
- Create `frontend/app/(app)/broker-portal/page.tsx`

**Why:** Revenue expansion. Brokers pay 10–15% of deal value, or flat monthly subscription.

---

### [x] 26. Add funnel analytics tracking
**Status:** Complete (2026-06-28)  
**What:** Built end-to-end funnel analytics system tracking step entry/exit, time spent, errors, and device types with admin dashboard.

**Implemented:**

**Backend:**
- Created `src/models/FunnelAnalytics.js` — MongoDB model storing userId, sessionId, step, action (enter/exit/error), timestamp, timeSpentMs, errorMessage, deviceType
- Created `src/services/funnelAnalytics.service.js` — Analytics aggregators:
  - `getStepCompletionRates()` — % completion per step with drop-off tracking
  - `getAvgTimePerStep()` — avg, median, p95, max time spent per step
  - `getErrorRateByStep()` — error % by step with top error messages
  - `getDeviceComparison()` — completion rates: mobile vs desktop
  - `getRecentEvents()` — raw event log with filters
  - `logFunnelEvent()` — atomic write-through for tracking
- Added endpoints to `src/routes/funnel.routes.js`:
  - `POST /funnel/analytics` — log event from client
  - `GET /funnel/analytics` (admin only) — fetch aggregated stats with ?daysBack query

**Frontend:**
- Added analytics tracking helper to `frontend/app/(app)/funnel/page.jsx`:
  - Logs step `enter` when user reaches new step
  - Logs step `exit` with time spent (Date.now() - entry time)
  - Tracks device type (mobile/desktop based on viewport width)
  - Automatic error tracking support for future implementation
- Non-blocking POST calls (doesn't delay UX)

**Admin Dashboard:**
- Created `frontend/app/(app)/admin/funnel-analytics/page.tsx` with 5 tabs:
  - **Completion Rates** — funnel waterfall showing % drop-off at each step (visually alerts if >20% drop)
  - **Time per Step** — avg, median, p95, max time; highlights slow steps (>5m)
  - **Error Rates** — error count/rate per step + top 3 error messages
  - **Device Comparison** — mobile vs desktop completion rates to identify UX issues
  - **Recent Events** — searchable raw event log (last 50) with user, step, action, duration
- Time range filter: last 7/14/30 days
- Color-coded metrics (red for high drop-off/errors, amber for moderate, green for good)
- Responsive table design with formatted durations (e.g., "2m 45s")

**Result:** Admins can now identify exactly where funnels leak. "Step 5 has 45% drop-off" points directly to redesign priorities. Mobile vs desktop comparison flags responsive design issues.

---

### [ ] 27. Add referral / share incentive
**Status:** Pending  
**What:** Share tokens exist, but no incentive to share. A small reward loop drives viral growth.

**Mechanic:**
- User generates report, gets shareable link + unique referral code
- Friend opens link, runs intelligence, unlocks via payment
- Referrer gets ₹20 credit / discount on next report
- Both get "Shared by [name]" badge

**Implementation:**
- Add `referredBy: userId` to User model
- Track in report unlock: if referred, credit both users
- Show referral status on my-reports, share modal

**Why:** 10% referral conversion = 10% growth, cheap CAC.

---

## Completed Items

(Mark items here with `[x]` as they're finished. Include session date and brief note of what was done.)

---

## Notes

- **Approval workflow:** Before implementing any item, present the scope and get user approval.
- **Scope:** Each item is independent or clearly listed as depending on prior items.
- **Context:** Each item includes file paths, logic, and why it matters — future Claude sessions can pick it up without this conversation.
- **Session resume:** New session: read this file, find first `[ ]` item, ask user for approval on scope, implement, mark `[x]`.
