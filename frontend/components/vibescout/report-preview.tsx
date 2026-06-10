'use client';

import Image from 'next/image';
import PieChart from './pie-chart';

export default function ReportPreview() {
  const REPORT_W = 400;
  const REPORT_ABOVE = 400;   // more card sits above the panel
  const REPORT_H = 560;
  const REPORT_INSIDE = REPORT_H - REPORT_ABOVE; // 160px overlap

  /* ── Env metrics (icon + label + value + bar) ── */
  const envMetrics = [
    {
      svg: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" aria-hidden="true">
          <path d="M9.59 4.59A2 2 0 1111 8H2m10.59 11.41A2 2 0 1014 16H2m15.73-8.27A2.5 2.5 0 1119.5 12H2" />
        </svg>
      ),
      label: 'Air Quality',
      value: '42 AQI',
      fill: 0.42,
    },
    {
      svg: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
        </svg>
      ),
      label: 'Noise Levels',
      value: '35dB',
      fill: 0.35,
    },
    {
      svg: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      label: 'Sunlight Yield',
      value: '87%',
      fill: 0.87,
    },
  ];

  const lifestyleMetrics = [
    { label: 'Commute',    value: '15m',       fill: 0.25 },
    { label: 'Community',  value: 'High',       fill: 0.80 },
    { label: 'Amenities',  value: 'Excellent',  fill: 0.92 },
  ];

  return (
    <>
      <style>{`
        /* ── focus ring ── */
        .rp-cta:focus-visible { outline: 2px solid #D4AF37; outline-offset: 3px; }

        /* ── tablet card edge bleeds ── */
        .tablet-card-wrap { position: relative; }

        /* top bleed */
        .tablet-card-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 50%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.9) 50%, transparent);
          box-shadow: 0 0 15px 3px rgba(212,175,55,0.5);
          pointer-events: none; z-index: 20;
        }
        /* bottom bleed */
        .tablet-card-wrap::after {
          content: '';
          position: absolute;
          bottom: 0; left: 50%; transform: translateX(-50%);
          width: 50%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.9) 50%, transparent);
          box-shadow: 0 0 15px 3px rgba(212,175,55,0.5);
          pointer-events: none; z-index: 20;
        }
        /* left bleed */
        .tablet-bleed-left {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 1px; height: 50%;
          background: linear-gradient(180deg, transparent, rgba(212,175,55,0.9) 50%, transparent);
          box-shadow: 0 0 15px 3px rgba(212,175,55,0.5);
          pointer-events: none; z-index: 20;
        }
        /* right bleed */
        .tablet-bleed-right {
          position: absolute; right: 0; top: 50%; transform: translateY(-50%);
          width: 1px; height: 50%;
          background: linear-gradient(180deg, transparent, rgba(212,175,55,0.9) 50%, transparent);
          box-shadow: 0 0 15px 3px rgba(212,175,55,0.5);
          pointer-events: none; z-index: 20;
        }

        /* ── bottom panel wrapper top bleed ── */
        .bottom-panel-wrap { position: relative; }
        .bottom-panel-wrap::before {
          content: '';
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 40%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.8) 50%, transparent);
          box-shadow: 0 0 12px 2px rgba(212,175,55,0.4);
          pointer-events: none; z-index: 2;
        }

        /* ── each analytics card top bleed ── */
        .analytics-card { position: relative; }
        .analytics-card::before {
          content: '';
          position: absolute;
          top: 0; left: 50%; transform: translateX(-50%);
          width: 55%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.75) 50%, transparent);
          box-shadow: 0 0 10px 2px rgba(212,175,55,0.35);
          pointer-events: none; z-index: 2;
        }

        /* ── reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .rp-cta { transition: none !important; }
        }
      `}</style>

      {/* ── SECTION WRAPPER with bg ── */}
      <section style={{
        padding: '120px 48px 0',
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'radial-gradient(ellipse at 50% 30%, #1a1400 0%, #000000 70%)',
        borderRadius: '32px',
      }}>

        {/* ── Section header ── */}
        <div style={{ textAlign: 'center', marginBottom: '56px' }}>
          {/* eyebrow — point 2 */}
          <p style={{
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            color: '#D4AF37',
            fontFamily: "'Outfit', sans-serif",
            marginBottom: '10px',
          }}>
            CONTINUE SECTION
          </p>
          <h2 style={{
            fontSize: '30px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#F5F2EA',
            fontFamily: "'Outfit', sans-serif",
            margin: 0,
            lineHeight: 1,
          }}>
            REPORT PREVIEW
          </h2>
        </div>

        {/* ── Composition wrapper ── */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* ── Radiant background image aura behind tablet ── */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            top: '-180px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '820px',
            height: '780px',
            pointerEvents: 'none',
            zIndex: 0,
            /* radial mask: opaque in center, dissolves to transparent at edges */
            maskImage: 'radial-gradient(ellipse 55% 55% at 50% 46%, #000 0%, #000 28%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse 55% 55% at 50% 46%, #000 0%, #000 28%, transparent 72%)',
          }}>
            <Image
              src="/radiant-backgroun.png"
              alt=""
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center center',
                opacity: 0.38,
                mixBlendMode: 'screen',
              }}
              sizes="820px"
            />
          </div>

          {/* ══════════════════════════════════
              TABLET CARD — points 3, 5
          ══════════════════════════════════ */}
          <div
            className="tablet-card-wrap"
            style={{
              position: 'relative',
              zIndex: 10,
              width: `${REPORT_W}px`,
              marginBottom: `-${REPORT_INSIDE}px`,
              borderRadius: '14px',
              overflow: 'visible',
            }}
          >
            {/* Left / right edge bleeds — point 5 */}
            <div className="tablet-bleed-left" />
            <div className="tablet-bleed-right" />

            {/* The card itself — flat, no tilt */}
            <div style={{
              background: 'linear-gradient(170deg, #141414 0%, #090909 100%)',
              border: '1px solid rgba(212,175,55,0.5)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 0 30px rgba(212,175,55,0.2)',
            }}>

              {/* Brand bar */}
              <div style={{
                padding: '11px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{
                    width: '18px', height: '18px', borderRadius: '4px',
                    background: 'rgba(212,175,55,0.14)',
                    border: '1px solid rgba(212,175,55,0.40)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                      <circle cx="5" cy="5" r="3.5" fill="#D4AF37" />
                    </svg>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', color: '#D4AF37', fontFamily: "'Outfit', sans-serif" }}>
                    VIBESCOUT
                  </span>
                </div>
                <span style={{ fontSize: '8px', color: 'rgba(245,242,234,0.25)', fontFamily: "'Outfit', sans-serif", letterSpacing: '0.05em' }}>
                  Dublin Property Report — v1
                </span>
              </div>

              {/* Hero image */}
              <div style={{ position: 'relative', height: '230px' }}>
                <Image
                  src="/luxury-villa.png"
                  alt="Luxury villa property"
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'center top' }}
                  sizes="400px"
                />
                <div aria-hidden="true" style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 50px rgba(0,0,0,0.55)', pointerEvents: 'none' }} />
                <div aria-hidden="true" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '58%', background: 'linear-gradient(transparent, rgba(9,9,9,0.95))' }} />
              </div>

              {/* Title block */}
              <div style={{ padding: '16px 18px 12px' }}>
                <div style={{ fontSize: '7px', fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', fontFamily: "'Outfit', sans-serif", marginBottom: '7px' }}>
                  PROPERTY INTELLIGENCE REPORT
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, lineHeight: 1.18, color: '#F5F2EA', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                  PROPERTY INTELLIGENCE<br />REPORT: [Property Name]
                </h3>
              </div>

              {/* Intelligence mini-cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '0 18px 16px' }}>
                {[
                  { label: 'WHAT CHANGED', text: 'New line construction begins 2025' },
                  { label: 'WHY IT MATTERS', text: 'Enhanced connectivity, reduced commute' },
                  { label: 'IMPACT', text: '11% projected property value increase' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '7px', padding: '9px 8px' }}>
                    <div style={{ fontSize: '6.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(212,175,55,0.55)', fontFamily: "'Outfit', sans-serif", marginBottom: '5px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: '8.5px', color: 'rgba(245,242,234,0.65)', fontFamily: "'Outfit', sans-serif", lineHeight: 1.45 }}>
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{ padding: '7px 18px', borderTop: '1px solid rgba(255,255,255,0.045)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '6.5px', color: 'rgba(245,242,234,0.18)', fontFamily: "'Outfit', sans-serif" }}>VIBESCOUT PRIVATE INDEX</span>
                <span style={{ fontSize: '6.5px', color: 'rgba(245,242,234,0.18)', fontFamily: "'Outfit', sans-serif" }}>vibescout.com/report</span>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              BOTTOM PANEL WRAPPER — point 6
          ══════════════════════════════════ */}
          <div
            className="bottom-panel-wrap"
            style={{
              width: '100%',
              maxWidth: '860px',
              /* frosted panel — heavily diffused, near-transparent */
              background: 'rgba(22,16,4,0.18)',
              backdropFilter: 'blur(40px) saturate(2.2) brightness(1.18)',
              WebkitBackdropFilter: 'blur(40px) saturate(2.2) brightness(1.18)',
              border: '1px solid rgba(212,175,55,0.30)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: [
                '0 0 40px rgba(212,175,55,0.12)',
                'inset 0 0 80px rgba(212,175,55,0.06)',
                'inset 0 1px 0 rgba(255,248,200,0.18)',
                'inset 0 -1px 0 rgba(212,175,55,0.08)',
              ].join(', '),
              position: 'relative',
              zIndex: 5,
              paddingTop: `${REPORT_INSIDE + 28}px`,
            }}
          >
            {/* Analytics row — point 7 */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '28px' }}>

              {/* ── Environmental Quality — points 7,8,9 ── */}
              <div
                className="analytics-card"
                style={{
                  flex: 1,
                  /* frosted glass — low opacity so warm glow bleeds through */
                  /* heavy frost — near-invisible fill, max blur */
                  background: 'linear-gradient(155deg, rgba(255,248,200,0.10) 0%, rgba(24,18,4,0.14) 100%)',
                  backdropFilter: 'blur(40px) saturate(2.4) brightness(1.22)',
                  WebkitBackdropFilter: 'blur(40px) saturate(2.4) brightness(1.22)',
                  border: '1px solid rgba(212,175,55,0.38)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: [
                    '0 0 22px rgba(212,175,55,0.14)',
                    'inset 0 0 30px rgba(212,175,55,0.06)',
                    'inset 0 1px 0 rgba(255,248,200,0.20)',
                    'inset 0 -1px 0 rgba(212,175,55,0.06)',
                  ].join(', '),
                }}
              >
                {/* Card title — point 8 */}
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4, paddingBottom: '8px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                  ENVIRONMENTAL<br />QUALITY
                </div>
                {envMetrics.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Circular gold ring icon — point 9 */}
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%',
                        border: '1px solid rgba(212,175,55,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        background: 'rgba(212,175,55,0.06)',
                      }}>
                        {m.svg}
                      </div>
                      <span style={{ flex: 1, fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif" }}>
                        {m.label}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>
                        {m.value}
                      </span>
                    </div>
                    {/* Gold progress bar — point 9 */}
                    <div style={{ height: '2px', background: 'rgba(212,175,55,0.12)', borderRadius: '2px', marginLeft: '38px' }}>
                      <div style={{
                        width: `${m.fill * 100}%`, height: '100%',
                        background: 'linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.3))',
                        borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Lifestyle Fit — points 7,8,10 ── */}
              <div
                className="analytics-card"
                style={{
                  flex: 1,
                  /* heavy frost — near-invisible fill, max blur */
                  background: 'linear-gradient(155deg, rgba(255,248,200,0.10) 0%, rgba(24,18,4,0.14) 100%)',
                  backdropFilter: 'blur(40px) saturate(2.4) brightness(1.22)',
                  WebkitBackdropFilter: 'blur(40px) saturate(2.4) brightness(1.22)',
                  border: '1px solid rgba(212,175,55,0.38)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: [
                    '0 0 22px rgba(212,175,55,0.14)',
                    'inset 0 0 30px rgba(212,175,55,0.06)',
                    'inset 0 1px 0 rgba(255,248,200,0.20)',
                    'inset 0 -1px 0 rgba(212,175,55,0.06)',
                  ].join(', '),
                }}
              >
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4, paddingBottom: '8px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                  LIFESTYLE<br />FIT
                </div>
                {lifestyleMetrics.map((m, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit', sans-serif" }}>{m.label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', fontFamily: "'Outfit', sans-serif" }}>{m.value}</span>
                    </div>
                    <div style={{ height: '2px', background: 'rgba(212,175,55,0.12)', borderRadius: '2px' }}>
                      <div style={{
                        width: `${m.fill * 100}%`, height: '100%',
                        background: 'linear-gradient(90deg, #D4AF37, rgba(212,175,55,0.3))',
                        borderRadius: '2px',
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Financial Verdicts — points 7,8,11 ── */}
              <div
                className="analytics-card"
                style={{
                  flex: 1,
                  background: 'linear-gradient(155deg, rgba(255,248,200,0.10) 0%, rgba(24,18,4,0.14) 100%)',
                  backdropFilter: 'blur(40px) saturate(2.4) brightness(1.22)',
                  WebkitBackdropFilter: 'blur(40px) saturate(2.4) brightness(1.22)',
                  border: '1px solid rgba(212,175,55,0.38)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxShadow: [
                    '0 0 22px rgba(212,175,55,0.14)',
                    'inset 0 0 30px rgba(212,175,55,0.06)',
                    'inset 0 1px 0 rgba(255,248,200,0.20)',
                    'inset 0 -1px 0 rgba(212,175,55,0.06)',
                  ].join(', '),
                }}
              >
                <div style={{ fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#D4AF37', fontFamily: "'Outfit', sans-serif", lineHeight: 1.4, paddingBottom: '8px', borderBottom: '1px solid rgba(212,175,55,0.15)' }}>
                  FINANCIAL<br />VERDICTS
                </div>
                <PieChart />
              </div>
            </div>

            {/* ── CTA — point 12 ── */}
            <div style={{ textAlign: 'center' }}>
              <button
                className="rp-cta"
                aria-label="View full property intelligence report"
                style={{
                  background: 'transparent',
                  color: '#D4AF37',
                  height: '48px',
                  paddingInline: '40px',
                  borderRadius: '10px',
                  border: '2px solid rgba(212,175,55,0.7)',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  fontFamily: "'Outfit', sans-serif",
                  cursor: 'pointer',
                  boxShadow: '0 0 15px rgba(212,175,55,0.3)',
                  transition: 'box-shadow 0.2s ease, color 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(212,175,55,0.5)';
                  e.currentTarget.style.color = '#F0CE82';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 0 15px rgba(212,175,55,0.3)';
                  e.currentTarget.style.color = '#D4AF37';
                }}
              >
                VIEW FULL REPORT
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
