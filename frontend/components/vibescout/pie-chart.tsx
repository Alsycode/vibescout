'use client';

export default function PieChart() {
  const cx = 52;
  const cy = 52;
  const r = 40;
  const slice1End = 0.85;

  const toXY = (pct: number) => {
    const angle = pct * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const s0 = toXY(0);
  const s1 = toXY(slice1End);

  // 85% gold slice (large arc)
  const goldPath = [
    `M ${cx} ${cy}`,
    `L ${s0.x} ${s0.y}`,
    `A ${r} ${r} 0 1 1 ${s1.x} ${s1.y}`,
    'Z',
  ].join(' ');

  // 15% remainder slice
  const remainPath = [
    `M ${cx} ${cy}`,
    `L ${s1.x} ${s1.y}`,
    `A ${r} ${r} 0 0 1 ${s0.x} ${s0.y}`,
    'Z',
  ].join(' ');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <svg width="104" height="104" viewBox="0 0 104 104" fill="none" aria-label="Financial verdicts pie chart">
        <defs>
          <filter id="pie-glow-f">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="gold-rad" cx="38%" cy="32%" r="70%">
            <stop offset="0%" stopColor="#F0CE82" />
            <stop offset="100%" stopColor="#B8920A" />
          </radialGradient>
        </defs>

        {/* Remainder slice */}
        <path d={remainPath} fill="#2a2310" />

        {/* Gold slice — filled, no inner radius */}
        <path d={goldPath} fill="url(#gold-rad)" filter="url(#pie-glow-f)" />

        {/* Divider lines */}
        <line x1={cx} y1={cy} x2={s0.x} y2={s0.y} stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
        <line x1={cx} y1={cy} x2={s1.x} y2={s1.y} stroke="rgba(0,0,0,0.6)" strokeWidth="1.5" />
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D4AF37', flexShrink: 0 }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
            Investment Potential (85%)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4a4030', flexShrink: 0 }} />
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', fontFamily: "'Outfit', sans-serif" }}>
            Market Value Trend (+6% YOY)
          </span>
        </div>
      </div>
    </div>
  );
}
