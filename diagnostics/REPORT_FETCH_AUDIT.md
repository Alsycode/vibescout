# Report Generation — Complete Fetch Audit

**Date**: 2026-05-28  
**Scope**: Full static analysis of the report generation pipeline  
**Method**: Code-only trace — no live API calls made, no app files modified  
**Files read**: 18 source files across routes, services, models, middleware, and data layers

---

## 1. Complete Fetch Map

Every async operation in the pipeline, in execution order.

### Phase A — Property Start (`POST /analyze/start`)

| # | Operation | File | Function | Type |
|---|-----------|------|----------|------|
| A1 | Google Places Details (coords from placeId) | `analyze.routes.js:23` | `getCoordinatesFromPlaceId` | External HTTP |
| A2 | MongoDB — `Cluster.find({})` ALL clusters | `clusterService.js:48` | `assignCluster` | DB query (full scan) |
| A3 | MongoDB — `Cluster.findOneAndUpdate` (upsert) | `clusterService.js:36` | `upsertCluster` | DB write |
| A4 | MongoDB — `ShadowProperty.create` | `analyze.routes.js:93` | inline | DB write |
| A5 | MongoDB — `User.findByIdAndUpdate` (sessionId) | `analyze.routes.js:104` | inline | DB write |
| A6 | Nominatim reverse geocode (city name) | `analyze.routes.js:38` | `reverseGeocode` | External HTTP |

### Phase B — Intelligence Pipeline (`runPipeline`, async, fire-and-forget)

Runs in parallel via `Promise.all`. All 6 branches execute simultaneously.

#### B-AQI: `getOrFetchClusterSignal('AQI', ...)`

| # | Operation | File | Function | Timeout | Fallback |
|---|-----------|------|----------|---------|----------|
| B1 | Redis GET `cluster:{id}:AQI` | `intelligencePipeline.service.js:55` | `getOrFetchClusterSignal` | Upstash timeout | Continue |
| B2 | MongoDB `Cluster.findOne` (AQI cache) | `intelligencePipeline.service.js:68` | `getOrFetchClusterSignal` | Mongoose default | Continue |
| B3 | OpenAQ `api.openaq.org/v2/latest` | `aqi.service.js:89` | `fetchFromOpenAQ` | 5000ms | Continue |
| B4 | Nominatim reverse geocode (state lookup) | `aqi.service.js:70` | `reverseGeocodeState` | 5000ms | null state |
| B5 | CPCB `api.data.gov.in/resource/...` | `aqi.service.js:143` | `fetchFromCPCB` | 5000ms | Continue |
| B6 | Seasonal AQI lookup (JS table) | `cityAQIAverages.js:80` | `getSeasonalAQI` | None (sync) | national_default |
| B7 | Redis SET `cluster:{id}:AQI` | `intelligencePipeline.service.js:39` | `cacheClusterSignal` | Upstash timeout | Logged |
| B8 | MongoDB `Cluster.findOneAndUpdate` (AQI write) | `intelligencePipeline.service.js:43` | `cacheClusterSignal` | Mongoose default | Logged |

#### B-Noise: `fetchNoiseWithFallback(...)`

| # | Operation | File | Function | Timeout | Fallback |
|---|-----------|------|----------|---------|----------|
| B9 | HowLoud `http://elb1.howloud.com/score` | `noise.service.js:34` | `fetchFromHowLoud` | 5000ms | Continue |
| B10 | MongoDB `Cluster.findOne` (noise cache) | `noise.service.js:55` | `fetchFromClusterCache` | Mongoose default | Continue |
| B11 | MongoDB `Cluster.findOne` (amenities for GROQ context) | `noise.service.js:89` | `estimateNoiseWithGroq` | Mongoose default | empty types |
| B12 | GROQ `api.groq.com/openai/v1/chat/completions` (noise estimate) | `noise.service.js:107` | `estimateNoiseWithGroq` | 8000ms | Hard default |

#### B-Solar: `getOrFetchClusterSignal('Solar', ...)`

| # | Operation | File | Function | Timeout | Fallback |
|---|-----------|------|----------|---------|----------|
| B13 | Redis GET `cluster:{id}:Solar` | `intelligencePipeline.service.js:55` | `getOrFetchClusterSignal` | Upstash timeout | Continue |
| B14 | MongoDB `Cluster.findOne` (solar cache) | `intelligencePipeline.service.js:68` | `getOrFetchClusterSignal` | Mongoose default | Continue |
| B15 | Open-Meteo `api.open-meteo.com/v1/forecast` | `solar.service.js:39` | `fetchFromOpenMeteo` | 5000ms | Continue |
| B16 | Latitude formula (sync JS) | `solar.service.js:29` | `estimateSolarFromLatitude` | None | Always succeeds |

#### B-Weather: `getOrFetchClusterSignal('Weather', ...)`

| # | Operation | File | Function | Timeout | Fallback |
|---|-----------|------|----------|---------|----------|
| B17 | Redis GET `cluster:{id}:Weather` | `intelligencePipeline.service.js:55` | `getOrFetchClusterSignal` | Upstash timeout | Continue |
| B18 | MongoDB `Cluster.findOne` (weather cache) | `intelligencePipeline.service.js:68` | `getOrFetchClusterSignal` | Mongoose default | Continue |
| B19 | OpenWeatherMap `api.openweathermap.org/data/2.5/weather` | `weather.service.js:41` | `fetchFromOpenWeatherMap` | 5000ms | Continue |
| B20 | Nominatim reverse geocode (state for weather) | `weather.service.js:22` | `reverseGeocodeState` | 5000ms | null state |
| B21 | Seasonal weather lookup (JS table) | `cityWeatherAverages.js:96` | `getSeasonalWeather` | None (sync) | national_default |

#### B-Amenities: `fetchAmenitiesWithFallback(...)`

| # | Operation | File | Function | Timeout | Fallback |
|---|-----------|------|----------|---------|----------|
| B22 | Google Places `maps.googleapis.com/nearbysearch` ×7 parallel | `places.service.js:38` | `fetchPlaceType` | 5000ms each | [] |
| B23 | MongoDB `Cluster.findOne` (amenities cache) | `places.service.js:80` | `fetchFromClusterCache` | Mongoose default | Continue |
| B24 | Seed fallback (empty arrays) | `places.service.js:112` | `fetchAmenities` | None | Always succeeds |

#### B-News: `fetchNewsWithFallback(...)`

| # | Operation | File | Function | Timeout | Fallback |
|---|-----------|------|----------|---------|----------|
| B25 | Redis GET `cluster:{id}:news` | `news.service.js:157` | `fetchNewsWithFallback` | Upstash timeout | Continue |
| B26 | GNews `gnews.io/api/v4/search` | `news.service.js:75` | `fetchFromGNews` | 6000ms | Continue |
| B27 | NewsAPI `newsapi.org/v2/everything` | `news.service.js:107` | `fetchFromNewsAPI` | 6000ms | Continue |
| B28 | Google News RSS `news.google.com/rss/search` | `news.service.js:137` | `fetchFromGoogleRSS` | 6000ms | Continue |
| B29 | Redis SET `cluster:{id}:news` | `news.service.js:173` | `fetchNewsWithFallback` | Upstash timeout | Logged |

#### B-Finalize

| # | Operation | File | Function | Type |
|---|-----------|------|----------|------|
| B30 | Redis SET `session:{id}:intelligence` | `intelligencePipeline.service.js:163` | `runPipeline` | DB write |
| B31 | MongoDB `ShadowProperty.findByIdAndUpdate` (intelligence + status) | `intelligencePipeline.service.js:168` | `runPipeline` | DB write |
| B32 | MongoDB `Cluster.findOneAndUpdate` (lastSearchedAt) | `intelligencePipeline.service.js:182` | `runPipeline` | DB write |

### Phase C — Funnel (`POST /funnel/save` ×8)

| # | Operation | File | Function | Type |
|---|-----------|------|----------|------|
| C1 | MongoDB `User.findByIdAndUpdate` (step data) | `funnel.routes.js:28` | inline | DB write |
| C2 | MongoDB `ShadowProperty.findOne` (on complete=true) | `funnel.routes.js:33` | inline | DB query |
| C3 | MongoDB `User.findById` (get preferences) | `funnel.routes.js:38` | inline | DB query |
| C4 | `computeAllVerdicts` (sync) | `verdictEngine.service.js:141` | `computeAllVerdicts` | Sync computation |
| C5 | `computeLeadScore` (sync) | `leadScore.service.js` | `computeLeadScore` | Sync computation |
| C6 | MongoDB `Lead.create` | `funnel.routes.js:44` | inline | DB write |

### Phase D — Report Generation (`GET /report/generate`)

| # | Operation | File | Function | Type |
|---|-----------|------|----------|------|
| D1 | MongoDB `ShadowProperty.findOne` (sessionId) | `report.routes.js:86` | inline | DB query |
| D2 | MongoDB `User.findById` (report history check if SP missing) | `report.routes.js:89` | inline | DB query |
| D3 | MongoDB `User.findById` (preferences) | `report.routes.js:102` | inline | DB query |
| D4 | Redis GET `report:{sessionId}` (cache check) | `report.routes.js:105` | `redisGet` | Cache read |
| D5 | `computeAllVerdicts` (sync) | `verdictEngine.service.js:141` | `computeAllVerdicts` | Sync computation |
| D6 | `computeFinancialScores` (sync) | `report.routes.js:47` | `computeFinancialScores` | Sync computation |
| D7 | GROQ `api.groq.com/openai/v1/chat/completions` (labels) | `groq.service.js:24` | `callGroq` | **No timeout** |
| D8 | `validateGroqOutput` (sync) | `groqValidator.service.js:22` | `validateGroqOutput` | Sync |
| D9 | `buildTemplateReport` (sync fallback) | `reportTemplates.service.js:48` | `buildTemplateReport` | Sync |
| D10 | MongoDB `User.findByIdAndUpdate` (push reportHistory) | `report.routes.js:191` | inline | DB write |
| D11 | Redis SET `report:{sessionId}` (7-day cache) | `report.routes.js:204` | `redisSet` | Cache write |

---

## 2. Failed Fetches

### FAIL-01 — GROQ main report call has NO timeout
- **File**: `groq.service.js:24`
- **Function**: `callGroq`
- **Issue**: Uses bare `fetch(...)` with no `AbortController` or timeout
- **Contrast**: The noise GROQ call in `noise.service.js:107` correctly uses `fetchWithTimeout(..., 8000)`
- **Impact**: If GROQ is slow or unresponsive, the entire `GET /report/generate` request hangs indefinitely. No retry, no timeout error, just an open HTTP connection
- **Status**: **Silent hang — no error thrown, no fallback triggered until client-side timeout**
- **Expected**: `callGroq` should return null on timeout → `validateGroqOutput(null)` returns null → `buildTemplateReport` kicks in
- **Actual**: Never reaches template fallback; request hangs

### FAIL-02 — `computeAllVerdicts` crashes if any preference step is null
- **File**: `verdictEngine.service.js:146–170`
- **Function**: `computeAllVerdicts`
- **Issue**: Direct property access on `p.step3`, `p.step1`, `p.step4`, `p.step5`, `p.step7` with no null guards
```js
p.step3.noiseSensitivity   // line 146 — TypeError if step3 is null
p.step3.aqiSensitivity     // line 147
p.step4.facingDirection    // line 148
p.step5.amenityPriorities  // line 151
p.step1.workplaceLat       // line 163
p.step7.monthlyHouseholdIncome // line 170
```
- **Trigger conditions**:
  - User completes the funnel but skips a step
  - User submits Step 8 `complete:true` without having visited all prior steps
  - `preferences` object is from an old user account with a partial schema
- **Impact**: Throws TypeError, propagates to Express error handler, report generation returns 500
- **Called from**: `funnel.routes.js:41` (on complete) and `report.routes.js:113`
- **Status**: **Hard crash — unhandled, no fallback**

### FAIL-03 — Amenity distances from cluster cache always `undefined`
- **File**: `places.service.js:84–96`, `verdictEngine.service.js:152–158`
- **Issue**: Field name mismatch between what is stored and what is read
  - `Cluster.cachedAmenities` stores `{ name, distance, placeId }` (field: `distance`)
  - When cache is served, `fetchFromClusterCache` returns `ca.schools` etc. as-is
  - `verdictEngine` reads `intel.amenities.schools[0]?.distanceM` (field: `distanceM`)
  - `distanceM` is only written when data comes from Google Places live (both `distanceM` AND `distance` are written)
  - When serving from cluster cache, items have `distance` but not `distanceM`
- **Result**: All amenity distances = `undefined` → defaults to 9999 in `amenityVerdict`
- **Impact**: All amenity verdicts are RED FLAG or CAUTION when data is served from cluster cache
- **Status**: **Silent wrong verdict — no error, no log, completely invisible**

### FAIL-04 — Solar sub-fields dropped by ShadowProperty schema
- **File**: `ShadowProperty.js:39–43`, `solar.service.js:59–68`
- **Issue**: `fetchSolar` returns `{ peakSunHours, morningScore, wfhLightScore, acSavingsEstimate, solarPanelViability, viability, source }` but ShadowProperty only persists `{ peakSunHours, viability, source }`
- **Dropped fields**: `morningScore`, `wfhLightScore`, `acSavingsEstimate`, `solarPanelViability`
- **Impact**: Report's solar signal always has these four as `undefined`. Any UI card (SolarPathCard) displaying these will show nothing or NaN
- **Status**: **Silent data loss — no error thrown, no warning logged**

### FAIL-05 — `restaurants` and `worship` dropped by ShadowProperty schema
- **File**: `ShadowProperty.js:49–56`
- **Issue**: ShadowProperty's `intelligence.amenities` schema has only: `schools, hospitals, parks, gyms, cafes`. The `restaurants` and `worship` keys returned by `fetchAmenities` are not in the schema and are silently discarded by Mongoose
- **Impact**: Report's amenities signal never contains restaurant or worship data. UI components relying on these show nothing
- **Status**: **Silent data loss — Mongoose silently strips unknown fields**

### FAIL-06 — Weather `description` dropped by ShadowProperty schema
- **File**: `ShadowProperty.js:46–48`, `weather.service.js:50`
- **Issue**: ShadowProperty schema for weather: `{ temp, humidity, source }`. `description` field is absent
- **Impact**: Report's weather signal always has `description: undefined`
- **Status**: **Silent data loss**

---

## 3. Intermittent Fetches

### INT-01 — OpenAQ: data sparse / no sensors within 5km
- **File**: `aqi.service.js:89–123`
- **Issue**: API returns success (HTTP 200) but `data.results` may be empty or contain only zero-value readings for large parts of India with no monitoring stations
- **Guard**: `if (!data.results?.length) return null` (handled) and `if (m.value > 0)` filter (handled)
- **Actual return when no sensors**: `null` → falls to Level 2
- **Status**: Handled, but causes frequent waterfall descent in rural areas

### INT-02 — HowLoud: HTTP (not HTTPS), intermittent availability
- **File**: `noise.service.js:34`
- **URL**: `http://elb1.howloud.com/score` — plain HTTP
- **Issue**: HowLoud API is a known third-party with variable uptime. Response shape is assumed: `data?.result?.[0]?.score ?? data?.score`
- **Guard**: Returns null on any failure → falls to Level 2
- **Status**: Intermittent — falls to cache or GROQ, but GROQ returns estimated values with low precision

### INT-03 — CPCB `data.gov.in` rate-limited / city name mismatch
- **File**: `aqi.service.js:139–175`
- **Issue**: City name passed is derived from property name or Nominatim `display_name` splitting. City names with typos, alternate spellings, or non-English characters fail the `filters[city]` match. Also `data.gov.in` is known to rate-limit and return 429/503
- **Guard**: `if (!res.ok) return null` (handled)
- **Actual**: City name mismatch silently returns empty `records` → fallback to Level 4

### INT-04 — Google Places: ZERO_RESULTS treated as success, REQUEST_DENIED treated as failure
- **File**: `places.service.js:44`
- **Issue**: `if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') return []` — ZERO_RESULTS returns empty array (correct). But `REQUEST_DENIED` (expired/invalid key, billing not enabled) also returns `[]` silently
- **Impact**: With an invalid GOOGLE_PLACES_API_KEY, all 7 amenity types return `[]` → `hasAny = false` → falls to cluster cache → may hit FAIL-03
- **Status**: Silent API key failure masquerading as no results

### INT-05 — GROQ noise estimation with no amenity context
- **File**: `noise.service.js:89–91`
- **Issue**: `deriveNearbyPlaceTypes(cluster?.cachedAmenities)` — if cluster is brand-new (first search in area), `cachedAmenities` is null → `nearbyPlaceTypes = []` → defaults to `['residential']`
- **Impact**: GROQ noise estimate has minimal context, likely returns ~50–55dB regardless of actual urban density
- **Status**: Intermittent — only affects first search per cluster

### INT-06 — Nominatim rate limiting (1 req/sec policy)
- **File**: `aqi.service.js:70`, `weather.service.js:22`, `analyze.routes.js:38`
- **Issue**: Nominatim enforces a 1 request/second rate limit. Three separate Nominatim calls happen per session (geocode in AQI, geocode in weather, reverse geocode in analyze). Under concurrent load, 429 responses silently return null → state-level fallbacks trigger
- **Status**: Intermittent under load — handled by null returns but degrades to national_default

---

## 4. Missing Fields

| Field | Where Set | Where Used | Status |
|-------|-----------|------------|--------|
| `sp.intelligence.solar.morningScore` | `solar.service.js:55` | `SolarPathCard` (UI) | **Never persisted** — schema missing |
| `sp.intelligence.solar.wfhLightScore` | `solar.service.js:56` | `SolarPathCard` (UI) | **Never persisted** — schema missing |
| `sp.intelligence.solar.acSavingsEstimate` | `solar.service.js:57` | `SolarPathCard` (UI) | **Never persisted** — schema missing |
| `sp.intelligence.solar.solarPanelViability` | `solar.service.js:64` | Report `signals.solar` spread | **Never persisted** — schema missing |
| `sp.intelligence.amenities.restaurants` | `places.service.js:67` | Report spread | **Never persisted** — schema missing |
| `sp.intelligence.amenities.worship` | `places.service.js:67` | Report spread | **Never persisted** — schema missing |
| `sp.intelligence.weather.description` | `weather.service.js:50` | Potential UI use | **Never persisted** — schema missing |
| `sp.intelligence.localNews.updatedAt` | — | Cache freshness | **Never written** — no code sets it |
| `groqLabels.aqiLabel` | `groq.service.js` | `report.signals.aqi.label` | May be `undefined` if GROQ partial |
| `groqLabels.solarLabel` | `groq.service.js` | `report.signals.solar.label` | May be `undefined` if GROQ partial |
| `groqLabels.commuteLabel` | `groq.service.js` | `report.signals.commute.label` | May be `undefined` if GROQ partial |
| `groqLabels.amenityLabel` | `groq.service.js` | `report.signals.amenities.label` | May be `undefined` if GROQ partial |
| `groqLabels.financialNote` | `groq.service.js` | `report.financialNote` (sale) | May be `undefined` if GROQ partial |
| `groqLabels.rentalNote` | `groq.service.js` | `report.financialNote` (rent) | May be `undefined` if GROQ partial |

---

## 5. Potential Race Conditions

### RACE-01 — Report generation polled before pipeline completes
- **Flow**: `runPipeline` is fire-and-forget (`analyze.routes.js:121`). Frontend polls `/report/generate` while pipeline runs
- **Guard**: `if (sp.status === 'fetching') return res.json({ status: 'pending', retryAfter: 3 })` — `report.routes.js:98`
- **Risk**: If pipeline crashes mid-run (e.g., unhandled error in one of the 6 parallel fetches), ShadowProperty status stays `'fetching'` **forever** — there is no timeout or failure state. The status enum only has `['fetching', 'completed']` — no `'failed'`
- **Result**: Frontend receives `{ status: 'pending', retryAfter: 3 }` indefinitely, report never loads
- **Note**: The schema comment at `ShadowProperty.js:82` says "'failed' status does not exist — pipeline always completes via waterfall" but this is only true if the waterfall itself doesn't throw

### RACE-02 — `userProvidedSpecs` not set when pipeline runs
- **Flow**: Pipeline starts immediately after property confirmation. `userProvidedSpecs` (listingType, budgetBracket, bhk, floor) is set separately via `POST /analyze/:sessionId/context` (Step 8 of funnel, later)
- **Risk**: Pipeline runs with `sp.userProvidedSpecs = {}`. If report is generated before Step 8 completes, `sp.userProvidedSpecs.listingType` is `undefined`
- **Impact**: `budgetVerdict` silently defaults to rent brackets. `computeFinancialScores` uses fallback income. No error thrown

### RACE-03 — Concurrent report generation writes duplicate `reportHistory`
- **Flow**: `User.findByIdAndUpdate` with `$push: { reportHistory: ... }` — `report.routes.js:191`
- **Risk**: If user rapidly double-taps "generate report", two concurrent requests both pass the Redis cache miss (cache not yet written), both generate the report, both push to `reportHistory`, and both set the Redis cache
- **Result**: Duplicate `reportHistory` entries for same `sessionId`, double billing potential
- **Guard**: None — no idempotency lock

---

## 6. Timeout-Prone Operations

| Operation | File | Timeout | Risk |
|-----------|------|---------|------|
| GROQ labels call (D7) | `groq.service.js:24` | **NONE** | Highest — blocks entire report response |
| OpenAQ fetch (B3) | `aqi.service.js:89` | 5000ms | Medium — pipeline parallel, ok |
| CPCB fetch (B5) | `aqi.service.js:143` | 5000ms | Medium — `data.gov.in` known to be slow |
| HowLoud fetch (B9) | `noise.service.js:34` | 5000ms | Medium — HTTP, not HTTPS, slower |
| GROQ noise estimate (B12) | `noise.service.js:107` | 8000ms | Low — pipeline only |
| Open-Meteo fetch (B15) | `solar.service.js:39` | 5000ms | Low — free tier, usually fast |
| Google Places ×7 parallel (B22) | `places.service.js:38` | 5000ms | Medium — 7 parallel, all must complete |
| GNews fetch (B26) | `news.service.js:75` | 6000ms | Medium — may quota-limit |
| NewsAPI fetch (B27) | `news.service.js:107` | 6000ms | Medium |
| Google RSS fetch (B28) | `news.service.js:137` | 6000ms | Low |
| Nominatim ×3 calls | Various | 5000ms each | Medium — rate limited |
| `Cluster.find({})` full scan (A2) | `clusterService.js:48` | Mongoose default | Grows with cluster count |

**Worst-case pipeline duration (all Level 1s fail, all waterfalls run)**:
- AQI: OpenAQ (5s) + Nominatim (5s) + CPCB (5s) = 15s sequential inside `fetchAQI`
- Noise: HowLoud (5s) + GROQ (8s) = 13s sequential
- Solar: Open-Meteo (5s) = 5s
- Weather: OpenWeatherMap (5s) + Nominatim (5s) = 10s sequential
- Amenities: Google Places ×7 (5s parallel) = 5s
- News: Redis miss + GNews (6s) + NewsAPI (6s) + RSS (6s) = 18s sequential

Since pipeline runs in `Promise.all`, worst-case = max of all branches = **~18 seconds**. In practice this is usually 3–8 seconds.

---

## 7. Silent Failures

### SF-01 — `getOrFetchClusterSignal` returns `source: 'live'` for Redis-cached data
- **File**: `intelligencePipeline.service.js:56–59`
```js
return { ...parsed, source: 'live' };  // wrong — should be 'redis' or 'cache'
```
- **Impact**: `sp.dataSource.aqi/solar/weather` always shows `'live'` even when served from Redis. Monitoring, debugging, and trust scoring are incorrect

### SF-02 — `session:{sessionId}:intelligence` Redis key written but never read
- **File**: `intelligencePipeline.service.js:159–165` (write) vs. `report.routes.js` (reads `sp.intelligence` from MongoDB, not this key)
- **Impact**: Redis memory consumed by keys that are never read. Report always makes a MongoDB read even when this Redis key could serve it

### SF-03 — `validateGroqOutput` returns partial object without checking required keys
- **File**: `groqValidator.service.js:22–61`
- **Issue**: Only strips disallowed keys. Does not verify all required label keys are present
- **Impact**: If GROQ returns only `{ noiseLabel, matchKeywords }`, the validator returns it as valid. Report generation uses the partial object; `aqiLabel`, `solarLabel` etc. become `undefined` in the report. Template fallback (`buildTemplateReport`) is NOT triggered because `validateGroqOutput` returned non-null
- **This bypasses the entire anti-hallucination fallback for partial responses**

### SF-04 — `budgetVerdict` silently passes when `budgetBracket` is `undefined`
- **File**: `verdictEngine.service.js:79–86`
- **Issue**: `brackets.indexOf(undefined)` = `-1`. Since `-1 > userIdx + 1` is false and `-1 > userIdx` is false, always returns `'pass'`
- **Impact**: Any session where Step 8 (`/analyze/:sessionId/context`) was not completed gets a `'pass'` budget verdict regardless of the actual affordability mismatch

### SF-05 — `assignCluster` full table scan with no geo index
- **File**: `clusterService.js:48`
```js
const allClusters = await Cluster.find({});  // no filter, no limit
```
- **Impact**: As cluster count grows (each unique 0.01° lat/lng cell), this query returns and iterates all of them in Node.js memory. No geo index. Latency grows linearly with cluster count. Silent — no error, just slow

### SF-06 — AQI double Nominatim call even on CPCB success
- **File**: `aqi.service.js:192–204`
- **Issue**: When `cityName` is already provided, `reverseGeocodeState` is still called (for state lookup), BEFORE CPCB is attempted. If CPCB succeeds, the state result is never used — the Nominatim call was wasted
- **Impact**: +5 seconds (potentially) blocked on Nominatim on every AQI waterfall that has cityName but falls past OpenAQ

### SF-07 — `getFallbackSignal('AQI')` always uses `national_default`
- **File**: `intelligencePipeline.service.js:119`
```js
const value = typeof getSeasonalAQI === 'function' ? getSeasonalAQI(null) : 80;
```
- `null` is passed as stateName → `getSeasonalAQI` returns national_default
- **Impact**: When `getOrFetchClusterSignal` hits its own fallback (vs. `fetchAQI`'s fallback), it always returns national_default AQI even for states with very different profiles (e.g., Kerala = 30–45 vs. national_default = 58–120)

### SF-08 — `fetchNoise` called without `floorLevel` in pipeline
- **File**: `intelligencePipeline.service.js:94`
```js
const result = await fetchNoise(lat, lng, clusterId);  // no floorLevel
```
- Signature: `fetchNoise(lat, lng, clusterId, floorLevel = 'Unknown')`
- **Impact**: GROQ noise estimator always receives `floorLevel: 'Unknown'`, losing the floor hint from `userProvidedSpecs.floor` (which is collected in Step 4 but not passed). Note: floor is only set after pipeline runs, so this may be by design, but it means GROQ estimates are always less accurate

### SF-09 — Missing states in `WEATHER_STATE_NAME_MAP`
- **File**: `cityWeatherAverages.js:82–94`
- **Missing**: Rajasthan, West Bengal, Telangana, Andhra Pradesh (all present in AQI map)
- **Impact**: Weather for properties in these 4 states always uses `national_default` instead of accurate seasonal averages

---

## 8. Suggested Fixes (NOT Implemented)

These are observations only. No code changes made.

### Fix for FAIL-01 — Add timeout to GROQ report call
- Wrap `fetch(...)` in `groq.service.js:24` with an `AbortController` (15–20 second timeout)
- `callGroq` already returns `null` on error; the rest of the chain handles it correctly

### Fix for FAIL-02 — Null-guard preference steps in `computeAllVerdicts`
- Add optional chaining or early null checks before accessing `p.step3`, `p.step4`, `p.step5`, `p.step1`, `p.step7`
- Return safe defaults or throw a typed error that can be caught by the report generator

### Fix for FAIL-03 — Normalize field name in cluster amenity cache
- Either: change `Cluster.cachedAmenities` schema to use `distanceM` instead of `distance`
- Or: in `fetchFromClusterCache` (places.service.js), remap each item `{ ...item, distanceM: item.distance }`

### Fix for FAIL-04 / FAIL-05 / FAIL-06 — Extend ShadowProperty intelligence schema
- Add `morningScore`, `wfhLightScore`, `acSavingsEstimate`, `solarPanelViability` to `intelligence.solar`
- Add `restaurants` and `worship` arrays to `intelligence.amenities`
- Add `description: String` to `intelligence.weather`

### Fix for RACE-01 — Add pipeline failure state
- Add `'failed'` to ShadowProperty status enum
- Wrap `runPipeline` body in try/catch that sets `status: 'failed'` on any unhandled error
- Report generation should return a distinct response for `status: 'failed'`

### Fix for RACE-03 — Idempotency for report generation
- Check for existing `reportHistory` entry before pushing: `$addToSet` instead of `$push`, or check and skip if entry with same `sessionId` exists

### Fix for SF-01 — Correct cache source label
- In `getOrFetchClusterSignal` Redis hit path: return `{ ...parsed, source: 'redis' }` (or `'cache'`)

### Fix for SF-02 — Use session intelligence Redis key in report generation
- Read `session:{sessionId}:intelligence` from Redis before falling back to MongoDB

### Fix for SF-03 — Validate required keys in `validateGroqOutput`
- After stripping disallowed keys, verify that all required label keys are present; return `null` if any required key is missing (triggers template fallback)

### Fix for SF-04 — Guard undefined `budgetBracket`
- In `budgetVerdict`, if `propIdx === -1`, return `'caution'` or explicitly handle missing bracket

### Fix for SF-05 — Add geo index to Cluster
- Add `{ centroidLat: 1, centroidLng: 1 }` compound index and use a `$geoNear` or bounding-box query in `assignCluster` instead of full scan

### Fix for SF-07 — Pass state name to `getFallbackSignal`
- Thread `cityName` or `stateName` into `getOrFetchClusterSignal` and pass it to `getFallbackSignal`

### Fix for SF-09 — Complete WEATHER_STATE_NAME_MAP
- Add Rajasthan, West Bengal, Telangana, Andhra Pradesh entries (data already exists in `CITY_AQI_AVERAGES` for reference)

---

## Issue Priority Matrix

| ID | Severity | Type | User-Visible Impact |
|----|----------|------|---------------------|
| FAIL-01 | **CRITICAL** | Hang | Report never loads (GROQ slow) |
| FAIL-02 | **CRITICAL** | Crash | Report returns 500 (partial funnel) |
| FAIL-03 | **HIGH** | Wrong data | Amenity verdict incorrect from cache |
| FAIL-04 | **HIGH** | Missing data | Solar card shows empty fields |
| FAIL-05 | **HIGH** | Missing data | No restaurants/worship in report |
| RACE-01 | **HIGH** | Stuck state | Report stuck on "pending" forever |
| SF-03 | **HIGH** | Wrong data | Report labels missing (no fallback triggered) |
| SF-04 | **MEDIUM** | Wrong verdict | Budget always "pass" if Step 8 incomplete |
| FAIL-06 | **MEDIUM** | Missing data | Weather description always undefined |
| SF-01 | **MEDIUM** | Wrong metadata | DataSource shows 'live' for cached data |
| SF-02 | **MEDIUM** | Waste | Redis key written, never read |
| RACE-02 | **MEDIUM** | Wrong verdict | Budget/financial wrong if Step 8 races |
| RACE-03 | **LOW** | Duplicate data | Duplicate reportHistory entries |
| INT-02 | **LOW** | Intermittent | Noise falls to estimated more often |
| INT-04 | **LOW** | Silent | Google Places key failure looks like no results |
| SF-05 | **LOW** | Performance | Cluster scan grows with usage |
| SF-06 | **LOW** | Performance | Extra Nominatim call wasted |
| SF-07 | **LOW** | Wrong data | AQI fallback too coarse (national avg) |
| SF-08 | **LOW** | Data quality | GROQ noise estimate always floor-unaware |
| SF-09 | **LOW** | Wrong data | Weather wrong for 4 states |

---

*This file was generated by static code analysis only. No production data was read, no APIs were called, no app files were modified.*
