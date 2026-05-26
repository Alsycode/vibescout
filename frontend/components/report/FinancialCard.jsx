// FILE: components/report/FinancialCard.jsx
// PURPOSE: Sale-only financial card — Aetheris Intelligence aesthetic.
//          Teal accent top line, budget bracket as large metric, cyber metric grid.

'use client';

import { VerdictBadge } from './VerdictBadge';

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 14L6 9l3 3 4-5 3 3"
        stroke="rgba(231,197,138,0.65)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="2" y1="16" x2="16" y2="16" stroke="rgba(231,197,138,0.3)" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

function MetricBlock({ label, value, unit, sublabel }) {
  if (value == null) return null;
  return (
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
        {label}
      </p>
      <p
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: 'rgba(255,255,255,0.9)',
          lineHeight: 1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.35)',
              marginLeft: '4px',
            }}
          >
            {unit}
          </span>
        )}
      </p>
      {sublabel && (
        <p
          style={{
            fontSize: '10px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.28)',
            marginTop: '3px',
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}

export default function FinancialCard({ budget, financial, financialNote }) {
  const affordabilityRatio = financial?.affordabilityRatio ?? null;
  const emiEstimate = financial?.emiEstimate ?? null;
  const downPaymentPercent = financial?.downPaymentPercent ?? null;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{
        padding: '24px',
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Teal top accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent 0%, rgba(231,197,138,0.5) 50%, transparent 100%)',
        }}
      />

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
            Financial Intelligence
          </p>
          <p
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Budget &amp; Affordability
          </p>
        </div>
        <ChartIcon />
      </div>

      {/* Budget verdict panel */}
      <div
        style={{
          padding: '18px 20px',
          background: 'rgba(11,11,11,0.6)',
          border: '1px solid rgba(231,197,138,0.08)',
          borderRadius: '14px',
          marginBottom: '12px',
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
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.42)',
            marginBottom: '8px',
          }}
        >
          Asking Price Bracket
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: budget?.label ? '12px' : '0',
          }}
        >
          <p
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.92)',
            }}
          >
            {budget?.bracket ?? '—'}
          </p>
          {budget?.verdict && <VerdictBadge verdict={budget.verdict} />}
        </div>
        {budget?.label && (
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.6,
            }}
          >
            {budget.label}
          </p>
        )}
      </div>

      {/* Financial metrics grid */}
      {(affordabilityRatio != null || emiEstimate != null || downPaymentPercent != null) && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '12px',
          }}
        >
          <MetricBlock
            label="Affordability Ratio"
            value={affordabilityRatio != null ? `${affordabilityRatio}%` : null}
            sublabel="Income-to-EMI ratio"
          />
          <MetricBlock
            label="Est. EMI"
            value={emiEstimate}
            sublabel="80% loan, 8.5% rate"
          />
          <MetricBlock
            label="Down Payment"
            value={downPaymentPercent != null ? `${downPaymentPercent}%` : null}
            sublabel="Of asking price"
          />
        </div>
      )}

      {/* GROQ financial note */}
      {financialNote && (
        <div
          style={{
            borderTop: '1px solid rgba(231,197,138,0.07)',
            paddingTop: '14px',
          }}
        >
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.4)',
              lineHeight: 1.7,
            }}
          >
            {financialNote}
          </p>
        </div>
      )}
    </div>
  );
}
