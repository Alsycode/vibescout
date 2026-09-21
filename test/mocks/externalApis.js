// FILE: test/mocks/externalApis.js
// PURPOSE: nock-based mock layer for every third-party host the backend calls, so
//          tests are deterministic and free. Wired globally in test/setup.js:
//          real network is disabled by default (except localhost, for supertest);
//          any un-mocked outbound call throws loudly instead of hitting a real API.

import nock from 'nock';

// Every hostname reachable via fetchWithTimeout (src/lib/fetchWithTimeout.js).
// Keep in sync with PROVIDER_RULES in src/services/apiUsage.service.js.
export const EXTERNAL_HOSTS = [
  'https://api.groq.com',
  'https://maps.googleapis.com',
  'https://airquality.googleapis.com',
  'https://api.openaq.org',
  'https://api.openweathermap.org',
  'https://api.waqi.info',
  'https://gnews.io',
  'https://newsapi.org',
  'https://news.google.com',
  'https://nominatim.openstreetmap.org',
  'https://overpass-api.de',
  'https://overpass.private.coffee',
  'https://api.opentopodata.org',
  'https://global-surface-water.appspot.com',
  'https://api.data.gov.in',
  'https://api.open-meteo.com',
  'https://air-quality-api.open-meteo.com',
];

/**
 * Blanket 200-{} mock for every known external host, any method/path, persisted
 * for the life of the test file. Use this when a test doesn't care about a
 * specific provider's response shape and just needs the pipeline to not hang
 * or hit the network. Prefer the per-provider mockers below when the test
 * actually asserts on the response.
 */
export function mockAllExternalApis() {
  const scopes = EXTERNAL_HOSTS.map((host) =>
    nock(host).persist().get(/.*/).reply(200, {}).post(/.*/).reply(200, {}),
  );
  return scopes;
}

/** Groq chat-completion — matches src/services/groq.service.js. */
export function mockGroqChatCompletion(content, { status = 200 } = {}) {
  return nock('https://api.groq.com')
    .post('/openai/v1/chat/completions')
    .reply(status, {
      choices: [{ message: { content: typeof content === 'string' ? content : JSON.stringify(content) } }],
    });
}

export function mockGroqDown() {
  return nock('https://api.groq.com')
    .post('/openai/v1/chat/completions')
    .replyWithError('mocked: Groq unreachable');
}

/** Google Places nearby-search — matches src/services/places.service.js. */
export function mockGooglePlacesNearbySearch(results = []) {
  return nock('https://maps.googleapis.com')
    .persist()
    .get('/maps/api/place/nearbysearch/json')
    .query(true)
    .reply(200, { status: 'OK', results });
}

/** Google Air Quality (Level 1 AQI source). */
export function mockGoogleAirQuality(payload) {
  return nock('https://airquality.googleapis.com')
    .post(/.*/)
    .reply(200, payload ?? { indexes: [{ code: 'ind_cpcb', aqi: 80, category: 'Poor' }] });
}

/** OpenAQ measurements. */
export function mockOpenAQ(payload) {
  return nock('https://api.openaq.org')
    .get(/.*/)
    .query(true)
    .reply(200, payload ?? { results: [] });
}

/** Nominatim reverse/forward geocode. */
export function mockNominatim(payload) {
  return nock('https://nominatim.openstreetmap.org')
    .get(/.*/)
    .query(true)
    .reply(200, payload ?? []);
}

/** Overpass (noise/amenity OSM queries). */
export function mockOverpass(payload) {
  return nock('https://overpass-api.de')
    .post(/.*/)
    .reply(200, payload ?? { elements: [] });
}

export { nock };
