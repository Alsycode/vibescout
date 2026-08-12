// FILE: components/report/ReportViewer.jsx
// dynamic import keeps Leaflet off the SSR bundle

'use client';

import { useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SharePDFBar from '../SharePDFBar';
import AmenitySummaryCard from './AmenitySummaryCard';
import NearbyComplexesCard from './NearbyComplexesCard';

const IntelligenceMapCard = dynamic(
  () => import('./IntelligenceMapCard'),
  { ssr: false, loading: () => null },
);

// ─── Signal type icons ────────────────────────────────────────────────────────

const AqiIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <path d="M1 6 Q2.5 3.5 4 6 Q5.5 8.5 7 5 Q8.5 1.5 11 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const NoiseIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <path d="M1 8 Q2.5 4 4.5 6.5 Q6 8.5 7.5 3 Q9 -1 11 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
);
const SolarIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.2"/>
    <line x1="6" y1="0.5" x2="6" y2="2"   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="6" y1="10"  x2="6" y2="11.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="0.5" y1="6" x2="2"   y2="6"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="10"  y1="6" x2="11.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="2" y1="2"   x2="3" y2="3"    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="9" y1="9"   x2="10" y2="10"  stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="10" y1="2"  x2="9" y2="3"    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <line x1="3"  y1="9"  x2="2" y2="10"   stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);
const CommuteIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <rect x="1" y="4.5" width="10" height="4.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
    <path d="M3 4.5 L4.2 2 L7.8 2 L9 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    <circle cx="3.5" cy="9.5" r="1.1" stroke="currentColor" strokeWidth="1.1"/>
    <circle cx="8.5" cy="9.5" r="1.1" stroke="currentColor" strokeWidth="1.1"/>
  </svg>
);
const VastuIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.1"/>
    <line x1="6" y1="1.5" x2="6" y2="10.5" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5"/>
    <line x1="1.5" y1="6" x2="10.5" y2="6" stroke="currentColor" strokeWidth="0.8" strokeDasharray="1.5 1.5" opacity="0.5"/>
    <path d="M6 2.5 L6.5 4.5 L8.5 4.5 L7 5.7 L7.5 7.5 L6 6.4 L4.5 7.5 L5 5.7 L3.5 4.5 L5.5 4.5 Z" fill="currentColor" opacity="0.65"/>
  </svg>
);
const CommunityIcon = () => (
  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
    <circle cx="4.5" cy="3.5" r="1.7" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M1.5 10 C1.5 7.8 2.8 6.8 4.5 6.8 C6.2 6.8 7.5 7.8 7.5 10" stroke="currentColor" strokeWidth="1.1" fill="none"/>
    <circle cx="8.8" cy="3.5" r="1.3" stroke="currentColor" strokeWidth="1.1"/>
    <path d="M8.8 6.5 C10.2 6.5 11 7.2 11 9.5" stroke="currentColor" strokeWidth="1.1" fill="none"/>
  </svg>
);

// ─── Micro helpers ────────────────────────────────────────────────────────────

function VerdictPill({ verdict }) {
  const cfg = verdict === 'pass'
    ? { label: 'PASS', color: '#6ECB7A' }
    : verdict === 'red_flag'
    ? { label: 'FLAG', color: '#D4645A' }
    : { label: 'NOTE', color: '#D4A853' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontWeight: 700, color: cfg.color, letterSpacing: '0.08em',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function Sparkline({ color, trend = 'up' }) {
  const upPath   = 'M0,52 C8,48 14,44 22,38 C30,32 36,28 44,22 C54,16 62,12 72,8 C82,5 90,4 100,3';
  const downPath = 'M0,24 C8,16 12,32 20,28 C28,14 34,36 44,30 C54,16 60,40 70,26 C80,14 88,32 100,20';
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox="0 0 100 60" style={{ width: '100%', height: 56 }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-${trend}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={trend === 'up' ? upPath : downPath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        paddingBottom: 2, pointerEvents: 'none',
      }}>
        {['100', '75', '50', '25'].map(v => (
          <span key={v} style={{
            fontSize: 7, color: 'rgba(255,255,255,0.2)', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', display: 'block', textAlign: 'right',
          }}>{v}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ value, size = 88 }) {
  const r = (size - 14) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (Math.min(value, 100) / 100) * circ;
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="#0DD8C0" strokeWidth={7}
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
      />
      <text x={c} y={c + 1} textAnchor="middle" dominantBaseline="middle"
        fill="rgba(255,255,255,0.9)" fontSize={15} fontWeight={700} fontFamily="inherit">
        {value}%
      </text>
    </svg>
  );
}

function StarRating({ count, total = 5 }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <svg key={i} width={20} height={20} viewBox="0 0 20 20">
          <polygon
            points="10,2 12.4,7.2 18,7.6 13.8,11.4 15.2,17 10,14 4.8,17 6.2,11.4 2,7.6 7.6,7.2"
            fill={i < count ? '#0DD8C0' : 'rgba(255,255,255,0.1)'}
            stroke={i < count ? 'rgba(13,216,192,0.4)' : 'none'}
            strokeWidth="0.5"
          />
        </svg>
      ))}
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(13,216,192,0.15)' }} />
      <p style={{
        fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase',
        color: 'rgba(13,216,192,0.55)', whiteSpace: 'nowrap',
      }}>
        {text}
      </p>
      <div style={{ flex: 1, height: 1, background: 'rgba(13,216,192,0.15)' }} />
    </div>
  );
}

// ─── Spec icons (SVG outline) ─────────────────────────────────────────────────

const SpecIconHouse = () => (
  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
    <path d="M1 6.2L6.5 1.5L12 6.2" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.5 5.3V11.5H10.5V5.3" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4.5 11.5V8H8.5V11.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SpecIconBed = () => (
  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
    <path d="M1.5 8.5V5C1.5 4 2 3.5 3 3.5H10C11 3.5 11.5 4 11.5 5V8.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 8.5H12" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
    <path d="M1 10.5V8.5M12 10.5V8.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
    <path d="M3 6.5H5.5M7.5 6.5H10" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
  </svg>
);
const SpecIconBuilding = () => (
  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
    <rect x="2" y="1.5" width="9" height="10.5" rx="0.8" stroke="currentColor" strokeWidth="1.15"/>
    <path d="M4.5 4.5H8.5M4.5 7H8.5M4.5 9.5H6.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
  </svg>
);
const SpecIconCalendar = () => (
  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
    <rect x="1.5" y="2.5" width="10" height="9.5" rx="1" stroke="currentColor" strokeWidth="1.15"/>
    <path d="M1.5 5.5H11.5M4 1.5V3.5M9 1.5V3.5" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round"/>
    <circle cx="4.5" cy="8.2" r="0.6" fill="currentColor"/>
    <circle cx="6.5" cy="8.2" r="0.6" fill="currentColor"/>
    <circle cx="8.5" cy="8.2" r="0.6" fill="currentColor"/>
  </svg>
);

const SPEC_ICONS = [SpecIconHouse, SpecIconBed, SpecIconBuilding, SpecIconCalendar];

// ─── Section 1: Header ────────────────────────────────────────────────────────

function ReportHeader({ report }) {
  const summary = report?.summary ?? {};
  const listingType = report?.listingType;

  const propertySpecs = [
    listingType ? (listingType === 'sale' ? 'For Sale' : 'For Rent') : null,
    report?.bhk ?? null,
    report?.floor && report.floor !== 'Unknown' ? `Floor ${report.floor}` : null,
    report?.generatedAt
      ? new Date(report.generatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : null,
  ].filter(Boolean);

  return (
    <div className="rv-card-pad" style={{
      maxWidth: 860, width: '100%', margin: '0 auto 16px',
      background: 'rgba(8,12,28,0.9)',
      border: '1px solid rgba(13,216,192,0.12)',
      borderRadius: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(13,216,192,0.5),transparent)' }} />

      <div className="rv-header-flex">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="rv-h1">
            {report?.propertyName ?? 'Property Report'}
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#6ECB7A', marginBottom: 4 }}>
            {report?.headline ?? ''}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>
            {summary.totalRedFlags ?? 0} concern{(summary.totalRedFlags ?? 0) !== 1 ? 's' : ''},{' '}
            {summary.totalCautions ?? 0} caution{(summary.totalCautions ?? 0) !== 1 ? 's' : ''} noted.
          </p>
        </div>

        <div className="rv-flagscan">
          <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            Flag Scan Results
          </p>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'center' }}>
              <p className="rv-flagnum" style={{ color: '#D4645A' }}>{summary.totalRedFlags ?? 0}</p>
              <p style={{ fontSize: 10, color: 'rgba(212,100,90,0.7)', fontWeight: 400, marginTop: 2 }}>Red Flag{(summary.totalRedFlags ?? 0) !== 1 ? 's' : ''}</p>
            </div>
            {(summary.totalCautions ?? 0) > 0 && (
              <div style={{ textAlign: 'center' }}>
                <p className="rv-flagnum" style={{ color: '#D4A853' }}>{summary.totalCautions}</p>
                <p style={{ fontSize: 10, color: 'rgba(212,168,83,0.7)', fontWeight: 400, marginTop: 2 }}>Caution{summary.totalCautions !== 1 ? 's' : ''}</p>
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <p className="rv-flagnum" style={{ color: '#6ECB7A' }}>{summary.totalPasses ?? 0}</p>
              <p style={{ fontSize: 10, color: 'rgba(110,203,122,0.7)', fontWeight: 400, marginTop: 2 }}>Pass{(summary.totalPasses ?? 0) !== 1 ? 'es' : ''}</p>
            </div>
          </div>
        </div>

        {propertySpecs.length > 0 && (
          <div className="rv-specs-col">
            {propertySpecs.map((spec, i) => {
              const Icon = SPEC_ICONS[i];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: 'rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    {Icon && <Icon />}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 300, whiteSpace: 'nowrap' }}>{spec}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section 2: Highlight cards ───────────────────────────────────────────────

function HighlightCards({ report }) {
  const summary = report?.summary ?? {};
  const signals = report?.signals ?? {};
  const budgetVerdict = signals.budget?.verdict;

  const budgetLabel = budgetVerdict === 'pass'
    ? 'WITHIN BUDGET'
    : budgetVerdict === 'red_flag' ? 'OVER BUDGET' : 'NEAR LIMIT';
  const budgetSub = budgetVerdict === 'pass'
    ? 'Property price is within your budget range.'
    : budgetVerdict === 'red_flag'
    ? 'Property price exceeds your budget range.'
    : 'Property price is close to your budget limit.';

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }} className="rv-pair">
      <div className="rv-inner-pad" style={{
        flex: 1,
        background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(110,203,122,0.12)',
        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ flexShrink: 0 }}>
          <svg width={44} height={44} viewBox="0 0 44 44">
            <circle cx={22} cy={22} r={21} fill="rgba(110,203,122,0.08)" stroke="rgba(110,203,122,0.15)" strokeWidth={1} />
            <circle cx={22} cy={11} r={3} fill="rgba(13,216,192,0.8)" />
            <path d="M22,14 L19,22 L22,28 M22,14 L25,22 L22,28 M19,18 L25,18 M19,22 L16,30 M25,22 L28,30"
              stroke="rgba(13,216,192,0.75)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <div>
          <p className="rv-hlabel" style={{ color: '#6ECB7A' }}>
            {summary.totalPasses ?? 0} PASSES
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 300, marginTop: 4 }}>
            Property satisfies most of your requirements.
          </p>
        </div>
      </div>

      <div className="rv-inner-pad" style={{
        flex: 1,
        background: 'rgba(8,12,28,0.85)',
        border: `1px solid ${budgetVerdict === 'pass' ? 'rgba(13,216,192,0.15)' : 'rgba(212,100,90,0.15)'}`,
        borderRadius: 14, display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{ flexShrink: 0 }}>
          <svg width={44} height={44} viewBox="0 0 44 44">
            <circle cx={22} cy={22} r={21} fill="rgba(13,216,192,0.08)" stroke="rgba(13,216,192,0.15)" strokeWidth={1} />
            <rect x={10} y={15} width={24} height={16} rx={3} fill="none" stroke="rgba(13,216,192,0.75)" strokeWidth="1.5" />
            <line x1={10} y1={21} x2={34} y2={21} stroke="rgba(13,216,192,0.5)" strokeWidth="1.5" />
            <circle cx={22} cy={26} r={2.5} fill="rgba(13,216,192,0.7)" />
          </svg>
        </div>
        <div>
          <p className="rv-hlabel" style={{ color: '#0DD8C0' }}>
            {budgetLabel}
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 300, marginTop: 4 }}>
            {budgetSub}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Section 3: Why this verdict ──────────────────────────────────────────────

function deriveStrengths(signals, listingType) {
  const out = [];
  if (signals?.noise?.verdict === 'pass' && signals.noise.estimatedDb)
    out.push(`Quiet environment (${signals.noise.estimatedDb}dB)`);
  if (signals?.aqi?.verdict === 'pass')
    out.push('Good AQI conditions');
  if (signals?.solar?.verdict === 'pass' && signals.solar.peakSunHours)
    out.push(`Good solar potential (${signals.solar.peakSunHours} hrs/day)`);
  if (signals?.vastu?.verdict === 'pass' && signals.vastu?.vastuPreference === 'Yes' && signals.vastu.facingDirection)
    out.push(`${signals.vastu.facingDirection}-facing, favourable Vastu`);
  if (signals?.budget?.verdict === 'pass')
    out.push(`Budget-compatible ${listingType === 'sale' ? 'price' : 'rental'}`);
  if (signals?.community?.verdict === 'pass')
    out.push('Strong family infrastructure nearby');
  if (signals?.commute?.verdict === 'pass')
    out.push('Commute-friendly location');
  return out;
}

const CONCERN_PREFIX = {
  commute: 'Estimated commute of',
  aqi:     'Current AQI reading',
  noise:   'Estimated noise level',
  solar:   'Peak sun hours',
  budget:  null,
};

function derivePrimaryConcern(signals) {
  const checks = [
    { key: 'commute',  label: 'Commute Time',   getValue: (s) => s?.commute?.estimatedMins != null ? `${s.commute.estimatedMins}` : null, getUnit: () => 'mins', getMessage: (s) => s?.commute?.label },
    { key: 'aqi',      label: 'Air Quality',     getValue: (s) => s?.aqi?.value != null ? `${s.aqi.value}` : null, getUnit: () => 'AQI', getMessage: (s) => s?.aqi?.label },
    { key: 'noise',    label: 'Noise Level',     getValue: (s) => s?.noise?.estimatedDb != null ? `${s.noise.estimatedDb}` : null, getUnit: () => 'dB', getMessage: (s) => s?.noise?.label },
    { key: 'budget',   label: 'Budget',          getValue: () => null, getUnit: () => null, getMessage: (s) => s?.budget?.label },
    { key: 'solar',    label: 'Solar Exposure',  getValue: (s) => s?.solar?.peakSunHours != null ? `${s.solar.peakSunHours}` : null, getUnit: () => 'hrs/day', getMessage: (s) => s?.solar?.label },
  ];
  for (const severity of ['red_flag', 'caution']) {
    for (const c of checks) {
      if (signals?.[c.key]?.verdict === severity) {
        return {
          ...c,
          value: c.getValue(signals),
          unit: c.getUnit(),
          message: c.getMessage(signals),
          prefix: CONCERN_PREFIX[c.key] ?? null,
          severity,
        };
      }
    }
  }
  return null;
}

function WhyVerdict({ report }) {
  const signals = report?.signals ?? {};
  const strengths = deriveStrengths(signals, report?.listingType);
  const concern = derivePrimaryConcern(signals);

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 4 }}>Why this verdict</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>Full-width investigative evidence modules</p>
      </div>

      <div className="rv-why-panels">
        {/* Strengths panel */}
        <div className="rv-inner-pad" style={{
          flex: 1,
          background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(110,203,122,0.1)',
          borderRadius: 14, overflow: 'hidden', position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <svg width={16} height={16} viewBox="0 0 16 16">
              <path d="M8 2 L13 4.5 L13 8.5 C13 12 8 14 8 14 C8 14 3 12 3 8.5 L3 4.5 Z"
                fill="none" stroke="rgba(110,203,122,0.7)" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(110,203,122,0.7)' }}>
              Strengths
            </p>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <ul style={{ flex: 1, listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
              {strengths.slice(0, 7).map((s, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 300 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6ECB7A', boxShadow: '0 0 4px rgba(110,203,122,0.5)', flexShrink: 0 }} />
                  {s}
                </li>
              ))}
              {strengths.length === 0 && (
                <li style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No standout strengths noted.</li>
              )}
            </ul>
            <div style={{ flexShrink: 0, width: 110 }}>
              <Sparkline color="#6ECB7A" trend="up" />
              <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 4, letterSpacing: '0.08em' }}>30 Days Trend</p>
            </div>
          </div>
        </div>

        {/* Concern panel */}
        <div className="rv-inner-pad" style={{
          flex: 1,
          background: 'rgba(8,12,28,0.85)',
          border: `1px solid ${concern?.severity === 'red_flag' ? 'rgba(212,100,90,0.15)' : 'rgba(212,168,83,0.12)'}`,
          borderRadius: 14, overflow: 'hidden',
        }}>
          {concern ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <svg width={16} height={16} viewBox="0 0 16 16">
                  <path d="M8 2 L14 13 L2 13 Z" fill="none" stroke="rgba(212,168,83,0.8)" strokeWidth="1.2" />
                  <line x1="8" y1="7" x2="8" y2="10" stroke="rgba(212,168,83,0.8)" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="8" cy="12" r="0.8" fill="rgba(212,168,83,0.8)" />
                </svg>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.8)' }}>
                  Concern
                </p>
              </div>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>{concern.label}</p>
              {concern.prefix && (
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 300, marginBottom: 6 }}>
                  {concern.prefix}
                </p>
              )}
              {concern.value && (
                <p className="rv-concern-val">
                  {concern.value}
                  {concern.unit && (
                    <span style={{ fontSize: 17, fontWeight: 500, marginLeft: 6, letterSpacing: 0 }}>{concern.unit}</span>
                  )}
                </p>
              )}
              {concern.message && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', fontWeight: 300, lineHeight: 1.5, marginBottom: 10 }}>
                  {concern.message}
                </p>
              )}
              <div>
                <Sparkline color="#D4645A" trend="volatile" />
                <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: 4, letterSpacing: '0.08em' }}>30 Days Trend</p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8 }}>
              <span style={{ fontSize: 24 }}>✓</span>
              <p style={{ fontSize: 13, color: 'rgba(110,203,122,0.7)', fontWeight: 500 }}>No concerns found</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>All signals passed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Section 5: What we discovered ───────────────────────────────────────────

function SignalCard({ icon, overline, metric, metricUnit, verdict, label, footer }) {
  const accentColor = verdict === 'pass' ? '#6ECB7A' : verdict === 'red_flag' ? '#D4645A' : '#D4A853';
  return (
    <div style={{
      minWidth: 116, padding: '14px 13px',
      background: 'rgba(8,12,28,0.85)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderTop: `2px solid ${accentColor}40`,
      borderRadius: 12,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header: icon + overline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        {icon && (
          <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
        <p style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {overline}
        </p>
      </div>

      {/* Metric + unit on same line */}
      <p style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', marginBottom: 4 }}>
        {metric}
        {metricUnit && (
          <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginLeft: 4 }}>
            {metricUnit}
          </span>
        )}
      </p>

      {/* Verdict */}
      <div style={{ marginTop: 6, marginBottom: 8 }}>
        <VerdictPill verdict={verdict} />
      </div>

      {/* Label */}
      {label && (
        <p style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.38)', fontWeight: 300, lineHeight: 1.5, flex: 1 }}>{label}</p>
      )}

      {/* Footer (e.g. noise floor breakdown) */}
      {footer && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {footer}
        </div>
      )}

      {/* Timestamp */}
      <p style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.18)', fontWeight: 300, marginTop: 8, letterSpacing: '0.03em' }}>
        Updated some ago
      </p>
    </div>
  );
}

function WhatWeDiscovered({ signals, report }) {
  const { aqi, noise, solar, commute, vastu, community } = signals;

  const communityFooter = community?.counts ? (() => {
    const items = [
      { emoji: '🏫', count: community.counts.schoolsNear, label: 'Schools' },
      { emoji: '🌳', count: community.counts.parksNear,   label: 'Parks'   },
      { emoji: '☕', count: community.counts.cafesNear,   label: 'Cafes'   },
      { emoji: '🏋️', count: community.counts.gymsNear,    label: 'Gyms'    },
    ].filter(x => x.count);
    if (!items.length) return null;
    return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {items.map((x, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 28 }}>
            <span style={{ fontSize: 13, lineHeight: 1 }}>{x.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', lineHeight: 1 }}>{x.count}</span>
            <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1, whiteSpace: 'nowrap' }}>{x.label}</span>
          </div>
        ))}
        <span style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.2)', alignSelf: 'flex-end', paddingBottom: 1 }}>within 1.5 km</span>
      </div>
    );
  })() : null;

  const noiseFooter = (() => {
    if (!noise) return null;
    const reduction = (noise.rawEstimatedDb != null && noise.estimatedDb != null)
      ? noise.rawEstimatedDb - noise.estimatedDb
      : 0;
    if (reduction <= 0) return null;
    const floorBand = noise.category?.split('·')[1]?.trim() ?? null;
    return (
      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.32)', lineHeight: 1.5 }}>
        Street level {noise.rawEstimatedDb}dB<br />
        Floor {floorBand} −{reduction}dB
      </p>
    );
  })();

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      <SectionLabel text="What we discovered" />
      <div className="signal-grid">
        {aqi && (
          <SignalCard
            icon={<AqiIcon />}
            overline="Atmospheric Quality"
            metric="AQI"
            metricUnit={aqi.value != null ? String(aqi.value) : undefined}
            verdict={aqi.verdict}
            label={aqi.label}
          />
        )}
        {noise && (
          <SignalCard
            icon={<NoiseIcon />}
            overline="Acoustic Profile"
            metric={noise.estimatedDb != null ? `${noise.estimatedDb}` : '—'}
            metricUnit="dB"
            verdict={noise.verdict}
            label={noise.label}
            footer={noiseFooter}
          />
        )}
        {solar && (
          <SignalCard
            icon={<SolarIcon />}
            overline="Solar Intelligence"
            metric={solar.peakSunHours != null ? `${solar.peakSunHours}` : '—'}
            metricUnit="hrs/day"
            verdict={solar.verdict}
            label={solar.label}
          />
        )}
        {commute && (
          <SignalCard
            icon={<CommuteIcon />}
            overline="Commute Vector"
            metric={commute.estimatedMins != null ? `${commute.estimatedMins}` : 'WFH'}
            metricUnit={commute.estimatedMins != null ? 'min' : undefined}
            verdict={commute.verdict}
            label={commute.label}
          />
        )}
        {vastu?.vastuPreference === 'Yes' && vastu && (
          <SignalCard
            icon={<VastuIcon />}
            overline="Vastu Intelligence"
            metric={vastu.facingDirection ?? '—'}
            verdict={vastu.verdict}
            label={vastu.label}
          />
        )}
        {community && (
          <SignalCard
            icon={<CommunityIcon />}
            overline="Community Pulse"
            metric={community.derivedCharacter ?? '—'}
            metricUnit={community.userPreference ?? undefined}
            verdict={community.verdict}
            label={community.label}
            footer={communityFooter}
          />
        )}
      </div>
    </div>
  );
}

// ─── Section 5b: Nearby Places ───────────────────────────────────────────────

const PLACE_CATEGORIES = [
  { key: 'hospitals',   label: 'Hospitals',    icon: '🏥' },
  { key: 'schools',     label: 'Schools',      icon: '🏫' },
  { key: 'parks',       label: 'Parks',        icon: '🌳' },
  { key: 'cafes',       label: 'Cafes',        icon: '☕' },
  { key: 'gyms',        label: 'Gyms',         icon: '🏋️' },
  { key: 'restaurants', label: 'Restaurants',  icon: '🍽️' },
  { key: 'worship',     label: 'Worship',      icon: '🛕' },
];

function formatDist(m) {
  if (m == null) return null;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${m} m`;
}

function NearbyPlaces({ amenities, priorities = [] }) {
  if (!amenities) return null;

  const prioritySet = new Set(priorities);
  const orderedCats = [
    ...PLACE_CATEGORIES.filter(c => prioritySet.has(c.key)),
    ...PLACE_CATEGORIES.filter(c => !prioritySet.has(c.key)),
  ].filter(c => (amenities[c.key] ?? []).length > 0);

  if (!orderedCats.length) return null;

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      <SectionLabel text="Nearby Places" />
      <div className="place-grid">
        {orderedCats.map(({ key, label, icon }) => {
          const places = (amenities[key] ?? []).slice(0, 4);
          const isPriority = prioritySet.has(key);
          return (
            <div
              key={key}
              style={{
                background: 'rgba(8,12,28,0.85)',
                border: `1px solid ${isPriority ? 'rgba(13,216,192,0.18)' : 'rgba(255,255,255,0.07)'}`,
                borderTop: `2px solid ${isPriority ? 'rgba(13,216,192,0.35)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 12, padding: '14px 13px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: isPriority ? 'rgba(13,216,192,0.7)' : 'rgba(255,255,255,0.3)' }}>
                  {label}
                </p>
                {isPriority && (
                  <span style={{ fontSize: 8, fontWeight: 600, color: 'rgba(13,216,192,0.55)', background: 'rgba(13,216,192,0.08)', border: '1px solid rgba(13,216,192,0.2)', borderRadius: 9999, padding: '1px 5px', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                    priority
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {places.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 400, color: 'rgba(255,255,255,0.65)', lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                    </p>
                    {formatDist(p.distanceM) && (
                      <span style={{ fontSize: 9, fontWeight: 500, color: 'rgba(255,255,255,0.28)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                        {formatDist(p.distanceM)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section 6: Local intelligence ───────────────────────────────────────────

// Stable Picsum seeds for real-estate/city themed placeholder images
const NEWS_FALLBACK_IMGS = [
  'https://picsum.photos/seed/cityscape/350/180',
  'https://picsum.photos/seed/highway88/350/180',
  'https://picsum.photos/seed/apartment/350/180',
  'https://picsum.photos/seed/realty22/350/180',
  'https://picsum.photos/seed/skyline9/350/180',
  'https://picsum.photos/seed/estate44/350/180',
];

function LocalIntelligence({ localNews }) {
  const headlines = localNews?.headlines ?? [];
  if (!headlines.length) return null;

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      <SectionLabel text="Local Intelligence" />
      <div className="news-grid">
        {headlines.slice(0, 6).map((h, i) => (
          <a
            key={i}
            href={h.url ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            <div style={{ height: 78, overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
              <img
                src={h.imageUrl ?? NEWS_FALLBACK_IMGS[i % NEWS_FALLBACK_IMGS.length]}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: h.imageUrl ? 0.82 : 0.55 }}
                onError={(e) => { e.currentTarget.src = NEWS_FALLBACK_IMGS[i % NEWS_FALLBACK_IMGS.length]; }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(4,8,20,0.55))' }} />
            </div>
            <div style={{ padding: '9px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.82)', lineHeight: 1.42, marginBottom: 'auto', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {h.title}
              </p>
              <div style={{ marginTop: 8 }}>
                {(h.source || h.publisher) && (
                  <p style={{ fontSize: 9.5, fontWeight: 400, color: 'rgba(255,255,255,0.45)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {h.source ?? h.publisher}
                  </p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
                  <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.22)', fontWeight: 300 }}>google-rss</p>
                  {h.publishedAt && (
                    <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.3)', fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(h.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
        {headlines.length > 6 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(8,12,28,0.5)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 12, flexDirection: 'column', gap: 4, minHeight: 160,
          }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'rgba(13,216,192,0.7)' }}>+{headlines.length - 6}</p>
            <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: 1.4 }}>more signals</p>
            <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)', marginTop: 2 }}>Via Google News</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Section 6b: Derived Intelligence ────────────────────────────────────────

const RISK_COLORS = {
  Low:          '#6ECB7A',
  'Low-Moderate': '#A8D87A',
  Moderate:     '#D4A853',
  High:         '#D4645A',
  'Very High':  '#C0392B',
};

function LivabilityCard({ data }) {
  if (!data) return null;
  const gradeColor = data.score >= 75 ? '#6ECB7A' : data.score >= 55 ? '#D4A853' : '#D4645A';
  const bd = data.breakdown ?? {};
  const bars = [
    { label: 'Air Quality',  value: bd.aqi?.score   ?? 0, weight: 30 },
    { label: 'Quiet',        value: bd.noise?.score  ?? 0, weight: 30 },
    { label: 'Green Space',  value: bd.parks?.score  ?? 0, weight: 20 },
    { label: 'Sunlight',     value: bd.solar?.score  ?? 0, weight: 20 },
  ];
  return (
    <div style={{
      background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
      borderTop: '2px solid rgba(13,216,192,0.3)', borderRadius: 12, padding: '16px 14px',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.5)', marginBottom: 10 }}>Livability Index</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 14 }}>
        <p style={{ fontSize: 40, fontWeight: 700, color: gradeColor, lineHeight: 1, letterSpacing: '-0.02em' }}>{data.grade}</p>
        <div>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)', lineHeight: 1 }}>{data.score}</p>
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>out of 100</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {bars.map(b => (
          <div key={b.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', fontWeight: 300 }}>{b.label}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontVariantNumeric: 'tabular-nums' }}>{b.weight}%</span>
            </div>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${b.value}%`, background: gradeColor, borderRadius: 2, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MaturityCard({ data }) {
  if (!data) return null;
  const bandColor = data.band === 'Mature' ? '#6ECB7A' : data.band === 'Established' ? '#0DD8C0' : data.band === 'Developing' ? '#D4A853' : '#D4645A';
  const cats = [
    { label: 'Schools',     key: 'schools'     },
    { label: 'Hospitals',   key: 'hospitals'   },
    { label: 'Cafes',       key: 'cafes'       },
    { label: 'Parks',       key: 'parks'       },
    { label: 'Gyms',        key: 'gyms'        },
    { label: 'Restaurants', key: 'restaurants' },
    { label: 'Worship',     key: 'worship'     },
  ];
  return (
    <div style={{
      background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
      borderTop: `2px solid ${bandColor}50`, borderRadius: 12, padding: '16px 14px',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Neighbourhood Maturity</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: bandColor, marginBottom: 2, lineHeight: 1 }}>{data.band}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Density score: {data.score}/100</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px 8px' }}>
        {cats.map(c => {
          const n = data.counts?.[c.key] ?? 0;
          return (
            <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: n > 0 ? bandColor : 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: n > 0 ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.22)', whiteSpace: 'nowrap' }}>
                {c.label} ({n})
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SolarSavingsCard({ data }) {
  if (!data) return null;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
      borderTop: '2px solid rgba(212,168,83,0.4)', borderRadius: 12, padding: '16px 14px',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,168,83,0.6)', marginBottom: 10 }}>Solar Savings Estimate</p>
      <p style={{ fontSize: 28, fontWeight: 700, color: '#D4A853', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 2 }}>{data.displayText}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>estimated solar savings</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {[
          [`${data.panelKw}kW rooftop system`, true],
          [`${data.dailyKwh} kWh generated/day`, true],
          [`${data.annualKwh.toLocaleString('en-IN')} kWh/year`, true],
          ['At ₹8/unit electricity rate', false],
        ].map(([text, highlight], i) => (
          <p key={i} style={{ fontSize: 9.5, color: highlight ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.22)', fontWeight: 300 }}>
            {text}
          </p>
        ))}
      </div>
    </div>
  );
}

function InfraCard({ data }) {
  if (!data) return null;
  return (
    <div style={{
      background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
      borderTop: `2px solid ${data.hasSignals ? 'rgba(13,216,192,0.4)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 12, padding: '16px 14px',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: data.hasSignals ? 'rgba(13,216,192,0.5)' : 'rgba(255,255,255,0.25)', marginBottom: 10 }}>Infrastructure Momentum</p>
      {data.hasSignals ? (
        <>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#0DD8C0', lineHeight: 1, marginBottom: 2 }}>{data.count}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>development signal{data.count !== 1 ? 's' : ''} detected</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.signals.slice(0, 3).map((s, i) => (
              <div key={i}>
                <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, marginBottom: 3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {s.title}
                </p>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {s.matchedKeywords.slice(0, 3).map(kw => (
                    <span key={kw} style={{ fontSize: 8, fontWeight: 600, color: 'rgba(13,216,192,0.7)', background: 'rgba(13,216,192,0.08)', border: '1px solid rgba(13,216,192,0.2)', borderRadius: 9999, padding: '1px 6px' }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>No active signals</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.5 }}>No infrastructure projects announced in local news. Area appears stable — no major developments currently planned.</p>
        </div>
      )}
    </div>
  );
}

function LandHistoryCard({ data }) {
  if (!data) return null;
  const riskColor = RISK_COLORS[data.floodRisk] ?? '#D4A853';
  return (
    <div style={{
      background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
      borderTop: `2px solid ${riskColor}50`, borderRadius: 12, padding: '16px 14px',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Land History · Flood Risk</p>
      <p style={{ fontSize: 22, fontWeight: 700, color: riskColor, lineHeight: 1, marginBottom: 2 }}>{data.floodRisk}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Flood vulnerability level</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>{data.reason}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {data.waterOccurrence != null && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 300 }}>
            Historical water occurrence: {data.waterOccurrence}% (Landsat 1984–2024)
          </p>
        )}
        {data.nearestWaterBodyM != null && (
          <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 300 }}>
            Nearest water body: {data.nearestWaterBodyM < 1000 ? `${data.nearestWaterBodyM}m` : `${(data.nearestWaterBodyM / 1000).toFixed(1)}km`} away
          </p>
        )}
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', marginTop: 4, fontWeight: 300 }}>
          Source: {data.source === 'jrc+osm' ? 'JRC Landsat + OSM' : data.source === 'osm' ? 'OpenStreetMap' : 'Estimated'}
        </p>
      </div>
    </div>
  );
}

// Mini cross-section: dashed line = surrounding ground level, dot = where the property sits.
function TerrainProfile({ relativeM, color }) {
  const clamped = Math.max(-12, Math.min(12, relativeM));
  const dotY = 20 - (clamped / 12) * 13;
  return (
    <svg viewBox="0 0 100 40" style={{ width: '100%', height: 38 }} preserveAspectRatio="none">
      <line x1="4" y1="20" x2="96" y2="20"
        stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="3 3" />
      <line x1="50" y1="20" x2="50" y2={dotY}
        stroke={color} strokeWidth="1" opacity="0.45" />
      <circle cx="50" cy={dotY} r="3.4" fill={color} />
    </svg>
  );
}

function TerrainCard({ data }) {
  if (!data) return null;
  const riskColor = RISK_COLORS[data.drainageRisk] ?? '#D4A853';
  const sign = data.relativeM > 0 ? '+' : '';
  return (
    <div style={{
      background: 'rgba(8,12,28,0.85)', border: '1px solid rgba(255,255,255,0.07)',
      borderTop: `2px solid ${riskColor}50`, borderRadius: 12, padding: '16px 14px',
    }}>
      <p style={{ fontSize: 8, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Terrain · Drainage</p>
      <p style={{ fontSize: 19, fontWeight: 700, color: riskColor, lineHeight: 1.15, marginBottom: 3 }}>{data.terrainPosition}</p>
      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>{data.drainageRisk} drainage risk</p>

      <TerrainProfile relativeM={data.relativeM} color={riskColor} />
      <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.22)', textAlign: 'center', marginTop: 2, marginBottom: 10, letterSpacing: '0.06em' }}>
        vs surrounding ground level
      </p>

      <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 10 }}>{data.reason}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 300 }}>
          Elevation: {data.elevationM}m ({sign}{data.relativeM}m vs surroundings)
        </p>
        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)', fontWeight: 300 }}>
          Local relief: {data.localReliefM}m across {data.samplesUsed} sample points
        </p>
        <p style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.24)', marginTop: 6, fontWeight: 300, lineHeight: 1.5, fontStyle: 'italic' }}>
          Shows how water flows across the land. Does not account for stormwater drains or
          sewer capacity, which drive flooding in flat cities.
        </p>
        <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', marginTop: 4, fontWeight: 300 }}>
          Source: {data.source === 'open-meteo' ? 'Copernicus DEM GLO-90' : 'SRTM 30m'} · {data.confidence} confidence
        </p>
      </div>
    </div>
  );
}

function DerivedIntelligence({ derivedSignals }) {
  if (!derivedSignals) return null;
  const { livabilityIndex, maturityScore, solarSavings, infrastructureMomentum, landHistory, terrain } = derivedSignals;
  if (!livabilityIndex && !maturityScore && !solarSavings && !infrastructureMomentum && !landHistory && !terrain) return null;

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      <SectionLabel text="Location Intelligence" />
      <div className="signal-grid">
        <LivabilityCard data={livabilityIndex} />
        <MaturityCard data={maturityScore} />
        <SolarSavingsCard data={solarSavings} />
        <InfraCard data={infrastructureMomentum} />
        <LandHistoryCard data={landHistory} />
        <TerrainCard data={terrain} />
      </div>
    </div>
  );
}

// ─── Section 7: Rental / Financial ───────────────────────────────────────────

function RentalSection({ report, shareToken, readonly, financial }) {
  const isSale = report?.listingType === 'sale';
  const signals = report?.signals ?? {};
  const budget = signals.budget;

  const sharedCardStyle = {
    padding: '20px 22px',
    background: 'rgba(8,12,28,0.85)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    display: 'flex', flexDirection: 'column',
  };

  if (isSale) {
    return (
      <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
        <SectionLabel text="Financial Intelligence" />
        <div className="rv-quartet">
          {/* Sale price */}
          <div style={{ ...sharedCardStyle, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 15, color: 'rgba(13,216,192,0.7)', fontWeight: 700, lineHeight: 1 }}>₹</span>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.5)' }}>Sale Price Bracket</p>
            </div>
            <p style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>{budget?.bracket ?? '—'}</p>
            <VerdictPill verdict={budget?.verdict} />
            {financial?.emiEstimate && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>Est. EMI: {financial.emiEstimate} · ~8.5% 20yr loan</p>
            )}
          </div>

          {/* EMI donut */}
          {financial?.affordabilityRatio != null && (
            <div style={{ ...sharedCardStyle, alignItems: 'center', justifyContent: 'center', padding: '20px 28px' }}>
              <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.5)', marginBottom: 12 }}>EMI-to-Income</p>
              <DonutChart value={financial.affordabilityRatio} />
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Of monthly income</p>
            </div>
          )}

          {/* Down payment */}
          <div style={{ ...sharedCardStyle, flex: 1, gap: 8 }}>
            {financial?.downPaymentPercent != null && (
              <div>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Down Payment</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{financial.downPaymentPercent}%</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Of asking price</p>
              </div>
            )}
          </div>

          {/* Share / export */}
          <div style={{ ...sharedCardStyle, justifyContent: 'center', gap: 8, minWidth: 160 }}>
            <SharePDFBar sessionId={report?.sessionId} shareToken={shareToken} readonly={readonly} compact />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 860, width: '100%', margin: '0 auto 16px' }}>
      <SectionLabel text="Rental Intelligence" />
      <div className="rv-quartet">
        {/* Rental fit */}
        <div style={{ ...sharedCardStyle, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 15, color: 'rgba(13,216,192,0.7)', fontWeight: 700, lineHeight: 1 }}>₹</span>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.5)' }}>Rental Fit Assessment</p>
          </div>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>Monthly Rent Bracket</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>{budget?.bracket ?? '—'}</p>
          <VerdictPill verdict={budget?.verdict} />
          {budget?.label && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 10, lineHeight: 1.5 }}>{budget.label}</p>
          )}
        </div>

        {/* Rent-to-income donut */}
        {financial?.rentToIncomeRatio != null && (
          <div style={{ ...sharedCardStyle, alignItems: 'center', justifyContent: 'center', padding: '20px 28px' }}>
            <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.5)', marginBottom: 12 }}>Rent-to-Income</p>
            <DonutChart value={financial.rentToIncomeRatio} />
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>Of monthly income</p>
          </div>
        )}

        {/* Annual burden */}
        <div style={{ ...sharedCardStyle, flex: 1 }}>
          {financial?.annualRentBurden && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <rect x="1.5" y="5" width="11" height="7.5" rx="1.2" stroke="rgba(13,216,192,0.6)" strokeWidth="1.1"/>
                  <path d="M4.5 5V3.5C4.5 2.7 5.1 2 6 2H8C8.9 2 9.5 2.7 9.5 3.5V5" stroke="rgba(13,216,192,0.6)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1.5 8.5H12.5" stroke="rgba(13,216,192,0.4)" strokeWidth="1" strokeLinecap="round"/>
                </svg>
                <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.5)' }}>Annual Rent Burden</p>
              </div>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{financial.annualRentBurden}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>Estimated yearly</p>
              {budget?.bracket && (
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>Property is in the {budget.bracket} bracket.</p>
              )}
            </div>
          )}
        </div>

        {/* Share / export */}
        <div style={{ ...sharedCardStyle, justifyContent: 'center', gap: 8, minWidth: 160 }}>
          <SharePDFBar sessionId={report?.sessionId} shareToken={shareToken} readonly={readonly} compact />
        </div>
      </div>
    </div>
  );
}

// ─── Section 8: Final recommendation ─────────────────────────────────────────

function FinalRecommendation({ report }) {
  const summary = report?.summary ?? {};
  const redFlags = summary.totalRedFlags ?? 0;
  const cautions = summary.totalCautions ?? 0;

  const config = redFlags >= 2
    ? { title: 'REVIEW CAREFULLY',        color: '#D4645A', stars: 2, tag: 'Seek Further Information',   tagColor: 'rgba(212,100,90,0.7)',  rating: 'Needs Review'    }
    : redFlags === 1
    ? { title: 'PROCEED WITH CAUTION',    color: '#D4A853', stars: 3, tag: 'Schedule Site Visit First',  tagColor: 'rgba(212,168,83,0.7)',  rating: 'Moderate Match'  }
    : cautions >= 2
    ? { title: 'PROCEED WITH CAUTION',    color: '#D4A853', stars: 3, tag: 'Schedule Site Visit First',  tagColor: 'rgba(212,168,83,0.7)',  rating: 'Moderate Match'  }
    : { title: 'PROCEED WITH CONFIDENCE', color: '#6ECB7A', stars: 4, tag: 'Proceed to Property Visit',  tagColor: 'rgba(110,203,122,0.7)', rating: 'Strong Match'    };

  return (
    <div className="rv-final-card" style={{
      maxWidth: 860, width: '100%', margin: '0 auto 16px',
      background: 'rgba(8,12,28,0.9)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg,transparent,${config.color}40,transparent)` }} />

      <div className="rv-final-flex">
        <div style={{ flexShrink: 0, width: 56, height: 56, borderRadius: '50%', background: `${config.color}18`, border: `1px solid ${config.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={28} height={28} viewBox="0 0 28 28">
            <polygon points="14,3 17,10 25,10.5 19,16 21,24 14,20 7,24 9,16 3,10.5 11,10" fill={config.color} opacity={0.9} />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Final Recommendation</p>
          <p style={{ fontSize: 18, fontWeight: 700, color: config.color, letterSpacing: '-0.01em', marginBottom: 6 }}>{config.title}</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 300, lineHeight: 1.6, maxWidth: 420 }}>
            {report?.propertyName} demonstrates {config.stars >= 4 ? 'strong' : config.stars === 3 ? 'moderate' : 'limited'} alignment with your environmental, lifestyle, and budget preferences.
            {config.stars < 4 && ' Review flagged items before committing.'}
          </p>
        </div>

        <div className="rv-final-rating">
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 8 }}>Overall Fit Score</p>
          <StarRating count={config.stars} />
          <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>{config.rating}</p>
          <p style={{ fontSize: 10, color: config.tagColor, marginTop: 4 }}>Recommendation: {config.tag}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main ReportViewer ────────────────────────────────────────────────────────

export default function ReportViewer({ report, shareToken, readonly, preferences }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    const elements = containerRef.current.querySelectorAll('.reveal');
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, [report]);

  if (!report) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-glow-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(13,216,192,0.6)', boxShadow: '0 0 16px rgba(13,216,192,0.4)', margin: '0 auto 16px' }} />
          <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em' }}>Preparing report...</p>
        </div>
      </div>
    );
  }

  const signals = report.signals ?? {};

  return (
    <div
      id="report-content"
      ref={containerRef}
      className="rv-container"
    >
      <ReportHeader report={report} />
      <HighlightCards report={report} />
      <WhyVerdict report={report} />

      <IntelligenceMapCard report={report} />

      <WhatWeDiscovered signals={signals} report={report} />
      <AmenitySummaryCard
        amenities={signals.amenities}
        lat={report.propertyLat}
        lng={report.propertyLng}
        priorities={preferences?.step5?.amenityPriorities ?? []}
      />
      <NearbyComplexesCard nearbyComplexes={signals.nearbyComplexes} />
      <LocalIntelligence localNews={signals.localNews} />
      <DerivedIntelligence derivedSignals={signals.derivedSignals} />
      <RentalSection
        report={report}
        shareToken={shareToken}
        readonly={readonly}
        financial={report.financial}
      />
      <FinalRecommendation report={report} />
    </div>
  );
}
