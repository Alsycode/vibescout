// FILE: components/admin/LeadScoreBar.jsx
// PURPOSE: Visual score bar 0–100 — color shifts by tier (hot/warm/lukewarm/cold).
//          Used in lead list and lead detail views.

'use client';

const TIER_COLORS = {
  hot: 'var(--color-danger)',
  warm: 'var(--color-warning)',
  lukewarm: 'var(--color-accent)',
  cold: 'var(--color-text-muted)',
};

const TIER_BG = {
  hot: 'rgba(212,100,90,0.12)',
  warm: 'rgba(212,168,83,0.12)',
  lukewarm: 'rgba(231,197,138,0.10)',
  cold: 'rgba(255,255,255,0.04)',
};

function scoreTier(score) {
  if (score >= 80) return 'hot';
  if (score >= 60) return 'warm';
  if (score >= 40) return 'lukewarm';
  return 'cold';
}

export default function LeadScoreBar({ score, tier, showLabel = true, compact = false }) {
  const resolvedTier = tier || scoreTier(score ?? 0);
  const fillColor = TIER_COLORS[resolvedTier] ?? TIER_COLORS.cold;
  const trackBg = TIER_BG[resolvedTier] ?? TIER_BG.cold;
  const pct = Math.min(100, Math.max(0, score ?? 0));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
            }}
          >
            Lead Score
          </span>
          <span
            style={{
              fontSize: compact ? '14px' : '18px',
              fontWeight: 500,
              color: fillColor,
              textShadow: `0 0 8px ${fillColor}22`,
            }}
          >
            {pct}
            <span
              style={{
                fontSize: '11px',
                fontWeight: 300,
                color: 'var(--color-text-muted)',
                marginLeft: '2px',
              }}
            >
              / 100
            </span>
          </span>
        </div>
      )}

      {/* Track */}
      <div
        style={{
          height: compact ? '4px' : '6px',
          borderRadius: '3px',
          background: trackBg,
          border: `1px solid ${fillColor}22`,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${pct}%`,
            background: fillColor,
            borderRadius: '3px',
            transition: 'width 0.6s var(--ease-smooth)',
            boxShadow: `0 0 8px ${fillColor}44`,
          }}
        />
      </div>

      {showLabel && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 400,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: fillColor,
          }}
        >
          {resolvedTier}
        </span>
      )}
    </div>
  );
}
