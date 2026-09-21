// FILE: test/unit/externalApis.mock.test.js
// Proves the mock layer: a mocked host resolves deterministically, and an
// un-mocked host is refused instead of hitting the real network.
import { describe, it, expect } from 'vitest';
import { fetchWithTimeout } from '../../src/lib/fetchWithTimeout.js';
import { mockGroqChatCompletion, mockGoogleAirQuality } from '../mocks/externalApis.js';

describe('external API mock layer', () => {
  it('serves a mocked Groq response with no real network call', async () => {
    mockGroqChatCompletion({ headline: 'mocked' });
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      body: '{}',
    });
    const body = await res.json();
    expect(res.ok).toBe(true);
    expect(JSON.parse(body.choices[0].message.content)).toEqual({ headline: 'mocked' });
  });

  it('serves a mocked Google Air Quality response', async () => {
    mockGoogleAirQuality({ indexes: [{ code: 'ind_cpcb', aqi: 42 }] });
    const res = await fetchWithTimeout('https://airquality.googleapis.com/v1/currentConditions:lookup', {
      method: 'POST',
      body: '{}',
    });
    const body = await res.json();
    expect(body.indexes[0].aqi).toBe(42);
  });

  it('refuses an un-mocked external host instead of making a real call', async () => {
    await expect(
      fetchWithTimeout('https://api.openweathermap.org/data/2.5/weather?q=x'),
    ).rejects.toThrow();
  });
});
