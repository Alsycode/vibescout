// FILE: components/report/VibeSummaryCard.jsx
// PURPOSE: Hero summary card — Aetheris Intelligence aesthetic.
//          Cyber-elevated glass card, scan icon, teal keyword pills, flag count blocks.

'use client';

import { VerdictBadge } from './VerdictBadge';

function ScanIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="9.25" stroke="rgba(231,197,138,0.35)" strokeWidth="1" />
      <circle cx="11" cy="11" r="6" stroke="rgba(231,197,138,0.2)" strokeWidth="1" />
      <circle cx="11" cy="11" r="2.5" fill="rgba(231,197,138,0.55)" />
      <line x1="11" y1="1.5" x2="11" y2="5.5" stroke="rgba(231,197,138,0.4)" strokeWidth="1" />
      <line x1="11" y1="16.5" x2="11" y2="20.5" stroke="rgba(231,197,138,0.4)" strokeWidth="1" />
      <line x1="1.5" y1="11" x2="5.5" y2="11" stroke="rgba(231,197,138,0.4)" strokeWidth="1" />
      <line x1="16.5" y1="11" x2="20.5" y2="11" stroke="rgba(231,197,138,0.4)" strokeWidth="1" />
    </svg>
  );
}

function FlagBlock({ label, count, dotColor, glowColor }) {
  if (!count) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        background: 'rgba(11,11,11,0.6)',
        border: '1px solid rgba(231,197,138,0.07)',
        borderRadius: '10px',
      }}
    >
      <span
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          background: dotColor,
          boxShadow: `0 0 8px ${glowColor}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.92)',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontSize: '10px',
          fontWeight: 400,
          color: 'rgba(255,255,255,0.4)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function VibeSummaryCard({ report }) {
  const headline = report?.headline ?? 'Your property analysis is ready.';
  const matchKeywords = report?.matchKeywords ?? [];
  const verdict = report?.verdict;
  const summary = report?.summary ?? {};
  const propertyName = report?.propertyName;

  return (
    <div
      className="glass-cyber-elevated reveal"
      style={{
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
        padding: '36px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(231,197,138,0.32)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(231,197,138,0.16)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(231,197,138,0.55) 50%, transparent 100%)',
        }}
      />

      {/* Corner radial glow */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '180px',
          height: '180px',
          background:
            'radial-gradient(circle at top right, rgba(231,197,138,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '28px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(231,197,138,0.65)',
              marginBottom: '5px',
            }}
          >
            Vibe Intelligence
          </p>
          {propertyName && (
            <p
              style={{
                fontSize: '13px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              {propertyName}
            </p>
          )}
        </div>
        <div
          className="animate-glow-pulse"
          style={{ opacity: 0.8, marginTop: '2px' }}
        >
          <ScanIcon />
        </div>
      </div>

      {/* Headline */}
      <h1
        style={{
          fontSize: '30px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.95)',
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
          marginBottom: '24px',
        }}
      >
        {headline}
      </h1>

      {/* Match keywords */}
      {matchKeywords.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          {matchKeywords.map((kw, i) => (
            <span
              key={i}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 13px',
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: 'rgba(231,197,138,0.85)',
                background: 'rgba(231,197,138,0.08)',
                border: '1px solid rgba(231,197,138,0.22)',
                borderRadius: '9999px',
                whiteSpace: 'nowrap',
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {/* Verdict text */}
      {verdict && (
        <div
          style={{
            padding: '14px 16px',
            background: 'rgba(11,11,11,0.55)',
            border: '1px solid rgba(231,197,138,0.08)',
            borderLeft: '2px solid rgba(231,197,138,0.35)',
            borderRadius: '0 10px 10px 0',
            marginBottom: '28px',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.62)',
              lineHeight: 1.7,
            }}
          >
            {verdict}
          </p>
        </div>
      )}

      {/* Flag scan results */}
      <div
        style={{
          borderTop: '1px solid rgba(231,197,138,0.08)',
          paddingTop: '20px',
        }}
      >
        <p
          style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.4)',
            marginBottom: '12px',
          }}
        >
          Flag Scan Results
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <FlagBlock
            label={summary.totalRedFlags === 1 ? 'Red Flag' : 'Red Flags'}
            count={summary.totalRedFlags}
            dotColor="#D4645A"
            glowColor="rgba(212,100,90,0.6)"
          />
          <FlagBlock
            label={summary.totalCautions === 1 ? 'Caution' : 'Cautions'}
            count={summary.totalCautions}
            dotColor="#D4A853"
            glowColor="rgba(212,168,83,0.6)"
          />
          <FlagBlock
            label={summary.totalPasses === 1 ? 'Pass' : 'Passes'}
            count={summary.totalPasses}
            dotColor="#6ECB7A"
            glowColor="rgba(110,203,122,0.6)"
          />
          {!summary.totalRedFlags && !summary.totalCautions && !summary.totalPasses && (
            <p
              style={{
                fontSize: '13px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.28)',
                padding: '8px 0',
              }}
            >
              Verdict summary pending
            </p>
          )}
        </div>
      </div>

      {/* Bottom metadata */}
      {report?.listingType && (
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '3px 11px',
              borderRadius: '9999px',
              background: 'rgba(231,197,138,0.08)',
              border: '1px solid rgba(231,197,138,0.2)',
              color: 'rgba(231,197,138,0.7)',
            }}
          >
            {report.listingType === 'sale' ? 'For Sale' : 'For Rent'}
          </span>
          {report?.generatedAt && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 300,
                color: 'rgba(255,255,255,0.28)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {new Date(report.generatedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
