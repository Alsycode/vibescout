# Vibescout — Production Deployment Guide

## Overview

| Component | Platform | URL |
|-----------|----------|-----|
| Frontend | Vercel | `vibescout.com` |
| Backend API | Ubuntu 22.04 VPS (PM2) | `api.vibescout.com` |
| Database | MongoDB Atlas | M0 free tier |
| Cache | Upstash Redis | REST API |

---

## 1. Infrastructure Setup

### 1.1 VPS — Ubuntu 22.04

Provision a Ubuntu 22.04 VPS (DigitalOcean, Linode, Hetzner, or equivalent). Minimum 1 GB RAM.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install build tools
sudo apt install -y git build-essential curl

# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js 22 LTS
nvm install 22
nvm use 22
nvm alias default 22
node --version   # should print v22.x.x

# Install PM2 globally
npm install -g pm2
```

### 1.2 MongoDB Atlas

1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a new **M0** (free tier) cluster
3. Create database: `vibescout`
4. Create a database user with read/write access
5. Add your VPS IP to the IP allowlist (or `0.0.0.0/0` for development)
6. Copy the connection string: `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/vibescout`

### 1.3 Upstash Redis

1. Create a free account at [upstash.com](https://upstash.com)
2. Create a new Redis database (region closest to your VPS)
3. Copy the **REST URL** and **REST Token** from the dashboard

### 1.4 Required API Accounts

Sign up and obtain API keys for all of the following before deployment:

| Service | Purpose | Free tier |
|---------|---------|-----------|
| Google Cloud (Places API) | Geocoding, amenity search, Maps JS | $200/month credit |
| OpenAQ | Live AQI data | Free |
| OpenWeatherMap | Live weather | 1000 calls/day free |
| HowLoud | Noise score | Contact for key |
| GROQ | AI label generation | Free tier |
| GNews.io | Local news headlines | 100 calls/day free |
| NewsAPI.org | News fallback | 100 calls/day free (dev) |
| data.gov.in | CPCB AQI city average | Free (register for key) |

---

## 2. MongoDB Index Creation

Create these indexes manually after the database is first connected. Run via MongoDB Atlas UI (Data Explorer → Collection → Indexes) or via `mongosh`:

```js
// shadowproperties
db.shadowproperties.createIndex({ sessionId: 1 }, { unique: true });
db.shadowproperties.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL — CRITICAL

// clusters
db.clusters.createIndex({ clusterId: 1 }, { unique: true });

// users
db.users.createIndex({ email: 1 }, { unique: true });

// leads
db.leads.createIndex({ sessionId: 1 }, { unique: true });
db.leads.createIndex({ scoreTier: 1, listingType: 1 });
db.leads.createIndex({ stage: 1 });

// brokers
db.brokers.createIndex({ email: 1 }, { unique: true });
```

> **Critical:** The TTL index on `shadowproperties.expiresAt` must exist before any data is written. Without it, ShadowProperty documents accumulate indefinitely.

---

## 3. Backend Deployment

### 3.1 Clone and configure

```bash
# Clone repository
git clone <your-repo-url> /var/www/vibescout-api
cd /var/www/vibescout-api

# Install dependencies
npm install

# Create .env from example
cp .env.example .env
nano .env   # fill in all values — see Section 5 checklist below
```

### 3.2 Environment variables (backend)

Fill every variable in `/var/www/vibescout-api/.env`:

```env
PORT=3001
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/vibescout
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxx...
GROQ_API_KEY=gsk_...
GOOGLE_PLACES_API_KEY=AIza...
OPENAQ_API_KEY=...
OPENWEATHER_API_KEY=...
HOWLOUD_API_KEY=...
GNEWS_API_KEY=...
NEWSAPI_API_KEY=...
CPCB_API_KEY=your_data_gov_in_api_key_here
JWT_SECRET=<minimum 64 random characters — use: openssl rand -hex 32>
COOKIE_DOMAIN=.vibescout.com
FRONTEND_URL=https://vibescout.com
NODE_ENV=production
```

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

### 3.3 Start with PM2

```bash
cd /var/www/vibescout-api

# Start the API server
pm2 start server.js --name vibescout-api

# Save PM2 process list (survives reboot)
pm2 save

# Configure PM2 to start on system boot
pm2 startup
# Follow the printed command (e.g. sudo env PATH=... pm2 startup systemd ...)
```

Verify it's running:
```bash
pm2 status
pm2 logs vibescout-api --lines 50
```

---

## 4. Seed Data (Run in Order)

After the backend is running and all indexes are created, seed the database. Run from `/var/www/vibescout-api`:

```bash
# Step 1 — Evergreen cluster data (fetches live signals — takes 2–3 minutes)
node scripts/seedClusters.js

# Step 2 — User accounts (user1, user2, admin)
node scripts/seedUsers.js

# Step 3 — Sample ShadowProperty documents (10 properties, no API calls)
node scripts/seedShadowProperties.js

# Step 4 — Sample Lead documents (links to ShadowProperties from step 3)
node scripts/seedLeads.js
```

> `seedClusters.js` makes live API calls (OpenAQ, OpenWeatherMap, Open-Meteo, HowLoud, Google Places) for all 28 evergreen cluster zones. Ensure all API keys are in `.env` before running. Individual signal failures are logged but do not abort the script.

**Seed account credentials:**

| Email | Password | Role |
|-------|----------|------|
| `user1@vibescout.com` | `user1pass` | user |
| `user2@vibescout.com` | `user2pass` | user |
| `admin@vibescout.com` | `adminpass` | admin |

> Change admin password immediately after first login in production.

---

## 5. Nginx Configuration

### 5.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 5.2 API reverse proxy config

```bash
sudo nano /etc/nginx/sites-available/vibescout-api
```

Paste the following:

```nginx
server {
    listen 80;
    server_name api.vibescout.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/vibescout-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5.3 SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx

# Issue certificate (Nginx plugin handles config automatically)
sudo certbot --nginx -d api.vibescout.com

# Certbot auto-renews — verify the timer is active
sudo systemctl status certbot.timer
```

After certbot, your Nginx config will have HTTPS auto-configured. Verify:
```bash
curl https://api.vibescout.com/health
# Expected: {"ok":true} or similar
```

---

## 6. Frontend Deployment (Vercel)

### 6.1 Deploy

```bash
cd vibescout-frontend

# Install Vercel CLI if needed
npm install -g vercel

# Deploy to production
vercel --prod
```

Follow the prompts to link your project. Vercel auto-detects Next.js.

### 6.2 Environment variables (Vercel)

Set these in the **Vercel dashboard → Project → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.vibescout.com` |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | `AIza...` (same Google Cloud key, Maps JS API enabled) |

> `NEXT_PUBLIC_` prefix is required — Next.js only exposes variables with this prefix to the browser.

### 6.3 Custom domain

In Vercel dashboard → Domains:
- Add `vibescout.com` → point DNS A record to Vercel's IP
- Add `www.vibescout.com` → CNAME to `cname.vercel-dns.com`

In your DNS provider, also set:
- `api.vibescout.com` → A record pointing to your VPS IP

---

## 7. Env Var Checklist

### Backend `.env` — all required

- [ ] `PORT` — 3001
- [ ] `MONGODB_URI` — Atlas connection string with `/vibescout` database
- [ ] `UPSTASH_REDIS_REST_URL` — Upstash REST endpoint
- [ ] `UPSTASH_REDIS_REST_TOKEN` — Upstash REST token
- [ ] `GROQ_API_KEY` — starts with `gsk_`
- [ ] `GOOGLE_PLACES_API_KEY` — Places API + Geocoding API enabled
- [ ] `OPENAQ_API_KEY` — OpenAQ v2
- [ ] `OPENWEATHER_API_KEY` — OpenWeatherMap current weather
- [ ] `HOWLOUD_API_KEY` — HowLoud noise score API
- [ ] `GNEWS_API_KEY` — GNews.io
- [ ] `NEWSAPI_API_KEY` — NewsAPI.org
- [ ] `CPCB_API_KEY` — data.gov.in API key
- [ ] `JWT_SECRET` — minimum 64 characters, high entropy
- [ ] `COOKIE_DOMAIN` — `.vibescout.com` (leading dot for cross-subdomain)
- [ ] `FRONTEND_URL` — `https://vibescout.com` (no trailing slash)
- [ ] `NODE_ENV` — `production`

### Vercel environment variables — all required

- [ ] `NEXT_PUBLIC_API_URL` — `https://api.vibescout.com`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_KEY` — Google Maps JS API key

---

## 8. Smoke Tests

Run all 8 tests after deployment to verify the full system is operational.

### Test 1 — Pipeline fires on property search
1. Open `https://vibescout.com/analyze`
2. Search "Koramangala, Bangalore" → select from autocomplete → confirm pin
3. Expected: redirected to `/funnel?sessionId=xxx`
4. Verify: `pm2 logs vibescout-api` shows `[Pipeline] Started` then `[Pipeline] Complete` within 60s

### Test 2 — Full funnel → report, no hallucinations
1. Log in as `user1@vibescout.com`
2. Complete all 8 funnel steps for a Koramangala sale property
3. Expected: report renders with a headline that contains no hallucinated city names
4. Verify: GROQ labels reference only values from the factSheet (noise dB, AQI, commute minutes)

### Test 3 — Share link works without login
1. On the report page, click "Copy share link"
2. Open the copied URL (`/report/xxx?share=TOKEN`) in an incognito window
3. Expected: report renders fully, read-only (no SharePDFBar visible)
4. Verify: no JWT cookie is sent; backend validates via shareToken only

### Test 4 — Owner report loads from reportHistory
1. Log in as `user1@vibescout.com`
2. Navigate to a report URL (`/report/xxx`) without the `?share=` param
3. Expected: full report renders with SharePDFBar visible
4. Verify in MongoDB Atlas: `users` collection → `reportHistory` array contains the entry

### Test 5 — Admin panel — lead created with correct data
1. Log in as `admin@vibescout.com` → navigate to `/admin/leads`
2. Expected: the lead from the completed funnel appears in the table
3. Click the lead → verify `verdictObject`, `scoreBreakdown`, and `dataSource` all populated
4. Verify `scoreTier` matches the `compositeScore` (hot ≥80, warm ≥60, etc.)

### Test 6 — Evergreen clusters show fresh status
1. Log in as admin → navigate to `/admin/clusters`
2. Expected: all 28 evergreen cluster rows show a "Fresh" badge (green)
3. If any show "Stale" or "Cold", re-run `node scripts/seedClusters.js`

### Test 7 — Redis intelligence key written after pipeline
1. Complete a new property analysis (POST /analyze/start)
2. Wait for pipeline to complete (poll status or check PM2 logs)
3. In Upstash dashboard → Data Browser, search for key: `session:<sessionId>:intelligence`
4. Expected: key exists, contains JSON with all 6 signals (aqi, noise, solar, weather, amenities, localNews)
5. Verify TTL is approximately 7200 seconds (2 hours)

### Test 8 — LocalNewsCard shows headlines in report
1. Complete a funnel for a Koramangala or Whitefield property (these are evergreen zones with seeded news)
2. Expected: LocalNewsCard in the report renders at least 1 headline
3. If headlines are empty, verify: `seedClusters.js` ran successfully AND `GNEWS_API_KEY` is valid

---

## 9. Monitoring

### PM2 logs
```bash
# Live log stream
pm2 logs vibescout-api

# Last 200 lines
pm2 logs vibescout-api --lines 200

# Error log only
pm2 logs vibescout-api --err
```

### PM2 process status
```bash
pm2 status
pm2 monit   # interactive CPU/memory monitor
```

### MongoDB Atlas
- Enable **Alerts** in Atlas: connection count > 80, disk usage > 80%
- Enable **Slow Query** profiler (threshold: 100ms) to catch missing indexes

### Upstash Redis
- Monitor **Daily Command Count** in Upstash dashboard (free tier: 10,000 commands/day)
- Set an alert at 80% of daily limit
- Key namespaces to watch:
  - `session:*:intelligence` — pipeline output (EX 7200)
  - `cluster:*:AQI` — AQI cache (EX 86400)
  - `report:*` — rendered report cache (EX 604800)

### GROQ
- Monitor **Token Usage** in [console.groq.com](https://console.groq.com)
- Each report generation consumes ~500 tokens (max_tokens cap)
- Free tier: 6,000 tokens/minute, 500,000 tokens/day

### Nginx access log
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 10. Common Issues & Fixes

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `CORS error` on frontend | `FRONTEND_URL` mismatch | Ensure no trailing slash; must match exactly |
| Cookie not sent | `COOKIE_DOMAIN` wrong | Must be `.vibescout.com` (leading dot) |
| Pipeline never completes | Missing API key | Check PM2 error logs; verify `.env` keys |
| Report always shows template text | GROQ key invalid or rate-limited | Check GROQ console; template fallback is normal |
| TTL index not working | Index not created | Run the `createIndex` command in Section 2 |
| `jwt malformed` errors | Old cookies from dev | Clear browser cookies; ensure `JWT_SECRET` is set |
| Leaflet map blank | Missing CSS import | Confirm `leaflet/dist/leaflet.css` imported in layout |
| Admin shows 403 | User role not admin | Verify seed ran; check `role` field in Atlas |

---

## 11. Phase 2 Readiness

The following hooks are built into Phase 1 and require zero breaking changes to activate:

| Location | What Phase 2 adds |
|----------|-------------------|
| `Lead.auction.*` | Populated when auction is created and resolved |
| `Lead.stage` | Changes `new → listed → sold/expired` |
| `Broker.bidHistory` | Populated by Razorpay per-bid payment events |
| `LeadAuction` model | Bidding engine reads/writes this collection |
| `POST /admin/leads/:id/list-auction` | New route — creates LeadAuction, opens 5-min window |
| `AdminSidebar.jsx` — Auction Market | `opacity-40` removed, becomes active `Link` |
| `server.js` | `app.use('/auction', auctionRoutes)` added |
| `src/models/User.js` | `'broker'` added to role enum |
| `app/(app)/broker-portal/layout.jsx` | Full broker portal UI replaces stub |
