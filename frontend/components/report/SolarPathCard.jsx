// FILE: components/report/SolarPathCard.jsx
// PURPOSE: Solar viability card — Aetheris Intelligence aesthetic.
//          Peak sun hours as large metric, viability tags, optional sub-metrics.

'use client';

import { VerdictBadge } from './VerdictBadge';
import { DataSourceLabel } from './DataSourceLabel';

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="4" stroke="rgba(231,197,138,0.65)" strokeWidth="1.5" />
      <line x1="10" y1="1" x2="10" y2="3.5" stroke="rgba(231,197,138,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="16.5" x2="10" y2="19" stroke="rgba(231,197,138,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="10" x2="3.5" y2="10" stroke="rgba(231,197,138,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16.5" y1="10" x2="19" y2="10" stroke="rgba(231,197,138,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.22" y1="3.22" x2="5" y2="5" stroke="rgba(231,197,138,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="15" x2="16.78" y2="16.78" stroke="rgba(231,197,138,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16.78" y1="3.22" x2="15" y2="5" stroke="rgba(231,197,138,0.35)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="15" x2="3.22" y2="16.78" stroke="rgba(231,197,138,0.35)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const VIABILITY_DESCRIPTION = {
  Good: 'Excellent solar exposure — strong panel viability and natural morning light.',
  Moderate: 'Adequate solar exposure for most of the year.',
  Poor: 'Limited direct sunlight — solar panels less effective at this location.',
};

const VIABILITY_COLOR = {
  Good: 'rgba(231,197,138,0.75)',
  Moderate: 'rgba(212,168,83,0.75)',
  Poor: 'rgba(212,100,90,0.75)',
};

const VIABILITY_BG = {
  Good: 'rgba(231,197,138,0.08)',
  Moderate: 'rgba(212,168,83,0.08)',
  Poor: 'rgba(212,100,90,0.08)',
};

const VIABILITY_BORDER = {
  Good: 'rgba(231,197,138,0.22)',
  Moderate: 'rgba(212,168,83,0.22)',
  Poor: 'rgba(212,100,90,0.22)',
};

export default function SolarPathCard({ solar }) {
  const peakHours = solar?.peakSunHours ?? null;
  const viability = solar?.viability ?? null;

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
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
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
            Solar Intelligence
          </p>
          <p
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Natural Light &amp; Solar Potential
          </p>
        </div>
        <SunIcon />
      </div>

      {/* Main metric panel */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(11,11,11,0.6)',
          border: '1px solid rgba(231,197,138,0.08)',
          borderRadius: '14px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '12px',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '100px',
            height: '100px',
            background:
              'radial-gradient(circle at top right, rgba(231,197,138,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Peak hours metric */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px',
            marginBottom: '14px',
          }}
        >
          <span
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.95)',
              lineHeight: 1,
              letterSpacing: '-0.03em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {peakHours !== null ? peakHours : '—'}
          </span>
          <div style={{ paddingBottom: '10px' }}>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 300,
                color: 'rgba(231,197,138,0.55)',
                letterSpacing: '0.06em',
              }}
            >
              hrs
            </span>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.3)',
                marginLeft: '4px',
              }}
            >
              / day
            </span>
          </div>
          {solar?.verdict && (
            <div style={{ paddingBottom: '10px', marginLeft: '4px' }}>
              <VerdictBadge verdict={solar.verdict} />
            </div>
          )}
        </div>

        {/* Viability tag */}
        {viability && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.06em',
                padding: '4px 12px',
                borderRadius: '9999px',
                background: VIABILITY_BG[viability] ?? 'rgba(231,197,138,0.08)',
                border: `1px solid ${VIABILITY_BORDER[viability] ?? 'rgba(231,197,138,0.22)'}`,
                color: VIABILITY_COLOR[viability] ?? 'rgba(231,197,138,0.8)',
              }}
            >
              {viability} Viability
            </span>
          </div>
        )}

        {/* Viability description */}
        {viability && VIABILITY_DESCRIPTION[viability] && (
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.38)',
              lineHeight: 1.6,
              marginBottom: solar?.label ? '10px' : '0',
            }}
          >
            {VIABILITY_DESCRIPTION[viability]}
          </p>
        )}

        {/* GROQ label */}
        {solar?.label && (
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.38)',
              lineHeight: 1.55,
            }}
          >
            {solar.label}
          </p>
        )}

        <div style={{ marginTop: '12px' }}>
          <DataSourceLabel source={solar?.source} updatedAt={solar?.updatedAt} />
        </div>
      </div>

      {/* Additional sub-metrics */}
      {(solar?.morningScore != null || solar?.acSavingsEstimate != null) && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {solar?.morningScore != null && (
            <div
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '14px 16px',
                background: 'rgba(11,11,11,0.55)',
                border: '1px solid rgba(231,197,138,0.07)',
                borderRadius: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(231,197,138,0.45)',
                  marginBottom: '6px',
                }}
              >
                Morning Score
              </p>
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1,
                }}
              >
                {solar.morningScore}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.35)',
                    marginLeft: '4px',
                  }}
                >
                  / 10
                </span>
              </p>
            </div>
          )}
          {solar?.acSavingsEstimate != null && (
            <div
              style={{
                flex: 1,
                minWidth: '130px',
                padding: '14px 16px',
                background: 'rgba(11,11,11,0.55)',
                border: '1px solid rgba(231,197,138,0.07)',
                borderRadius: '12px',
              }}
            >
              <p
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(231,197,138,0.45)',
                  marginBottom: '6px',
                }}
              >
                AC Saving Potential
              </p>
              <p
                style={{
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: 1,
                }}
              >
                {solar.acSavingsEstimate}
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.35)',
                    marginLeft: '4px',
                  }}
                >
                  est.
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
