// FILE: components/report/HyperPersonalCard.jsx
// PURPOSE: Commute + lifestyle card — Aetheris Intelligence aesthetic.
//          Two cyber panels: commute vector (big metric) and lifestyle class.

'use client';

import { VerdictBadge } from './VerdictBadge';

function RouteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="3.5" cy="5" r="2" stroke="rgba(231,197,138,0.65)" strokeWidth="1.5" />
      <circle cx="14.5" cy="13" r="2" stroke="rgba(231,197,138,0.65)" strokeWidth="1.5" />
      <path
        d="M3.5 7v2c0 2.2 1.8 4 4 4H9c2.2 0 4-1.8 4-4V7c0-2.2 1.8-4 4-4"
        stroke="rgba(231,197,138,0.4)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const COMMUTE_MODE_LABELS = {
  walking: 'Walking',
  two_wheeler: 'Two-wheeler',
  auto_rickshaw: 'Auto-rickshaw',
  car: 'Car',
  public_transport: 'Public transport',
};

const LIFESTYLE_DESCRIPTIONS = {
  remote: 'Remote worker — proximity to cafes and parks weighted higher.',
  family: 'Family household — schools and hospitals weighted higher.',
  student: 'Student — cafes, gyms, and connectivity weighted higher.',
  professional: 'Professional — gyms, cafes, and quick commutes weighted higher.',
  retired: 'Retired — hospitals, parks, and quiet areas weighted higher.',
};

const WFH_DESCRIPTIONS = {
  'full-time': 'Full-time remote — commute verdict auto-pass.',
  hybrid: 'Hybrid — commute assessed for office days.',
  no: 'On-site — daily commute assessed.',
};

const LIFESTYLE_TAGS = {
  remote: ['Remote-friendly', 'Cafe proximity', 'Park access'],
  family: ['School zones', 'Hospital access', 'Safe streets'],
  student: ['Transit access', 'Cafe density', 'Affordable area'],
  professional: ['Gym access', 'Quick commute', 'Connectivity'],
  retired: ['Hospital nearby', 'Parks', 'Quiet zone'],
};

export default function HyperPersonalCard({ commute, preferences }) {
  const estimatedMins = commute?.estimatedMins ?? null;
  const wfhStatus = preferences?.step1?.wfhStatus;
  const commuteMode = preferences?.step1?.commuteMode;
  const maxCommuteMinutes = preferences?.step1?.maxCommuteMinutes;
  const lifestyleType = preferences?.step2?.lifestyleType;

  const isWfhFullTime = wfhStatus === 'full-time';
  const lifestyleTags = lifestyleType ? (LIFESTYLE_TAGS[lifestyleType] ?? []) : [];

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
            Personal Matrix
          </p>
          <p
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Commute &amp; Lifestyle
          </p>
        </div>
        <RouteIcon />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Commute vector panel */}
        <div
          style={{
            padding: '20px',
            background: 'rgba(11,11,11,0.6)',
            border: '1px solid rgba(231,197,138,0.08)',
            borderRadius: '14px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Corner glow */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '80px',
              height: '80px',
              background:
                'radial-gradient(circle at top right, rgba(231,197,138,0.06) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          <p
            style={{
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(231,197,138,0.45)',
              marginBottom: '14px',
            }}
          >
            Commute Vector
          </p>

          {/* Main commute metric */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '8px',
              marginBottom: '14px',
              flexWrap: 'wrap',
            }}
          >
            {!isWfhFullTime && estimatedMins !== null ? (
              <>
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
                  {estimatedMins}
                </span>
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 300,
                    color: 'rgba(231,197,138,0.55)',
                    paddingBottom: '10px',
                    letterSpacing: '0.06em',
                  }}
                >
                  min
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.3)',
                    paddingBottom: '10px',
                  }}
                >
                  estimated
                </span>
              </>
            ) : isWfhFullTime ? (
              <span
                style={{
                  fontSize: '22px',
                  fontWeight: 500,
                  color: 'rgba(231,197,138,0.75)',
                }}
              >
                Full-time remote
              </span>
            ) : (
              <span
                style={{
                  fontSize: '16px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.35)',
                }}
              >
                Commute data pending
              </span>
            )}
            {commute?.verdict && (
              <div style={{ paddingBottom: isWfhFullTime ? '0' : '10px' }}>
                <VerdictBadge verdict={commute.verdict} />
              </div>
            )}
          </div>

          {/* Commute label */}
          {commute?.label && (
            <p
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.55,
                marginBottom: '14px',
              }}
            >
              {commute.label}
            </p>
          )}

          {/* Context row */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flexWrap: 'wrap',
            }}
          >
            {commuteMode && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.38)',
                    marginBottom: '3px',
                  }}
                >
                  Mode
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {COMMUTE_MODE_LABELS[commuteMode] ?? commuteMode}
                </p>
              </div>
            )}
            {maxCommuteMinutes && !isWfhFullTime && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.38)',
                    marginBottom: '3px',
                  }}
                >
                  Max Acceptable
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {maxCommuteMinutes} min
                </p>
              </div>
            )}
            {wfhStatus && (
              <div>
                <p
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(231,197,138,0.38)',
                    marginBottom: '3px',
                  }}
                >
                  Work Style
                </p>
                <p
                  style={{
                    fontSize: '13px',
                    fontWeight: 400,
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {WFH_DESCRIPTIONS[wfhStatus]?.split(' — ')[0] ?? wfhStatus}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Lifestyle class panel */}
        {lifestyleType && (
          <div
            style={{
              padding: '18px 20px',
              background: 'rgba(11,11,11,0.55)',
              border: '1px solid rgba(231,197,138,0.07)',
              borderRadius: '14px',
            }}
          >
            <p
              style={{
                fontSize: '9px',
                fontWeight: 500,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(231,197,138,0.45)',
                marginBottom: '10px',
              }}
            >
              Lifestyle Class
            </p>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                textTransform: 'capitalize',
                marginBottom: '6px',
              }}
            >
              {lifestyleType}
            </p>
            <p
              style={{
                fontSize: '12px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.6,
                marginBottom: lifestyleTags.length ? '12px' : '0',
              }}
            >
              {LIFESTYLE_DESCRIPTIONS[lifestyleType] ?? ''}
            </p>
            {lifestyleTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {lifestyleTags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: '10px',
                      fontWeight: 400,
                      letterSpacing: '0.04em',
                      padding: '3px 10px',
                      borderRadius: '9999px',
                      background: 'rgba(231,197,138,0.07)',
                      border: '1px solid rgba(231,197,138,0.18)',
                      color: 'rgba(231,197,138,0.65)',
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
