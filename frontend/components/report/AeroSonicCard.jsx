// FILE: components/report/AeroSonicCard.jsx
// PURPOSE: Noise + AQI combined card — Aetheris Intelligence design.
//          Two side-by-side metric panels matching the ATMOSPHERIC QUALITY / ACOUSTIC PROFILE
//          screenshot aesthetic. Large numbers, teal icons, progress bars, verdict tags.

'use client';

import { VerdictBadge } from './VerdictBadge';
import { DataSourceLabel } from './DataSourceLabel';

function WindIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 6.5h9c1.4 0 2.5-1.1 2.5-2.5S12.4 1.5 11 1.5"
        stroke="rgba(231,197,138,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 9.5h6.5"
        stroke="rgba(231,197,138,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M2 12.5h9c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5"
        stroke="rgba(231,197,138,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="1,9 4,9 5.5,3.5 7,14.5 8.5,9 11,9 12.5,5.5 14,12.5 15.5,9 17,9"
        stroke="rgba(231,197,138,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricBar({ value, max, verdict }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor =
    verdict === 'pass'
      ? 'rgba(231,197,138,0.75)'
      : verdict === 'caution'
      ? 'rgba(212,168,83,0.75)'
      : verdict === 'red_flag'
      ? 'rgba(212,100,90,0.75)'
      : 'rgba(231,197,138,0.55)';
  const barGlow =
    verdict === 'pass'
      ? 'rgba(231,197,138,0.4)'
      : verdict === 'caution'
      ? 'rgba(212,168,83,0.4)'
      : verdict === 'red_flag'
      ? 'rgba(212,100,90,0.4)'
      : 'rgba(231,197,138,0.3)';

  return (
    <div
      style={{
        height: '3px',
        background: 'rgba(231,197,138,0.08)',
        borderRadius: '2px',
        overflow: 'hidden',
        marginBottom: '14px',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: barColor,
          borderRadius: '2px',
          boxShadow: `0 0 8px ${barGlow}`,
        }}
      />
    </div>
  );
}

function AeroPanel({ title, icon, value, unit, verdict, category, groqLabel, source, updatedAt, barMax }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: '200px',
        padding: '20px',
        background: 'rgba(11,11,11,0.6)',
        border: '1px solid rgba(231,197,138,0.08)',
        borderRadius: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Corner radial glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '80px',
          height: '80px',
          background:
            'radial-gradient(circle at top right, rgba(231,197,138,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '18px',
        }}
      >
        <p
          style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.6)',
            lineHeight: 1.4,
            maxWidth: '140px',
          }}
        >
          {title}
        </p>
        {icon}
      </div>

      {/* Big metric value */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '6px',
          marginBottom: '10px',
        }}
      >
        <span
          style={{
            fontSize: '52px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.95)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value !== null ? value : '—'}
        </span>
        <span
          style={{
            fontSize: '14px',
            fontWeight: 300,
            color: 'rgba(231,197,138,0.55)',
            paddingBottom: '8px',
            letterSpacing: '0.06em',
          }}
        >
          {unit}
        </span>
      </div>

      {/* Progress bar */}
      {value !== null && barMax != null && (
        <MetricBar value={value} max={barMax} verdict={verdict} />
      )}

      {/* Verdict + category */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '10px',
          flexWrap: 'wrap',
        }}
      >
        {verdict && <VerdictBadge verdict={verdict} />}
        {category && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.42)',
            }}
          >
            {category}
          </span>
        )}
      </div>

      {/* GROQ label */}
      {groqLabel && (
        <p
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.55,
            marginBottom: '8px',
          }}
        >
          {groqLabel}
        </p>
      )}

      <DataSourceLabel source={source} updatedAt={updatedAt} />
    </div>
  );
}

export default function AeroSonicCard({ noise, aqi }) {
  const noiseDb = noise?.estimatedDb ?? null;
  const aqiValue = aqi?.value ?? null;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{
        padding: '24px',
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Card header */}
      <div style={{ marginBottom: '20px' }}>
        <p
          style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.55)',
            marginBottom: '5px',
          }}
        >
          Aerosonic Environment
        </p>
        <p
          style={{
            fontSize: '17px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          Noise &amp; Air Quality
        </p>
      </div>

      {/* Two metric panels */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <AeroPanel
          title="Atmospheric Quality"
          icon={<WindIcon />}
          value={aqiValue}
          unit="AQI"
          verdict={aqi?.verdict}
          category={aqi?.category}
          groqLabel={aqi?.label}
          source={aqi?.source}
          updatedAt={aqi?.updatedAt}
          barMax={300}
        />
        <AeroPanel
          title="Acoustic Profile"
          icon={<PulseIcon />}
          value={noiseDb}
          unit="dB"
          verdict={noise?.verdict}
          category={noise?.category}
          groqLabel={noise?.label}
          source={noise?.source}
          updatedAt={noise?.updatedAt}
          barMax={90}
        />
      </div>
    </div>
  );
}
