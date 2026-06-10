'use client';

interface MiniChartProps {
  points: number[];
  width?: number;
  height?: number;
}

export default function MiniChart({ points, width = 70, height = 28 }: MiniChartProps) {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const padX = 2;
  const padY = 3;
  const w = width - padX * 2;
  const h = height - padY * 2;

  const coords = points.map((p, i) => {
    const x = padX + (i / (points.length - 1)) * w;
    const y = padY + h - ((p - min) / range) * h;
    return `${x},${y}`;
  });

  const pathD = `M ${coords.join(' L ')}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
      <defs>
        <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <polyline
        points={coords.join(' ')}
        stroke="rgba(216,181,106,0.25)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={coords.join(' ')}
        stroke="#D8B56A"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#gold-glow)"
      />
      {/* Terminal dot */}
      {points.length > 0 && (() => {
        const last = coords[coords.length - 1].split(',');
        return (
          <circle
            cx={parseFloat(last[0])}
            cy={parseFloat(last[1])}
            r="1.5"
            fill="#D8B56A"
            filter="url(#gold-glow)"
          />
        );
      })()}
    </svg>
  );
}
