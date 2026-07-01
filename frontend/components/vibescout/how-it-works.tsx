'use client';

// Section: HOW IT WORKS — 3-step user journey
// Scroll-triggered animations. User-friendly, non-technical.

import { useRef, type CSSProperties } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

// ── Icons ─────────────────────────────────────────────────────────────────────

function PinIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <path
        d="M14 3C10.13 3 7 6.13 7 10c0 5.25 7 15 7 15s7-9.75 7-15c0-3.87-3.13-7-7-7z"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
      />
      <circle cx="14" cy="10" r="2.5" stroke={color} strokeWidth="1.4" fill="rgba(52,211,153,0.12)" />
    </svg>
  );
}

function RadarIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <circle cx="14" cy="14" r="10" stroke={color} strokeWidth="1.4" strokeDasharray="2 3.5" opacity="0.32" />
      <circle cx="14" cy="14" r="6"  stroke={color} strokeWidth="1.4" strokeDasharray="2 3.5" opacity="0.58" />
      <circle cx="14" cy="14" r="2"  fill={color} />
      <line x1="14" y1="14" x2="21.5" y2="6" stroke={color} strokeWidth="1.7" strokeLinecap="round" opacity="0.78" />
      <line x1="14" y1="14" x2="22.5" y2="12" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.32" />
    </svg>
  );
}

function ReportIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden>
      <rect x="6" y="3" width="16" height="22" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M10 9h8M10 13h8M10 17h5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.48" />
      <path d="M16 19.5l1.5 1.5L20 17.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="7.5" width="10" height="7.5" rx="1.5" stroke="#34D399" strokeWidth="1.4" />
      <path d="M5.5 7.5V5a2.5 2.5 0 015 0v2.5" stroke="#34D399" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.25" r="1.1" fill="#34D399" />
    </svg>
  );
}

// ── Step data ─────────────────────────────────────────────────────────────────

const STEPS = [
  {
    num:   '01',
    title: 'Tell us where',
    desc:  'Enter any address in India. No account needed to get started — just type and go.',
    note:  'Works for any street, colony, or landmark',
    color: '#34D399',
    rgb:   '52,211,153',
    Icon:  PinIcon,
  },
  {
    num:   '02',
    title: 'We scan 6 signals',
    desc:  'We pull live data on air quality, safety, transit, schools, flood risk, and amenities — from verified public sources, not crowdsourced opinions.',
    note:  '6 live feeds · ~8 seconds total',
    color: '#22D3EE',
    rgb:   '34,211,238',
    Icon:  RadarIcon,
  },
  {
    num:   '03',
    title: 'Your report is ready',
    desc:  'A full scored report in seconds. Honest verdicts, no fluff. Download or share it with your family.',
    note:  'Verdict fixed by rules · not guessed by AI',
    color: '#E8A030',
    rgb:   '232,160,48',
    Icon:  ReportIcon,
  },
] as const;

// ── Connector ─────────────────────────────────────────────────────────────────
// Sits between two cards in the flex row. Aligns with the icon center in each card.
// Icon top = 24px (card padding) + ~18px (badge) + 18px (badge margin) = 60px
// Icon center = 60 + 26 = 86px → that's paddingTop we apply here.

function Connector({ visible, delay }: { visible: boolean; delay: number }) {
  return (
    <div
      className="hiw-connector"
      style={{
        flexShrink:  0,
        width:       '72px',
        alignSelf:   'flex-start',
        paddingTop:  '86px',
        position:    'relative',
        overflow:    'hidden',
      }}
    >
      {/* Draw-on dashed line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={visible ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        style={{
          width:           '100%',
          height:          '1px',
          transformOrigin: 'left center',
          backgroundImage:
            'repeating-linear-gradient(90deg, rgba(255,255,255,0.14) 0px, rgba(255,255,255,0.14) 4px, transparent 4px, transparent 10px)',
        }}
      />

      {/* Travelling glow dot — loops after draw-on completes */}
      {visible && (
        <div
          aria-hidden
          style={{
            position:         'absolute',
            top:              '82px',          // (86px paddingTop) - (2px half-dot-height)
            left:             '-4px',
            width:            '5px',
            height:           '5px',
            borderRadius:     '50%',
            background:       'rgba(52,211,153,0.95)',
            boxShadow:        '0 0 8px 2px rgba(52,211,153,0.55)',
            animation:        'travelDot 3s ease-in-out infinite',
            animationDelay:   `${delay + 0.55}s`,
            pointerEvents:    'none',
          }}
        />
      )}
    </div>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  visible,
}: {
  step: typeof STEPS[number];
  index: number;
  visible: boolean;
}) {
  const cardDelay = index * 0.18 + 0.25;

  return (
    <motion.div
      className="hiw-card"
      initial={{ opacity: 0, y: 44 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }}
      transition={{ duration: 0.65, delay: cardDelay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -5, transition: { duration: 0.22, ease: 'easeOut' } }}
      whileTap={{ scale: 0.99 }}
      style={
        {
          flex:         1,
          minWidth:     0,
          position:     'relative',
          background:   '#0C0C18',
          borderRadius: '14px',
          border:       '1px solid rgba(255,255,255,0.06)',
          borderTop:    `1px solid rgba(${step.rgb},0.42)`,
          overflow:     'hidden',
          cursor:       'default',
          boxShadow: [
            `0 0 0 1px rgba(${step.rgb},0.07)`,
            `0 0 55px rgba(${step.rgb},0.12)`,
            '0 22px 60px rgba(0,0,0,0.52)',
            'inset 0 1px 0 rgba(255,255,255,0.05)',
          ].join(', '),
          '--card-rgb': step.rgb,
        } as CSSProperties
      }
    >
      {/* Ambient top-glow wash */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          top:           0,
          left:          0,
          right:         0,
          height:        '150px',
          background:    `radial-gradient(ellipse 85% 110px at 50% 0%, rgba(${step.rgb},0.11) 0%, transparent 100%)`,
          pointerEvents: 'none',
          borderRadius:  '14px 14px 0 0',
        }}
      />

      {/* Large ghost step number — decorative depth */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          top:           '8px',
          right:         '16px',
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '88px',
          fontWeight:    700,
          letterSpacing: '-0.04em',
          color:         `rgba(${step.rgb},0.048)`,
          lineHeight:    1,
          userSelect:    'none',
          pointerEvents: 'none',
        }}
      >
        {step.num}
      </div>

      {/* Card body */}
      <div style={{ padding: '24px 22px 22px', position: 'relative' }}>

        {/* Step badge */}
        <div style={{ marginBottom: '18px' }}>
          <span style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '9px',
            fontWeight:    500,
            letterSpacing: '0.12em',
            color:         step.color,
            padding:       '3px 8px',
            background:    `rgba(${step.rgb},0.08)`,
            border:        `1px solid rgba(${step.rgb},0.22)`,
            borderRadius:  '3px',
            display:       'inline-block',
          }}>
            STEP {step.num}
          </span>
        </div>

        {/* Icon + one-shot pulse ring */}
        <div style={{ position: 'relative', width: '52px', height: '52px', marginBottom: '18px' }}>

          {/* Pulse ring — plays once when card enters */}
          {visible && (
            <div
              aria-hidden
              style={{
                position:         'absolute',
                inset:            '-10px',
                borderRadius:     '50%',
                border:           `1px solid rgba(${step.rgb},0.55)`,
                animation:        'pulseRingOnce 0.85s ease-out forwards',
                animationDelay:   `${cardDelay + 0.28}s`,
                opacity:          0,
                pointerEvents:    'none',
              }}
            />
          )}

          {/* Icon box */}
          <div style={{
            width:          '52px',
            height:         '52px',
            borderRadius:   '12px',
            background:     `rgba(${step.rgb},0.07)`,
            border:         `1px solid rgba(${step.rgb},0.18)`,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            boxShadow:      `0 0 0 4px rgba(${step.rgb},0.06), 0 0 28px rgba(${step.rgb},0.28)`,
          }}>
            <step.Icon color={step.color} />
          </div>
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      '18px',
          fontWeight:    700,
          color:         'rgba(255,255,255,0.92)',
          margin:        '0 0 10px',
          letterSpacing: '-0.02em',
          lineHeight:    1.2,
        }}>
          {step.title}
        </h3>

        {/* Description */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize:   '14px',
          fontWeight: 400,
          lineHeight: 1.72,
          color:      'rgba(255,255,255,0.44)',
          margin:     '0 0 20px',
        }}>
          {step.desc}
        </p>

        {/* Divider */}
        <div style={{
          height:       '1px',
          background:   'rgba(255,255,255,0.05)',
          marginBottom: '14px',
        }} />

        {/* Backend note — mono label */}
        <p style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '10px',
          fontWeight:    400,
          letterSpacing: '0.025em',
          color:         `rgba(${step.rgb},0.48)`,
          margin:        0,
          display:       'flex',
          alignItems:    'center',
          gap:           '6px',
        }}>
          <span style={{ color: step.color, fontSize: '8px' }}>◆</span>
          {step.note}
        </p>
      </div>
    </motion.div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function HowItWorks() {
  const ref    = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduce = useReducedMotion();

  // Respect prefers-reduced-motion — skip animations, show everything immediately
  const visible = reduce ? true : inView;

  return (
    <section
      id="how-it-works"
      ref={ref}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Ambient section glow ── */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          inset:         0,
          background:    'radial-gradient(ellipse 900px 500px at 50% 40%, rgba(52,211,153,0.028) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '1160px', margin: '0 auto', padding: '110px 24px 120px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '70px' }}>

          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}
          >
            <div style={{
              width:      '22px',
              height:     '1px',
              background: 'linear-gradient(90deg, transparent, #34D399)',
            }} />
            <span style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              fontWeight:    500,
              letterSpacing: '0.18em',
              color:         '#34D399',
            }}>
              THE PROCESS
            </span>
            <div style={{
              width:      '22px',
              height:     '1px',
              background: 'linear-gradient(90deg, #34D399, transparent)',
            }} />
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.60, delay: 0.13 }}
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      'clamp(28px, 4vw, 44px)',
              fontWeight:    700,
              color:         'rgba(255,255,255,0.94)',
              margin:        '0 0 16px',
              letterSpacing: '-0.03em',
              lineHeight:    1.16,
            }}
          >
            Get your neighbourhood report
            <br />
            <span style={{ color: '#34D399' }}>in 3 steps</span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
            transition={{ duration: 0.52, delay: 0.21 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '15px',
              fontWeight: 400,
              color:      'rgba(255,255,255,0.36)',
              margin:     0,
              lineHeight: 1.65,
            }}
          >
            No guesswork. No opinions. Just data-backed verdicts on any address in India.
          </motion.p>
        </div>

        {/* ── Cards + connectors ── */}
        <div
          className="hiw-cards"
          style={{
            display:     'flex',
            alignItems:  'flex-start',
            gap:         0,
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step.num} style={{ display: 'contents' }}>
              <StepCard step={step} index={i} visible={visible} />
              {i < STEPS.length - 1 && (
                <Connector
                  visible={visible}
                  delay={i * 0.18 + 0.56}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Trust badge ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          transition={{ duration: 0.52, delay: 0.95 }}
          style={{ marginTop: '52px', display: 'flex', justifyContent: 'center' }}
        >
          <div style={{
            display:      'inline-flex',
            alignItems:   'center',
            gap:          '10px',
            padding:      '10px 20px',
            background:   'rgba(52,211,153,0.05)',
            border:       '1px solid rgba(52,211,153,0.14)',
            borderRadius: '100px',
          }}>
            <LockIcon />
            <span style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '13px',
              fontWeight:    400,
              color:         'rgba(255,255,255,0.50)',
              letterSpacing: '-0.01em',
            }}>
              Every verdict is calculated by{' '}
              <span style={{ color: '#34D399', fontWeight: 500 }}>fixed rules</span>
              {' '}— not guessed by AI
            </span>
          </div>
        </motion.div>
      </div>

      {/* ── CSS keyframes + responsive ── */}
      <style>{`
        @keyframes pulseRingOnce {
          0%   { transform: scale(1);   opacity: 0.65; }
          100% { transform: scale(2.5); opacity: 0;    }
        }

        @keyframes travelDot {
          0%   { transform: translateX(-4px); opacity: 0;   }
          8%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateX(76px); opacity: 0;   }
        }

        /* Hover glow boost — uses CSS custom property set per card */
        .hiw-card:hover {
          box-shadow:
            0 0 0 1px rgba(var(--card-rgb), 0.14),
            0 0 80px rgba(var(--card-rgb), 0.20),
            0 28px 70px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
        }

        @media (max-width: 767px) {
          .hiw-cards {
            flex-direction: column !important;
            gap: 14px !important;
          }
          .hiw-connector {
            display: none !important;
          }
        }
      `}</style>
    </section>
  );
}
