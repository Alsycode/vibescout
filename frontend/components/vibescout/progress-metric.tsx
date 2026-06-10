'use client';

interface ProgressMetricProps {
  label: string;
  value: string;
  fill: number; // 0–1
}

export default function ProgressMetric({ label, value, fill }: ProgressMetricProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontSize: '11px', fontWeight: 400,
          color: 'rgba(245,242,234,0.65)',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {label}
        </span>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: '#F5F2EA',
          fontFamily: "'Outfit', sans-serif",
        }}>
          {value}
        </span>
      </div>
      <div style={{
        height: '3px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(100, fill * 100)}%`,
          height: '100%',
          background: 'linear-gradient(90deg, rgba(216,181,106,0.7), #D8B56A)',
          borderRadius: '2px',
          boxShadow: '0 0 6px rgba(216,181,106,0.4)',
        }} />
      </div>
    </div>
  );
}
