'use client';

interface DossierCardProps {
  title: string;
  icon: React.ReactNode;
  whatChanged: string;
  whyItMatters: string;
  impact: string;
}

export default function DossierCard({ title, icon, whatChanged, whyItMatters, impact }: DossierCardProps) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(216,181,106,0.2)',
      boxShadow: '0 0 25px rgba(216,181,106,0.12)',
      borderRadius: '18px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Card header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'rgba(216,181,106,0.08)',
          border: '1px solid rgba(216,181,106,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#F5F2EA',
          fontFamily: "'Outfit', sans-serif",
          lineHeight: 1.2,
        }}>
          {title}
        </h3>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

      {/* What Changed */}
      <div>
        <div style={{
          fontSize: '8px', fontWeight: 400, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(245,242,234,0.4)',
          fontFamily: "'Outfit', sans-serif", marginBottom: '4px',
        }}>
          WHAT CHANGED
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(245,242,234,0.75)',
          fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: '6px',
        }}>
          <span style={{ color: '#D8B56A', marginTop: '1px' }}>◆</span>
          {whatChanged}
        </div>
      </div>

      {/* Why It Matters */}
      <div>
        <div style={{
          fontSize: '8px', fontWeight: 400, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(245,242,234,0.4)',
          fontFamily: "'Outfit', sans-serif", marginBottom: '4px',
        }}>
          WHY IT MATTERS
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(245,242,234,0.75)',
          fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: '6px',
        }}>
          <span style={{ color: '#D8B56A', marginTop: '1px' }}>◆</span>
          {whyItMatters}
        </div>
      </div>

      {/* Impact */}
      <div>
        <div style={{
          fontSize: '8px', fontWeight: 400, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'rgba(245,242,234,0.4)',
          fontFamily: "'Outfit', sans-serif", marginBottom: '4px',
        }}>
          IMPACT
        </div>
        <div style={{
          fontSize: '11px', color: 'rgba(245,242,234,0.75)',
          fontFamily: "'Outfit', sans-serif", lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: '6px',
        }}>
          <span style={{ color: '#D8B56A', marginTop: '1px' }}>◆</span>
          {impact}
        </div>
      </div>
    </div>
  );
}
