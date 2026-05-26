// FILE: components/admin/ClusterHealthBadge.jsx
// PURPOSE: Visual badge showing cluster freshness state — fresh / stale / cold.
//          Derived from updatedAt timestamps on cluster signal data.

'use client';

const STATES = {
  fresh: {
    label: 'Fresh',
    bg: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: 'var(--color-success-border)',
    dot: 'var(--color-success)',
  },
  stale: {
    label: 'Stale',
    bg: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    border: 'var(--color-warning-border)',
    dot: 'var(--color-warning)',
  },
  cold: {
    label: 'No data',
    bg: 'rgba(255,255,255,0.04)',
    color: 'var(--color-text-muted)',
    border: 'rgba(255,255,255,0.07)',
    dot: 'var(--color-text-muted)',
  },
};

// TTL thresholds (matches cron schedules from spec Section 5)
const FRESH_TTL_MS = 26 * 60 * 60 * 1000; // 26h — AQI/weather run daily
const STALE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days — stale but has data

export function deriveClusterState(updatedAt) {
  if (!updatedAt) return 'cold';
  const age = Date.now() - new Date(updatedAt).getTime();
  if (age < FRESH_TTL_MS) return 'fresh';
  if (age < STALE_TTL_MS) return 'stale';
  return 'cold';
}

export default function ClusterHealthBadge({ state, updatedAt, showAge = false }) {
  const resolved = state ?? deriveClusterState(updatedAt);
  const s = STATES[resolved] ?? STATES.cold;

  let ageText = null;
  if (showAge && updatedAt) {
    const ms = Date.now() - new Date(updatedAt).getTime();
    const hours = Math.round(ms / (1000 * 60 * 60));
    if (hours < 24) {
      ageText = `${hours}h ago`;
    } else {
      const days = Math.round(hours / 24);
      ageText = `${days}d ago`;
    }
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          fontWeight: 500,
          padding: '3px 10px',
          borderRadius: 'var(--radius-pill)',
          background: s.bg,
          color: s.color,
          border: `1px solid ${s.border}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: s.dot,
            flexShrink: 0,
          }}
        />
        {s.label}
      </span>
      {showAge && ageText && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
          }}
        >
          {ageText}
        </span>
      )}
    </div>
  );
}
