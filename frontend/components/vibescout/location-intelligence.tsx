'use client';

// Section 2: Information Gap — Redesigned
// Layout: two-column, left editorial + right broker disclosure audit dashboard
// Motion: Framer Motion stagger reveal, floating card, row sequential entrance

import React, { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';

// ── Types ─────────────────────────────────────────────────────────────────────

type VerdictDot = 'proceed' | 'caution' | 'red_flag';

// ── Color maps ────────────────────────────────────────────────────────────────

const DOT_COLOR: Record<VerdictDot, string> = {
  proceed:  '#34D399',
  caution:  '#F59E0B',
  red_flag: '#E63946',
};

const DOT_GLOW: Record<VerdictDot, string> = {
  proceed:  'rgba(52, 211, 153, 0.55)',
  caution:  'rgba(245, 158, 11, 0.55)',
  red_flag: 'rgba(230, 57, 70, 0.55)',
};

// ── Row SVG icons ─────────────────────────────────────────────────────────────

function AQIIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M1 7.5 L3 4.5 L5 10.5 L7 3 L9 12 L11 6.5 L13 8.5 L14 7.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NoiseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M5 3.5 L5 11.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M5 3.5 L10 6 L10 9 L5 11.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M12 5.5 C13.2 6.5 13.2 8.5 12 9.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M1.5 7.5 L3.5 7.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SolarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <rect x="2" y="5" width="11" height="7" rx="0.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" />
      <line x1="7.5" y1="1.5" x2="7.5" y2="4" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="11.5" y1="2.5" x2="10.2" y2="4" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="3.5" y1="2.5" x2="4.8" y2="4" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CommuteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="6" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" />
      <path d="M7.5 4.5 L7.5 7.5 L9.5 9" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <path d="M7.5 1.5 L14 5 L7.5 8.5 L1 5 Z" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M3.5 6.5 L3.5 11 C3.5 11 5.5 12.5 7.5 12.5 C9.5 12.5 11.5 11 11.5 11 L11.5 6.5" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function BudgetIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden>
      <circle cx="7.5" cy="7.5" r="6" stroke="rgba(255,255,255,0.40)" strokeWidth="1.4" />
      <text x="7.5" y="10.5" textAnchor="middle" fill="rgba(255,255,255,0.40)" fontSize="7" fontFamily="sans-serif">₹</text>
    </svg>
  );
}

// ── Stat card icons ───────────────────────────────────────────────────────────

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="7" cy="6" r="3" stroke="#22D3EE" strokeWidth="1.4" />
      <path d="M1.5 16C1.5 12.96 4.02 10.5 7 10.5" stroke="#22D3EE" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="13" cy="6.5" r="2.5" stroke="#22D3EE" strokeWidth="1.4" />
      <path d="M10 16C10 13.515 11.343 11.62 13 11 C14.657 11.62 16 13.515 16 16" stroke="#22D3EE" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RupeeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <line x1="5" y1="4.5" x2="13" y2="4.5" stroke="#22D3EE" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="5" y1="7.5" x2="13" y2="7.5" stroke="#22D3EE" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M5 7.5 C5 7.5 7 7.5 9 7.5 C11 7.5 12.5 6.2 12.5 5 C12.5 3.8 11 3 9 3"
        stroke="#22D3EE"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M5 7.5 L11.5 14.5" stroke="#22D3EE" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// ── Shield icon (card header) ─────────────────────────────────────────────────

function ShieldCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5L2.5 3.75V8C2.5 11.25 4.9 14.17 8 15C11.1 14.17 13.5 11.25 13.5 8V3.75L8 1.5Z"
        stroke="rgba(34,211,238,0.85)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 8L7 9.5L10.5 6"
        stroke="rgba(34,211,238,0.85)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const AUDIT_ROWS: {
  label: string;
  value: string;
  verdict: VerdictDot;
  Icon: () => React.ReactElement;
}[] = [
  { label: 'AIR QUALITY (LIVE AQI)',     value: '42 AQI · Good',            verdict: 'proceed',  Icon: AQIIcon     },
  { label: 'NOISE RISK (OSM MODEL)',     value: 'Low · 38 dB est.',         verdict: 'proceed',  Icon: NoiseIcon   },
  { label: 'SOLAR POTENTIAL',            value: '4.8 kWh/m² · High',        verdict: 'proceed',  Icon: SolarIcon   },
  { label: 'COMMUTE TIME',               value: '47 min · Tue 08:30',       verdict: 'caution',  Icon: CommuteIcon },
  { label: 'NEAREST SCHOOL',             value: '450 m · DPS nearby',       verdict: 'proceed',  Icon: SchoolIcon  },
  { label: 'BUDGET FIT',                 value: '+12% above bracket',       verdict: 'caution',  Icon: BudgetIcon  },
];

const STATS = [
  { num: '73%',   sub: 'of buyers discover issues after signing',    Icon: UsersIcon  },
  { num: '₹4.2L', sub: 'average hidden cost per metro transaction',  Icon: RupeeIcon  },
];

// ── Animation variants ────────────────────────────────────────────────────────

const leftColVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUpVariants: Variants = {
  hidden:   { opacity: 0, y: 24 },
  visible:  {
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const cardEnterVariants: Variants = {
  hidden:   { opacity: 0, y: 36, scale: 0.975 },
  visible:  {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.18 },
  },
};

const rowsContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.38 } },
};

const rowVariants: Variants = {
  hidden:   { opacity: 0, x: 14 },
  visible:  {
    opacity: 1, x: 0,
    transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Main component ─────────────────────────────────────────────────────────────

export default function LocationIntelligence() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px 0px' });

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      style={{
        background: '#080812',
        position:   'relative',
        overflow:            'hidden',
        padding:             'clamp(80px, 10vw, 140px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* ── Ambient glows ──────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          background:    'radial-gradient(ellipse 800px 700px at 78% 55%, rgba(34,211,238,0.045) 0%, transparent 65%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          background:    'radial-gradient(ellipse 500px 400px at 80% 70%, rgba(230,57,70,0.025) 0%, transparent 70%)',
        }}
      />
      <div
        aria-hidden
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          background:    'radial-gradient(ellipse 600px 300px at 20% 30%, rgba(34,211,238,0.018) 0%, transparent 65%)',
        }}
      />

      {/* ── Two-column layout ──────────────────────────────────── */}
      <div
        className="info-gap-grid"
        style={{
          maxWidth:            '1280px',
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap:                 'clamp(48px, 6vw, 104px)',
          alignItems:          'center',
          position:            'relative',
        }}
      >

        {/* ════════════════════════════════════════════════════════
            LEFT COLUMN
        ════════════════════════════════════════════════════════ */}
        <motion.div
          variants={leftColVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Eyebrow label */}
          <motion.div
            variants={fadeUpVariants}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}
          >
            <div
              style={{
                width:      '18px',
                height:     '1px',
                background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.7))',
              }}
            />
            <p
              style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '10px',
                fontWeight:    600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color:         '#03d3bd',
                margin:        0,
              }}
            >
              THE INFORMATION GAP
            </p>
          </motion.div>

          {/* Editorial heading */}
          <motion.h2 variants={fadeUpVariants} style={{ margin: '0 0 22px' }}>
            <span
              style={{
                display:       'block',
                fontFamily:    "'Instrument Serif', serif",
                fontStyle:     'normal',
                fontSize:      'clamp(30px, 3.4vw, 50px)',
                fontWeight:    400,
                letterSpacing: '-0.01em',
                lineHeight:    1.16,
                color:         'rgba(255,255,255,0.92)',
              }}
            >
              The listing shows you
            </span>
            <span
              style={{
                display:       'block',
                fontFamily:    "'Instrument Serif', serif",
                fontStyle:     'normal',
                fontSize:      'clamp(30px, 3.4vw, 50px)',
                fontWeight:    400,
                letterSpacing: '-0.01em',
                lineHeight:    1.16,
                color:         '#03d3bd',
                textShadow:    '0 0 40px rgba(3,211,189,0.25)',
              }}
            >
              what they want you to see.
            </span>
          </motion.h2>

          {/* Body text */}
          <motion.p
            variants={fadeUpVariants}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '15px',
              fontWeight: 400,
              lineHeight: 1.78,
              color:      'rgba(255,255,255,0.45)',
              maxWidth:   '430px',
              margin:     '0 0 44px',
            }}
          >
            VibeScout is the independent intelligence layer between a property
            buyer and the information ecosystem that profits from their
            uncertainty. Six signals pulled directly from the source — no broker
            incentives, no sponsored placements.
          </motion.p>

          {/* Stat cards */}
          <motion.div
            variants={fadeUpVariants}
            className="info-gap-stats"
            style={{ display: 'flex', gap: '14px' }}
          >
            {STATS.map((s) => (
              <motion.div
                key={s.num}
                whileHover={{
                  y: -3,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.55), 0 0 24px rgba(34,211,238,0.07)',
                }}
                transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  flex:            1,
                  background:      'rgba(12, 12, 24, 0.85)',
                  border:          '1px solid rgba(255,255,255,0.07)',
                  borderTop:       '1px solid rgba(255,255,255,0.11)',
                  borderRadius:    '12px',
                  padding:         '20px',
                  backdropFilter:  'blur(12px)',
                  boxShadow:       '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
                  cursor:          'default',
                }}
              >
                <div style={{ marginBottom: '12px' }}>
                  <s.Icon />
                </div>
                <p
                  style={{
                    fontFamily:    "'Geist Mono', monospace",
                    fontSize:      '30px',
                    fontWeight:    400,
                    color:         '#22D3EE',
                    letterSpacing: '-0.025em',
                    lineHeight:    1,
                    margin:        '0 0 8px',
                    textShadow:    '0 0 28px rgba(34,211,238,0.3)',
                  }}
                >
                  {s.num}
                </p>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize:   '11px',
                    fontWeight: 400,
                    color:      'rgba(255,255,255,0.32)',
                    lineHeight: 1.55,
                    margin:     0,
                  }}
                >
                  {s.sub}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* ════════════════════════════════════════════════════════
            RIGHT COLUMN — Broker Disclosure Audit
        ════════════════════════════════════════════════════════ */}
        <motion.div
          variants={cardEnterVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
          >
            {/* Dashboard card */}
            <motion.div
              whileHover={{
                boxShadow: [
                  '0 0 0 1px rgba(255,255,255,0.05)',
                  '0 40px 120px rgba(0,0,0,0.70)',
                  '0 0 80px rgba(34,211,238,0.07)',
                  'inset 0 1px 0 rgba(255,255,255,0.08)',
                ].join(', '),
              }}
              transition={{ duration: 0.3 }}
              style={{
                background:   'linear-gradient(145deg, #0e0e1e 0%, #0b0b19 60%, #090914 100%)',
                border:       '1px solid rgba(255,255,255,0.07)',
                borderTop:    '1px solid rgba(255,255,255,0.13)',
                borderRadius: '16px',
                overflow:     'hidden',
                boxShadow:    [
                  '0 0 0 1px rgba(255,255,255,0.03)',
                  '0 32px 100px rgba(0,0,0,0.65)',
                  '0 0 60px rgba(34,211,238,0.04)',
                  'inset 0 1px 0 rgba(255,255,255,0.06)',
                ].join(', '),
              }}
            >
              {/* ── Card header ──────────────────────────────────── */}
              <div
                style={{
                  padding:        '14px 18px',
                  borderBottom:   '1px solid rgba(255,255,255,0.055)',
                  background:     'rgba(34,211,238,0.025)',
                  display:        'flex',
                  alignItems:     'center',
                  gap:            '10px',
                }}
              >
                {/* Shield icon container */}
                <div
                  style={{
                    width:           '30px',
                    height:          '30px',
                    borderRadius:    '8px',
                    background:      'rgba(34,211,238,0.07)',
                    border:          '1px solid rgba(34,211,238,0.18)',
                    display:         'flex',
                    alignItems:      'center',
                    justifyContent:  'center',
                    flexShrink:      0,
                    boxShadow:       '0 0 12px rgba(34,211,238,0.06)',
                  }}
                >
                  <ShieldCheckIcon />
                </div>

                <span
                  style={{
                    fontFamily:    "'Inter', sans-serif",
                    fontSize:      '10px',
                    fontWeight:    600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.11em',
                    color:         'rgba(255,255,255,0.82)',
                    flex:          1,
                  }}
                >
                  BROKER DISCLOSURE AUDIT
                </span>

                {/* Gaps detected badge */}
                <span
                  style={{
                    fontFamily:    "'Geist Mono', monospace",
                    fontSize:      '9px',
                    fontWeight:    500,
                    letterSpacing: '0.06em',
                    color:         '#22D3EE',
                    padding:       '4px 9px',
                    border:        '1px solid rgba(34,211,238,0.28)',
                    borderRadius:  '5px',
                    background:    'rgba(34,211,238,0.05)',
                    whiteSpace:    'nowrap',
                    boxShadow:     '0 0 10px rgba(34,211,238,0.06)',
                  }}
                >
                  6 GAPS DETECTED
                </span>
              </div>

              {/* ── Audit rows ────────────────────────────────────── */}
              <motion.div
                variants={rowsContainerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
              >
                {AUDIT_ROWS.map((row, i) => {
                  const color = DOT_COLOR[row.verdict];
                  const glow  = DOT_GLOW[row.verdict];
                  return (
                    <motion.div
                      key={row.label}
                      variants={rowVariants}
                      whileHover={{ background: 'rgba(255,255,255,0.022)' }}
                      style={{
                        display:        'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        alignItems:     'center',
                        gap:            '13px',
                        padding:        '11px 18px',
                        borderBottom:   i < AUDIT_ROWS.length - 1
                          ? '1px solid rgba(255,255,255,0.038)'
                          : 'none',
                        cursor:         'default',
                        transition:     'background 140ms ease',
                      }}
                    >
                      {/* Row icon container */}
                      <div
                        style={{
                          width:           '32px',
                          height:          '32px',
                          borderRadius:    '8px',
                          background:      'rgba(255,255,255,0.038)',
                          border:          '1px solid rgba(255,255,255,0.065)',
                          display:         'flex',
                          alignItems:      'center',
                          justifyContent:  'center',
                          flexShrink:      0,
                        }}
                      >
                        <row.Icon />
                      </div>

                      {/* Label + value */}
                      <div>
                        <p
                          style={{
                            fontFamily:    "'Inter', sans-serif",
                            fontSize:      '8.5px',
                            fontWeight:    500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.09em',
                            color:         'rgba(255,255,255,0.27)',
                            margin:        '0 0 3px',
                          }}
                        >
                          {row.label}
                        </p>
                        <p
                          style={{
                            fontFamily:    "'Geist Mono', monospace",
                            fontSize:      '13px',
                            fontWeight:    400,
                            color:         'rgba(255,255,255,0.82)',
                            margin:        0,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {row.value}
                        </p>
                      </div>

                      {/* Status dot */}
                      <div
                        style={{
                          width:        '8px',
                          height:       '8px',
                          borderRadius: '50%',
                          background:   color,
                          boxShadow:    `0 0 8px ${glow}`,
                          flexShrink:   0,
                        }}
                      />
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Source attribution */}
          <p
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '9px',
              fontWeight:    400,
              color:         'rgba(255,255,255,0.17)',
              letterSpacing: '0.04em',
              marginTop:     '14px',
              textAlign:     'right',
              margin:        '14px 0 0',
            }}
          >
            OPENAQ · OSM OVERPASS · GOOGLE SOLAR · GOOGLE MAPS · GNEWS
          </p>
        </motion.div>
      </div>

      {/* ── Responsive overrides ───────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .info-gap-grid {
            grid-template-columns: 1fr !important;
            gap: 56px !important;
          }
        }
        @media (max-width: 520px) {
          .info-gap-stats {
            flex-direction: column !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </section>
  );
}
