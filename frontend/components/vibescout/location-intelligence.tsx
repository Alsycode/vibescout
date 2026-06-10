'use client';

import TimelineGallery from './timeline-gallery';
import DossierCard from './dossier-card';

const MetroIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const CommutingIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const LocalValueIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D8B56A" strokeWidth="1.5" strokeLinecap="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);

const dossierCards = [
  {
    title: 'Metro Expansion Approved',
    icon: <MetroIcon />,
    whatChanged: 'New line construction begins 2025',
    whyItMatters: 'Enhanced connectivity, reduced commute',
    impact: '12% projected property value increase',
  },
  {
    title: 'Commuting Approved',
    icon: <CommutingIcon />,
    whatChanged: 'New line construction begins 2025',
    whyItMatters: 'Enhanced connectivity, reduced commute',
    impact: '13% projected property value increase',
  },
  {
    title: 'Local Value Approved',
    icon: <LocalValueIcon />,
    whatChanged: 'New line construction begins 2025',
    whyItMatters: 'Enhanced connectivity, reduced commute',
    impact: '12% projected property value increase',
  },
];

export default function LocationIntelligence() {
  return (
    <section style={{ padding: '0 48px', maxWidth: '1280px', margin: '0 auto 0' }}>
      {/* Main luxury panel */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 0 40px rgba(216,181,106,0.08)',
      }}>
        {/* Header */}
        <div style={{ padding: '40px 40px 32px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(216,181,106,0.4))' }} />
            <span style={{
              fontSize: '10px', fontWeight: 400, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: '#D8B56A',
              fontFamily: "'Outfit', sans-serif",
            }}>
              INTELLIGENCE
            </span>
            <div style={{ flex: 1, maxWidth: '80px', height: '1px', background: 'linear-gradient(90deg, rgba(216,181,106,0.4), transparent)' }} />
          </div>

          <h2 style={{
            fontSize: '28px', fontWeight: 500,
            color: '#F5F2EA', lineHeight: 1.2,
            fontFamily: "'Outfit', sans-serif",
            margin: 0,
          }}>
            A Location Is Alive
          </h2>
        </div>

        {/* Timeline Gallery */}
        <TimelineGallery />

        {/* Area Intelligence */}
        <div style={{ padding: '40px 40px 48px' }}>
          {/* Divider + eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '20px', height: '1px', background: 'rgba(216,181,106,0.4)' }} />
            <span style={{
              fontSize: '9px', fontWeight: 400, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: 'rgba(216,181,106,0.7)',
              fontFamily: "'Outfit', sans-serif",
            }}>
              AREA INTELLIGENCE
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Curated Dossier heading */}
          <div style={{ marginBottom: '8px' }}>
            <h3 style={{
              fontSize: '22px', fontWeight: 500,
              color: '#F5F2EA', margin: 0,
              fontFamily: "'Outfit', sans-serif",
            }}>
              Curated Dossier
            </h3>
          </div>
          <p style={{
            fontSize: '13px', fontWeight: 300,
            color: 'rgba(245,242,234,0.5)',
            fontFamily: "'Outfit', sans-serif",
            marginBottom: '28px',
          }}>
            A curator&apos;s synthesis of intelligence findings.
          </p>

          {/* Dossier cards grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {dossierCards.map((card, i) => (
              <DossierCard key={i} {...card} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
