// FILE: components/report/VerdictBadge.jsx
// PURPOSE: Translucent verdict pill badge — red_flag / caution / pass.
//          Uses glass-compatible token mapping from Section 2.5 §20.
//          No opaque fills, no glow, background-only differentiation.

'use client';

const STYLES = {
  red_flag: {
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    border: '1px solid var(--color-danger-border)',
  },
  caution: {
    background: 'var(--color-warning-bg)',
    color: 'var(--color-warning)',
    border: '1px solid var(--color-warning-border)',
  },
  pass: {
    background: 'var(--color-success-bg)',
    color: 'var(--color-success)',
    border: '1px solid var(--color-success-border)',
  },
};

const LABELS = {
  red_flag: 'Red flag',
  caution: 'Caution',
  pass: 'Pass',
};

export function VerdictBadge({ verdict }) {
  const style = STYLES[verdict] ?? STYLES.caution;
  const label = LABELS[verdict] ?? (verdict ? verdict.charAt(0).toUpperCase() + verdict.slice(1) : '—');

  return (
    <span
      style={{
        ...style,
        fontSize: '11px',
        fontWeight: 500,
        letterSpacing: '0.02em',
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        display: 'inline-flex',
        alignItems: 'center',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

export default VerdictBadge;
