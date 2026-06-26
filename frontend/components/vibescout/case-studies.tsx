'use client';

import React, { useRef, useState, useEffect } from 'react';

type VerdictKey = 'proceed' | 'caution' | 'red_flag';

interface Finding {
  signal:  string;
  found:   string;
  verdict: VerdictKey;
  icon:    string; // signal type key
}

interface CaseStudy {
  id:           string;
  verdict:      VerdictKey;
  property:     string;
  location:     string;
  listingClaim: string;
  findings:     Finding[];
  outcome:      string;
}

const CASES: CaseStudy[] = [
  {
    id:       '001',
    verdict:  'red_flag',
    property: '2BHK · 6th Floor',
    location: 'Whitefield, Bengaluru',
    listingClaim:
      '"Peaceful residential neighbourhood. Excellent connectivity. Premium finishes."',
    findings: [
      { signal: 'NOISE RISK',    found: '74 dB est. · Adjacent to ITPL connector', verdict: 'red_flag', icon: 'noise'    },
      { signal: 'COMMUTE TIME',  found: '68 min peak · Whitefield to MG Road',     verdict: 'red_flag', icon: 'commute'  },
      { signal: 'FINANCIAL FIT', found: '+23% above comparable block average',      verdict: 'red_flag', icon: 'finance'  },
    ],
    outcome:
      'Buyer negotiated ₹9.21 price reduction after presenting the VibeScout report. Commute risk was the deciding factor.',
  },
  {
    id:       '002',
    verdict:  'caution',
    property: '3BHK · Ground Floor',
    location: 'Baner, Pune',
    listingClaim:
      '"Green surroundings. Walking distance to IT hubs. Vaastu-compliant."',
    findings: [
      { signal: 'FLOOD ZONE',  found: 'Zone B — 2023 waterlogging on record',      verdict: 'red_flag', icon: 'flood'   },
      { signal: 'AIR QUALITY', found: '58 AQI · Moderate · Near Baner bypass',     verdict: 'caution',  icon: 'air'     },
      { signal: 'SOLAR YIELD', found: '3.2 kWh/m² · North-facing · Low potential', verdict: 'caution',  icon: 'solar'   },
    ],
    outcome:
      'Buyer requested a higher floor unit in the same complex. Builder disclosed the 2023 waterlogging only after the report was produced.',
  },
  {
    id:       '003',
    verdict:  'proceed',
    property: '1BHK · 9th Floor',
    location: 'Koramangala 5th Block, Bengaluru',
    listingClaim:
      '"Prime location. High rental yield. Excellent social infrastructure."',
    findings: [
      { signal: 'AIR QUALITY',   found: '42 AQI · Good · OpenAQ sensor 0.8km away', verdict: 'proceed', icon: 'air'     },
      { signal: 'COMMUTE TIME',  found: '31 min peak · Koramangala to Indiranagar',  verdict: 'proceed', icon: 'commute' },
      { signal: 'FINANCIAL FIT', found: '+4% above avg · Within acceptable premium', verdict: 'proceed', icon: 'finance' },
    ],
    outcome:
      'Listing claims verified. Buyer proceeded with full confidence. Report used in rental yield negotiation with landlord.',
  },
];

const VERDICT_COLOR: Record<VerdictKey, string> = {
  proceed:  '#34D399',
  caution:  '#F59E0B',
  red_flag: '#E63946',
};

const VERDICT_RGB: Record<VerdictKey, string> = {
  proceed:  '52,211,153',
  caution:  '245,158,11',
  red_flag: '230,57,70',
};

const VERDICT_LABEL: Record<VerdictKey, string> = {
  proceed:  'PROCEED',
  caution:  'CAUTION',
  red_flag: 'RED FLAG',
};

// Signal icons as inline SVG strings
const SIGNAL_ICONS: Record<string, JSX.Element> = {
  noise: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h2M6 8v8M10 5v14M14 8v8M18 5v14M22 12h-2"/>
    </svg>
  ),
  commute: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="12" rx="3"/>
      <path d="M8 17v2M16 17v2M3 10h18"/>
      <circle cx="7.5" cy="14" r="1" fill="currentColor"/>
      <circle cx="16.5" cy="14" r="1" fill="currentColor"/>
    </svg>
  ),
  finance: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M9 8h6M9 12h6M12 8v8"/>
      <path d="M9 12c0 1.657 1.343 3 3 3s3-1.343 3-3"/>
    </svg>
  ),
  flood: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8 7 5 10 5 14a7 7 0 0 0 14 0c0-4-3-7-7-12z"/>
    </svg>
  ),
  air: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2"/>
      <path d="M12.59 19.41A2 2 0 1 0 14 16H2"/>
      <path d="M6.59 11.41A2 2 0 1 0 8 8H2M17 8h1a2 2 0 0 1 0 4h-1"/>
    </svg>
  ),
  solar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
    </svg>
  ),
};

const TEAL = '#00D4BE';

function DossierCard({ cs, index, visible }: { cs: CaseStudy; index: number; visible: boolean }) {
  const color = VERDICT_COLOR[cs.verdict];
  const rgb   = VERDICT_RGB[cs.verdict];
  const delay = `${index * 120 + 200}ms`;

  return (
    <div
      style={{
        background:    '#0B0F1A',
        borderTop:     '1px solid rgba(255,255,255,0.07)',
        borderRight:   '1px solid rgba(255,255,255,0.07)',
        borderBottom:  '1px solid rgba(255,255,255,0.07)',
        borderLeft:    `3px solid ${color}`,
        borderRadius: '12px',
        overflow:     'hidden',
        boxShadow: [
          `0 0 0 1px rgba(${rgb},0.04)`,
          `0 0 40px rgba(${rgb},0.04)`,
          '0 20px 60px rgba(0,0,0,0.5)',
        ].join(', '),
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(24px)',
        transition: visible
          ? `opacity 600ms ease ${delay}, transform 600ms ease ${delay}`
          : 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding:        '18px 20px 14px',
          borderBottom:   '1px solid rgba(255,255,255,0.06)',
          display:        'flex',
          alignItems:     'flex-start',
          justifyContent: 'space-between',
          gap:            '12px',
        }}
      >
        <div>
          <p
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '9px',
              fontWeight:    400,
              color:         'rgba(255,255,255,0.28)',
              letterSpacing: '0.08em',
              margin:        '0 0 8px',
              textTransform: 'uppercase',
            }}
          >
            CASE #{cs.id} · {cs.location.toUpperCase()}
          </p>
          <p
            style={{
              fontFamily:  "'Inter', sans-serif",
              fontSize:    '18px',
              fontWeight:  700,
              color:       'rgba(255,255,255,0.92)',
              margin:      '0 0 2px',
              lineHeight:  1.2,
            }}
          >
            {cs.property}
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '18px',
              fontWeight: 700,
              color:      'rgba(255,255,255,0.92)',
              margin:     0,
              lineHeight: 1.2,
            }}
          >
            {cs.location}
          </p>
        </div>

        {/* Verdict badge */}
        <span
          style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '9px',
            fontWeight:    600,
            color:         color,
            letterSpacing: '0.07em',
            padding:       '4px 10px',
            background:    `rgba(${rgb},0.10)`,
            border:        `1px solid rgba(${rgb},0.30)`,
            borderRadius:  '5px',
            whiteSpace:    'nowrap',
            flexShrink:    0,
            boxShadow:     `0 0 12px rgba(${rgb},0.12)`,
          }}
        >
          ◆ {VERDICT_LABEL[cs.verdict]}
        </span>
      </div>

      {/* ── What the listing said ── */}
      <div
        style={{
          padding:      '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <p
          style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '9px',
            fontWeight:    600,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color:         TEAL,
            margin:        '0 0 8px',
          }}
        >
          WHAT THE LISTING SAID
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '13px',
            fontWeight: 400,
            fontStyle:  'italic',
            lineHeight: 1.6,
            color:      'rgba(255,255,255,0.42)',
            margin:     0,
          }}
        >
          {cs.listingClaim}
        </p>
      </div>

      {/* ── What we found ── */}
      <div style={{ padding: '16px 20px 8px', flex: 1 }}>
        <p
          style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '9px',
            fontWeight:    600,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color:         TEAL,
            margin:        '0 0 12px',
          }}
        >
          WHAT WE FOUND
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {cs.findings.map((f) => {
            const fc = VERDICT_COLOR[f.verdict];
            return (
              <div
                key={f.signal}
                style={{
                  display:    'flex',
                  alignItems: 'center',
                  gap:        '12px',
                }}
              >
                {/* Icon box */}
                <div
                  style={{
                    width:        '40px',
                    height:       '40px',
                    borderRadius: '8px',
                    background:   'rgba(0,212,190,0.07)',
                    border:       '1px solid rgba(0,212,190,0.12)',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    flexShrink:   0,
                    color:        TEAL,
                  }}
                >
                  {SIGNAL_ICONS[f.icon]}
                </div>

                {/* Label + value */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontFamily:    "'Inter', sans-serif",
                      fontSize:      '9px',
                      fontWeight:    600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.09em',
                      color:         TEAL,
                      margin:        '0 0 3px',
                    }}
                  >
                    {f.signal}
                  </p>
                  <p
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize:   '12px',
                      fontWeight: 400,
                      color:      'rgba(255,255,255,0.75)',
                      margin:     0,
                      lineHeight: 1.4,
                    }}
                  >
                    {f.found}
                  </p>
                </div>

                {/* Status dot */}
                <span
                  style={{
                    width:        '8px',
                    height:       '8px',
                    borderRadius: '50%',
                    background:   fc,
                    boxShadow:    `0 0 7px ${fc}90`,
                    flexShrink:   0,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Outcome ── */}
      <div
        style={{
          padding:    '14px 20px',
          borderTop:  '1px solid rgba(255,255,255,0.05)',
          background: `rgba(${rgb},0.025)`,
          marginTop:  '8px',
        }}
      >
        <p
          style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '9px',
            fontWeight:    600,
            textTransform: 'uppercase',
            letterSpacing: '0.10em',
            color:         `rgba(${rgb},0.65)`,
            margin:        '0 0 6px',
          }}
        >
          OUTCOME
        </p>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '12px',
            fontWeight: 400,
            lineHeight: 1.65,
            color:      'rgba(255,255,255,0.50)',
            margin:     0,
          }}
        >
          {cs.outcome}
        </p>
      </div>
    </div>
  );
}

export default function CaseStudies() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="case-studies"
      className="section-pad-std"
      style={{
        background:      '#080812',
        backgroundImage: 'var(--grid-bg-image)',
        backgroundSize:  '64px 64px',
        position:        'relative',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>

        {/* ── Section header ── */}
        <div
          style={{
            maxWidth:     '580px',
            marginBottom: '52px',
            opacity:      visible ? 1 : 0,
            transform:    visible ? 'translateY(0)' : 'translateY(20px)',
            transition:   'opacity 600ms ease, transform 600ms ease',
          }}
        >
          {/* Label with teal line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <p
              style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '10px',
                fontWeight:    600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color:         TEAL,
                margin:        0,
                whiteSpace:    'nowrap',
              }}
            >
              INVESTIGATION FILES
            </p>
            <div
              style={{
                height:     '1px',
                width:      '48px',
                background: `linear-gradient(90deg, ${TEAL}, transparent)`,
                flexShrink: 0,
              }}
            />
          </div>

          <h2 style={{ margin: '0 0 16px' }}>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(30px, 3.4vw, 50px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.16,
              color:         'rgba(255,255,255,0.92)',
            }}>
              What the listing said.
            </span>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(30px, 3.4vw, 50px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.16,
              color:         '#22D3EE',
              textShadow:    '0 0 40px rgba(34,211,238,0.22)',
            }}>
              What we found.
            </span>
          </h2>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '15px',
              fontWeight: 400,
              lineHeight: 1.7,
              color:      'rgba(255,255,255,0.40)',
              margin:     0,
            }}
          >
            Three real property investigations across Bengaluru and Pune.
            <br />
            Listing claims on the left. VibeScout findings on the right.
          </p>
        </div>

        {/* ── Cards ── */}
        <div className="signals-grid">
          {CASES.map((cs, i) => (
            <DossierCard key={cs.id} cs={cs} index={i} visible={visible} />
          ))}
        </div>
      </div>
    </section>
  );
}
