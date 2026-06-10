'use client';

import MiniChart from './mini-chart';

interface Milestone {
  label: string;
  time: string;
  icon: React.ReactNode;
  temp: string;
  meta1Label: string;
  meta1Value: string;
  meta2Label: string;
  meta2Value: string;
  chartPoints: number[];
}

interface TimelineMilestoneProps {
  milestones: Milestone[];
}

export default function TimelineMilestones({ milestones }: TimelineMilestoneProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {milestones.map((m, i) => (
        <div
          key={i}
          style={{
            padding: '16px 20px 14px',
            borderRight: i < milestones.length - 1 ? '1px solid rgba(255,255,255,0.06)' : undefined,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {/* Icon + dot row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Icon button */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(216,181,106,0.08)',
              border: '1px solid rgba(216,181,106,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {m.icon}
            </div>
            {/* Dot + line */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#D8B56A',
                boxShadow: '0 0 6px rgba(216,181,106,0.5)',
                flexShrink: 0,
              }} />
              <div style={{ flex: 1, height: '1px', background: 'rgba(216,181,106,0.15)' }} />
            </div>
          </div>

          {/* Label */}
          <div style={{
            fontSize: '9px',
            fontWeight: 400,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            color: 'rgba(245,242,234,0.5)',
            fontFamily: "'Outfit', sans-serif",
            marginTop: '4px',
          }}>
            {m.label}
          </div>

          {/* Temp */}
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            color: '#F5F2EA',
            fontFamily: "'Outfit', sans-serif",
            lineHeight: 1.2,
          }}>
            {m.temp}
          </div>

          {/* Meta grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: 'rgba(245,242,234,0.4)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.meta1Label}:</span>
              <span style={{ fontSize: '9px', color: 'rgba(245,242,234,0.7)', fontFamily: "'Outfit', sans-serif" }}>{m.meta1Value}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', color: 'rgba(245,242,234,0.4)', fontFamily: "'Outfit', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.meta2Label}:</span>
              <span style={{ fontSize: '9px', color: 'rgba(245,242,234,0.7)', fontFamily: "'Outfit', sans-serif" }}>{m.meta2Value}</span>
            </div>
          </div>

          {/* Mini chart */}
          <div style={{ marginTop: '4px' }}>
            <MiniChart points={m.chartPoints} width={80} height={28} />
          </div>
        </div>
      ))}
    </div>
  );
}
