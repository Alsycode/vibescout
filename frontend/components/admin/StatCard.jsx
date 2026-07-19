'use client';

export default function StatCard({ label, value, sublabel, accentColor, icon: Icon, trend }) {
  const color = accentColor || 'var(--color-accent)';

  return (
    <div
      className="admin-stat-card"
      style={{ borderTopColor: color.startsWith('#') ? `${color}50` : undefined }}
    >
      {/* Top row: label + icon */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '14px',
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.32)',
        }}>
          {label}
        </p>
        {Icon && (
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={13} color={color} strokeWidth={1.75} />
          </div>
        )}
      </div>

      {/* Value */}
      <p style={{
        fontSize: '32px',
        fontWeight: 700,
        color: color,
        lineHeight: 1,
        letterSpacing: '-0.03em',
        fontVariantNumeric: 'tabular-nums',
        textShadow: `0 0 20px ${color.startsWith('var') ? 'rgba(13,216,192,0.25)' : `${color}30`}`,
      }}>
        {value ?? '—'}
      </p>

      {/* Bottom: sublabel + optional trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        {sublabel && (
          <p style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.28)',
          }}>
            {sublabel}
          </p>
        )}
        {trend && (
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: trend > 0 ? '#34D399' : '#E63946',
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Subtle accent glow strip at bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${color.startsWith('#') ? color : '#0DD8C0'}18 50%, transparent 100%)`,
        borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
