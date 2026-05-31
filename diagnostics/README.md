# Diagnostics — Report Fetch Audit

This folder contains **read-only** diagnostic output from a static analysis of the report generation pipeline.
No source files were modified.

## Contents

| File | Purpose |
|------|---------|
| `REPORT_FETCH_AUDIT.md` | Full audit: fetch map, failures, race conditions, missing fields, suggested fixes |
| `probe-fetches.mjs` | Standalone runnable probe — tests every external API live (no DB/Redis writes) |

## Running the probe

```sh
# From the repo root, with .env loaded:
node --env-file=.env diagnostics/probe-fetches.mjs
```

The probe uses the same env vars as the app (`OPENAQ_API_KEY`, `GROQ_API_KEY`, etc.).
Missing keys are skipped with a warning rather than crashing.
Test coordinates default to Bengaluru city centre (12.9716, 77.5946).

## What was analysed

18 source files, top-to-bottom, no execution:

- `src/routes/analyze.routes.js`
- `src/routes/report.routes.js`
- `src/routes/funnel.routes.js`
- `src/services/intelligencePipeline.service.js`
- `src/services/verdictEngine.service.js`
- `src/services/aqi.service.js`
- `src/services/noise.service.js`
- `src/services/solar.service.js`
- `src/services/weather.service.js`
- `src/services/places.service.js`
- `src/services/news.service.js`
- `src/services/groq.service.js`
- `src/services/groqValidator.service.js`
- `src/services/reportTemplates.service.js`
- `src/services/clusterService.js`
- `src/models/ShadowProperty.js`
- `src/models/Cluster.js`
- `src/models/User.js`
- `src/lib/redis.js`
- `src/data/cityAQIAverages.js`
- `src/data/cityWeatherAverages.js`
