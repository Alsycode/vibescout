// FILE: components/report/CommunityPulseCard.jsx
// PURPOSE: Community intelligence placeholder — Aetheris aesthetic.
//          Cyber coming-soon card with initializing status indicator.

'use client';

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1.5" stroke="rgba(231,197,138,0.55)" strokeWidth="1.5" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1.5" stroke="rgba(231,197,138,0.35)" strokeWidth="1.5" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1.5" stroke="rgba(231,197,138,0.35)" strokeWidth="1.5" />
      <rect x="10.5" y="10.5" width="6" height="6" rx="1.5" stroke="rgba(231,197,138,0.2)" strokeWidth="1.5" strokeDasharray="2 2" />
    </svg>
  );
}

export default function CommunityPulseCard() {
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
            Community Intelligence
          </p>
          <p
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Community Pulse
          </p>
        </div>
        <GridIcon />
      </div>

      {/* Status panel */}
      <div
        style={{
          padding: '20px',
          background: 'rgba(11,11,11,0.55)',
          border: '1px solid rgba(231,197,138,0.07)',
          borderLeft: '2px solid rgba(231,197,138,0.2)',
          borderRadius: '0 12px 12px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px',
        }}
      >
        {/* Pulsing status dot */}
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'rgba(231,197,138,0.5)',
            boxShadow: '0 0 10px rgba(231,197,138,0.3)',
            flexShrink: 0,
            marginTop: '5px',
          }}
          className="animate-glow-pulse"
        />
        <div>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '6px',
            }}
          >
            Community intelligence coming soon
          </p>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.35)',
              lineHeight: 1.6,
              marginBottom: '14px',
            }}
          >
            Resident sentiment, area activity, and neighbourhood character signals are in development.
          </p>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '3px 10px',
              borderRadius: '9999px',
              background: 'rgba(231,197,138,0.06)',
              border: '1px solid rgba(231,197,138,0.15)',
              color: 'rgba(231,197,138,0.45)',
            }}
          >
            Status: Initializing
          </span>
        </div>
      </div>
    </div>
  );
}
