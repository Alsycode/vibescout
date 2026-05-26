// FILE: components/admin/StatCard.jsx
// PURPOSE: Admin dashboard stat card — glass-subtle, single accent-colored number,
//          glow-gold-sm on number only. No gradients per admin panel rules.

'use client';

export default function StatCard({ label, value, sublabel, accentColor }) {
  const color = accentColor || 'var(--color-accent)';

  return (
    <div
      className="glass-subtle"
      style={{
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
        flex: 1,
        minWidth: '180px',
      }}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-muted)',
          marginBottom: 'var(--space-sm)',
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: '28px',
          fontWeight: 500,
          color: color,
          lineHeight: 1,
          textShadow: `0 0 12px ${color}33`,
          marginBottom: sublabel ? 'var(--space-xs)' : 0,
        }}
      >
        {value ?? '—'}
      </p>
      {sublabel && (
        <p
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '2px',
          }}
        >
          {sublabel}
        </p>
      )}
    </div>
  );
}
