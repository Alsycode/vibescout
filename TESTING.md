# Testing — environment & isolation

Companion to [PRODUCTION_READINESS_PLAN.md](PRODUCTION_READINESS_PLAN.md) Stage 0 and
[TEST_PROGRESS.md](TEST_PROGRESS.md). This doc covers **how to run the test suites
against a disposable environment**. No production data is ever touched.

---

## TL;DR

```bash
# 1. one-time: provision a throwaway Mongo DB + (optional) Redis namespace
cp .env.test.example .env.test        # then edit values
# 2. run
npm test                              # backend (vitest + supertest)  — added in task 0.3
cd frontend && npm test               # frontend units                — added in task 0.4
cd frontend && npm run test:e2e       # Playwright E2E                 — added in task 0.4
```

The test runner loads `.env.test` and **refuses to start unless `MONGODB_URI`
points at a database whose name contains `_test`** (guard added with the vitest
setup file in task 0.3).

---

## What "isolated" means here

| Resource | Isolation mechanism | Notes |
|---|---|---|
| MongoDB | Separate database `haum_test` (never the dev/prod DB name). Suite drops/recreates collections between runs. | Name **must** contain `_test`. |
| Redis (Upstash) | Either a **second free Upstash database**, or reuse the dev DB with `REDIS_KEY_PREFIX=haum_test:`. | `redisGet`/`redisSet` honour the prefix; `apiUsage.service.js` raw-client keys do **not** — see below. |
| Razorpay | **Test-mode keys only** (`rzp_test_*`). Never live keys in `.env.test` or CI. | Signature/webhook tests use `RAZORPAY_WEBHOOK_SECRET`. |
| Google / Groq / news / AQI / weather | **No real calls.** Outbound HTTP is intercepted by the mock layer (nock / MSW, task 0.7). Keys in `.env.test` are obvious dummies so an un-mocked call fails loudly. | Use a real low-quota throwaway Google key only if you deliberately run a live smoke test. |
| Email (SMTP) | `EMAIL_HOST` unset → `email.service.js` short-circuits. Optionally point at Mailpit to assert on message bodies. | |

### Redis prefix caveat

`src/services/apiUsage.service.js` uses the raw `redis` client (`pipeline`,
`hgetall`, `smembers`) on `apiusage:*` keys and is **not** covered by
`REDIS_KEY_PREFIX`. To keep those counters out of your dev data, either:

- use a dedicated test Upstash database (option a), **or**
- ensure integration tests mock all outbound HTTP (task 0.7) so `recordApiCall`
  is never triggered.

---

## Provisioning

### MongoDB

- **Local:** `mongod` running locally → `MONGODB_URI=mongodb://localhost:27017/haum_test`.
- **Atlas:** reuse the cluster with a distinct DB name:
  `mongodb+srv://<user>:<pass>@<cluster>/haum_test?retryWrites=true&w=majority`.
  A separate low-tier CI cluster is preferable for load isolation but not required for correctness.

### Redis (Upstash)

- **Option a (recommended):** create a second free database in the Upstash console,
  put its REST URL/token in `.env.test`, leave `REDIS_KEY_PREFIX` blank.
- **Option b:** keep the dev URL/token, set `REDIS_KEY_PREFIX=haum_test:`.

### Razorpay

Dashboard → Test Mode → API keys. Copy `rzp_test_*` id/secret into `.env.test`.
For webhook tests, set any string as `RAZORPAY_WEBHOOK_SECRET` and sign fixtures with it.

---

## Seed data

`npm run seed:test` populates the test DB with a fixed fixture set
([`test/seed/seedTestData.js`](test/seed/seedTestData.js), constants in
[`test/fixtures/seedData.js`](test/fixtures/seedData.js)):

| Fixture | Value |
|---|---|
| Admin | `admin@haum.test` |
| Users | `user1@haum.test`, `user2@haum.test` |
| Password (all) | `Test1234!` |
| Completed + unlocked session | `vs_1757000000000_0000005eed01` (owned by user1, in `reportHistory`, in `unlockedReports`) |
| Completed but locked session | `vs_1757000000001_0000005eed02` (no owner, not unlocked — for paywall tests) |
| Share token | `deadbeefdeadbeefdeadbeefdeadbeef` |

- Idempotent (upsert by email / sessionId). `--fresh` wipes `users` + `shadowproperties` first.
- Refuses unless `MONGODB_URI`'s database name contains `_test`; `--force` overrides.
- Importable: `import { seedTestData } from './test/seed/seedTestData.js'` inside a
  suite after `connectTestDb()` — returns `{ users, shadowProperties, credentials }`.

## External API mocking

All outbound HTTP goes through `fetchWithTimeout` (`src/lib/fetchWithTimeout.js`),
so a single nock-based layer covers every provider. Wired globally in
[`test/setup.js`](test/setup.js):

- Real network is **disabled by default** for every backend test — only loopback
  (127.0.0.1 / ::1 / localhost, for supertest) stays open.
- An un-mocked external call throws `NetConnectNotAllowedError` instead of
  silently hitting a real API — a forgotten mock fails the test loudly.
- `nock.cleanAll()` runs after every test so mocks never leak between tests.

Use [`test/mocks/externalApis.js`](test/mocks/externalApis.js):

- `mockAllExternalApis()` — blanket 200-`{}` for every known host; use when a
  test just needs the pipeline not to hang and doesn't assert on the response.
- Per-provider mockers with real response shapes — `mockGroqChatCompletion()`,
  `mockGroqDown()`, `mockGooglePlacesNearbySearch()`, `mockGoogleAirQuality()`,
  `mockOpenAQ()`, `mockNominatim()`, `mockOverpass()` — for tests that assert on
  the actual data or exercise a fallback path.

See [`test/unit/externalApis.mock.test.js`](test/unit/externalApis.mock.test.js)
for the pattern.

## CI

GitHub Actions (task 0.6) constructs `.env.test` from repository secrets:
`MONGODB_URI` (a `*_test` DB), `UPSTASH_*` (a dedicated CI Upstash DB),
`JWT_SECRET`, `RAZORPAY_*` test keys. All external HTTP is mocked, so no other
real credentials are needed.

---

## Files

- `.env.test.example` — template, committed.
- `.env.test` — your local values, **git-ignored** (`.env.*.local` and `.env` are
  ignored; `.env.test` is added to `.gitignore` in this task).
