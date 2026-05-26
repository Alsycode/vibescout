VIBESCOUT — PHASE 1 MASTER BUILD
PROMPT V2
<!-- Assembly: V2_Consolidation_Plan.md + Cleanup_Patches_P0_P1.md +
Final_Consistency_Audit.md + Section_2_5_Global_Design_System.md applied to
vibescout-master-build-prompt.pdf -->
Section 1 — Platform Overview + Core
Logic + User Journey
WHAT THIS IS
Vibescout is a two-sided real estate intelligence platform.
Consumer side:
● User searches any real-world property by name or location (not a curated listing)
● User provides basic context (price bracket, BHK, floor)
● User completes an 8-step lifestyle preference funnel
● User receives a deterministic AI-audited property report powered by live environment
data (AQI, noise, solar, amenities) + GROQ as a constrained formatter
Intelligence side:
● Every completed funnel creates a scored Lead document
● The lead captures: what property the user is auditing, their budget, their lifestyle profile,
and the real-world data verdict for that location
● This is a high-intent lead — the user is actively validating a property they found in the
real world
● In Phase 2, brokers bid on leads via a 5-minute auction window, paying per bid through
Razorpay
Phase 2 (auction marketplace — NOT built in Phase 1, but fully prepared for):
● Brokers bid on high-score leads using Razorpay per-bid payment during a 5-minute
auction window
● All schema fields, route stubs, and admin UI hooks for Phase 2 are built in Phase 1 so
integration requires zero breaking changes
● Phase 2 bidding logic is clearly marked with // PHASE 2 comments
Domain: vibescout.com API: api.vibescout.com Admin: vibescout.com/admin (role: admin)
Storage: MongoDB Atlas + Upstash Redis
THE CORE LOGIC SHIFT — READ BEFORE WRITING
ANY CODE
Old model (DO NOT BUILD THIS): Admin uploads property listings. User browses, clicks a
listing, completes a funnel, gets a report about that listing.
New model (BUILD THIS): User searches any property they have found in the real world (from
a broker, a site visit, word of mouth). The app audits it. The user brings the property; the app
brings the intelligence.
This means:
● There is NO admin-managed property listing page
● There is NO /properties browse page
● There is NO Property model
● There is a ShadowProperty model — user-triggered, not admin-uploaded
● The app is a Property Audit Tool, not a listing marketplace
USER JOURNEY (STEP BY STEP)
Step 1 — Property Discovery (/analyze)
User lands on a minimalist search page with a single input: "Enter the property name or address
you are considering."
Geocoding — three-path fallback (all paths mandatory):
Path A (primary): Google Places Autocomplete. User selects a verified place from the
dropdown. Frontend sends place_id to backend. Backend calls Google Place Details API for
exact lat and lng.
Path B (fallback if Places API fails or quota exceeded): A free Leaflet.js map appears. User
drops a pin on the property location. No API key needed.
Path C (last resort): Manual lat/lng coordinate entry fields appear.
All three paths converge at a confirmation step: After any path resolves coordinates, show a
small Leaflet map with the pin at the resolved location. Display a "Confirm this location" button.
The user must tap confirm before anything proceeds.
Only after confirmation does the frontend send { place_id?, lat, lng, name } to POST
/analyze/start.
Step 2 — Intelligence Pipeline Fires (Background, Async)
The moment POST /analyze/start is called, the backend:
1. Creates a ShadowProperty document with status: 'fetching' and expiresAt:
Date.now() + 24 * 60 * 60 * 1000
2. Returns { sessionId, shadowPropertyId } to the frontend immediately
3. Fires the async intelligence pipeline in the background (does NOT await it)
The async pipeline (non-blocking, runs while user fills the funnel):
● Macro signals: AQI, weather, solar — via clusterService using cluster centroid
(cached, cheap)
● Micro signals: Noise and Amenities — using the EXACT confirmed coordinates for
street-level precision
● Each signal has an independent 5-second timeout
● A failed signal NEVER stores null — every signal has a guaranteed waterfall fallback
chain
● All Redis data written with EX 7200 (2-hour auto-expiry)
● On pipeline complete: ShadowProperty.status → 'completed'
● One Redis key written per session: session:{sessionId}:intelligence
containing all 5 signals as a single object (EX 7200)
● dataSource object always written per signal: { aqi:
'live'|'cache'|'city_average'|'seasonal', noise:
'live'|'cache'|'estimated', solar: 'live'|'cache'|'computed',
amenities: 'live'|'cache'|'seed', weather:
'live'|'cache'|'seasonal' }
Step 3 — Context Screen (Before Funnel)
Before the 8-step funnel, show a "Property Context" screen:
● "For Sale / For Rent" toggle — sets listingType, drives funnel Step 7 and entire
report format
● "What is the asking price / monthly rent?" → dropdown brackets
○ Sale brackets: Under 30L / 30L–60L / 60L–1Cr / 1Cr–1.5Cr / 1.5Cr–2Cr /
2Cr–3Cr / 3Cr–5Cr / Above 5Cr
○ Rent brackets: Under 10K / 10K–20K / 20K–35K / 35K–50K / 50K–75K / 75K–1L
/ Above 1L
● "BHK / Property Type?" → 1BHK / 2BHK / 3BHK / 4BHK+ / Studio / Villa / Plot / PG
● "Which floor is it on?" → Ground / 1–3 / 4–7 / 8–15 / 16+ / Top Floor / Unknown
All four fields required. The selected price/rent bracket is normalised and stored as
budgetBracket (single field, not two separate fields). Server validates all as enums. Invalid
payloads rejected before session proceeds.
Step 4 — Lifestyle Funnel (8 Steps)
User completes the 8-step funnel. Because the intelligence pipeline fired in Step 2, by the time
the user reaches Step 8, data is already cached. Zero visible wait in the happy path.
Step 1 — Location & Commute:
● "Do you work from home full-time?" toggle
○ YES → wfhStatus: 'full-time' → commute verdict auto-set to pass →
skip Q2/Q3/Q4
○ NO / Hybrid → show Q2, Q3, Q4
● Q2: "Where is your workplace?" → same LocationSearch component used for
property search (Google Places Autocomplete → Leaflet pin → manual coords) →
resolves to { workplaceLat, workplaceLng }
● Q3: "How do you usually commute?" → Walking / Two-wheeler / Auto-rickshaw / Car /
Public transport
● Q4: "What is your maximum acceptable commute time?" → 15 min / 30 min / 45 min / 60
min / 90 min
Hybrid WFH users are treated the same as non-WFH for commute verdict — they still commute
on office days.
Step 2 — Lifestyle type: Remote worker / Family / Student / Professional / Retired
Step 3 — Environmental sensitivity:
● AQI sensitivity: Sensitive / Moderate / Low
● Noise sensitivity: High / Moderate / Low
Step 4 — Home usage:
● WFH status (carried from Step 1 — pre-filled, not re-asked)
● Vastu preference: Yes / No / No preference
● Preferred facing direction: East / West / North / South / No preference
Step 5 — Amenity priorities: User ranks which amenities matter most: Schools / Hospitals /
Parks / Gyms / Cafes. Top 2 ranked drive the amenityVerdict.
Step 6 — Community preferences: Family-heavy area / Quiet residential / Active nightlife /
Mixed / No preference
Step 7 (sale) — Financial profile:
● Monthly household income (bracket)
● Available down payment (bracket)
● Loan pre-approved: Yes / No
● Investment intent: Yes / No / Primary residence
Step 7 (rent) — Rental profile:
● Monthly household income (bracket)
● Preferred lease duration: 11 months / 1 year / 2 years / Flexible
● Pets owned: Yes / No
● Furnishing preference: Furnished / Semi-furnished / Unfurnished
● Move-in timeline: Immediately / Within 1 month / 1–3 months / 3+ months
Step 8 — Final confirmation: No new data collected. User reviews summary of their inputs
and confirms. On confirm: triggers computeAllVerdicts + computeLeadScore + Lead
document creation. Redirects to /report/[sessionId].
Step 5 — Report Generation (GET /report/generate)
When user submits Step 8:
1. Frontend calls GET /report/generate?sessionId=xxx
2. Backend checks ShadowProperty.status:
○ 'completed' → generate report
○ 'fetching' → return { status: 'pending', retryAfter: 3 }
3. Frontend polls every 3 seconds, hard cap of 60 seconds
4. Pipeline guaranteed to complete within 60s — 'failed' status does not exist
5. On report generation: full rendered report JSON is written to
User.reportHistory[].reportSnapshot (permanent) AND cached to Redis
report:{sessionId} EX 604800 (7 days)
Step 6 — Report Viewing
Single URL: /report/[sessionId]
Conditional auth logic (server-side, in page component):
● Has ?share=TOKEN in URL?
○ YES → look up User.reportHistory by sessionId + shareToken match
→ render public read-only report
○ NO → check JWT cookie → authenticated owner → render full report from
User.reportHistory
● No JWT → redirect to /login
Report page lives in (marketing)/ route group for SSR. Auth check happens server-side
before any data fetch. Share links are permanent (stored in User.reportHistory). Redis
cache is a fast-path only — source of truth is User.reportHistory[].reportSnapshot.
Section 2 — Schemas (All Models)
MONGOOSE SCHEMAS
ShadowProperty
{
sessionId: { type: String, required: true, unique: true },
placeId: { type: String, default: null },
name: { type: String, required: true },
coordinates: {
lat: { type: Number, required: true },
lng: { type: Number, required: true },
},
confirmedByUser: { type: Boolean, default: false },
clusterId: { type: String },
userProvidedSpecs: {
budgetBracket: { type: String, required: true },
// normalised at write time from priceBracket (sale) or rentBracket (rent)
// single field — no conditional reads anywhere downstream
bhk: { type: String, required: true,
enum: ['1BHK','2BHK','3BHK','4BHK+','Studio','Villa','Plot','PG'] },
floor: { type: String, required: true,
enum: ['Ground','1–3','4–7','8–15','16+','Top Floor','Unknown'] },
listingType: { type: String, required: true, enum: ['sale','rent'] },
},
intelligence: {
aqi: {
value: Number,
category: String,
source: { type: String, enum: ['live','cache','city_average','seasonal'] },
},
noise: {
estimatedDb: Number,
category: String,
source: { type: String, enum: ['live','cache','estimated'] },
},
solar: {
peakSunHours: Number,
viability: String,
source: { type: String, enum: ['live','cache','computed'] },
},
weather: {
temp: Number,
humidity: Number,
source: { type: String, enum: ['live','cache','seasonal'] },
},
amenities: {
schools: [{ name: String, distanceM: Number }],
hospitals: [{ name: String, distanceM: Number }],
parks: [{ name: String, distanceM: Number }],
gyms: [{ name: String, distanceM: Number }],
cafes: [{ name: String, distanceM: Number }],
source: { type: String, enum: ['live','cache','seed'] },
},
// PATCH #9 — cachedNews added to Cluster schema (see below)
// ShadowProperty stores localNews inline:
localNews: {
headlines: [{
title: String,
url: String,
source: String,
publishedAt: Date,
snippet: String,
}],
source: { type: String, enum: ['gnews','newsapi','google-rss','fallback'] },
updatedAt: Date,
},
},
dataSource: {
aqi: String,
noise: String,
solar: String,
weather: String,
amenities: String,
localNews: String, // PATCH — added with localNews propagation
},
status: { type: String, enum: ['fetching','completed'], default: 'fetching' },
// NOTE: 'failed' status does not exist — pipeline always completes via waterfall
expiresAt: { type: Date, required: true },
// set to Date.now() + 24h at creation
// ShadowProperty is a temporary working document
// Lead copies all important data at creation — ShadowProperty deletion loses nothing
createdAt: { type: Date, default: Date.now },
}
// Indexes
ShadowPropertySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL
ShadowPropertySchema.index({ sessionId: 1 }, { unique: true });
Cluster
{
clusterId: { type: String, required: true, unique: true },
// format: '{lat_2dp}_{lng_2dp}' e.g. '9.93_76.26'
centroidLat: { type: Number, required: true },
centroidLng: { type: Number, required: true },
cachedAQI: {
aqi: Number,
pm25: Number,
category: String,
updatedAt: Date,
},
cachedWeather: {
temp: Number,
humidity: Number,
description: String,
updatedAt: Date,
},
cachedSolar: {
peakSunHours: Number,
morningScore: Number,
wfhLightScore: Number,
acSavingsEstimate: Number,
solarPanelViability: String,
updatedAt: Date,
},
cachedNoise: {
score: Number,
estimatedDb: Number,
category: String,
profile: {
morning: String,
afternoon: String,
night: String,
},
source: { type: String, enum: ['howloud','estimated'] },
updatedAt: Date,
},
cachedAmenities: {
schools: [{ name: String, distance: Number, placeId: String }],
hospitals: [{ name: String, distance: Number, placeId: String }],
gyms: [{ name: String, distance: Number, placeId: String }],
restaurants: [{ name: String, distance: Number, placeId: String }],
parks: [{ name: String, distance: Number, placeId: String }],
worship: [{ name: String, distance: Number, placeId: String }],
cafes: [{ name: String, distance: Number, placeId: String }],
updatedAt: Date,
},
// PATCH #9 — cachedNews field added
cachedNews: {
headlines: [{
title: String,
url: String,
source: String,
publishedAt: Date,
snippet: String,
}],
source: { type: String, enum: ['gnews','newsapi','google-rss','fallback'] },
updatedAt: Date,
},
propertyCount: { type: Number, default: 0 },
lastSearchedAt: Date,
// updated every time a ShadowProperty resolves this cluster
// drives Tier 2 freshness — clusters searched within 7 days get cron refresh
createdAt: { type: Date, default: Date.now },
}
// Indexes
ClusterSchema.index({ clusterId: 1 }, { unique: true });
User
{
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
passwordHash: { type: String, required: true },
role: { type: String, enum: ['user','admin'], default: 'user' },
// Phase 2 adds 'broker' to this enum
preferences: {
listingTypeContext: { type: String, enum: ['sale','rent'] },
sessionId: String,
// wfhStatus carried from step1 into step4 — stored here
step1: {
wfhStatus: String, // 'full-time' | 'hybrid' | 'no'
workplaceLat: Number, // null if wfhStatus === 'full-time'
workplaceLng: Number,
commuteMode: String, // 'walking'|'two_wheeler'|'auto_rickshaw'|'car'|'public_transport'
maxCommuteMinutes: Number,
},
step2: {
lifestyleType: String, // 'remote'|'family'|'student'|'professional'|'retired'
},
step3: {
aqiSensitivity: String, // 'Sensitive'|'Moderate'|'Low'
noiseSensitivity: String, // 'High'|'Moderate'|'Low'
},
step4: {
vastuPreference: String,
facingDirection: String,
},
step5: {
amenityPriorities: [String],
// ordered array e.g. ['schools','hospitals','parks','gyms','cafes']
// top 2 drive amenityVerdict
},
step6: {
communityPreference: String,
},
step7: {
// sale fields
monthlyHouseholdIncome: String,
availableDownPayment: String,
loanPreApproved: Boolean,
investmentIntent: String,
// rent fields
preferredLeaseDuration: String,
petsOwned: Boolean,
furnishingPreference: String,
moveInTimeline: String,
},
},
reportHistory: [{
sessionId: String,
listingType: String,
propertyName: String,
reportSnapshot: Object,
// full rendered report JSON — permanent record
// source of truth after ShadowProperty expires
shareToken: String,
// crypto.randomBytes(16).toString('hex') — 32 chars, 128-bit entropy
// stored here — validated by matching sessionId + shareToken
generatedAt: Date,
}],
// No cap on reportHistory — unlimited entries per user
createdAt: { type: Date, default: Date.now },
}
// Indexes
UserSchema.index({ email: 1 }, { unique: true });
Lead
{
userId: { type: ObjectId, ref: 'User', required: true },
shadowPropertyId: { type: ObjectId, ref: 'ShadowProperty', required: true },
sessionId: { type: String, required: true, unique: true },
clusterId: { type: String, required: true },
listingType: { type: String, enum: ['sale','rent'], required: true },
// Full snapshot copied from ShadowProperty at lead creation
// ShadowProperty expires in 24h — Lead is permanent record
preferences: Object, // full copy of user.preferences at lead creation
userProvidedSpecs: Object, // copy of shadowProperty.userProvidedSpecs
verdictObject: Object, // output of computeAllVerdicts — stored for broker view
// Derived budget bracket for verdict — normalised single field
budgetBracket: String,
compositeScore: { type: Number, min: 0, max: 100 },
scoreTier: { type: String, enum: ['hot','warm','lukewarm','cold'] },
scoreBreakdown: Object,
dataSource: Object,
// copied from ShadowProperty.dataSource at lead creation
// Pipeline stage — auction-aligned, no CRM stages
stage: {
type: String,
enum: ['new','listed','sold','expired'],
default: 'new',
},
// new → lead created, not yet auctioned
// listed → admin listed it, auction live (Phase 2)
// sold → winning bid paid, broker assigned (Phase 2)
// expired → auction ended with no bids (Phase 2)
assignedBrokerId: { type: ObjectId, ref: 'Broker', default: null },
// set automatically when auction closes — never manually by admin
// PHASE 2 — auction fields (precise schema, no logic in Phase 1)
auction: {
status: { type: String, enum: ['new','listed','sold','expired'], default: 'new' },
startTime: Date,
endTime: Date,
reservePrice: Number,
winningBrokerId: { type: ObjectId, ref: 'Broker', default: null },
winningBid: { type: Number, default: null },
razorpayOrderId: { type: String, default: null },
},
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now },
}
// Indexes
LeadSchema.index({ sessionId: 1 }, { unique: true });
LeadSchema.index({ scoreTier: 1, listingType: 1 });
LeadSchema.index({ stage: 1 });
Broker
{
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
phone: String,
company: String,
assignedCities: [String],
activeLeads: [{ type: ObjectId, ref: 'Lead' }],
tier: { type: String, enum: ['standard','premium','elite'], default: 'standard' },
isActive: { type: Boolean, default: true },
// PHASE 2 — bidding history (schema only, no logic)
bidHistory: [{
auctionId: { type: ObjectId, ref: 'LeadAuction' },
leadId: { type: ObjectId, ref: 'Lead' },
bidAmount: Number,
razorpayPaymentId: String,
won: Boolean,
createdAt: Date,
}],
createdAt: { type: Date, default: Date.now },
}
// Indexes
BrokerSchema.index({ email: 1 }, { unique: true });
LeadAuction
{
// PHASE 2 — full bidding engine ships in Phase 2
// Precise schema defined now — zero migration cost at Phase 2 launch
leadId: { type: ObjectId, ref: 'Lead', unique: true, required: true },
startTime: Date,
endTime: Date,
reservePrice: Number,
bids: [{
brokerId: { type: ObjectId, ref: 'Broker' },
amount: Number,
razorpayOrderId: String,
razorpayPaymentId: String,
placedAt: Date,
}],
currentHighBid: { type: Number, default: 0 },
winnerId: { type: ObjectId, ref: 'Broker', default: null },
status: {
type: String,
enum: ['scheduled','live','sold','expired'],
default: 'scheduled',
},
createdAt: { type: Date, default: Date.now },
}
MONGODB INDEXES SUMMARY
shadowproperties:
{ sessionId: 1 } unique
{ expiresAt: 1 } TTL (expireAfterSeconds: 0)
clusters:
{ clusterId: 1 } unique
users:
{ email: 1 } unique
leads:
{ sessionId: 1 } unique
{ scoreTier: 1, listingType: 1 }
{ stage: 1 }
brokers:
{ email: 1 } unique
Section 2.5 — Global Design System
(Cinematic Environmental Intelligence)
THIS SECTION FULLY OVERRIDES ALL VISUAL STYLING IN SECTION 8. The @theme
block in Section 8 (globals.css) is superseded. All color tokens, font declarations, and
animation keyframes defined below replace their Section 8 equivalents. Architecture, schemas,
routes, and business logic remain unchanged.
1. Core Design Philosophy
Cinematic Environmental Intelligence — dark, luxurious, atmospheric, immersive. Reference
tone: Apple product pages × Arc'teryx editorial × National Geographic cinematography.
Every screen is a chapter in a story. The app does not feel like a dashboard — it feels like a
documentary about the place you might live. Calm. Premium. Mysterious. Sophisticated.
Emotionally resonant without being decorative.
Design principles (ranked):
1. Emotional depth over information density — let data breathe
2. Subtle luxury over obvious polish — restraint is the flex
3. Scroll-driven storytelling over static layouts — every section reveals
4. Atmospheric immersion over flat utility — the void is the canvas
5. Honest data, cinematic presentation — never sacrifice accuracy for aesthetics
2. Color Token System
globals.css — full replacement
/* app/globals.css */
@import "tailwindcss";
@import
url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap');
@theme {
/* ── Backgrounds ── */
--color-bg: #050505;
--color-bg-secondary: #0B0B0B;
--color-surface: rgba(255, 255, 255, 0.028);
--color-surface-hover: rgba(255, 255, 255, 0.055);
--color-surface-active: rgba(255, 255, 255, 0.08);
/* ── Primary Accent — Gold ── */
--color-accent: #E7C58A;
--color-accent-90: rgba(231, 197, 138, 0.9);
--color-accent-70: rgba(231, 197, 138, 0.7);
--color-accent-55: rgba(231, 197, 138, 0.55);
--color-accent-35: rgba(231, 197, 138, 0.35);
--color-accent-15: rgba(231, 197, 138, 0.15);
--color-accent-08: rgba(231, 197, 138, 0.08);
/* ── Secondary Accent — Environmental Blue ── */
--color-env: #5D748A;
--color-env-soft: rgba(93, 116, 138, 0.4);
/* ── Tertiary Accent — Soft Green ── */
--color-nature: #B4D2AA;
--color-nature-soft: rgba(180, 210, 170, 0.4);
/* ── Text ── */
--color-text-primary: rgba(255, 255, 255, 0.9);
--color-text-secondary: rgba(255, 255, 255, 0.55);
--color-text-muted: rgba(255, 255, 255, 0.32);
--color-text-ghost: rgba(255, 255, 255, 0.18);
--color-text-gold: rgba(231, 197, 138, 0.55);
--color-text-gold-bright:rgba(231, 197, 138, 0.9);
/* ── Borders ── */
--color-border: rgba(255, 255, 255, 0.07);
--color-border-hover: rgba(255, 255, 255, 0.14);
--color-border-gold: rgba(231, 197, 138, 0.2);
--color-border-gold-hover: rgba(231, 197, 138, 0.45);
/* ── Verdict ── */
--color-success: #6ECB7A;
--color-success-bg: rgba(110, 203, 122, 0.1);
--color-success-border: rgba(110, 203, 122, 0.2);
/* PATCH #3 — --color-warning shifted to #D4A853 to separate from --color-accent #E7C58A
*/
--color-warning: #D4A853;
--color-warning-bg: rgba(212, 168, 83, 0.1);
--color-warning-border: rgba(212, 168, 83, 0.2);
--color-danger: #D4645A;
--color-danger-bg: rgba(212, 100, 90, 0.1);
--color-danger-border: rgba(212, 100, 90, 0.2);
/* ── Typography ── */
--font-display: 'Outfit', sans-serif;
/* NOTE: --font-display is identical to --font-body — reserved for future display font
differentiation */
--font-body: 'Outfit', sans-serif;
/* ── Spacing scale ── */
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 40px;
--space-2xl: 64px;
--space-3xl: 96px;
--space-4xl: 128px;
/* ── Blur scale ── */
--blur-sm: 8px;
--blur-md: 16px;
--blur-lg: 24px;
--blur-xl: 40px;
/* ── Radius ── */
--radius-sm: 6px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-pill: 9999px;
/* ── Transitions ── */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-reveal: 800ms;
/* ── Shadow / Glow ── */
--glow-gold-sm: 0 0 12px rgba(231, 197, 138, 0.08);
--glow-gold-md: 0 0 24px rgba(231, 197, 138, 0.12);
--glow-gold-lg: 0 0 48px rgba(231, 197, 138, 0.15);
--glow-env-sm: 0 0 12px rgba(93, 116, 138, 0.1);
--shadow-card: 0 4px 24px rgba(0, 0, 0, 0.4);
--shadow-float: 0 8px 40px rgba(0, 0, 0, 0.5);
}
/* ── Base ── */
html {
background: var(--color-bg);
color: var(--color-text-primary);
font-family: var(--font-body);
font-weight: 300;
line-height: 1.7;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
scroll-behavior: smooth;
}
body {
background: var(--color-bg);
min-height: 100vh;
}
/* ── Selection ── */
::selection {
background: var(--color-accent-35);
color: var(--color-text-primary);
}
/* ── Scrollbar ── */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
background: rgba(255, 255, 255, 0.08);
border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
background: rgba(255, 255, 255, 0.15);
}
/* ── Animations ── */
@keyframes fadeUp {
from { opacity: 0; transform: translateY(20px); }
to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
from { opacity: 0; }
to { opacity: 1; }
}
@keyframes glowPulse {
0%, 100% { opacity: 0.4; }
50% { opacity: 0.8; }
}
@keyframes shimmer {
0% { background-position: -200% 0; }
100% { background-position: 200% 0; }
}
@keyframes float {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-6px); }
}
@keyframes scanLine {
0% { transform: translateY(-100%); }
100% { transform: translateY(100vh); }
}
@keyframes particleDrift {
0% { transform: translate(0, 0) scale(1); opacity: 0; }
20% { opacity: 0.6; }
80% { opacity: 0.3; }
100% { transform: translate(var(--dx, 40px), var(--dy, -120px)) scale(0.3); opacity: 0; }
}
.animate-fade-up { animation: fadeUp 0.6s var(--ease-smooth) forwards; }
.animate-fade-in { animation: fadeIn 0.4s ease forwards; }
.animate-glow-pulse { animation: glowPulse 4s ease-in-out infinite; }
.animate-float { animation: float 6s ease-in-out infinite; }
/* Stagger children — add to parent container */
.stagger-children > * {
opacity: 0;
animation: fadeUp 0.6s var(--ease-smooth) forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 80ms; }
.stagger-children > *:nth-child(3) { animation-delay: 160ms; }
.stagger-children > *:nth-child(4) { animation-delay: 240ms; }
.stagger-children > *:nth-child(5) { animation-delay: 320ms; }
.stagger-children > *:nth-child(6) { animation-delay: 400ms; }
.stagger-children > *:nth-child(7) { animation-delay: 480ms; }
.stagger-children > *:nth-child(8) { animation-delay: 560ms; }
Token Usage Rules
● --color-accent (gold) = primary interactive, active states, key data highlights, CTAs
● --color-env (blue) = secondary data, environmental signals, informational badges
● --color-nature (green) = positive verdicts, nature/organic signals, pass states
● --color-text-gold = labels, overlines, category markers
● --color-surface = all card backgrounds — never use opaque white or opaque dark
● --color-bg (#050505) = page background — the void, never replaced with lighter fills
● Verdict colors are softer than Section 8 originals to sit on dark glass without vibrating
3. Typography System
Font: Outfit — modern geometric sans, excellent weight range, cinematic readability.
Weight map (use only these four):
300 → body text, descriptions, secondary content
400 → standard UI text, form labels, data values
500 → section titles, card headers, emphasis
600 → hero headlines only (landing page, report headline)
Size scale:
text-xs → 11px → source labels, timestamps, meta
text-sm → 13px → captions, helper text, badges
text-base → 15px → body text, descriptions
text-lg → 18px → card titles, section headers
text-xl → 22px → page titles
text-2xl → 28px → hero subheads
text-3xl → 36px → hero headlines
text-4xl → 48px → landing hero only
Line height:
Headings → 1.2
Body text → 1.7
Captions → 1.5
Letter spacing:
Hero text → -0.02em (tight)
Body text → 0 (default)
Overlines → 0.08em (tracking)
Labels → 0.04em
Typography Rules
● Overlines (category labels like "NOISE ANALYSIS") always: uppercase, text-xs,
weight 400, tracking-[0.08em], text-[var(--color-text-gold)]
● Body text defaults to weight 300 — lightness is the luxury
● Never bold body copy mid-sentence — use gold color for inline emphasis instead
● All numeric data values render at weight 500 for scanability
● Unit suffixes (dB, km, hrs) render at weight 300,
text-[var(--color-text-secondary)]
4. Spacing System
Section-level spacing drives the scroll storytelling rhythm.
Between page sections (hero → signals → financial): var(--space-4xl) 128px
Between card groups within a section: var(--space-3xl) 96px
Between cards in same group: var(--space-lg) 24px
Card internal padding: var(--space-lg) 24px
Between card title and content: var(--space-md) 16px
Between data rows inside a card: var(--space-sm) 8px
Icon/badge to label gap: var(--space-sm) 8px
Generous spacing is non-negotiable. When in doubt, add more space.
5. Glassmorphism System
Every card, panel, modal, and elevated surface uses glassmorphism. No opaque cards.
Glass Surface — Standard Card
.glass-card {
background: rgba(255, 255, 255, 0.028);
backdrop-filter: blur(24px);
-webkit-backdrop-filter: blur(24px);
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: var(--radius-lg);
box-shadow: var(--shadow-card);
}
Glass Surface — Elevated (modals, floating panels)
.glass-elevated {
background: rgba(255, 255, 255, 0.045);
backdrop-filter: blur(40px);
-webkit-backdrop-filter: blur(40px);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-float);
}
Glass Surface — Subtle (nested elements, badges, inner containers)
.glass-subtle {
background: rgba(255, 255, 255, 0.015);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
border: 1px solid rgba(255, 255, 255, 0.04);
border-radius: var(--radius-md);
}
Glass Surface — Interactive Input
.glass-input {
background: rgba(255, 255, 255, 0.04);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.07);
border-radius: var(--radius-md);
color: var(--color-text-primary);
transition: border-color var(--duration-normal) var(--ease-smooth),
box-shadow var(--duration-normal) var(--ease-smooth);
}
.glass-input:focus {
border-color: var(--color-border-gold);
box-shadow: var(--glow-gold-sm);
outline: none;
}
Glassmorphism Rules
● Never use fully opaque backgrounds on cards (no bg-white, no bg-gray-900)
● backdrop-filter is mandatory — the blur is what creates depth against the void
● Nested glass layers decrease blur: outer 24px → inner 8px
● Never stack more than 2 glass layers (performance + visual mud)
● Admin panel cards use same glass system — no separate "admin theme"
6. Motion & Animation Philosophy
Motion is cinematic — purposeful, slow enough to register, never bouncy or playful.
Principles
1. Reveal, don't pop. Elements fade up into view. Nothing appears instantly.
2. Stagger, don't synchronize. Groups of cards animate 80ms apart.
3. Ease out, never bounce. Use var(--ease-smooth) (cubic-bezier(0.16, 1, 0.3, 1)).
No spring easing on page elements.
4. Slow is premium. Base duration 300ms. Hero reveals 800ms. Micro-interactions
150ms.
5. Only animate opacity and transform. No layout animations. No color transitions on
large surfaces.
Animation Inventory
Context Animation Duration Easing
Card entering viewport fadeUp 600ms --ease-smoot
h
Staggered card group fadeUp + 80ms stagger 600ms
each
--ease-smoot
h
Hero headline fadeUp 800ms --ease-smoot
h
Verdict badge appear fadeIn + scale(0.9→1) 300ms --ease-smoot
h
Hover glow on card box-shadow transition 300ms ease
Button hover border-color + translateY(-1px) 150ms ease
Loading skeleton shimmer 2s linear infinite
Data value count-up JS-driven, 800ms — ease-out
Page section reveal IntersectionObserver + fadeUp 600ms --ease-smoot
h
Scroll-Triggered Reveals
All report sections and landing page chapters use IntersectionObserver:
const observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
if (entry.isIntersecting) {
entry.target.classList.add('animate-fade-up');
observer.unobserve(entry.target);
}
});
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
Elements with .reveal start with opacity: 0; transform: translateY(20px) and
animate in when 15% visible. One-shot — no reverse on scroll-out.
7. Scroll Storytelling Behavior
Report pages and landing page render as vertical narratives. Each section is a chapter.
Structure:
┌─────────────────────────────┐
│ Dark void (128px gap) │
│ ┌───────────────────────┐ │
│ │ Chapter 1: Hero │ │ ← VibeSummaryCard
│ │ (full viewport feel) │ │
│ └───────────────────────┘ │
│ Dark void (96px gap) │
│ ┌───────────────────────┐ │
│ │ Chapter 2: Signals │ │ ← AeroSonic + Solar + LocalNews
│ │ (staggered cards) │ │
│ └───────────────────────┘ │
│ Dark void (96px gap) │
│ ┌───────────────────────┐ │
│ │ Chapter 3: Personal │ │ ← Commute + Community
│ └───────────────────────┘ │
│ Dark void (96px gap) │
│ ┌───────────────────────┐ │
│ │ Chapter 4: Financial │ │ ← FinancialCard or RentalFitCard
│ └───────────────────────┘ │
│ Dark void (64px gap) │
│ ┌───────────────────────┐ │
│ │ Share bar │ │
│ └───────────────────────┘ │
└─────────────────────────────┘
Each chapter enters via .reveal + stagger. The void between chapters creates pacing.
8. Card Surface Rules
All data cards in the report, admin panel, and funnel share one visual language.
Structure
┌─────────────────────────────────┐ glass-card
│ OVERLINE LABEL │ text-xs, gold, tracking-wide
│ Card Title │ text-lg, weight 500
│ │
│ ┌───────────────────────────┐ │
│ │ Data value 42 dB │ │ weight 500 value + weight 300 unit
│ │ VerdictBadge [Caution] │ │ pill badge
│ └───────────────────────────┘ │ glass-subtle inner container
│ │
│ GROQ label text (1 line) │ text-sm, weight 300, secondary
│ DataSourceLabel │ text-xs, muted
└─────────────────────────────────┘
Card Variants
● Signal card (AeroSonic, Solar, News): glass-card + top border accent
(border-t-[1px] border-t-[var(--color-border-gold)] on hover)
● Summary card (VibeSummary): glass-elevated + gold glow on hover
● Financial card: glass-card + env-blue accent line
● Admin card: glass-card, no accent — neutral presentation
● Stat card (admin dashboard): glass-subtle + single accent-colored number
Card Sizing
● Max width: max-w-2xl (672px) for report cards — centered in viewport
● Full width for admin tables
● Funnel cards: max-w-md (448px) — centered, intimate feel
9. Hover Interaction Rules
Hover states signal interactivity through light, not motion.
/* Standard card hover */
.glass-card {
transition: border-color var(--duration-normal) ease,
box-shadow var(--duration-normal) ease,
transform var(--duration-normal) var(--ease-smooth);
}
.glass-card:hover {
border-color: var(--color-border-gold);
box-shadow: var(--glow-gold-md);
transform: translateY(-2px);
}
/* Button hover */
.btn-primary:hover {
box-shadow: var(--glow-gold-sm);
border-color: var(--color-accent-70);
transform: translateY(-1px);
}
/* Link hover */
a:hover {
color: var(--color-accent);
transition: color var(--duration-fast) ease;
}
/* Table row hover (admin) */
tr:hover {
background: rgba(255, 255, 255, 0.02);
}
Hover Rules
● Lift: max translateY(-2px) for cards, -1px for buttons. Never more.
● Glow: border shifts to gold + soft gold box-shadow. Never full-surface glow.
● No scale transforms on hover — scale feels cheap on dark UIs
● Admin table rows: background lightens to 0.02 white. No border changes.
● Disabled elements: opacity: 0.3, cursor: not-allowed, no hover effect
10. Atmospheric Effects System
Subtle environmental atmosphere on hero sections and landing page only.
Noise Overlay
.noise-overlay {
position: fixed;
inset: 0;
z-index: 0;
pointer-events: none;
opacity: 0.025;
background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256'
xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence
type='fractalNoise' baseFrequency='0.9' numOctaves='4'
stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25'
filter='url(%23n)'/%3E%3C/svg%3E");
background-repeat: repeat;
background-size: 256px 256px;
}
Particle Field (landing page hero only)
.particle {
position: absolute;
width: 2px;
height: 2px;
background: var(--color-accent-35);
border-radius: 50%;
animation: particleDrift var(--particle-duration, 8s) ease-in-out infinite;
animation-delay: var(--particle-delay, 0s);
}
Generate particles in JS with randomized --dx, --dy, --particle-duration,
--particle-delay.
Atmospheric Rules
● Noise overlay: landing page + report page only. Not on funnel, admin, or auth pages.
● Particle count: max 12 on landing hero, 0 elsewhere
● All atmospheric elements: pointer-events: none, z-index: 0
● Atmospheric effects must not impact scroll performance — test on mobile
● prefers-reduced-motion: disable particles, keep noise (static)
11. Lighting & Glow Rules
Glow is the primary depth cue. It replaces drop shadows in the traditional sense.
Glow Scale
--glow-gold-sm: 0 0 12px rgba(231, 197, 138, 0.08) → resting interactive elements
--glow-gold-md: 0 0 24px rgba(231, 197, 138, 0.12) → hover state, focused input
--glow-gold-lg: 0 0 48px rgba(231, 197, 138, 0.15) → hero card, primary CTA
--glow-env-sm: 0 0 12px rgba(93, 116, 138, 0.1) → environmental signal accent
Glow Rules
● Gold glow: interactive elements, CTAs, verdict highlights, hero card
● Env-blue glow: data signal cards (secondary accent only)
● Never glow text directly — glow the container
● Glow intensity increases on hover, decreases on blur
● Max one glowing element per viewport — if everything glows, nothing does
● Verdict badges do NOT glow — they use background color only
● Admin panel: minimal glow. Only stat card primary numbers get --glow-gold-sm
12. Gradient Language
Gradients are environmental — they suggest atmosphere, not decoration.
Allowed Gradients
.gradient-fade-top {
background: linear-gradient(180deg, #050505 0%, transparent 100%);
}
.gradient-fade-bottom {
background: linear-gradient(0deg, #050505 0%, transparent 100%);
}
.gradient-hero {
background: radial-gradient(
ellipse at 50% 0%,
rgba(231, 197, 138, 0.04) 0%,
transparent 70%
);
}
.gradient-accent-line {
background: linear-gradient(
90deg,
transparent 0%,
var(--color-accent-35) 50%,
transparent 100%
);
height: 1px;
}
Gradient Rules
● No gradient backgrounds on cards — cards are glass only
● Gradients serve atmosphere (fades, washes) or accent lines
● Max 2 gradient elements per viewport
● Never use gradients on text
● Never use multi-color gradients — single hue fades only
● Admin panel: zero gradients
13. Border Language
Resting: 1px solid rgba(255, 255, 255, 0.07) → barely visible
Hover: 1px solid rgba(255, 255, 255, 0.14) → slightly revealed
Active/Focus:1px solid rgba(231, 197, 138, 0.2) → gold tint
Gold hover: 1px solid rgba(231, 197, 138, 0.45) → clear gold accent
Border Rules
● All cards: 1px border, resting state
● Dividers inside cards: border-b border-[rgba(255,255,255,0.04)] — almost
invisible
● Never use 2px+ borders anywhere
● Admin table borders: border-b border-[rgba(255,255,255,0.05)] between
rows
● Input fields: resting border → gold border on focus
● Verdict badge pills: no border — background-only differentiation
14. Blur System
Background atmosphere: blur(40px) → deep backdrop effects
Card surface: blur(24px) → standard glass card
Nested surface: blur(8px) → inner containers, badges
Input field: blur(16px) → form elements
Blur Rules
● backdrop-filter mandatory on every glass surface
● Never use filter: blur() on text or data — only on backgrounds
● Blur stacks degrade performance — max 2 blur layers visible at once
● Mobile: reduce blur by 50% (24px → 12px, 8px → 4px) via media query
● Admin panel: blur(16px) cap — admin needs speed over atmosphere
15. Noise & Particle Overlay System
See Section 10 (Atmospheric Effects). Additional rules:
Scan Line Effect (report page only, optional)
.scan-line {
position: fixed;
left: 0;
right: 0;
height: 1px;
background: linear-gradient(
90deg,
transparent 0%,
rgba(231, 197, 138, 0.06) 50%,
transparent 100%
);
animation: scanLine 12s linear infinite;
pointer-events: none;
z-index: 1;
}
● Only on report hero section
● Disabled if prefers-reduced-motion: reduce
● Never on admin, funnel, or auth pages
16. Loading State Philosophy
Loading states are atmospheric, never jarring.
Skeleton Screens
.skeleton {
background: linear-gradient(
90deg,
rgba(255, 255, 255, 0.02) 0%,
rgba(255, 255, 255, 0.05) 50%,
rgba(255, 255, 255, 0.02) 100%
);
background-size: 200% 100%;
animation: shimmer 2s linear infinite;
border-radius: var(--radius-md);
}
Loading Rules
● Skeleton shapes match final content layout exactly (same heights, widths, gaps)
● Skeleton fills: rgba(255,255,255,0.02) base — nearly invisible against void
● No spinner icons. No progress bars. No loading text.
● Pipeline polling state (report generation): pulsing gold dot + "Analyzing environment..." in
text-sm, text-[var(--color-text-secondary)]
● The word "Loading" never appears in UI — use contextual verbs: "Analyzing...",
"Scanning...", "Preparing report..."
● Skeletons fade out → real content fades up (crossfade, 300ms)
17. Section Transition Behavior
Between scroll-storytelling chapters:
Chapter end:
→ Content fades to lower opacity (not hidden, just recedes)
→ 96–128px void gap
→ Next chapter reveals via IntersectionObserver + fadeUp
Funnel step transitions:
→ Current step fades out (opacity 1→0, 200ms)
→ Next step fades up (opacity 0→1, translateY 20→0, 400ms)
→ No horizontal slide — vertical reveals only
Page route transitions:
→ Crossfade (opacity only), 300ms
→ No slide-in/out page transitions
Transition Rules
● All transitions use var(--ease-smooth) — never linear, never bouncy
● Never animate height or width — opacity and transform only
● Admin page transitions: instant. No fade. Speed over cinema.
18. Dark Overlay System
.overlay-modal {
background: rgba(5, 5, 5, 0.8);
backdrop-filter: blur(8px);
}
.overlay-image {
background: linear-gradient(180deg, transparent 0%, rgba(5, 5, 5, 0.7) 100%);
}
.overlay-fade-bottom {
background: linear-gradient(0deg, #050505 0%, transparent 40%);
height: 120px;
pointer-events: none;
}
Overlay Rules
● Modal overlays: always rgba(5,5,5,0.8) with blur(8px) — never fully opaque
● Image overlays: bottom gradient fade for text legibility
● Section fades: transparent-to-void gradients at chapter boundaries
● Never overlay content with semi-transparent colors
19. Source Label Visual Rules
DataSourceLabel renders below signal values. Styling must feel integrated, not appended.
Source Display text Style
────────────────────────────────────────────────────────────
─────
live (nothing shown) —
computed (nothing shown) —
cache "Updated X days ago" text-xs, --color-text-muted, weight 300
city_average "City average" text-xs, --color-text-muted, weight 300
seasonal "Seasonal average" text-xs, --color-text-muted, weight 300
estimated "Estimated" text-xs, --color-text-muted, weight 300
seed "Area average" text-xs, --color-text-muted, weight 300
gnews (nothing shown) —
newsapi "Via NewsAPI" text-xs, --color-text-muted, weight 300
google-rss "Via Google News" text-xs, --color-text-muted, weight 300
fallback (nothing shown) — (news fallback = no headlines to show)
Source Label Rules
● Always positioned directly below the data value, 4px gap
● Never inside a badge or pill — bare text only
● Opacity: 0.32 max — should be discoverable, not prominent
● Same styling in report view and admin detail view
20. Explicit Legacy Override Rules
Tokens Removed (Section 8 originals — DO NOT USE)
REMOVED REPLACED BY
──────────────────────────────────────────────────────────
--color-bg: #F8F5F0 --color-bg: #050505
--color-surface: #FFFFFF --color-surface: rgba(255,255,255,0.028)
--color-deep: #1A2E2A (removed — use --color-text-primary)
--color-deep-mid: #2D4A44 (removed — use --color-text-secondary)
--color-accent: #B8975A --color-accent: #E7C58A
--color-accent-soft: #E8D5B0 --color-accent-35
--color-text-primary: #1A2E2A --color-text-primary: rgba(255,255,255,0.9)
--color-text-secondary:#6B7B78 --color-text-secondary: rgba(255,255,255,0.55)
--color-border: #E8E2D9 --color-border: rgba(255,255,255,0.07)
--color-success: #4A7C59 --color-success: #6ECB7A
--color-warning: #C4893A --color-warning: #D4A853 (shifted from Section 2.5 default)
--color-danger: #9B4A3A --color-danger: #D4645A
--font-display: Cormorant G. --font-display: Outfit
--font-body: DM Sans --font-body: Outfit
Fonts Removed
● Cormorant Garamond — removed entirely. No serif font in the system.
● DM Sans — removed entirely. Outfit replaces it.
● Both @import or <link> tags for these fonts must be deleted from any layout file.
Component Overrides Required
Component Override needed
VerdictBadge.js
x
Replace opaque bg- classes with glass-compatible verdict tokens
(--color-success-bg + --color-success text)
DataSourceLabel
.jsx
Update to use --color-text-muted (was
--color-text-secondary in dark-on-light context)
VibeSummaryCard
.jsx
Add glass-elevated + --glow-gold-lg treatment
Navbar.jsx Glass surface with blur(24px), border-bottom only
AdminSidebar.js
x
glass-card surface, gold accent on active nav item
SharePDFBar.jsx glass-subtle container, gold CTA button
All form inputs Apply .glass-input class — no opaque input backgrounds
VerdictBadge — New Token Mapping
VERDICT BACKGROUND TEXT COLOR BORDER
────────────────────────────────────────────────────────────
──────────────
red_flag var(--color-danger-bg) var(--color-danger) var(--color-danger-border)
caution var(--color-warning-bg) var(--color-warning) var(--color-warning-border)
pass var(--color-success-bg) var(--color-success) var(--color-success-border)
Badges use 10% opacity backgrounds with colored text — NOT opaque colored fills with white
text (the Section 8 approach).
Button System
Primary CTA
.btn-primary {
background: var(--color-accent-15);
color: var(--color-accent-90);
border: 1px solid var(--color-accent-35);
border-radius: var(--radius-md);
padding: 12px 28px;
font-weight: 500;
font-size: 15px;
letter-spacing: 0.02em;
transition: all var(--duration-normal) var(--ease-smooth);
}
.btn-primary:hover {
background: var(--color-accent-35);
border-color: var(--color-accent-70);
box-shadow: var(--glow-gold-sm);
transform: translateY(-1px);
}
Secondary / Ghost
.btn-secondary {
background: transparent;
color: var(--color-text-secondary);
border: 1px solid var(--color-border);
border-radius: var(--radius-md);
padding: 12px 28px;
font-weight: 400;
transition: all var(--duration-normal) var(--ease-smooth);
}
.btn-secondary:hover {
color: var(--color-text-primary);
border-color: var(--color-border-hover);
background: rgba(255, 255, 255, 0.02);
}
Button Rules
● No solid/opaque button backgrounds — all buttons are transparent or semi-transparent
● Primary CTA: gold-tinted glass. One per viewport.
● Icon buttons: 40×40px, glass-subtle, icon at 18px
● Disabled: opacity: 0.25, no hover effects, cursor: not-allowed
● Funnel "Next" button: btn-primary, pinned to bottom of step card
● Admin action buttons: btn-secondary — admin is functional, not cinematic
Responsive Breakpoints
Mobile: < 640px → single column, blur reduced 50%, no particles
Tablet: 640–1024 → report cards full-width, admin sidebar collapses
Desktop: > 1024 → max-width containers, full atmospheric effects
Mobile overrides:
@media (max-width: 640px) {
.glass-card { backdrop-filter: blur(12px); }
.glass-elevated { backdrop-filter: blur(20px); }
.noise-overlay { display: none; }
.particle { display: none; }
.scan-line { display: none; }
}
Accessibility
● All text meets WCAG AA contrast against #050505 background
● rgba(255,255,255,0.9) on #050505 = contrast ratio ~17:1 ✓
● rgba(255,255,255,0.55) on #050505 = contrast ratio ~10:1 ✓
● rgba(255,255,255,0.32) on #050505 = contrast ratio ~6:1 ✓ (large text only —
used only on text-xs labels)
● Gold accent #E7C58A on #050505 = contrast ratio ~11:1 ✓
● prefers-reduced-motion: all animations disabled except opacity fades
● prefers-contrast: more: increase border opacity to 0.2, text-muted to 0.45
● Focus rings: outline: 2px solid var(--color-accent-55);
outline-offset: 2px
END OF SECTION 2.5
This section is the single source of truth for all visual behavior. Every component built in Parts
16–31 must reference these tokens and rules. No component may define its own color values,
font weights, or animation curves outside this system.
Section 3 — Anti-Hallucination Protocol
ANTI-HALLUCINATION PROTOCOL — MANDATORY
This is the most critical section. Read every word before writing any AI-related code.
What GROQ must NEVER receive
● Property names, addresses, city names, or neighbourhood names
● Coordinates (lat/lng encodes location — GROQ will infer city and hallucinate local
knowledge)
● Price vs market comparisons
● Any instruction containing "write", "describe", "suggest", "recommend" without a
bounded input set
The Three-Layer System
Layer 1 — Deterministic verdict functions (JS, no AI)
All verdicts computed in src/services/verdictEngine.service.js. GROQ never
makes a judgment call.
// NOISE VERDICT
export function noiseVerdict(estimatedDb, noiseSensitivity) {
if (noiseSensitivity === 'High' && estimatedDb > 65) return 'red_flag';
if (noiseSensitivity === 'High' && estimatedDb > 55) return 'caution';
if (noiseSensitivity === 'Moderate' && estimatedDb > 75) return 'red_flag';
if (noiseSensitivity === 'Moderate' && estimatedDb > 65) return 'caution';
return 'pass';
}
// AQI VERDICT
export function aqiVerdict(aqiValue, aqiSensitivity) {
if (aqiSensitivity === 'Sensitive' && aqiValue > 100) return 'red_flag';
if (aqiSensitivity === 'Sensitive' && aqiValue > 50) return 'caution';
if (aqiSensitivity === 'Moderate' && aqiValue > 150) return 'red_flag';
if (aqiSensitivity === 'Moderate' && aqiValue > 100) return 'caution';
return 'pass';
}
// BUDGET VERDICT
// Uses single normalised budgetBracket field — no conditional sale/rent logic
export function budgetVerdict(propertyBudgetBracket, userBudgetBracket, listingType) {
const saleBrackets = ['Under 30L','30L–60L','60L–1Cr','1Cr–1.5Cr',
'1.5Cr–2Cr','2Cr–3Cr','3Cr–5Cr','Above 5Cr'];
const rentBrackets = ['Under 10K','10K–20K','20K–35K','35K–50K',
'50K–75K','75K–1L','Above 1L'];
const brackets = listingType === 'sale' ? saleBrackets : rentBrackets;
const propIdx = brackets.indexOf(propertyBudgetBracket);
const userIdx = brackets.indexOf(userBudgetBracket);
if (propIdx > userIdx + 1) return 'red_flag';
if (propIdx > userIdx) return 'caution';
return 'pass';
}
// USER BUDGET BRACKET DERIVATION
export function deriveUserBudgetBracket(monthlyIncome, listingType) {
if (listingType === 'rent') {
const maxRent = monthlyIncome * 0.30;
return mapToRentBracket(maxRent);
} else {
const loanEligibility = monthlyIncome * 60;
return mapToSaleBracket(loanEligibility);
}
}
// SOLAR VERDICT
export function solarVerdict(peakSunHours, facingDirection) {
const facingBonus = ['E','NE','SE'].includes(facingDirection) ? 0.5 : 0;
const adjusted = peakSunHours + facingBonus;
if (adjusted >= 5) return 'pass';
if (adjusted >= 3) return 'caution';
return 'red_flag';
}
// AMENITY VERDICT
const AMENITY_THRESHOLDS = {
schools: { pass: 800, caution: 2000 },
hospitals: { pass: 1500, caution: 4000 },
parks: { pass: 500, caution: 1500 },
gyms: { pass: 1000, caution: 3000 },
cafes: { pass: 500, caution: 2000 },
};
export function amenityVerdict(amenityDistances, userPriorities) {
const top2 = userPriorities.slice(0, 2);
const verdicts = top2.map(type => {
const d = amenityDistances[type] ?? 9999;
const t = AMENITY_THRESHOLDS[type];
if (d <= t.pass) return 'pass';
if (d <= t.caution) return 'caution';
return 'red_flag';
});
if (verdicts.includes('red_flag')) return 'red_flag';
if (verdicts.includes('caution')) return 'caution';
return 'pass';
}
// COMMUTE VERDICT
const COMMUTE_SPEEDS = {
walking: 5,
two_wheeler: 30,
auto_rickshaw: 20,
car: 25,
public_transport: 18,
};
export function commuteVerdict(propertyCoords, workplaceCoords, commuteMode,
maxMinutes, wfhStatus) {
if (wfhStatus === 'full-time') return 'pass';
if (!workplaceCoords?.lat) return 'caution';
const km = haversineKm(propertyCoords, workplaceCoords);
const speed = COMMUTE_SPEEDS[commuteMode] ?? 20;
const estimatedMinutes = (km / speed) * 60;
if (estimatedMinutes <= maxMinutes) return 'pass';
if (estimatedMinutes <= maxMinutes * 1.5) return 'caution';
return 'red_flag';
}
// HEADLINE GENERATOR — pure JS, GROQ never touches this
export function generateHeadline(totalRedFlags, totalCautions) {
if (totalRedFlags >= 2) return 'Significant concerns found — review carefully';
if (totalRedFlags === 1 && totalCautions >= 2) return 'Mixed signals — a few things to
consider';
if (totalRedFlags === 0 && totalCautions === 0) return 'Strong match across all signals';
if (totalCautions >= 2) return 'Decent match with some trade-offs';
return 'Good overall fit with minor notes';
}
// MASTER VERDICT FUNCTION
export function computeAllVerdicts(shadowProperty, preferences) {
const sp = shadowProperty;
const p = preferences;
const intel = sp.intelligence;
const _noiseVerdict = noiseVerdict(intel.noise.estimatedDb, p.step3.noiseSensitivity);
const _aqiVerdict = aqiVerdict(intel.aqi.value, p.step3.aqiSensitivity);
const _solarVerdict = solarVerdict(intel.solar.peakSunHours, p.step4.facingDirection);
const _amenityVerdict = amenityVerdict(
{
schools: intel.amenities.schools[0]?.distanceM,
hospitals: intel.amenities.hospitals[0]?.distanceM,
parks: intel.amenities.parks[0]?.distanceM,
gyms: intel.amenities.gyms[0]?.distanceM,
cafes: intel.amenities.cafes[0]?.distanceM,
},
p.step5.amenityPriorities
);
const _commuteVerdict = commuteVerdict(
sp.coordinates,
{ lat: p.step1.workplaceLat, lng: p.step1.workplaceLng },
p.step1.commuteMode,
p.step1.maxCommuteMinutes,
p.step1.wfhStatus
);
const userBudgetBracket = deriveUserBudgetBracket(
p.step7.monthlyHouseholdIncome,
sp.userProvidedSpecs.listingType
);
const _budgetVerdict = budgetVerdict(
sp.userProvidedSpecs.budgetBracket,
userBudgetBracket,
sp.userProvidedSpecs.listingType
);
const allVerdicts = [_noiseVerdict, _aqiVerdict, _solarVerdict,
_amenityVerdict, _commuteVerdict, _budgetVerdict];
// NOTE: localNews is informational only — no verdict function.
// If news sentiment verdict is added in future, update allVerdicts array.
const totalRedFlags = allVerdicts.filter(v => v === 'red_flag').length;
const totalCautions = allVerdicts.filter(v => v === 'caution').length;
const totalPasses = allVerdicts.filter(v => v === 'pass').length;
return {
noiseVerdict: _noiseVerdict,
aqiVerdict: _aqiVerdict,
solarVerdict: _solarVerdict,
amenityVerdict: _amenityVerdict,
commuteVerdict: _commuteVerdict,
budgetVerdict: _budgetVerdict,
estimatedDb: intel.noise.estimatedDb,
aqiValue: intel.aqi.value,
peakSunHours: intel.solar.peakSunHours,
nearestHospitalM: intel.amenities.hospitals[0]?.distanceM ?? null,
nearestSchoolM: intel.amenities.schools[0]?.distanceM ?? null,
userBudgetBracket,
propertyBudgetBracket: sp.userProvidedSpecs.budgetBracket,
userNoiseSensitivity: p.step3.noiseSensitivity,
estimatedCommuteMins: (() => {
if (p.step1.wfhStatus === 'full-time') return 0;
if (!p.step1.workplaceLat) return null;
const km = haversineKm(sp.coordinates,
{ lat: p.step1.workplaceLat, lng: p.step1.workplaceLng });
return Math.round((km / (COMMUTE_SPEEDS[p.step1.commuteMode] ?? 20)) * 60);
})(),
listingType: sp.userProvidedSpecs.listingType,
totalRedFlags,
totalCautions,
totalPasses,
headline: generateHeadline(totalRedFlags, totalCautions),
};
}
Layer 2 — GROQ receives only verdict object, never raw property data
GROQ's only job: produce short human-readable labels per verdict key.
GROQ input shape:
{
"noiseVerdict": "red_flag",
"estimatedDb": 72,
"userNoiseSensitivity": "High",
"aqiVerdict": "caution",
"aqiValue": 110,
"solarVerdict": "pass",
"peakSunHours": 5.2,
"amenityVerdict": "caution",
"nearestHospitalM": 1200,
"nearestSchoolM": 400,
"budgetVerdict": "pass",
"propertyBudgetBracket": "1Cr–1.5Cr",
"userBudgetBracket": "1Cr–1.5Cr",
"commuteVerdict": "pass",
"estimatedCommuteMins": 24,
"listingType": "sale",
"totalRedFlags": 1,
"totalCautions": 2,
"newsHeadlines": ["Infrastructure project approved near zone", "New metro line construction
begins"],
"newsCount": 2
}
GROQ system prompt (use verbatim):
You are a property report formatter. You receive a verdict object containing
computed verdict keys and numeric values only. Your ONLY job is to write one
short sentence (max 20 words) for each label key using ONLY the values provided.
Rules you must never break:
- Do not name any city, area, neighbourhood, street, or landmark
- Do not describe the property or its surroundings
- Do not add market comparisons or investment advice
- Do not use adjectives not directly derivable from the input numbers
- Do not include coordinates or location identifiers of any kind
- Return ONLY valid JSON. Start with {. End with }. No markdown. No preamble. No
explanation.
For matchKeywords, return only keywords from this exact list:
["quiet","sunny","well-connected","green","family-friendly","budget-friendly",
"noisy","polluted","high-amenity","low-amenity","bright-home","commute-friendly"]
Pick maximum 3. No others.
For newsLabel, write one sentence (max 20 words) summarizing the provided
newsHeadlines array. If newsHeadlines is empty, return: "No recent local
developments noted." Do not invent headlines. Only reference what is provided.
GROQ output shape (sale):
{
"noiseLabel": "string (max 20 words, based only on estimatedDb + noiseVerdict)",
"aqiLabel": "string (max 20 words, based only on aqiValue + aqiVerdict)",
"solarLabel": "string (max 20 words, based only on peakSunHours + solarVerdict)",
"amenityLabel": "string (max 20 words, based only on nearestHospitalM + nearestSchoolM)",
"budgetLabel": "string (max 20 words, based only on budgetVerdict +
propertyBudgetBracket)",
"commuteLabel": "string (max 20 words, based only on estimatedCommuteMins +
commuteVerdict)",
"financialNote": "string (max 20 words, based only on stressFreeScore + emiPercent)",
"matchKeywords": ["string", "string", "string"],
"verdict": "string (max 15 words, summary of totalRedFlags + totalCautions only)",
"newsLabel": "string (max 20 words, summary of provided headlines only)"
}
GROQ output shape (rent) — financialNote replaced with rentalNote:
{
"noiseLabel": "string",
"aqiLabel": "string",
"solarLabel": "string",
"amenityLabel": "string",
"budgetLabel": "string",
"commuteLabel": "string",
"rentalNote": "string (max 20 words, based only on rentStressFreeScore +
monthlyRentPercent)",
"matchKeywords": ["string", "string", "string"],
"verdict": "string",
"newsLabel": "string (max 20 words, summary of provided headlines only)"
}
Note: headline is NOT in the GROQ output. Generated deterministically by
generateHeadline() in JS.
Layer 3 — Output validation before report renders
src/services/groqValidator.service.js:
const ALLOWED_KEYWORDS = [
'quiet','sunny','well-connected','green','family-friendly','budget-friendly',
'noisy','polluted','high-amenity','low-amenity','bright-home','commute-friendly'
];
// PATCH #4 — newsLabel appended to both allowed key arrays
const ALLOWED_OUTPUT_KEYS_SALE = [
'noiseLabel','aqiLabel','solarLabel','amenityLabel',
'budgetLabel','commuteLabel','financialNote','matchKeywords','verdict',
'newsLabel'
];
const ALLOWED_OUTPUT_KEYS_RENT = [
'noiseLabel','aqiLabel','solarLabel','amenityLabel',
'budgetLabel','commuteLabel','rentalNote','matchKeywords','verdict',
'newsLabel'
];
export function validateGroqOutput(groqResponse, inputVerdictObject, listingType) {
let parsed;
try {
const raw = groqResponse.choices[0].message.content;
const cleaned = raw.replace(/```json|```/g, '').trim();
parsed = JSON.parse(cleaned);
} catch {
return null; // triggers template fallback
}
const allowedKeys = listingType === 'sale'
? ALLOWED_OUTPUT_KEYS_SALE
: ALLOWED_OUTPUT_KEYS_RENT;
for (const key of Object.keys(parsed)) {
if (!allowedKeys.includes(key)) delete parsed[key];
}
if (Array.isArray(parsed.matchKeywords)) {
parsed.matchKeywords = parsed.matchKeywords
.filter(k => ALLOWED_KEYWORDS.includes(k))
.slice(0, 3);
}
const numericFields = {
estimatedDb: inputVerdictObject.estimatedDb,
aqiValue: inputVerdictObject.aqiValue,
peakSunHours: inputVerdictObject.peakSunHours,
nearestHospitalM: inputVerdictObject.nearestHospitalM,
nearestSchoolM: inputVerdictObject.nearestSchoolM,
};
for (const [field, expected] of Object.entries(numericFields)) {
if (parsed[field] !== undefined && parsed[field] !== expected) {
parsed[field] = expected;
}
}
return parsed;
}
If validateGroqOutput returns null → report renders using
reportTemplates.service.js.
Template strings (reportTemplates.service.js) — always implement these:
export const NOISE_TEMPLATES = {
red_flag: (db, sens) => `Noise level of ${db}dB is high for ${sens.toLowerCase()} sensitivity.`,
caution: (db, sens) => `Noise at ${db}dB may occasionally bother someone with
${sens.toLowerCase()} sensitivity.`,
pass: (db) => `Noise level of ${db}dB is within comfortable range.`,
};
export const AQI_TEMPLATES = {
red_flag: (aqi) => `AQI of ${aqi} is poor — a concern for sensitive individuals.`,
caution: (aqi) => `AQI of ${aqi} is moderate — manageable with basic precautions.`,
pass: (aqi) => `AQI of ${aqi} is acceptable.`,
};
export const SOLAR_TEMPLATES = {
red_flag: (hrs) => `Peak sun hours of ${hrs} limits solar and natural light potential.`,
caution: (hrs) => `Peak sun hours of ${hrs} is moderate — adequate for basic needs.`,
pass: (hrs) => `Peak sun hours of ${hrs} is good for solar viability and natural light.`,
};
export const BUDGET_TEMPLATES = {
red_flag: (prop, user) => `Property bracket (${prop}) significantly exceeds your budget range
(${user}).`,
caution: (prop, user) => `Property bracket (${prop}) is slightly above your budget range
(${user}).`,
pass: () => `Property price is within your budget range.`,
};
export const AMENITY_TEMPLATES = {
red_flag: (hosp, school) => `Key amenities are far — nearest hospital ${hosp}m, school
${school}m.`,
caution: (hosp, school) => `Some amenities within reach — hospital ${hosp}m, school
${school}m.`,
pass: (hosp, school) => `Good amenity access — hospital ${hosp}m, school ${school}m.`,
};
export const COMMUTE_TEMPLATES = {
red_flag: (mins) => `Estimated commute of ${mins} minutes exceeds your preferred
maximum.`,
caution: (mins) => `Estimated commute of ${mins} minutes is close to your preferred
maximum.`,
pass: (mins) => mins === 0
? `No commute impact — working from home full-time.`
: `Estimated commute of ${mins} minutes is within your preferred range.`,
};
// PATCH #7 — NEWS_TEMPLATES added
export const NEWS_TEMPLATES = {
has_headlines: (count) => `${count} recent local headlines available for this area.`,
no_headlines: () => 'No recent local headlines found.',
};
BANNED WORDS — never appear anywhere in report UI: unavailable · missing · no
data · data not found · could not be retrieved · failed · error
Section 4 — Guaranteed Data Contract +
Cluster System
GUARANTEED DATA CONTRACT — NON-NEGOTIABLE
A paying user must always see a complete report. Every signal must always resolve to a value.
The word "unavailable" must never appear in any report card.
Every signal has a waterfall fallback chain. The pipeline walks down the chain until it gets a
value. It always gets a value.
AQI waterfall
1. OpenAQ live data at cluster centroid (5s timeout)
2. Cluster MongoDB cache (any age — stale is better than nothing)
3. CPCB city-level AQI (free public API — daily city average)
4. src/data/cityAQIAverages.js lookup (city + current month → hardcoded
seasonal average)
Weather waterfall
1. OpenWeatherMap live data (5s timeout)
2. Cluster MongoDB cache
3. src/data/cityWeatherAverages.js lookup (city + current month)
Solar waterfall
1. Open-Meteo live data (5s timeout — free API, rarely fails)
2. Cluster MongoDB cache
estimateSolarFromLatitude(lat, facingDirection) — pure JS:
baseHours = 8 - ((lat - 8) / 29) * 2facingBonus = ['E','NE','SE'].includes(facing) ? 0.5 : 0→
always returns a value, zero API dependency
3.
Noise waterfall
1. HowLoud live data at EXACT property coordinates (5s timeout)
2. Cluster MongoDB cached noise (centroid-level — slightly less precise)
3. GROQ structured estimate:
○ Input: { nearbyPlaceTypes: [...], floorLevel: '4-7',
roadProximity: 'major_road' }
○ Coordinates NEVER sent to GROQ
○ GROQ returns { estimatedDb: Number, confidence: 'low' }
○ Stored with source: 'estimated'
Amenities waterfall
1. Google Places Nearby Search at EXACT property coordinates (5s timeout)
2. Cluster MongoDB cached amenities (centroid-level)
3. Seed amenities data (always present for evergreen clusters — populated at deployment)
Note: cityLandmarks.js is removed. Amenity waterfall layer 3 (seed data) covers the same
zones. cityCenters.js replaces it for commute verdict only.
News waterfall
1. GNews.io API at cluster centroid (6s timeout)
○ Endpoint: GET https://gnews.io/api/v4/search
○ Params:
q={area}+{city}&lang=en&country=in&max=10&from={7_days_ago}
○ Header: X-API-Key: {GNEWS_API_KEY}
2. NewsAPI.org (6s timeout)
○ Endpoint: GET https://newsapi.org/v2/everything
○ Params:
q={area}+{city}&language=en&sortBy=publishedAt&pageSize=10
3. Google News RSS parse (6s timeout)
○ URL:
https://news.google.com/rss/search?q={area}+{city}&hl=en-IN&
gl=IN
4. Empty array with source: 'fallback' — always returns, never null
dataSource field
intelligence: {
aqi: { value: Number, category: String, source: 'live'|'cache'|'city_average'|'seasonal' },
noise: { estimatedDb: Number, category: String, source: 'live'|'cache'|'estimated' },
solar: { peakSunHours: Number, viability: String, source: 'live'|'cache'|'computed' },
weather: { temp: Number, humidity: Number, source: 'live'|'cache'|'seasonal' },
amenities: { schools:[...], hospitals:[...], ..., source: 'live'|'cache'|'seed' },
localNews: { headlines:[...], source: 'gnews'|'newsapi'|'google-rss'|'fallback' },
}
Report display rule per source
source What report shows
live Value only — no label
cache Value + muted text: "Updated X days ago"
city_averag
e
Value + muted text: "City average"
seasonal Value + muted text: "Seasonal average"
estimated Value + muted text: "Estimated"
computed Value only — physics formula, fully reliable
seed Value + muted text: "Area average"
gnews Value only — no label
newsapi Value + muted text: "Via NewsAPI"
google-rss Value + muted text: "Via Google News"
fallback (no headlines to display — card shows empty
state)
Value and verdict badge always render. Source label is small, muted, honest. Card is never
blank.
CLUSTER SYSTEM
Cluster radius
const CLUSTER_RADIUS_M = 1500; // named constant — do not hardcode elsewhere
Two-tier cluster freshness
Tier 1 — Evergreen clusters (always refreshed by cron regardless of traffic)
Defined in src/data/evergreenClusters.js:
export const EVERGREEN_CLUSTER_IDS = [
// Kochi
'10.10_76.35', // Aluva
'9.97_76.28', // Edappally
'9.93_76.26', // Ernakulam centre
'10.02_76.31', // Kakkanad
'10.00_76.33', // Thrikkakara
// Bangalore
'12.97_77.59', // Koramangala
'12.93_77.62', // HSR Layout
'12.90_77.60', // BTM Layout
'13.01_77.56', // Malleswaram
'12.97_77.75', // Whitefield
'12.84_77.66', // Electronic City
// Mumbai
'19.07_72.87', // Andheri
'19.12_72.90', // Powai
'19.05_72.83', // Bandra
'19.01_72.85', // BKC
// Hyderabad
'17.44_78.39', // Hitech City
'17.43_78.35', // Gachibowli
'17.49_78.39', // Kondapur
'17.39_78.49', // Secunderabad
// Chennai
'13.08_80.27', // Anna Nagar
'12.98_80.25', // Velachery
'13.06_80.28', // Nungambakkam
// Pune
'18.55_73.89', // Koregaon Park
'18.52_73.87', // Kothrud
'18.59_73.91', // Viman Nagar
// Delhi NCR
'28.63_77.22', // Connaught Place
'28.47_77.03', // Gurugram centre
'28.53_77.39', // Noida Sector 18
];
Tier 2 — Recently searched clusters
export async function getAllActiveClusters() {
const evergreenClusters = await Cluster.find({
clusterId: { $in: EVERGREEN_CLUSTER_IDS }
});
const recentClusters = await Cluster.find({
lastSearchedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
clusterId: { $nin: EVERGREEN_CLUSTER_IDS }
});
return [...evergreenClusters, ...recentClusters];
}
Two-state freshness (internal only):
● Within TTL → skip refresh
● Past TTL → refresh on next cron run
upsertCluster must update lastSearchedAt = new Date() on every ShadowProperty
creation.
On-demand live fetch for cold clusters
async function getOrFetchClusterSignal(clusterId, lat, lng, signalType, cityName) {
const cached = await redisGet(`cluster:${clusterId}:${signalType}`);
if (cached) return { ...JSON.parse(cached), source: 'live' };
const cluster = await Cluster.findOne({ clusterId });
if (cluster?.[`cached${signalType}`]?.updatedAt) {
return { ...cluster[`cached${signalType}`], source: 'cache' };
}
const fresh = await fetchSignalLive(signalType, lat, lng);
if (fresh) {
await cacheClusterSignal(clusterId, signalType, fresh);
return { ...fresh, source: 'live' };
}
return getFallbackSignal(signalType, lat, lng, cityName);
}
Seed script for evergreen clusters (scripts/seedClusters.js)
Run once at deployment. For every cluster ID in EVERGREEN_CLUSTER_IDS:
1. upsertCluster(lat, lng) — creates Cluster document
2. Fetch all 5 signals live immediately
3. Store in MongoDB and Redis
4. Set lastSearchedAt = new Date()
cityCenters.js (replaces cityLandmarks.js — used for commute verdict
only)
// src/data/cityCenters.js
export const CITY_CENTERS = {
kochi: { lat: 9.9312, lng: 76.2673 },
bangalore: { lat: 12.9716, lng: 77.5946 },
mumbai: { lat: 19.0760, lng: 72.8777 },
hyderabad: { lat: 17.3850, lng: 78.4867 },
chennai: { lat: 13.0827, lng: 80.2707 },
pune: { lat: 18.5204, lng: 73.8567 },
delhi: { lat: 28.6139, lng: 77.2090 },
};
Commute speed proxies
export const COMMUTE_SPEEDS = {
walking: 5,
two_wheeler: 30,
auto_rickshaw: 20,
car: 25,
public_transport: 18,
};
Section 5 — Services + API Integrations
API INTEGRATIONS
1. AQI — OpenAQ
● Endpoint: GET https://api.openaq.org/v2/latest
● Params: coordinates={lat},{lng}&radius=5000
● Header: X-API-Key: {OPENAQ_API_KEY}
● Timeout: 5s
● Cron: daily 0 0 * * *
● Batch: 5 clusters / 1000ms
2. Weather — OpenWeatherMap
● Endpoint: GET https://api.openweathermap.org/data/2.5/weather
● Params: lat={lat}&lon={lng}&appid={key}&units=metric
● Timeout: 5s
● Cron: daily 0 0 * * *
● Batch: 10 clusters / 1000ms
3. Solar — Open-Meteo (free, no key required)
● Endpoint: GET https://api.open-meteo.com/v1/forecast
● Params:
latitude={lat}&longitude={lng}&hourly=direct_radiation&timezone=A
sia/Kolkata&forecast_days=1
● Logic: peakSunHours = hours where direct_radiation > 200 W/m²
● solarPanelViability: >5 → 'Good', >3 → 'Moderate', else 'Poor'
● Timeout: 5s
● Cron: daily 0 1 * * *
● Batch: 10 clusters / 500ms
4. Noise — HowLoud (EXACT property coordinates, not centroid)
● Endpoint: GET http://elb1.howloud.com/score
● Params: key={HOWLOUD_API_KEY}&latitude={lat}&longitude={lon}
● Logic: Score 50–100 → dB = 110 - score
● Timeout: 5s
● Fallback: GROQ estimate — input: { nearbyPlaceTypes, floorLevel,
roadProximity } — NEVER send coordinates to GROQ
● GROQ returns { estimatedDb: Number } stored with source: 'estimated'
● Cron: weekly 0 2 * * 1
● Batch: 5 clusters / 2000ms
5. Amenities — Google Places Nearby Search (EXACT property coordinates)
● Endpoint: GET
https://maps.googleapis.com/maps/api/place/nearbysearch/json
● Params: location={lat},{lng}&radius=3000&type={type}&key={key}
● Types: school, hospital, gym, restaurant, park, place_of_worship, cafe
● Timeout: 5s
● Cron: 0 3 1,15 * * (1st and 15th of month)
● Batch: 3 clusters / 2000ms
6. Geocoding — inline in analyze.routes.js (no separate service file)
async function getCoordinatesFromPlaceId(placeId) {
const url = `https://maps.googleapis.com/maps/api/place/details/json`
+ `?place_id=${placeId}&fields=geometry,name,formatted_address`
+ `&key=${process.env.GOOGLE_PLACES_API_KEY}`;
const res = await fetch(url);
const data = await res.json();
if (data.status !== 'OK') return null;
return {
lat: data.result.geometry.location.lat,
lng: data.result.geometry.location.lng,
name: data.result.name,
formattedAddress: data.result.formatted_address,
};
}
function validateIndiaCoordinates(lat, lng) {
return lat >= 6.5 && lat <= 37.6 && lng >= 68.1 && lng <= 97.4;
}
async function reverseGeocode(lat, lng) {
const url = `https://nominatim.openstreetmap.org/reverse`
+ `?lat=${lat}&lon=${lng}&format=json`;
const res = await fetch(url, { headers: { 'User-Agent': 'Vibescout/1.0' } });
const data = await res.json();
return { displayName: data.display_name ?? 'Selected location' };
}
7. RERA — NOT USED IN PHASE 1 Users bring their own properties without known
registration numbers. RERA verification not applicable. No RERA calls, no RERA fields on any
schema.
SERVICE FILES
src/services/intelligencePipeline.service.js
export async function runPipeline(shadowPropertyId, lat, lng, clusterId, cityName) {
// Called by POST /analyze/start — does NOT await this
const [aqi, noise, solar, weather, amenities, localNews] = await Promise.all([
getOrFetchClusterSignal(clusterId, lat, lng, 'AQI', cityName),
fetchNoiseWithFallback(lat, lng, clusterId, cityName),
getOrFetchClusterSignal(clusterId, lat, lng, 'Solar', cityName),
getOrFetchClusterSignal(clusterId, lat, lng, 'Weather', cityName),
fetchAmenitiesWithFallback(lat, lng, clusterId, cityName),
fetchNewsWithFallback(clusterId, cityName), // PATCH — news pipeline
]);
// Every signal guaranteed to return a value — never null
await redisSet(
`session:${sessionId}:intelligence`,
JSON.stringify({ aqi, noise, solar, weather, amenities, localNews }),
7200
);
await ShadowProperty.findByIdAndUpdate(shadowPropertyId, {
intelligence: { aqi, noise, solar, weather, amenities, localNews },
dataSource: {
aqi: aqi.source,
noise: noise.source,
solar: solar.source,
weather: weather.source,
amenities: amenities.source,
localNews: localNews.source,
},
status: 'completed',
});
await Cluster.findOneAndUpdate(
{ clusterId },
{ lastSearchedAt: new Date() }
);
}
src/services/news.service.js
Implements fetchNewsWithFallback(clusterId, cityName) with the News waterfall
chain defined in Section 4. Returns { headlines: [...], source:
'gnews'|'newsapi'|'google-rss'|'fallback' }. Never throws — always returns.
Headlines are { title, url, source, publishedAt, snippet }. Cluster-level cache
key: cluster:{clusterId}:news with EX 86400 (24h).
src/services/leadScore.service.js
const LIFESTYLE_WEIGHTS = {
family: { schools: 3, hospitals: 2, parks: 2, gyms: 1, cafes: 0 },
remote: { cafes: 3, parks: 2, gyms: 2, schools: 0, hospitals: 1 },
student: { cafes: 3, gyms: 2, parks: 1, schools: 1, hospitals: 1 },
professional: { gyms: 3, cafes: 2, hospitals: 1, parks: 1, schools: 1 },
retired: { hospitals: 3, parks: 3, schools: 0, gyms: 1, cafes: 1 },
};
function computeLifestyleMatch(clusterAmenities, lifestyleType) {
const weights = LIFESTYLE_WEIGHTS[lifestyleType] ?? LIFESTYLE_WEIGHTS.professional;
let score = 0, maxScore = 0;
for (const [type, weight] of Object.entries(weights)) {
maxScore += weight * 3;
const count = clusterAmenities[type]?.length ?? 0;
score += Math.min(count, 3) * weight;
}
return Math.round((score / maxScore) * 15);
}
export function computeLeadScore(preferences, shadowProperty, verdictObject) {
const p = preferences;
const sp = shadowProperty;
const v = verdictObject;
const budgetPts = v.budgetVerdict === 'pass' ? 25 : v.budgetVerdict === 'caution' ? 15 : 5;
const stressScore = computeStressScore(
p.step7.monthlyHouseholdIncome,
sp.userProvidedSpecs.budgetBracket,
sp.userProvidedSpecs.listingType
);
// NOTE: computeStressScore — implement inline in leadScore.service.js
const financialPts = Math.round((stressScore / 100) * 20);
const lifestylePts = computeLifestyleMatch(sp.intelligence?.amenities ?? {},
p.step2.lifestyleType);
const envPts = v.aqiVerdict === 'pass' ? 10 : v.aqiVerdict === 'caution' ? 6 : 2;
const commutePts = v.commuteVerdict === 'pass' ? 10 : v.commuteVerdict === 'caution' ? 6 :
2;
const readinessPts = sp.userProvidedSpecs.listingType === 'sale'
? (p.step7.loanPreApproved ? 5 : 0)
: (p.step7.moveInTimeline === 'immediately' ? 5 : 0);
const locationPts = p.step1.wfhStatus === 'full-time' ? 15
: v.commuteVerdict === 'pass' ? 15
: v.commuteVerdict === 'caution' ? 8 : 3;
const compositeScore = Math.min(100,
budgetPts + financialPts + lifestylePts + envPts + commutePts + readinessPts + locationPts
);
const tier = compositeScore >= 80 ? 'hot'
: compositeScore >= 60 ? 'warm'
: compositeScore >= 40 ? 'lukewarm'
: 'cold';
return {
compositeScore,
tier,
breakdown: {
budget: budgetPts, financial: financialPts, lifestyle: lifestylePts,
environmental: envPts, commute: commutePts, readiness: readinessPts,
location: locationPts,
},
};
}
src/services/groq.service.js
import fetch from 'node-fetch';
export async function callGroq(factSheet, listingType) {
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
},
body: JSON.stringify({
model: 'llama3-8b-8192',
max_tokens: 500,
temperature: 0.1,
messages: [
{ role: 'system', content: GROQ_SYSTEM_PROMPT },
{ role: 'user', content: JSON.stringify(factSheet) },
],
}),
});
const data = await response.json();
const raw = data.choices[0].message.content;
const cleaned = raw.replace(/```json|```/g, '').trim();
try {
return JSON.parse(cleaned);
} catch {
console.error('[GROQ] JSON parse failed:', cleaned);
return null;
}
}
src/services/clusterService.js
Must export:
export function haversineKm(coord1, coord2) // distance between two lat/lng points
export function assignCluster(lat, lng) // finds nearest cluster within
CLUSTER_RADIUS_M
export async function upsertCluster(lat, lng) // creates or updates cluster document
export async function getAllActiveClusters() // evergreen + recently searched
export async function getClustersNeedingRefresh(signalType, ttlSeconds) // for cron jobs
Cluster assignment:
const CLUSTER_RADIUS_M = 1500;
export async function assignCluster(lat, lng) {
const allClusters = await Cluster.find({});
let nearest = null, minDist = Infinity;
for (const c of allClusters) {
const d = haversineM(lat, lng, c.centroidLat, c.centroidLng);
if (d < minDist) { minDist = d; nearest = c; }
}
if (nearest && minDist <= CLUSTER_RADIUS_M) return nearest.clusterId;
return upsertCluster(lat, lng);
}
CRON JOBS (src/jobs/cronJobs.js)
5 cron jobs operating on Cluster documents. Micro-level noise and amenities for
ShadowProperty are fetched live during pipeline — not via cron.
import cron from 'node-cron';
async function processBatch(items, batchSize, delayMs, fn) {
for (let i = 0; i < items.length; i += batchSize) {
const batch = items.slice(i, i + batchSize);
await Promise.all(batch.map(fn));
if (i + batchSize < items.length) {
await new Promise(r => setTimeout(r, delayMs));
}
}
}
// AQI — daily
cron.schedule('0 0 * * *', async () => {
const clusters = await getClustersNeedingRefresh('AQI', 86400);
await processBatch(clusters, 5, 1000, async (cluster) => {
try {
const data = await fetchAQI(cluster.centroidLat, cluster.centroidLng);
if (!data) return;
await redisSet(`cluster:${cluster.clusterId}:AQI`, JSON.stringify(data), 86400);
await Cluster.findOneAndUpdate({ clusterId: cluster.clusterId },
{ cachedAQI: { ...data, updatedAt: new Date() } });
} catch (err) {
console.error(`[Cron:AQI] ${cluster.clusterId}:`, err.message);
}
});
});
// Weather — daily (same schedule as AQI, different batch)
cron.schedule('0 0 * * *', async () => { /* batch 10/1000ms */ });
// Solar — daily offset
cron.schedule('0 1 * * *', async () => { /* batch 10/500ms */ });
// Noise — weekly Monday
cron.schedule('0 2 * * 1', async () => { /* batch 5/2000ms */ });
// Amenities — 1st and 15th
cron.schedule('0 3 1,15 * *', async () => { /* batch 3/2000ms */ });
// News — daily (optional, improves cache hit rate; pipeline live-fetch is primary path)
// cron.schedule('0 4 * * *', async () => { /* batch 5/2000ms */ });
Section 6 — Backend Routes
AUTH SYSTEM
POST /auth/register { name, email, password }
POST /auth/login { email, password }
POST /auth/logout → clears cookie
GET /auth/me → returns user (protected)
JWT payload: { userId, email, name, role } Cookie: vb_token, httpOnly: true,
secure: true (prod), sameSite: 'lax'
Protected routes: POST /funnel/save, POST /analyze/start, GET
/report/generate, GET /auth/me, all /admin/* routes.
CONSUMER ROUTES
POST /analyze/start
// Body: { placeId?, lat, lng, name, confirmed: true }
// Validates: confirmed must be true, India bounding box check
// Auth: required (JWT)
1. Validate confirmed === true — reject if false
2. Validate India coordinates via validateIndiaCoordinates(lat, lng)
3. If placeId provided → getCoordinatesFromPlaceId(placeId) → override lat/lng with verified
coords
4. assignCluster(lat, lng) → clusterId
5. Create ShadowProperty:
{
sessionId: generateSessionId(),
placeId: placeId ?? null,
name,
coordinates: { lat, lng },
confirmedByUser: true,
clusterId,
status: 'fetching',
expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
}
6. Update User: { 'preferences.sessionId': sessionId }
7. Return { sessionId, shadowPropertyId } immediately
8. Fire pipeline (non-blocking — do NOT await):
runPipeline(shadowPropertyId, lat, lng, clusterId, cityName)
POST /analyze/:sessionId/context
// Body: { budgetBracket, bhk, floor, listingType }
// Validates all as enums — rejects any invalid value
// budgetBracket is the normalised single field
await ShadowProperty.findOneAndUpdate(
{ sessionId },
{ userProvidedSpecs: { budgetBracket, bhk, floor, listingType } }
);
await User.findByIdAndUpdate(userId, {
'preferences.listingTypeContext': listingType
});
return { ok: true };
GET /analyze/:sessionId/status
const sp = await ShadowProperty.findOne({ sessionId });
return { status: sp.status, dataSource: sp.dataSource };
POST /funnel/save
// Body: { sessionId, step, data, complete? }
// Auth: required
await User.findByIdAndUpdate(userId, {
[`preferences.step${step}`]: data
});
if (complete) {
const sp = await ShadowProperty.findOne({ sessionId });
const user = await User.findById(userId);
const preferences = user.preferences;
const verdictObject = computeAllVerdicts(sp, preferences);
const { compositeScore, tier, breakdown } = computeLeadScore(preferences, sp,
verdictObject);
await Lead.create({
userId,
shadowPropertyId: sp._id,
sessionId,
clusterId: sp.clusterId,
listingType: sp.userProvidedSpecs.listingType,
preferences,
userProvidedSpecs: sp.userProvidedSpecs,
budgetBracket: sp.userProvidedSpecs.budgetBracket,
verdictObject,
compositeScore,
scoreTier: tier,
scoreBreakdown: breakdown,
dataSource: sp.dataSource,
stage: 'new',
});
return { ok: true, sessionId };
}
return { ok: true };
GET /funnel/progress
const user = await User.findById(userId).select('preferences');
return { preferences: user.preferences };
GET /report/generate
// Query: { sessionId }
// Auth: required
const sp = await ShadowProperty.findOne({ sessionId });
if (!sp) {
const user = await User.findById(userId);
const cached = user.reportHistory.find(r => r.sessionId === sessionId);
if (cached) return { report: cached.reportSnapshot };
return { status: 'not_found' };
}
if (sp.status === 'fetching') {
return { status: 'pending', retryAfter: 3 };
}
const redisCached = await redisGet(`report:${sessionId}`);
if (redisCached) return { report: JSON.parse(redisCached) };
const user = await User.findById(userId);
const preferences = user.preferences;
const verdictObject = computeAllVerdicts(sp, preferences);
const financialScores = computeFinancialScores(sp.userProvidedSpecs, preferences);
// NOTE: computeFinancialScores — implement inline in report.routes.js
// PATCH #13 — newsHeadlines + newsCount added to factSheet
const factSheet = {
...verdictObject,
...financialScores,
wfhStatus: preferences.step1.wfhStatus,
facingDirection: preferences.step4.facingDirection,
listingType: sp.userProvidedSpecs.listingType,
newsHeadlines: sp.intelligence.localNews?.headlines?.map(h => h.title) ?? [],
newsCount: sp.intelligence.localNews?.headlines?.length ?? 0,
};
const groqRaw = await callGroq(factSheet, sp.userProvidedSpecs.listingType);
const groqLabels = validateGroqOutput(groqRaw, factSheet, sp.userProvidedSpecs.listingType)
?? buildTemplateReport(verdictObject, sp.userProvidedSpecs.listingType);
// PATCH #12 — localNews signal added to report object
const report = {
sessionId,
propertyName: sp.name,
listingType: sp.userProvidedSpecs.listingType,
generatedAt: new Date(),
headline: verdictObject.headline,
matchKeywords: groqLabels.matchKeywords,
verdict: groqLabels.verdict,
signals: {
noise: {
...sp.intelligence.noise,
verdict: verdictObject.noiseVerdict,
label: groqLabels.noiseLabel,
},
aqi: {
...sp.intelligence.aqi,
verdict: verdictObject.aqiVerdict,
label: groqLabels.aqiLabel,
},
solar: {
...sp.intelligence.solar,
verdict: verdictObject.solarVerdict,
label: groqLabels.solarLabel,
},
amenities: {
...sp.intelligence.amenities,
verdict: verdictObject.amenityVerdict,
label: groqLabels.amenityLabel,
},
commute: {
estimatedMins: verdictObject.estimatedCommuteMins,
verdict: verdictObject.commuteVerdict,
label: groqLabels.commuteLabel,
},
budget: {
bracket: sp.userProvidedSpecs.budgetBracket,
verdict: verdictObject.budgetVerdict,
label: groqLabels.budgetLabel,
},
localNews: {
...sp.intelligence.localNews,
label: groqLabels.newsLabel
?? (sp.intelligence.localNews?.headlines?.length
? NEWS_TEMPLATES.has_headlines(sp.intelligence.localNews.headlines.length)
: NEWS_TEMPLATES.no_headlines()),
},
},
financial: financialScores,
financialNote: sp.userProvidedSpecs.listingType === 'sale'
? groqLabels.financialNote
: groqLabels.rentalNote,
dataSource: sp.dataSource,
summary: {
totalRedFlags: verdictObject.totalRedFlags,
totalCautions: verdictObject.totalCautions,
totalPasses: verdictObject.totalPasses,
},
};
const shareToken = crypto.randomBytes(16).toString('hex');
await User.findByIdAndUpdate(userId, {
$push: {
reportHistory: {
sessionId,
listingType: sp.userProvidedSpecs.listingType,
propertyName: sp.name,
reportSnapshot: report,
shareToken,
generatedAt: new Date(),
}
}
});
await redisSet(`report:${sessionId}`, JSON.stringify(report), 604800);
return { report, shareToken };
GET /report/:sessionId
const { share } = req.query;
if (share) {
const owner = await User.findOne({
'reportHistory.sessionId': sessionId,
'reportHistory.shareToken': share,
});
if (!owner) return res.status(403).json({ error: 'Invalid share token' });
const entry = owner.reportHistory.find(r => r.sessionId === sessionId);
return res.json({ report: entry.reportSnapshot, readonly: true });
}
const entry = user.reportHistory.find(r => r.sessionId === sessionId);
if (!entry) return res.status(404).json({ error: 'Report not found' });
return res.json({ report: entry.reportSnapshot, shareToken: entry.shareToken });
ADMIN ROUTES
All admin routes: requireAuth + requireAdmin middleware.
Shadow Properties (read-only)
● GET /admin/shadow-properties — list (filter: status, listingType)
● GET /admin/shadow-properties/:id — detail with full intelligence data
Leads
● GET /admin/leads — list (filter: scoreTier, listingType, stage)
● GET /admin/leads/stats — aggregate stats for dashboard
● GET /admin/leads/:id — lead detail with verdictObject
Note: PATCH /admin/leads/:id/stage, PATCH /admin/leads/:id/assign, POST
/admin/leads/:id/notes are ALL removed. Broker interaction is Phase 2 only. Admin lead
panel is read-only in Phase 1.
Brokers
● GET /admin/brokers — list
● POST /admin/brokers — create
● PUT /admin/brokers/:id — update
● PATCH /admin/brokers/:id/status — toggle isActive
● GET /admin/brokers/:id/leads — leads assigned to broker
Clusters
● GET /admin/clusters — all clusters with freshness info
● GET /admin/clusters/stale — only stale clusters
● POST /admin/clusters/:id/refresh — trigger manual refresh (query:
?types=aqi,noise)
CRITICAL RULES — MANDATORY BEFORE WRITING
CODE
1. No TypeScript anywhere. Every file is .js or .jsx only.
2. Never summarise or skip code. No // rest of code here, no // TODO, no
placeholders. Every file complete and production-ready.
3. Split across multiple replies using the exact split plan in Section 9. End every part with:
--- END OF PART [N] — reply "continue" for Part [N+1] ---
Every file starts with:
// FILE: /path/to/file.js// PURPOSE: one-line description
4.
5. Backend: ES Modules throughout. "type": "module" in package.json. Use
import/export everywhere. No require().
Frontend: Next.js 15 App Router, .jsx files only. Use 'use client' where needed. Page
components that use params must await them:
export default async function Page({ params }) { const { id } = await params;}
6.
7. Styling: Tailwind CSS v4 only. No inline style props except truly dynamic values. No
tailwind.config.js. All design tokens in globals.css via @theme blocks.
8. Use exact package versions specified in Section 9.
CORS config:
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true, methods:
['GET','POST','PUT','DELETE','OPTIONS','PATCH'], allowedHeaders:
['Content-Type','Authorization'],}));
9.
10. cookie-parser registered before any route.
GROQ response parsing — always use this pattern:
const raw = data.choices[0].message.content;const cleaned = raw.replace(/```json|```/g,
'').trim();try { return JSON.parse(cleaned); }catch { console.error('[GROQ] parse failed:',
cleaned); return null; }
11.
12. VPS: Ubuntu 22.04 + Node.js 22 LTS via nvm.
13. Admin panel at /admin. JWT with role: 'admin' required.
14. Phase 2 fields present in schemas with // PHASE 2 comments. No active logic.
15. listingTypeContext set in context screen, stored in session. Every funnel step,
lead, and report is aware of it.
App Router route groups:
app/ (marketing)/ ← Server Components, SSR, SEO (app)/ ← 'use client' throughout,
SPA-like
16.
17. Socket.IO: never initialise in (marketing)/. Socket connections only in (app)/.
Section 7 — Frontend Architecture +
Components
FRONTEND ARCHITECTURE
app/
(marketing)/
layout.jsx ← SSR layout, no auth, no socket
page.jsx ← Landing page
analyze/
page.jsx ← Property search entry point
report/
[sessionId]/
page.jsx ← Report viewer (conditional auth)
(app)/
layout.jsx ← Client layout, auth guard
login/page.jsx
register/page.jsx
funnel/page.jsx ← Context screen + 8-step funnel
admin/
layout.jsx
page.jsx ← Dashboard
shadow-properties/
page.jsx
[id]/page.jsx
leads/
page.jsx
[id]/page.jsx
brokers/
page.jsx
[id]/page.jsx
clusters/page.jsx
broker-portal/
layout.jsx ← Phase 2 stub — "coming soon" layout
components/
LocationSearch.jsx ← 3-path geocoding (Places → Leaflet → manual)
LocationConfirmMap.jsx ← Confirmation map (Leaflet, dynamic import)
ContextScreen.jsx ← Pre-funnel context (listingType, budget, BHK, floor)
FunnelStep.jsx ← Individual funnel step renderer
Navbar.jsx
AuthGuard.jsx
SharePDFBar.jsx
report/
ReportViewer.jsx
VibeSummaryCard.jsx
VerdictBadge.jsx
DataSourceLabel.jsx ← Shows source label
AeroSonicCard.jsx ← Noise + AQI
SolarPathCard.jsx
LocalNewsCard.jsx ← PATCH #15 — local headlines
HyperPersonalCard.jsx ← PATCH #24 — commute + lifestyle
CommunityPulseCard.jsx
FinancialCard.jsx ← Sale only
RentalFitCard.jsx ← Rent only
admin/
AdminSidebar.jsx
LeadScoreBar.jsx
LeadSignalCard.jsx
ClusterHealthBadge.jsx
hooks/
useAnalyze.js
useFunnel.js
lib/
api.js
auth.js
KEY FRONTEND COMPONENTS
LocationSearch.jsx
Handles all three geocoding paths. Must be a client component ('use client').
// Path A: Google Places Autocomplete
// Path B: Leaflet map pin (shown if Places fails) — extracted to LeafletPinMap.jsx, dynamic
import
// Path C: Manual lat/lng text fields (link below map)
// All paths → onResolved({ lat, lng, name, placeId? })
Google Maps JS must be loaded in app/(marketing)/layout.jsx with
libraries=places:
import Script from 'next/script';
// In layout.jsx <head> or after <body>:
<Script
src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_
MAPS_KEY}&libraries=places`}
strategy="beforeInteractive"
/>
Without this tag, window.google.maps.places is undefined and Path A fails silently.
Leaflet must be loaded dynamically:
const LeafletPinMap = dynamic(
() => import('./LeafletPinMap'), // extracted component, not inline
{ ssr: false }
);
const LocationConfirmMap = dynamic(
() => import('./LocationConfirmMap'),
{ ssr: false }
);
LocationConfirmMap.jsx
Shows resolved coordinates on a Leaflet map. "Confirm this location" button calls
onConfirm(). Used both for property location AND workplace location (Step 1 of funnel).
ContextScreen.jsx
Pre-funnel screen at /funnel?sessionId=xxx.
Four required fields:
1. For Sale / For Rent toggle → sets listingType
2. Budget bracket dropdown (sale or rent brackets shown based on toggle)
3. BHK / property type
4. Floor
"Begin Analysis" → POST /analyze/:sessionId/context → advance to funnel Step 1.
Frontend normalises budget input before sending:
const budgetBracket = listingType === 'sale' ? selectedPriceBracket : selectedRentBracket;
// Single field sent to backend — no conditional server logic
FunnelStep.jsx
Renders each of the 8 funnel steps. Step 7 renders different fields based on
listingTypeContext from session.
Step 1 special behaviour:
● WFH full-time toggle → if true, hide workplace search + commute fields
● Workplace field uses same LocationSearch component as property search
● All three geocoding paths available for workplace
Report page — /report/[sessionId] in (marketing)/
// app/(marketing)/report/[sessionId]/page.jsx
export default async function ReportPage({ params, searchParams }) {
const { sessionId } = await params;
const { share } = await searchParams;
if (share) {
const data = await fetchReportByShareToken(sessionId, share);
if (!data) return notFound();
return <ReportViewer report={data.report} readonly={true} />;
}
const token = cookies().get('vb_token')?.value;
if (!token) redirect('/login');
const data = await fetchReportByOwner(sessionId, token);
if (!data) return notFound();
return <ReportViewer report={data.report} shareToken={data.shareToken} readonly={false} />;
}
ReportViewer.jsx
// Layout (4-chapter scroll structure with IntersectionObserver + stagger-children):
// 1. VibeSummaryCard — headline, matchKeywords, verdict, flag count
// 2. AeroSonicCard — noise + AQI combined
// 3. SolarPathCard — solar viability
// 3.5. LocalNewsCard — local headlines ← PATCH #15
// 4. HyperPersonalCard — commute + lifestyle
// 5. CommunityPulseCard — "Community intelligence coming soon" placeholder
// 6. FinancialCard (sale) OR RentalFitCard (rent)
// 7. SharePDFBar — share link copy + PDF export (hidden if readonly)
//
// Every card always shows a value. No card is ever blank.
// BANNED WORDS in all card components:
// 'unavailable' 'missing' 'no data' 'data not found' 'failed' 'error'
VerdictBadge.jsx
// PATCH — updated to glass-compatible translucent spec per Section 2.5 §20
const styles = {
red_flag: {
background: 'var(--color-danger-bg)',
color: 'var(--color-danger)',
border: '1px solid var(--color-danger-border)',
},
caution: {
background: 'var(--color-warning-bg)',
color: 'var(--color-warning)',
border: '1px solid var(--color-warning-border)',
},
pass: {
background: 'var(--color-success-bg)',
color: 'var(--color-success)',
border: '1px solid var(--color-success-border)',
},
};
export function VerdictBadge({ verdict }) {
return (
<span
className="text-xs font-medium px-2 py-1 rounded-full"
style={styles[verdict]}
>
{verdict === 'red_flag' ? 'Red flag' : verdict.charAt(0).toUpperCase() + verdict.slice(1)}
</span>
);
}
DataSourceLabel.jsx
// PATCH — news-aware source map; uses --color-text-muted per Section 2.5 §19
const labels = {
cache: (updatedAt) => `Updated ${daysSince(updatedAt)} days ago`,
city_average: () => 'City average',
seasonal: () => 'Seasonal average',
estimated: () => 'Estimated',
seed: () => 'Area average',
newsapi: () => 'Via NewsAPI',
'google-rss': () => 'Via Google News',
};
// Sources that render nothing: 'live', 'computed', 'gnews', 'fallback'
const SILENT_SOURCES = new Set(['live', 'computed', 'gnews', 'fallback']);
export function DataSourceLabel({ source, updatedAt }) {
if (!source || SILENT_SOURCES.has(source)) return null;
return (
<span className="text-xs text-[var(--color-text-muted)] mt-1 block" style={{ fontWeight: 300
}}>
{labels[source]?.(updatedAt) ?? ''}
</span>
);
}
// Never says 'unavailable', 'missing', or 'no data'
SharePDFBar.jsx
// Share: copies `/report/{sessionId}?share={shareToken}` to clipboard
// PDF: client-side html2canvas + jsPDF
// Hidden entirely when readonly={true} (share link recipient)
ADMIN PANEL
AdminSidebar navigation
Vibescout [logo]
─────────────────────
Overview /admin
Audited Properties /admin/shadow-properties
Leads /admin/leads
└ Hot /admin/leads?tier=hot
└ Warm /admin/leads?tier=warm
Brokers /admin/brokers
Clusters /admin/clusters
─────────────────────
Phase 2 (greyed, cursor-not-allowed):
Auction Market (disabled — PHASE 2)
Bid History (disabled — PHASE 2)
Admin Dashboard
Four StatCards: Total Audits | Leads by tier | Active Brokers | Cluster Health
Admin Shadow Properties panel
Read-only. Admin cannot create or edit ShadowProperties. Table: Name | Coordinates | Status |
listingType | Verdicts summary | Date
Admin Leads panel
Read-only in Phase 1. No stage update, no broker assign, no notes. Filter by: tier
(hot/warm/lukewarm/cold), listingType, stage (new/listed/sold/expired).
Lead detail shows:
● verdictObject — deterministic scores, not AI text
● Each signal: raw value + user preference + VerdictBadge
● scoreBreakdown — per-signal point contributions
● dataSource — where each signal came from
Admin Lead detail — signal card structure
Signal name
Raw API value (e.g. "72 dB")
User preference (e.g. "High sensitivity")
VerdictBadge (red_flag / caution / pass)
DataSourceLabel
Admin Brokers panel
CRUD for broker records. isActive toggle. View leads assigned to broker. No lead assignment
from admin in Phase 1.
Admin Clusters panel
Cluster list with freshness indicators. POST /admin/clusters/:id/refresh → triggers
manual signal refresh for selected types.
broker-portal stub
// app/(app)/broker-portal/layout.jsx
// Renders: "Broker portal coming in Phase 2" message
// Full auth guard applied — only role: broker can access (Phase 2 adds broker role)
Section 8 — Environment Variables +
Deployment Config
<!-- ⚠️ SUPERSEDED — THE CSS BLOCK THAT WAS HERE IS FULLY REPLACED BY
SECTION 2.5 ⚠️ Do not use any tokens, fonts, or keyframes from the original Section 8 CSS
block. The authoritative globals.css is defined in Section 2.5. Retained here only for historical
reference — do not copy into code. REMOVED: @theme block with #F8F5F0, Cormorant
Garamond, DM Sans, fadeUp(12px), opaque verdict badges. All of these are superseded. See
Section 2.5 §20 for the explicit token replacement table. If you see `#F8F5F0`, `Cormorant`,
`DM Sans`, `--color-deep`, or `--color-accent-soft` anywhere in your code, you have read the
wrong section. -->
ENVIRONMENT VARIABLES
# Backend .env
PORT=3001
MONGODB_URI=mongodb+srv://...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
GROQ_API_KEY=gsk_...
GOOGLE_PLACES_API_KEY=...
OPENAQ_API_KEY=...
OPENWEATHER_API_KEY=...
HOWLOUD_API_KEY=...
GNEWS_API_KEY=...
CPCB_API_KEY=your_data_gov_in_api_key_here
JWT_SECRET=minimum_64_characters_random_string
COOKIE_DOMAIN=.vibescout.com
FRONTEND_URL=https://vibescout.com
NODE_ENV=production
# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
SHARE + PDF EXPORT
Share URL: /report/{sessionId}?share={32-char-hex-token}
Token generation:
import { randomBytes } from 'crypto';
const shareToken = randomBytes(16).toString('hex'); // 128-bit entropy
Token validation:
const owner = await User.findOne({
'reportHistory.sessionId': sessionId,
'reportHistory.shareToken': shareToken,
});
if (!owner) return res.status(403).json({ error: 'Invalid share token' });
Share links: permanent (token stored in User.reportHistory). No expiry. Redis report
cache: 7-day fast-path only. Source of truth = User.reportHistory[].reportSnapshot.
PDF: client-side html2canvas + jsPDF. Hidden from share-link recipients (readonly={true}).
SEED DATA
scripts/seedUsers.js
Three accounts:
● user1@vibescout.com / password: user1pass / role: user
● user2@vibescout.com / password: user2pass / role: user
● admin@vibescout.com / password: adminpass / role: admin
scripts/seedShadowProperties.js
10 sample ShadowProperty documents with status: 'completed' and realistic intelligence
data.
● 5 sale, 5 rent
● Real Indian city coordinates from evergreen cluster zones
● Realistic noise/AQI/solar values so report renders meaningfully in development
● All dataSource fields populated (mix of 'live', 'cache', 'estimated')
scripts/seedLeads.js (separate from seedShadowProperties)
2 sample Lead documents linked to 2 of the above ShadowProperties. Run order:
seedUsers.js → seedShadowProperties.js → seedLeads.js
scripts/seedClusters.js
Run once at deployment. For every cluster in EVERGREEN_CLUSTER_IDS:
1. upsertCluster(lat, lng) — creates document
2. Fetch all 5 signals live
3. Store in MongoDB + Redis
4. lastSearchedAt = new Date()
Section 9 — Split Plan
PACKAGE VERSIONS
Frontend (Next.js):
{
"next": "15.2.0",
"react": "19.0.0",
"react-dom": "19.0.0",
"tailwindcss": "4.0.0",
"@tailwindcss/postcss": "4.0.0",
"html2canvas": "1.4.1",
"jspdf": "2.5.1",
"axios": "1.7.9",
"js-cookie": "3.0.5",
"leaflet": "1.9.4",
"react-leaflet": "4.2.1"
}
Backend (Express):
{
"express": "4.21.2",
"mongoose": "8.9.5",
"jsonwebtoken": "9.0.2",
"bcrypt": "5.1.1",
"cookie-parser": "1.4.7",
"cors": "2.8.5",
"node-cron": "3.0.3",
"dotenv": "16.4.7",
"express-rate-limit": "7.5.0",
"node-fetch": "3.3.2"
}
SPLIT PLAN
Changes from original spec:
● Dropped: rera.service.js, financial.service.js (inlined),
geocoding.service.js (inlined), SponsoredListing.js,
leadEnrichment.service.js
● cityLandmarks.js → replaced by cityCenters.js
● Part 29 broker-portal stub → folded into Part 28
● Freed slots redistributed to intelligence pipeline (Parts 9a/9b) and verdict engine (split
across Parts 7a/7b)
Part 1 — Backend foundation
package.json, .env.example, server.js,
src/middleware/errorHandler.js
Part 2 — Backend middleware + models A
src/middleware/rateLimiter.js,
src/models/ShadowProperty.js,
src/models/Cluster.js,
src/models/User.js
Part 3 — Backend models B
src/models/Lead.js,
src/models/Broker.js,
src/models/LeadAuction.js
Part 4 — Clustering algorithm
src/services/clusterService.js
Part 5 — Backend environment services A
src/services/aqi.service.js,
src/services/noise.service.js
**Special Instruction for Part 5 (aqi.service.js):**
Implement the full AQI waterfall as defined in Section 4. This includes:
- OpenAQ (live)
- Cluster cache
- CPCB City Average via data.gov.in API
- State-wise seasonal average from cityAQIAverages.js (city → state → national_default)
- Extract city and state names reliably using reverse geocoding (Nominatim or Google).
- Always return a valid AQI value. Never return null, undefined, or "unavailable".
Part 6 — Backend environment services B
src/services/solar.service.js,
src/services/weather.service.js,
src/services/places.service.js,
src/services/news.service.js ← PATCH #16
Part 7a — Verdict engine (critical — given full part)
src/services/verdictEngine.service.js
Part 7b — Anti-hallucination layer
src/services/groqValidator.service.js,
src/services/reportTemplates.service.js,
src/services/groq.service.js
Part 8 — Lead scoring
src/services/leadScore.service.js
Part 9a — Intelligence pipeline — waterfall fallbacks
src/services/intelligencePipeline.service.js (part 1 of 2)
— getOrFetchClusterSignal
— fetchNoiseWithFallback
— fetchAmenitiesWithFallback
— fetchNewsWithFallback
— getFallbackSignal
Part 9b — Intelligence pipeline — orchestrator
src/services/intelligencePipeline.service.js (part 2 of 2)
— runPipeline (main export)
— all Promise.all orchestration (6 signals including news)
— Redis write (single key: session:{id}:intelligence)
— ShadowProperty status update
Part 10 — Backend auth
src/services/token.service.js,
src/middleware/auth.middleware.js,
src/routes/auth.routes.js
Part 11 — Backend consumer routes A
src/routes/analyze.routes.js
(includes inlined geocoding functions)
Part 12 — Backend consumer routes B
src/routes/funnel.routes.js
Part 13 — Backend consumer routes C
src/routes/report.routes.js
(includes inlined financial score computation)
Part 14 — Backend admin routes A
src/routes/admin/shadowProperties.admin.routes.js,
src/routes/admin/leads.admin.routes.js
Part 15 — Backend admin routes B + cron
src/routes/admin/brokers.admin.routes.js,
src/routes/admin/clusters.admin.routes.js,
src/jobs/cronJobs.js
Part 16 — Frontend foundation
package.json, next.config.js, postcss.config.js,
app/globals.css
Part 17 — Frontend root layout + route group layouts
app/layout.jsx,
app/(marketing)/layout.jsx,
app/(app)/layout.jsx,
lib/auth.js
Part 18 — Frontend shared components + API layer
components/Navbar.jsx,
components/AuthGuard.jsx,
lib/api.js,
hooks/useAnalyze.js
Part 19 — Frontend auth pages
app/(app)/login/page.jsx,
app/(app)/register/page.jsx
Part 20 — Frontend analyze page
components/LocationSearch.jsx,
components/LocationConfirmMap.jsx,
app/(marketing)/analyze/page.jsx
Part 21 — Frontend context screen + funnel foundation
components/ContextScreen.jsx,
hooks/useFunnel.js
Part 22 — Frontend funnel step components
components/FunnelStep.jsx
(all 8 steps fully implemented — Step 1 with workplace LocationSearch,
Step 7 sale/rent branching, WFH toggle logic)
Part 23 — Frontend funnel page
app/(app)/funnel/page.jsx
Part 24 — Frontend report components A
components/report/VerdictBadge.jsx,
components/report/DataSourceLabel.jsx,
components/report/AeroSonicCard.jsx,
components/report/SolarPathCard.jsx
Part 25 — Frontend report components B
components/report/CommunityPulseCard.jsx,
components/report/HyperPersonalCard.jsx,
components/report/FinancialCard.jsx,
components/report/RentalFitCard.jsx,
components/report/LocalNewsCard.jsx ← PATCH #17
Part 26 — Frontend report viewer + share
components/report/ReportViewer.jsx,
components/report/VibeSummaryCard.jsx,
components/SharePDFBar.jsx,
app/(marketing)/report/[sessionId]/page.jsx
Part 27 — Frontend landing page
app/(marketing)/page.jsx
Part 28 — Admin layout + shared components
app/(app)/admin/layout.jsx,
components/admin/AdminSidebar.jsx,
components/admin/StatCard.jsx,
components/admin/DataTable.jsx
Part 29 — Admin dashboard + shadow properties
app/(app)/admin/page.jsx,
app/(app)/admin/shadow-properties/page.jsx,
app/(app)/admin/shadow-properties/[id]/page.jsx
Part 30 — Admin leads panel
app/(app)/admin/leads/page.jsx,
app/(app)/admin/leads/[id]/page.jsx,
components/admin/LeadScoreBar.jsx,
components/admin/LeadSignalCard.jsx
Part 31 — Admin brokers + clusters + broker portal stub
app/(app)/admin/brokers/page.jsx,
app/(app)/admin/brokers/[id]/page.jsx,
app/(app)/admin/clusters/page.jsx,
components/admin/ClusterHealthBadge.jsx,
app/(app)/broker-portal/layout.jsx
Part 32 — Static data files + seed scripts
src/data/evergreenClusters.js,
src/data/cityCenters.js,
src/data/cityAQIAverages.js,
src/data/cityWeatherAverages.js,
scripts/seedClusters.js,
scripts/seedShadowProperties.js,
scripts/seedLeads.js,
scripts/seedUsers.js
**Special Instruction for Part 32:**
Create the file `src/data/cityAQIAverages.js` with the **exact structure** defined in Section 4. It
must include:
- Multiple state-wise monthly averages (kerala, karnataka, tamilnadu, maharashtra, delhi,
uttarpradesh, etc.)
- `national_default` as the final safety net
Use the structure and sample values provided in Section 4.
Part 33 — Deployment
DEPLOYMENT.md
PHASE 2 INTEGRATION HOOKS SUMMARY
Location What Phase 2 adds
Lead.auction.* Populated when auction created and resolved
Lead.stage Changes from new → listed → sold/expired
Broker.bidHistory Populated by Razorpay per-bid payment events
LeadAuction model Bidding engine reads/writes this
POST
/admin/leads/:id/list-auct
ion
New route — creates LeadAuction, opens 5-min
window
AdminSidebar.jsx — Auction
Market
opacity-40 removed, becomes active Link
server.js app.use('/auction', auctionRoutes) added
src/models/User.js 'broker' added to role enum
app/(app)/broker-portal/la
yout.jsx
Full broker portal UI replaces stub
Section 10 — Deployment + Start
Instructions
DEPLOYMENT CHECKLIST (DEPLOYMENT.md — Part 33)
Infrastructure setup
1. VPS: Ubuntu 22.04. Install nvm → Node.js 22 LTS → PM2 globally.
2. MongoDB Atlas M0 free tier. Create database vibescout.
3. Upstash Redis: create database, copy REST URL + token.
4. API accounts required: Google Cloud (Places API), OpenAQ, OpenWeatherMap,
HowLoud, GROQ, GNews.io.
MongoDB indexes to create manually
shadowproperties:
{ sessionId: 1 } unique: true
{ expiresAt: 1 } expireAfterSeconds: 0 ← TTL index — critical
clusters:
{ clusterId: 1 } unique: true
users:
{ email: 1 } unique: true
leads:
{ sessionId: 1 } unique: true
{ scoreTier: 1, listingType: 1 }
{ stage: 1 }
brokers:
{ email: 1 } unique: true
Backend deployment
git clone <repo> /var/www/vibescout-api
cd /var/www/vibescout-api
npm install
cp .env.example .env
# fill .env with all keys including GNEWS_API_KEY
pm2 start server.js --name vibescout-api
pm2 save
pm2 startup
Seed data (run in order)
node scripts/seedClusters.js # fetch live data for all evergreen clusters
node scripts/seedUsers.js # create user1, user2, admin accounts
node scripts/seedShadowProperties.js
node scripts/seedLeads.js # run after shadow properties
Nginx config
server {
listen 80;
server_name api.vibescout.com;
location / {
proxy_pass http://localhost:3001;
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
proxy_set_header Host $host;
proxy_cache_bypass $http_upgrade;
}
}
sudo certbot --nginx -d api.vibescout.com
Frontend deployment (Vercel)
cd vibescout-frontend
vercel --prod
# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL=https://api.vibescout.com
# NEXT_PUBLIC_GOOGLE_MAPS_KEY=...
Custom domain: vibescout.com → Vercel. api.vibescout.com → VPS.
Smoke tests (run after deployment)
1. Search a real property → confirm pin → verify pipeline fires (check PM2 logs)
2. Complete full funnel → receive report → verify no hallucinated city names in labels
3. Copy share link → open in incognito → verify report renders without login
4. Open report after logging in as owner → verify reportHistory entry exists
5. Check admin panel → verify lead created with correct tier and verdictObject
6. Check admin clusters → verify evergreen clusters show status: fresh
7. Verify Redis keys exist: session:{id}:intelligence after pipeline completes
8. Complete a funnel for an evergreen cluster property → verify LocalNewsCard shows
headlines in report
Monitoring
● PM2: pm2 logs vibescout-api
● MongoDB Atlas: enable alerts for connection count + disk usage
● Upstash: monitor daily command count (stay within free tier)
● GROQ: monitor token usage in GROQ console
START INSTRUCTIONS
Begin with Part 1 now.
Write every file completely. No placeholders. No TypeScript. No summaries. Use Tailwind v4
utilities for all styling. Pin all package versions exactly as specified in Section 9.
Priority order (build in this sequence — each depends on the previous):
1. Parts 1–3 — Foundation + models
2. Part 4 — Cluster service (everything depends on this)
3. Parts 7a/7b — Verdict engine + anti-hallucination (core product guarantee)
4. Parts 9a/9b — Intelligence pipeline (async backbone)
5. Parts 5/6 — Environment services (called by pipeline)
6. Parts 10–13 — Auth + consumer routes
7. Parts 14–15 — Admin routes + cron
8. Parts 16–27 — Frontend (consumer facing)
9. Parts 28–31 — Admin frontend
10. Part 32 — Seed data
11. Part 33 — Deployment
End every part with: --- END OF PART [N] — reply "continue" for Part [N+1]
---
Anti-hallucination reminder for every AI-touching file:
● GROQ never receives: coordinates, property names, city names, addresses
● GROQ never receives: lat/lng in noise fallback — only { nearbyPlaceTypes,
floorLevel, roadProximity }
● headline is generated in JS — never by GROQ
● matchKeywords uses closed vocabulary only — groqValidator strips any unknown
keyword
● Template strings in reportTemplates.service.js are the guaranteed fallback for
every signal
● The word "unavailable" must never appear anywhere in the report UI
<!-- END OF MASTER_PROMPT_V2_FINAL --> <!-- Assembly record: PHASE 1: Section 8
CSS superseded ✓ | Section 2.5 inserted ✓ | --color-warning fix applied ✓ PHASE 2:
ShadowProperty localNews + dataSource.localNews ✓ | Cluster cachedNews ✓ | Section 4
news waterfall ✓ | Section 4 source table ✓ PHASE 3: GROQ input newsHeadlines+newsCount
✓ | GROQ output newsLabel (sale+rent) ✓ | GROQ system prompt newsLabel instruction ✓ |
ALLOWED_OUTPUT_KEYS newsLabel ✓ | NEWS_TEMPLATES ✓ PHASE 4: factSheet
newsHeadlines+newsCount ✓ | signals.localNews in report object ✓ PHASE 5:
GNEWS_API_KEY env var ✓ | news.service.js in Part 6 ✓ | LocalNewsCard.jsx in Part 25 ✓
PHASE 6: VerdictBadge glass spec ✓ | DataSourceLabel news-aware ✓ | ReportViewer layout
LocalNewsCard ✓ | LocalNewsCard + HyperPersonalCard in component list ✓ PHASE 7:
Smoke test #8 ✓ | computeAllVerdicts news comment ✓ Entropy mitigations: LeafletPinMap
extraction noted ✓ | computeStressScore mark inline ✓ | Google Maps <script> note ✓ |
--font-display dead token comment ✓ -->