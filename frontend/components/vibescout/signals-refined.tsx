'use client';

// Section 3: What You Receive — Six Signals
// Redesigned to match the Information Gap design philosophy:
//   Instrument Serif italic heading · cyan line-accent eyebrow
//   Layered ambient glows · glassmorphism cards with spotlight glow border
//   Framer Motion useInView + staggerChildren

import React, { useRef, useEffect, type CSSProperties } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// ── Types ──────────────────────────────────────────────────────────────────────

type SignalVerdict = 'proceed' | 'caution' | 'red_flag';

interface SignalSpec {
  label:       string;
  name:        string;
  sample:      string;
  unit:        string;
  source:      string;
  verdict:     SignalVerdict;
  description: string;
  Icon:        () => React.ReactElement;
}

// ── Verdict maps ───────────────────────────────────────────────────────────────

const VERDICT_COLOR: Record<SignalVerdict, string> = {
  proceed:  '#34D399',
  caution:  '#F59E0B',
  red_flag: '#E63946',
};

const VERDICT_GLOW: Record<SignalVerdict, string> = {
  proceed:  'rgba(52,211,153,0.18)',
  caution:  'rgba(245,158,11,0.18)',
  red_flag: 'rgba(230,57,70,0.18)',
};

const SIGNAL_CARD_GLOW_CSS = `
  [data-signal-glow]::before,
  [data-signal-glow]::after {
    pointer-events: none;
    content: "";
    position: absolute;
    inset: calc(var(--border-size) * -1);
    border: var(--border-size) solid transparent;
    border-radius: 16px;
    background-attachment: fixed;
    background-size: calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)));
    background-repeat: no-repeat;
    background-position: 50% 50%;
    mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
    mask-clip: padding-box, border-box;
    mask-composite: intersect;
  }
  [data-signal-glow]::before {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(185 100% 55% / 1), transparent 100%
    );
    filter: brightness(2);
  }
  [data-signal-glow]::after {
    background-image: radial-gradient(
      calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at
      calc(var(--x, 0) * 1px)
      calc(var(--y, 0) * 1px),
      hsl(185 100% 85% / 0.18), transparent 100%
    );
  }
`;

const VERDICT_LABEL: Record<SignalVerdict, string> = {
  proceed:  'PASS',
  caution:  'CAUTION',
  red_flag: 'FLAG',
};

// ── Signal icons (28 × 28, cyan stroke) ───────────────────────────────────────

function AirQualityIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M4 14h3c1 0 1.5-2 2.5-2s1.5 4 2.5 4 1.5-6 2.5-6 1.5 8 2.5 8 1.5-4 2.5-4 1.5 2 2.5 2H24" stroke="rgba(34,211,238,0.80)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M4 20h4c1.5 0 2-3 3.5-3s2.5 3 3.5 3H24" stroke="rgba(34,211,238,0.40)" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  );
}

function NoiseRiskIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path d="M3 14h2l2-6 3 12 3-8 3 4 2-2h7" stroke="rgba(34,211,238,0.80)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SolarYieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="6" y="8" width="16" height="12" rx="1" stroke="rgba(34,211,238,0.80)" strokeWidth="1.6"/>
      <line x1="6"  y1="12" x2="22" y2="12" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="6"  y1="16" x2="22" y2="16" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="11" y1="8"  x2="11" y2="20" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="17" y1="8"  x2="17" y2="20" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="14" y1="3"  x2="14" y2="6"  stroke="rgba(34,211,238,0.55)" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="20" y1="5"  x2="18.5" y2="7" stroke="rgba(34,211,238,0.55)" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="8"  y1="5"  x2="9.5"  y2="7" stroke="rgba(34,211,238,0.55)" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

function CommuteTimeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="7" y="5" width="14" height="16" rx="2" stroke="rgba(34,211,238,0.80)" strokeWidth="1.6"/>
      <rect x="9" y="7" width="10" height="5" rx="1" fill="rgba(34,211,238,0.08)" stroke="rgba(34,211,238,0.35)" strokeWidth="0.75"/>
      <circle cx="10.5" cy="16" r="1.25" fill="rgba(34,211,238,0.55)"/>
      <circle cx="17.5" cy="16" r="1.25" fill="rgba(34,211,238,0.55)"/>
      <line x1="9"  y1="22" x2="11" y2="21" stroke="rgba(34,211,238,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="22" x2="17" y2="21" stroke="rgba(34,211,238,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function FinancialFitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="10" stroke="rgba(34,211,238,0.80)" strokeWidth="1.6"/>
      <text x="14" y="18.5" textAnchor="middle" fill="rgba(34,211,238,0.75)" fontSize="11" fontFamily="sans-serif" fontWeight="500">₹</text>
    </svg>
  );
}

function LocalNewsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="4" y="5" width="17" height="18" rx="1.5" stroke="rgba(34,211,238,0.80)" strokeWidth="1.6"/>
      <path d="M21 9v12.5a1.5 1.5 0 003 0V9" stroke="rgba(34,211,238,0.50)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="7"  y1="9"  x2="13" y2="9"  stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="7"  y1="12" x2="18" y2="12" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="7"  y1="15" x2="18" y2="15" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
      <line x1="7"  y1="18" x2="14" y2="18" stroke="rgba(34,211,238,0.35)" strokeWidth="1"/>
    </svg>
  );
}

// ── Signal data ────────────────────────────────────────────────────────────────

const SIGNALS: SignalSpec[] = [
  {
    label:       'SIGNAL 01',
    name:        'Air Quality',
    sample:      '42',
    unit:        'AQI',
    source:      'OpenAQ · nearest sensor',
    verdict:     'proceed',
    description: 'Real-time PM2.5 and AQI from the closest OpenAQ monitor to the property. Thresholds set to India NAAQS standards.',
    Icon:        AirQualityIcon,
  },
  {
    label:       'SIGNAL 02',
    name:        'Noise Risk',
    sample:      '38',
    unit:        'dB est.',
    source:      'OSM / Overpass model',
    verdict:     'proceed',
    description: 'Derived from OpenStreetMap road classifications, industrial zones, and transit infrastructure within 500m.',
    Icon:        NoiseRiskIcon,
  },
  {
    label:       'SIGNAL 03',
    name:        'Solar Yield',
    sample:      '4.8',
    unit:        'kWh/m²/day',
    source:      'Google Solar API',
    verdict:     'proceed',
    description: 'Rooftop solar potential based on roof geometry, shading, and local irradiance. Useful for evaluating energy independence.',
    Icon:        SolarYieldIcon,
  },
  {
    label:       'SIGNAL 04',
    name:        'Commute Time',
    sample:      '47',
    unit:        'min peak',
    source:      'Google Maps · Tue 08:30',
    verdict:     'caution',
    description: 'Door-to-door peak-hour transit time to a user-specified destination. Computed on Tuesday 08:30 — the most representative commute window.',
    Icon:        CommuteTimeIcon,
  },
  {
    label:       'SIGNAL 05',
    name:        'Financial Fit',
    sample:      '+12%',
    unit:        'above area avg',
    source:      'Income bracket analysis',
    verdict:     'caution',
    description: 'Checks whether the listed price fits your stated budget. Flags affordability stress based on your income bracket and a standard rent-to-income or EMI ratio.',
    Icon:        FinancialFitIcon,
  },
  {
    label:       'SIGNAL 06',
    name:        'Local News',
    sample:      'No flags',
    unit:        '',
    source:      'GNews · 2h ago',
    verdict:     'proceed',
    description: 'Scans recent local news for the property\'s city and neighbourhood. Surfaces infrastructure disputes, civic issues, or incidents from the past 7 days.',
    Icon:        LocalNewsIcon,
  },
];

// ── Animation variants ─────────────────────────────────────────────────────────

const headerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
};

const fadeUpVariants: Variants = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const lineVariants: Variants = {
  hidden:  { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.1 } },
};

const gridVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.18 } },
};

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 28, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.60, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ── Signal card ────────────────────────────────────────────────────────────────

function SignalCard({ sig }: { sig: SignalSpec }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const color   = VERDICT_COLOR[sig.verdict];
  const glow    = VERDICT_GLOW[sig.verdict];

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const sync = (e: PointerEvent) => {
      el.style.setProperty('--x',  e.clientX.toFixed(2));
      el.style.setProperty('--y',  e.clientY.toFixed(2));
    };
    document.addEventListener('pointermove', sync);
    return () => document.removeEventListener('pointermove', sync);
  }, []);

  const glowVars = {
    '--size':           '260',
    '--border':         '2',
    '--border-size':    'calc(var(--border, 2) * 1px)',
    '--spotlight-size': 'calc(var(--size, 150) * 1px)',
  } as CSSProperties;

  return (
    <motion.div
      ref={cardRef}
      data-signal-glow
      variants={cardVariants}
      whileHover={{
        y: -4,
        boxShadow: [
          '0 0 0 1px rgba(34,211,238,0.10)',
          '0 28px 80px rgba(0,0,0,0.65)',
          `0 0 50px ${glow}`,
          'inset 0 1px 0 rgba(34,211,238,0.10)',
        ].join(', '),
      }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        ...glowVars,
        backgroundImage: [
          `radial-gradient(var(--spotlight-size) var(--spotlight-size) at calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px), hsl(185 100% 60% / 0.05), transparent)`,
          'linear-gradient(145deg, #0e0e1e 0%, #0a0a18 100%)',
        ].join(', '),
        backgroundAttachment: 'fixed',
        border:         '1px solid rgba(255,255,255,0.07)',
        borderTop:      '1px solid rgba(34,211,238,0.18)',
        borderRadius:   '16px',
        padding:        '26px 24px 22px',
        display:        'flex',
        flexDirection:  'column',
        gap:            0,
        position:       'relative',
        cursor:         'default',
        boxShadow:      [
          '0 0 0 1px rgba(255,255,255,0.03)',
          '0 20px 60px rgba(0,0,0,0.55)',
          'inset 0 1px 0 rgba(34,211,238,0.06)',
        ].join(', '),
      }}
    >
      {/* Subtle top-right ambient glow per verdict color */}
      <div
        aria-hidden
        style={{
          position:   'absolute',
          top:        '-30px',
          right:      '-30px',
          width:      '140px',
          height:     '140px',
          borderRadius:'50%',
          background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`,
          pointerEvents:'none',
          filter:     'blur(20px)',
        }}
      />

      {/* Top row: icon + label + verdict chip */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>

        {/* Icon container — matches info-gap style */}
        <motion.div
          whileHover={{ scale: 1.06, boxShadow: '0 0 18px rgba(34,211,238,0.18)' }}
          transition={{ duration: 0.2 }}
          style={{
            width:           '46px',
            height:          '46px',
            borderRadius:    '11px',
            background:      'rgba(34,211,238,0.06)',
            border:          '1px solid rgba(34,211,238,0.14)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            flexShrink:      0,
            boxShadow:       '0 0 12px rgba(34,211,238,0.06)',
          }}
        >
          <sig.Icon />
        </motion.div>

        {/* Label + signal name */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '9px',
              fontWeight:    600,
              textTransform: 'uppercase',
              letterSpacing: '0.13em',
              color:         'rgba(34,211,238,0.65)',
              whiteSpace:    'nowrap',
            }}>
              {sig.label}
            </span>

            {/* Verdict chip */}
            <span style={{
              fontFamily:   "'Geist Mono', monospace",
              fontSize:     '9px',
              fontWeight:   500,
              color:        color,
              letterSpacing:'0.06em',
              padding:      '3px 9px',
              background:   `${color}12`,
              border:       `1px solid ${color}35`,
              borderRadius: '4px',
              display:      'flex',
              alignItems:   'center',
              gap:          '5px',
              lineHeight:   1,
              whiteSpace:   'nowrap',
            }}>
              <span style={{
                width:        '5px',
                height:       '5px',
                borderRadius: '50%',
                background:   color,
                display:      'inline-block',
                boxShadow:    `0 0 6px ${color}80`,
              }} />
              {VERDICT_LABEL[sig.verdict]}
            </span>
          </div>

          <h3 style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '17px',
            fontWeight: 600,
            color:      'rgba(255,255,255,0.90)',
            margin:     0,
            lineHeight: 1.25,
          }}>
            {sig.name}
          </h3>
        </div>
      </div>

      {/* Sample value */}
      <div style={{ marginBottom: '14px' }}>
        <span style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '38px',
          fontWeight:    400,
          color:         'rgba(255,255,255,0.92)',
          letterSpacing: '-0.025em',
          lineHeight:    1,
          textShadow:    '0 0 30px rgba(34,211,238,0.10)',
        }}>
          {sig.sample}
        </span>
        {sig.unit && (
          <span style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '12px',
            fontWeight:    400,
            color:         'rgba(255,255,255,0.30)',
            letterSpacing: '0.01em',
            marginLeft:    '9px',
          }}>
            {sig.unit}
          </span>
        )}
      </div>

      {/* Description */}
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize:   '13px',
        fontWeight: 400,
        lineHeight: 1.72,
        color:      'rgba(255,255,255,0.42)',
        margin:     0,
        flex:       1,
      }}>
        {sig.description}
      </p>

      {/* Source footer */}
      <p style={{
        fontFamily:    "'Geist Mono', monospace",
        fontSize:      '9px',
        fontWeight:    400,
        color:         'rgba(255,255,255,0.20)',
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        margin:        0,
        paddingTop:    '14px',
        marginTop:     '14px',
        borderTop:     '1px solid rgba(34,211,238,0.07)',
      }}>
        SOURCE: {sig.source}
      </p>
    </motion.div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function SignalsRefined() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px 0px' });

  return (
    <>
    <style dangerouslySetInnerHTML={{ __html: SIGNAL_CARD_GLOW_CSS }} />
    <section
      ref={sectionRef}
      id="signals"
      style={{
        background: '#080812',
        position:   'relative',
        overflow:           'hidden',
        padding:            'clamp(80px, 10vw, 140px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* ── Ambient layered glows (matches info-gap section) ── */}
      <div aria-hidden style={{
        position:      'absolute', inset: 0, pointerEvents: 'none',
        background:    'radial-gradient(ellipse 1000px 600px at 50% 20%, rgba(34,211,238,0.04) 0%, transparent 65%)',
      }} />
      <div aria-hidden style={{
        position:      'absolute', inset: 0, pointerEvents: 'none',
        background:    'radial-gradient(ellipse 500px 400px at 10% 60%, rgba(34,211,238,0.025) 0%, transparent 65%)',
      }} />
      <div aria-hidden style={{
        position:      'absolute', inset: 0, pointerEvents: 'none',
        background:    'radial-gradient(ellipse 500px 400px at 90% 70%, rgba(34,211,238,0.02) 0%, transparent 65%)',
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>

        {/* ── Section header ──────────────────────────────────── */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ maxWidth: '620px', marginBottom: 'clamp(48px, 6vw, 80px)' }}
        >
          {/* Eyebrow — matches info-gap pattern */}
          <motion.div
            variants={fadeUpVariants}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}
          >
            <div style={{
              width:      '18px',
              height:     '1px',
              background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.7))',
            }} />
            <span style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '10px',
              fontWeight:    600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color:         '#03d3bd',
            }}>
              THE INTELLIGENCE
            </span>
            <motion.div
              variants={lineVariants}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              style={{
                height:          '1px',
                width:           '64px',
                background:      'linear-gradient(90deg, rgba(34,211,238,0.55) 0%, transparent 100%)',
                transformOrigin: 'left',
              }}
            />
          </motion.div>

          {/* Heading — Instrument Serif italic, white + cyan split */}
          <motion.h2 variants={fadeUpVariants} style={{ margin: '0 0 22px' }}>
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
              Six signals. Every report.
            </span>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(30px, 3.4vw, 50px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.16,
              color:         '#03d3bd',
              textShadow:    '0 0 40px rgba(3,211,189,0.22)',
            }}>
              No exceptions.
            </span>
          </motion.h2>

          {/* Body */}
          <motion.p variants={fadeUpVariants} style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '15px',
            fontWeight: 400,
            lineHeight: 1.78,
            color:      'rgba(255,255,255,0.42)',
            margin:     0,
          }}>
            Each signal is fetched live at report generation time, run through a
            deterministic threshold engine, and returned as a structured verdict.
            No caching beyond 7 days. No stale data.
          </motion.p>
        </motion.div>

        {/* ── Signal card grid ─────────────────────────────────── */}
        <motion.div
          className="signals-grid"
          variants={gridVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {SIGNALS.map((sig) => (
            <SignalCard key={sig.label} sig={sig} />
          ))}
        </motion.div>
      </div>
    </section>
    </>
  );
}
