'use client';

import { useState } from 'react';
import api from '@/lib/api';

if (process.env.NEXT_PUBLIC_DEV_UNLOCK !== 'true') {
  throw new Error('Dev test page is only available when NEXT_PUBLIC_DEV_UNLOCK=true');
}

const DEFAULT_FORM = {
  lat:            '12.9352',
  lng:            '77.6245',
  propertyName:   'Koramangala, Bangalore',
  cityName:       'Bengaluru',
  listingType:    'sale',
  budgetBracket:  '60L–1Cr',
  bhk:            '2BHK',
  floor:          '4–7',
};

const SALE_BRACKETS  = ['Under 30L','30L–60L','60L–1Cr','1Cr–1.5Cr','1.5Cr–2Cr','2Cr–3Cr','3Cr–5Cr','Above 5Cr'];
const RENT_BRACKETS  = ['Under 10K','10K–20K','20K–35K','35K–50K','50K–75K','75K–1L','Above 1L'];
const BHK_OPTIONS    = ['1BHK','2BHK','3BHK','4BHK+','Studio','Villa','Plot','PG'];
const FLOOR_OPTIONS  = ['Ground','1–3','4–7','8–15','16+','Top Floor','Unknown'];

function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.6)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 7,
  padding: '8px 12px',
  color: 'rgba(255,255,255,0.85)',
  fontFamily: "'Geist Mono', monospace",
  fontSize: 12,
  outline: 'none',
  width: '100%',
};

const selectStyle = { ...inputStyle, cursor: 'pointer' };

export default function DevTestReportPage() {
  const [form, setForm]       = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const [elapsed, setElapsed] = useState(null);

  const brackets = form.listingType === 'rent' ? RENT_BRACKETS : SALE_BRACKETS;

  function set(key, val) {
    setForm(prev => {
      const next = { ...prev, [key]: val };
      if (key === 'listingType') {
        next.budgetBracket = val === 'rent' ? RENT_BRACKETS[2] : SALE_BRACKETS[2];
      }
      return next;
    });
  }

  async function handleSeed() {
    setError('');
    setResult(null);
    setLoading(true);
    const t0 = Date.now();

    try {
      const { data } = await api.post('/dev/seed-report', {
        lat:          parseFloat(form.lat),
        lng:          parseFloat(form.lng),
        propertyName: form.propertyName,
        cityName:     form.cityName,
        listingType:  form.listingType,
        budgetBracket: form.budgetBracket,
        bhk:          form.bhk,
        floor:        form.floor,
      }, { timeout: 90000 });

      setElapsed(((Date.now() - t0) / 1000).toFixed(1));
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error ?? err.message ?? 'Seed failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080812', padding: '48px 24px', fontFamily: "'Geist Mono', monospace" }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0DD8C0', boxShadow: '0 0 8px rgba(13,216,192,0.9)', display: 'inline-block' }} />
            <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.55)' }}>
              DEV TOOLS · REPORT SEEDER
            </span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255,255,255,0.9)', margin: 0 }}>
            Seed a Test Report
          </h1>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 }}>
            Bypasses the full funnel. Runs the live intelligence pipeline and generates a complete report. Takes ~15–40s.
          </p>
        </div>

        {/* Form */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Latitude">
              <input style={inputStyle} value={form.lat} onChange={e => set('lat', e.target.value)} />
            </Field>
            <Field label="Longitude">
              <input style={inputStyle} value={form.lng} onChange={e => set('lng', e.target.value)} />
            </Field>
          </div>

          <Field label="Property Name">
            <input style={inputStyle} value={form.propertyName} onChange={e => set('propertyName', e.target.value)} />
          </Field>

          <Field label="City Name (for news + AQI lookup)">
            <input style={inputStyle} value={form.cityName} onChange={e => set('cityName', e.target.value)} />
          </Field>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Listing Type">
              <select style={selectStyle} value={form.listingType} onChange={e => set('listingType', e.target.value)}>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </Field>
            <Field label="Budget Bracket">
              <select style={selectStyle} value={form.budgetBracket} onChange={e => set('budgetBracket', e.target.value)}>
                {brackets.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="BHK">
              <select style={selectStyle} value={form.bhk} onChange={e => set('bhk', e.target.value)}>
                {BHK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Floor">
              <select style={selectStyle} value={form.floor} onChange={e => set('floor', e.target.value)}>
                {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            Commute: Koramangala → Indiranagar (driving, hybrid WFH). Preferences: moderate noise/AQI, East-facing, family community, ₹1L–2L income.
          </p>
        </div>

        {/* Seed button */}
        <button
          onClick={handleSeed}
          disabled={loading}
          style={{
            marginTop: 20, width: '100%',
            padding: '14px 24px',
            background: loading ? 'rgba(13,216,192,0.06)' : 'rgba(13,216,192,0.12)',
            border: '1px solid rgba(13,216,192,0.35)',
            borderRadius: 10,
            color: loading ? 'rgba(13,216,192,0.4)' : '#0DD8C0',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {loading ? '⚙ Running pipeline… this takes ~15–40s' : '◆ Seed Test Report'}
        </button>

        {/* Error */}
        {error && (
          <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(212,100,90,0.08)', border: '1px solid rgba(212,100,90,0.25)', borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: '#D4645A', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: 20, background: 'rgba(13,216,192,0.04)', border: '1px solid rgba(13,216,192,0.2)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6ECB7A', boxShadow: '0 0 6px rgba(110,203,122,0.8)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(110,203,122,0.8)' }}>
                Report seeded in {elapsed}s
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              <Row label="Property"  value={result.propertyName} />
              <Row label="Session ID" value={result.sessionId} mono />
            </div>

            {/* Amenity lat/lng check */}
            {result.amenitySample && (
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
                  Amenity lat/lng check
                </p>
                {['schools', 'parks'].map(cat => (
                  (result.amenitySample[cat] ?? []).map((p, i) => (
                    <div key={`${cat}-${i}`} style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 5, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ color: '#0DD8C0' }}>{cat.slice(0,1).toUpperCase()}</span>
                      <span style={{ flex: 1 }}>{p.name}</span>
                      <span style={{ color: p.lat ? '#6ECB7A' : '#D4645A' }}>
                        {p.lat ? `lat: ${p.lat?.toFixed(4)}, lng: ${p.lng?.toFixed(4)}` : 'NO LAT/LNG'}
                      </span>
                    </div>
                  ))
                ))}
              </div>
            )}

            <a
              href={`/report?sessionId=${result.sessionId}`}
              style={{
                display: 'block', textAlign: 'center',
                padding: '12px 20px',
                background: 'rgba(13,216,192,0.10)',
                border: '1px solid rgba(13,216,192,0.30)',
                borderRadius: 8,
                color: '#0DD8C0',
                fontFamily: "'Geist Mono', monospace",
                fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              ◆ View Full Report →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
      <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', flexShrink: 0, width: 80 }}>
        {label}
      </span>
      <span style={{ fontSize: mono ? 10 : 12, color: 'rgba(255,255,255,0.75)', fontFamily: mono ? "'Geist Mono', monospace" : 'inherit', wordBreak: 'break-all' }}>
        {value}
      </span>
    </div>
  );
}
