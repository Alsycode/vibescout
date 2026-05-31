/**
 * DIAGNOSTIC PROBE — probe-fetches.mjs
 *
 * Standalone script. Tests every external fetch the pipeline makes.
 * Run with: node diagnostics/probe-fetches.mjs
 *
 * SAFE: reads .env, makes read-only API calls, writes nothing to DB or Redis.
 * Does NOT import from src/ — duplicates minimal fetch logic only.
 *
 * Requires: node-fetch (already in package.json), dotenv
 * Usage:
 *   node --env-file=.env diagnostics/probe-fetches.mjs
 */

import fetch from 'node-fetch';

// ── Test coordinates (Bengaluru city centre) ────────────────────────
const TEST_LAT  = 12.9716;
const TEST_LNG  = 77.5946;
const TEST_CITY = 'Bengaluru';

// ── Helpers ─────────────────────────────────────────────────────────

function env(key) {
  return process.env[key] ?? null;
}

function status(label, ok, note = '') {
  const icon = ok ? '✓' : '✗';
  const pad  = label.padEnd(36);
  console.log(`  ${icon}  ${pad}  ${note}`);
}

async function timed(fn) {
  const t0  = Date.now();
  let result, error;
  try {
    result = await fn();
  } catch (err) {
    error = err;
  }
  return { result, error, ms: Date.now() - t0 };
}

async function fetchJson(url, opts = {}, timeoutMs = 7000) {
  const ctrl = new AbortController();
  const id   = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res  = await fetch(url, { ...opts, signal: ctrl.signal });
    const text = await res.text();
    clearTimeout(id);
    let json = null;
    try { json = JSON.parse(text); } catch {}
    return { ok: res.ok, status: res.status, json, text: text.slice(0, 300) };
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ── Probes ───────────────────────────────────────────────────────────

async function probeOpenAQ() {
  console.log('\n[AQI — Level 1] OpenAQ');
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://api.openaq.org/v2/latest?coordinates=${TEST_LAT},${TEST_LNG}&radius=5000&limit=10`,
      { headers: { 'X-API-Key': env('OPENAQ_API_KEY') ?? '' } },
    )
  );
  const ok = result?.ok && result?.json?.results?.length > 0;
  const count = result?.json?.results?.length ?? 0;
  status('OpenAQ HTTP 200 + results', !!result?.ok, `status=${result?.status} ms=${ms}`);
  status('OpenAQ has sensor results',  ok,           `results=${count}`);
  if (!env('OPENAQ_API_KEY')) status('OPENAQ_API_KEY set', false, 'env var missing');

  const measurements = result?.json?.results?.flatMap(r => r.measurements ?? []);
  const pm25 = measurements?.filter(m => m.parameter === 'pm25' && m.value > 0);
  const pm10 = measurements?.filter(m => m.parameter === 'pm10' && m.value > 0);
  status('PM2.5 readings found', (pm25?.length ?? 0) > 0, `count=${pm25?.length ?? 0}`);
  status('PM10 readings found',  (pm10?.length ?? 0) > 0, `count=${pm10?.length ?? 0}`);
}

async function probeCPCB() {
  console.log('\n[AQI — Level 3] CPCB / data.gov.in');
  if (!env('CPCB_API_KEY')) {
    status('CPCB_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://api.data.gov.in/resource/3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69` +
      `?api-key=${env('CPCB_API_KEY')}&format=json&filters[city]=${TEST_CITY}&limit=10`,
    )
  );
  const ok      = result?.ok;
  const records = result?.json?.records ?? [];
  status('CPCB HTTP 200',         ok,                  `status=${result?.status} ms=${ms}`);
  status('CPCB has records',      records.length > 0,  `count=${records.length}`);
  status('AQI record present',    records.some(r => r.pollutant_id === 'AQI'),    '');
  status('PM2.5 record present',  records.some(r => r.pollutant_id === 'PM2.5'), '');
}

async function probeNominatim() {
  console.log('\n[Geocoding] Nominatim (used by AQI + Weather + Analyze)');
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${TEST_LAT}&lon=${TEST_LNG}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'Vibescout/1.0 (diagnostic-probe)' } },
    )
  );
  const ok    = result?.ok;
  const addr  = result?.json?.address;
  status('Nominatim HTTP 200',   ok,                      `status=${result?.status} ms=${ms}`);
  status('state field present',  !!addr?.state,           `state="${addr?.state}"`);
  status('city field present',   !!(addr?.city ?? addr?.town), `city="${addr?.city ?? addr?.town}"`);
}

async function probeHowLoud() {
  console.log('\n[Noise — Level 1] HowLoud');
  if (!env('HOWLOUD_API_KEY')) {
    status('HOWLOUD_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const { result, ms } = await timed(() =>
    fetchJson(
      `http://elb1.howloud.com/score?key=${env('HOWLOUD_API_KEY')}&latitude=${TEST_LAT}&longitude=${TEST_LNG}`,
    )
  );
  const ok    = result?.ok;
  const score = result?.json?.result?.[0]?.score ?? result?.json?.score ?? null;
  status('HowLoud HTTP 200',    ok,                               `status=${result?.status} ms=${ms}`);
  status('score field present', score !== null,                   `score=${score}`);
  status('score in range 50–100', score !== null && score >= 50 && score <= 100, `score=${score}`);
  if (score !== null) {
    const estimatedDb = 110 - score;
    status(`estimated dB`, true, `${estimatedDb}dB`);
  }
  console.log('  NOTE: HowLoud uses plain HTTP (not HTTPS)');
}

async function probeGroqNoise() {
  console.log('\n[Noise — Level 3 / Labels] GROQ API');
  if (!env('GROQ_API_KEY')) {
    status('GROQ_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const { result, ms } = await timed(() =>
    fetchJson(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env('GROQ_API_KEY')}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          max_tokens: 50,
          temperature: 0.1,
          messages: [
            { role: 'system', content: 'Return ONLY valid JSON: {"estimatedDb": number}' },
            { role: 'user',   content: JSON.stringify({ nearbyPlaceTypes: ['residential'], floorLevel: '1–3', roadProximity: 'local_road' }) },
          ],
        }),
      },
      12000,  // 12s to catch the no-timeout issue
    )
  );
  const ok      = result?.ok;
  const content = result?.json?.choices?.[0]?.message?.content ?? null;
  status('GROQ HTTP 200',           ok,              `status=${result?.status} ms=${ms}`);
  status('content field present',   content !== null, `content="${content?.slice(0, 80)}"`);
  if (content) {
    let parsed = null;
    try { parsed = JSON.parse(content.replace(/```json|```/g, '').trim()); } catch {}
    status('JSON parseable',          parsed !== null, '');
    status('estimatedDb is number',   typeof parsed?.estimatedDb === 'number', `estimatedDb=${parsed?.estimatedDb}`);
  }
  if (ms > 8000) console.log(`  WARN: GROQ took ${ms}ms — report generation (no timeout) would block longer`);
}

async function probeOpenMeteo() {
  console.log('\n[Solar — Level 1] Open-Meteo');
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${TEST_LAT}&longitude=${TEST_LNG}&hourly=direct_radiation&timezone=Asia%2FKolkata&forecast_days=1`,
    )
  );
  const ok         = result?.ok;
  const radiation  = result?.json?.hourly?.direct_radiation;
  const peakHours  = Array.isArray(radiation) ? radiation.filter(r => r > 200).length : null;
  status('Open-Meteo HTTP 200',        ok,                                `status=${result?.status} ms=${ms}`);
  status('hourly.direct_radiation',    Array.isArray(radiation),          `length=${radiation?.length}`);
  status('peak sun hours computed',    peakHours !== null,                `peakSunHours=${peakHours}`);
}

async function probeOpenWeatherMap() {
  console.log('\n[Weather — Level 1] OpenWeatherMap');
  if (!env('OPENWEATHER_API_KEY')) {
    status('OPENWEATHER_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://api.openweathermap.org/data/2.5/weather?lat=${TEST_LAT}&lon=${TEST_LNG}&appid=${env('OPENWEATHER_API_KEY')}&units=metric`,
    )
  );
  const ok  = result?.ok;
  const d   = result?.json;
  status('OWM HTTP 200',            ok,                      `status=${result?.status} ms=${ms}`);
  status('main.temp present',       d?.main?.temp != null,   `temp=${d?.main?.temp}`);
  status('main.humidity present',   d?.main?.humidity != null, `humidity=${d?.main?.humidity}`);
  status('weather[0].description',  !!d?.weather?.[0]?.description, `desc="${d?.weather?.[0]?.description}"`);
}

async function probeGooglePlaces() {
  console.log('\n[Amenities — Level 1] Google Places Nearby Search');
  if (!env('GOOGLE_PLACES_API_KEY')) {
    status('GOOGLE_PLACES_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${TEST_LAT},${TEST_LNG}&radius=3000&type=hospital&key=${env('GOOGLE_PLACES_API_KEY')}`,
    )
  );
  const ok      = result?.ok;
  const apiStat = result?.json?.status;
  const results = result?.json?.results ?? [];
  status('Google Places HTTP 200',  ok,                         `status=${result?.status} ms=${ms}`);
  status('API status OK/ZERO',      apiStat === 'OK' || apiStat === 'ZERO_RESULTS', `api_status=${apiStat}`);
  if (apiStat === 'REQUEST_DENIED') {
    status('API key valid (NOT denied)', false, `error="${result?.json?.error_message}"`);
  }
  status('has results', results.length > 0, `count=${results.length}`);
  if (results[0]) {
    const loc = results[0].geometry?.location;
    const hasName = !!results[0].name;
    const hasLoc  = loc?.lat != null && loc?.lng != null;
    status('result has name',     hasName, `name="${results[0].name}"`);
    status('result has geometry', hasLoc,  `lat=${loc?.lat} lng=${loc?.lng}`);
  }

  // Check the distanceM field mismatch warning
  console.log('  DIAGNOSTIC: field name mismatch check');
  console.log('  → places.service writes both distanceM and distance to live results');
  console.log('  → Cluster.cachedAmenities schema only has distance (not distanceM)');
  console.log('  → verdictEngine reads distanceM from sp.intelligence.amenities');
  console.log('  → When amenities come from cluster cache, distanceM = undefined → 9999');
}

async function probeGNews() {
  console.log('\n[News — Level 1] GNews.io');
  if (!env('GNEWS_API_KEY')) {
    status('GNEWS_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(TEST_CITY + ' real estate')}&lang=en&country=in&max=10&from=${sevenDaysAgo}`,
      { headers: { 'X-API-Key': env('GNEWS_API_KEY') } },
    )
  );
  const ok  = result?.ok;
  const art = result?.json?.articles ?? [];
  status('GNews HTTP 200',        ok,              `status=${result?.status} ms=${ms}`);
  status('has articles',          art.length > 0,  `count=${art.length}`);
  if (art[0]) {
    status('article has title',   !!art[0].title,  `title="${art[0].title?.slice(0,40)}..."`);
    status('article has url',     !!art[0].url,    '');
  }
}

async function probeNewsAPI() {
  console.log('\n[News — Level 2] NewsAPI.org');
  if (!env('NEWSAPI_API_KEY')) {
    status('NEWSAPI_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(TEST_CITY + ' property')}&language=en&sortBy=publishedAt&pageSize=10`,
      { headers: { 'X-Api-Key': env('NEWSAPI_API_KEY') } },
    )
  );
  const ok  = result?.ok;
  const art = result?.json?.articles ?? [];
  status('NewsAPI HTTP 200',  ok,              `status=${result?.status} ms=${ms}`);
  status('has articles',      art.length > 0,  `count=${art.length}`);
}

async function probeGoogleRSS() {
  console.log('\n[News — Level 3] Google News RSS');
  const { result, ms } = await timed(() =>
    fetchJson(
      `https://news.google.com/rss/search?q=${encodeURIComponent(TEST_CITY + ' real estate property')}&hl=en-IN&gl=IN&ceid=IN:en`,
      {},
      8000,
    )
  );
  const ok  = result?.ok;
  const xml = result?.text ?? '';
  const hasItems = xml.includes('<item>');
  status('Google RSS HTTP 200', ok,       `status=${result?.status} ms=${ms}`);
  status('has <item> elements', hasItems, `found=${xml.match(/<item>/g)?.length ?? 0}`);
}

async function probeGroqReport() {
  console.log('\n[Report Labels] GROQ report call (checks no-timeout bug)');
  if (!env('GROQ_API_KEY')) {
    status('GROQ_API_KEY set', false, 'env var missing — skip');
    return;
  }
  const mockFactSheet = {
    noiseVerdict: 'pass', aqiVerdict: 'caution', solarVerdict: 'pass',
    amenityVerdict: 'red_flag', commuteVerdict: 'pass', budgetVerdict: 'pass',
    estimatedDb: 55, aqiValue: 120, peakSunHours: 5.5,
    nearestHospitalM: 2800, nearestSchoolM: 400,
    totalRedFlags: 1, totalCautions: 1, totalPasses: 4,
    listingType: 'rent', wfhStatus: 'hybrid',
    newsHeadlines: ['City rents rise 8% in Q1'], newsCount: 1,
  };

  const t0 = Date.now();
  let hung = false;
  const hangTimer = setTimeout(() => { hung = true; }, 15000);

  const { result, ms } = await timed(() =>
    fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env('GROQ_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        max_tokens: 500,
        temperature: 0.1,
        messages: [
          { role: 'system', content: 'Return ONLY valid JSON with keys: noiseLabel, aqiLabel, solarLabel, amenityLabel, budgetLabel, commuteLabel, rentalNote, matchKeywords, verdict, newsLabel' },
          { role: 'user', content: JSON.stringify(mockFactSheet) },
        ],
      }),
    }).then(r => r.json())
  );

  clearTimeout(hangTimer);
  const content = result?.choices?.[0]?.message?.content ?? null;
  status('GROQ report call returned', !!result,   `ms=${ms}`);
  status('content present',           !!content,  `length=${content?.length}`);

  if (ms > 10000) {
    status('WARN: call took >10s (no timeout in callGroq)', false, `ms=${ms} — will block report generation`);
  }

  if (content) {
    let parsed = null;
    try { parsed = JSON.parse(content.replace(/```json|```/g, '').trim()); } catch {}
    const requiredKeys = ['noiseLabel','aqiLabel','solarLabel','amenityLabel','budgetLabel','commuteLabel','rentalNote','matchKeywords','verdict','newsLabel'];
    status('JSON parseable', parsed !== null, '');
    if (parsed) {
      for (const k of requiredKeys) {
        status(`key "${k}" present`, k in parsed, parsed[k] === undefined ? 'UNDEFINED' : `"${String(parsed[k]).slice(0,40)}"`);
      }
    }
  }

  // Demonstrate the partial-output validator gap
  console.log('\n  DIAGNOSTIC: partial GROQ output gap (SF-03)');
  console.log('  → validateGroqOutput strips unknown keys but does NOT check all required keys exist');
  console.log('  → A partial GROQ response will pass validation and produce undefined labels in the report');
}

// ── Schema mismatch checks (static, no network) ───────────────────────

function checkSchemaGaps() {
  console.log('\n[Static Analysis] Schema field gaps');

  const solarReturned  = ['peakSunHours','morningScore','wfhLightScore','acSavingsEstimate','solarPanelViability','viability','source'];
  const solarPersisted = ['peakSunHours','viability','source'];
  const solarDropped   = solarReturned.filter(f => !solarPersisted.includes(f));
  status('solar: all fields persisted', solarDropped.length === 0, `DROPPED: ${solarDropped.join(', ')}`);

  const amenitiesReturned  = ['schools','hospitals','parks','gyms','cafes','restaurants','worship','source'];
  const amenitiesPersisted = ['schools','hospitals','parks','gyms','cafes','source'];
  const amenDropped        = amenitiesReturned.filter(f => !amenitiesPersisted.includes(f));
  status('amenities: all types persisted', amenDropped.length === 0, `DROPPED: ${amenDropped.join(', ')}`);

  const weatherReturned  = ['temp','humidity','description','source'];
  const weatherPersisted = ['temp','humidity','source'];
  const weatherDropped   = weatherReturned.filter(f => !weatherPersisted.includes(f));
  status('weather: all fields persisted', weatherDropped.length === 0, `DROPPED: ${weatherDropped.join(', ')}`);

  // distanceM vs distance check
  console.log('\n  Amenity distance field mismatch:');
  console.log('  places.service.js writes: { distanceM, distance }');
  console.log('  Cluster.cachedAmenities schema has: { distance } (no distanceM)');
  console.log('  verdictEngine reads: intel.amenities.schools[0]?.distanceM');
  status('distanceM available from cluster cache', false, 'MISMATCH — always undefined → 9999m');

  // Redis source label bug
  console.log('\n  Redis cache source label:');
  console.log('  getOrFetchClusterSignal returns: { ...parsed, source: "live" } on Redis hit');
  status('Redis-cached signal labelled correctly', false, 'returns source:"live" should be "cache"');
}

function checkTimeoutCoverage() {
  console.log('\n[Static Analysis] Timeout coverage');
  const calls = [
    { name: 'OpenAQ (AQI L1)',            timeout: '5000ms', ok: true  },
    { name: 'Nominatim AQI (state)',       timeout: '5000ms', ok: true  },
    { name: 'CPCB data.gov.in (AQI L3)',   timeout: '5000ms', ok: true  },
    { name: 'HowLoud (Noise L1)',          timeout: '5000ms', ok: true  },
    { name: 'GROQ noise estimate (L3)',    timeout: '8000ms', ok: true  },
    { name: 'Open-Meteo (Solar L1)',       timeout: '5000ms', ok: true  },
    { name: 'OpenWeatherMap (Weather L1)', timeout: '5000ms', ok: true  },
    { name: 'Nominatim weather (state)',   timeout: '5000ms', ok: true  },
    { name: 'Google Places ×7 (Amenity)', timeout: '5000ms', ok: true  },
    { name: 'GNews (News L1)',             timeout: '6000ms', ok: true  },
    { name: 'NewsAPI (News L2)',           timeout: '6000ms', ok: true  },
    { name: 'Google RSS (News L3)',        timeout: '6000ms', ok: true  },
    { name: 'GROQ report labels (D7)',     timeout: 'NONE ⚠', ok: false },
    { name: 'Google Places Details (A1)', timeout: 'NONE ⚠', ok: false },
  ];
  for (const c of calls) {
    status(c.name, c.ok, `timeout=${c.timeout}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────

console.log('═══════════════════════════════════════════════════════');
console.log(' Vibescout Report Pipeline — Fetch Probe');
console.log(` Test coordinates: ${TEST_LAT}, ${TEST_LNG} (${TEST_CITY})`);
console.log(' NOTE: Results are for diagnostic purposes only.');
console.log('       No DB writes, no cache writes, no app changes.');
console.log('═══════════════════════════════════════════════════════');

await probeNominatim();
await probeOpenAQ();
await probeCPCB();
await probeHowLoud();
await probeGroqNoise();
await probeOpenMeteo();
await probeOpenWeatherMap();
await probeGooglePlaces();
await probeGNews();
await probeNewsAPI();
await probeGoogleRSS();
await probeGroqReport();

checkSchemaGaps();
checkTimeoutCoverage();

console.log('\n═══════════════════════════════════════════════════════');
console.log(' Probe complete. See diagnostics/REPORT_FETCH_AUDIT.md');
console.log('═══════════════════════════════════════════════════════\n');
