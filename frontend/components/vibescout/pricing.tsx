'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, type Variants } from 'framer-motion';
import { ShinyButton } from '@/components/ui/shiny-button';

// ── Star positions [cx%, cy%, opacity] — matches funnel bg ────────────────────

const STARS = [
  [8, 12, 0.45], [22, 5, 0.65], [35, 18, 0.40], [14, 32, 0.55], [48, 8, 0.45],
  [5, 52, 0.35], [28, 44, 0.60], [42, 22, 0.45], [18, 68, 0.40], [38, 75, 0.55],
  [10, 78, 0.45], [25, 88, 0.35], [45, 35, 0.50], [3, 20, 0.40], [33, 58, 0.45],
  [50, 65, 0.55], [15, 47, 0.45], [40, 90, 0.35], [7, 90, 0.65], [30, 15, 0.40],
  [20, 80, 0.45], [46, 48, 0.35], [4, 38, 0.55], [24, 62, 0.45], [37, 8, 0.40],
];

// ── Feature rows — styled as funnel sidebar journey steps ─────────────────────

function SignalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M1 11.5C3 9 5.5 13 8 11C10.5 9 13 13 15 11" stroke="#0DD8C0" strokeWidth="1.35" strokeLinecap="round" />
      <path d="M2.5 8.5C4 6.5 6 10 8 8C10 6 12 10 13.5 8" stroke="#0DD8C0" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5L2.5 3.5V8C2.5 11.25 4.9 14.1 8 15C11.1 14.1 13.5 11.25 13.5 8V3.5L8 1.5Z" stroke="#0DD8C0" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M5.5 8L7 9.5L10.5 6" stroke="#0DD8C0" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <ellipse cx="8" cy="4" rx="5.5" ry="2" stroke="#0DD8C0" strokeWidth="1.35" />
      <path d="M2.5 4V8C2.5 9.1 5.01 10 8 10C10.99 10 13.5 9.1 13.5 8V4" stroke="#0DD8C0" strokeWidth="1.35" />
      <path d="M2.5 8V12C2.5 13.1 5.01 14 8 14C10.99 14 13.5 13.1 13.5 12V8" stroke="#0DD8C0" strokeWidth="1.35" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M9.5 1.5H4C3.448 1.5 3 1.948 3 2.5V13.5C3 14.052 3.448 14.5 4 14.5H12C12.552 14.5 13 14.052 13 13.5V5L9.5 1.5Z" stroke="#0DD8C0" strokeWidth="1.35" strokeLinejoin="round" />
      <path d="M8 7.5V11.5M6 9.5L8 11.5L10 9.5" stroke="#0DD8C0" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6.5" stroke="#0DD8C0" strokeWidth="1.35" />
      <path d="M8 4.5V8L10 9.5" stroke="#0DD8C0" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="7" r="3.5" stroke="#0DD8C0" strokeWidth="1.35" />
      <path d="M9 9l4.5 4.5M11 11l1.5 1.5" stroke="#0DD8C0" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

const INCLUSIONS = [
  { label: '6 live intelligence signals',  sub: 'Air quality, noise, solar, commute, financial fit, local news', Icon: SignalIcon   },
  { label: 'Deterministic verdicts',        sub: 'Computed by pure JS — not AI opinion',                          Icon: ShieldIcon   },
  { label: 'Raw data + source links',       sub: 'Every number traces back to its API source',                    Icon: DatabaseIcon },
  { label: 'PDF export',                    sub: 'Shareable, printable report with full data',                    Icon: FileIcon     },
  { label: '7-day report access',           sub: 'Redis-cached — re-fetch any time within the window',            Icon: ClockIcon    },
  { label: 'No subscription required',      sub: 'One property, one payment, one report',                         Icon: KeyIcon      },
];

const PRICE_TAGS = ['PER REPORT', 'NO SUBSCRIPTION', 'INSTANT DELIVERY'] as const;

// ── Animation variants ─────────────────────────────────────────────────────────

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const fadeUpVariants: Variants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.60, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const priceVariants: Variants = {
  hidden:  { opacity: 0, y: 30, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.70, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 36, scale: 0.975 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.18 } },
};

const rowsContainerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.40 } },
};

const rowVariants: Variants = {
  hidden:  { opacity: 0, x: 14 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.42, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function Pricing() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px 0px' });

  return (
    <section
      ref={sectionRef}
      id="pricing"
      style={{
        background:  '#080812',
        position:    'relative',
        overflow:    'hidden',
        padding:     'clamp(80px, 10vw, 140px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* ── Star field (mirrors funnel FunnelBgDecoration) ─────── */}
      <div
        aria-hidden
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}
      >
        {/* Ambient teal glow — upper left */}
        <div style={{
          position:     'absolute',
          left:         '5%',
          top:          '10%',
          width:        '50vw',
          height:       '50vw',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(13,216,192,0.050) 0%, transparent 65%)',
          transform:    'translate(-15%, -15%)',
        }} />

        {/* Scattered stars */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {STARS.map(([cx, cy, op], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
          ))}
        </svg>

        {/* Teal wave lines — bottom-right, matching funnel */}
        <svg
          style={{
            position:          'absolute',
            right:             '-4%',
            bottom:            '-4%',
            width:             '60%',
            height:            '72%',
            opacity:           0.14,
          }}
          viewBox="0 0 720 580"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="pg-wg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
              <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290"  stroke="url(#pg-wg)" strokeWidth="1.6" fill="none" />
          <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335"  stroke="url(#pg-wg)" strokeWidth="1.3" fill="none" opacity="0.85" />
          <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#pg-wg)" strokeWidth="1.0" fill="none" opacity="0.70" />
          <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255"  stroke="url(#pg-wg)" strokeWidth="1.4" fill="none" opacity="0.75" />
          <path d="M-80 475 C120 425 290 505 460 470 C600 435 715 375 860 425" stroke="url(#pg-wg)" strokeWidth="0.8" fill="none" opacity="0.55" />
          <path d="M-80 260 C30 218 140 285 260 258 C390 228 500 172 670 215"  stroke="url(#pg-wg)" strokeWidth="1.1" fill="none" opacity="0.60" />
        </svg>
      </div>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <div
        className="pricing-grid"
        style={{
          maxWidth:            '1240px',
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap:                 'clamp(48px, 6vw, 108px)',
          alignItems:          'center',
          position:            'relative',
          zIndex:              1,
        }}
      >

        {/* ═══════════════════════════════
            LEFT — Price display + CTA
        ═══════════════════════════════ */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          {/* Eyebrow — matches funnel sidebar title style */}
          <motion.p
            variants={fadeUpVariants}
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '10px',
              fontWeight:    600,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color:         '#0DD8C0',
              marginBottom:  '28px',
              margin:        '0 0 28px',
            }}
          >
            Pricing
          </motion.p>

          {/* Price */}
          <motion.div
            variants={priceVariants}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '18px' }}
          >
            <span style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      'clamp(20px, 2.2vw, 28px)',
              fontWeight:    400,
              color:         'rgba(13,216,192,0.50)',
              letterSpacing: '-0.01em',
              lineHeight:    1,
              marginTop:     'clamp(12px, 1.5vw, 20px)',
            }}>
              ₹
            </span>
            <span style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      'clamp(76px, 9vw, 120px)',
              fontWeight:    400,
              color:         'rgba(255,255,255,0.93)',
              letterSpacing: '-0.05em',
              lineHeight:    1,
              textShadow:    '0 0 60px rgba(13,216,192,0.20), 0 0 24px rgba(13,216,192,0.10)',
            }}>
              199
            </span>
          </motion.div>

          {/* Tag pills — match funnel step completed state */}
          <motion.div
            variants={fadeUpVariants}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '44px' }}
          >
            {PRICE_TAGS.map((tag) => (
              <span
                key={tag}
                style={{
                  fontFamily:    "'Geist Mono', monospace",
                  fontSize:      '9px',
                  fontWeight:    500,
                  letterSpacing: '0.09em',
                  color:         'rgba(13,216,192,0.60)',
                  padding:       '5px 11px',
                  border:        '1px solid rgba(13,216,192,0.18)',
                  borderRadius:  '5px',
                  background:    'rgba(13,216,192,0.04)',
                }}
              >
                {tag}
              </span>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={fadeUpVariants} style={{ marginBottom: '16px' }}>
            <ShinyButton href="/analyze">
              Run Intelligence on a Property →
            </ShinyButton>
          </motion.div>

          {/* Payment note */}
          <motion.p
            variants={fadeUpVariants}
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '12px',
              fontWeight:    400,
              color:         'rgba(255,255,255,0.22)',
              margin:        0,
              letterSpacing: '0.01em',
            }}
          >
            Powered by Razorpay · Report generated live after payment
          </motion.p>
        </motion.div>

        {/* ═══════════════════════════════
            RIGHT — funnel-content-card style
        ═══════════════════════════════ */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', repeatType: 'loop' }}
          >
            {/* Card — funnel-content-card conic gradient border */}
            <div
              style={{
                padding:          '0',
                border:           '1px solid transparent',
                borderRadius:     '18px',
                background:       `
                  linear-gradient(rgba(11,11,20,0.94), rgba(11,11,20,0.94)) padding-box,
                  linear-gradient(135deg,
                    rgba(13,216,192,0.22) 0%,
                    rgba(13,216,192,0.05) 40%,
                    rgba(13,216,192,0.02) 60%,
                    rgba(13,216,192,0.14) 100%
                  ) border-box
                `,
                backdropFilter:   'blur(16px)',
                boxShadow:        '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              {/* Card header — funnel sidebar-title style */}
              <div style={{
                padding:      '16px 24px',
                borderBottom: '1px solid rgba(13,216,192,0.08)',
                background:   'rgba(13,216,192,0.03)',
                borderRadius: '17px 17px 0 0',
                display:      'flex',
                alignItems:   'center',
                gap:          '10px',
              }}>
                {/* Teal glow dot */}
                <span style={{
                  width:        '6px',
                  height:       '6px',
                  borderRadius: '50%',
                  background:   '#0DD8C0',
                  boxShadow:    '0 0 8px rgba(13,216,192,0.80)',
                  flexShrink:   0,
                }} />
                <span style={{
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      '10px',
                  fontWeight:    600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color:         '#0DD8C0',
                }}>
                  Your Audit Journey Includes
                </span>
              </div>

              {/* Feature rows — funnel sidebar step style */}
              <motion.div
                variants={rowsContainerVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                style={{ padding: '20px 24px', position: 'relative' }}
              >
                {/* Vertical connector — gradient like funnel sidebar */}
                <div style={{
                  position:   'absolute',
                  left:       '39px',
                  top:        '36px',
                  bottom:     '36px',
                  width:      '1px',
                  background: 'linear-gradient(to bottom, rgba(13,216,192,0.35) 0%, rgba(255,255,255,0.03) 100%)',
                  zIndex:     0,
                }} />

                {INCLUSIONS.map((item, i) => {
                  const isLast = i === INCLUSIONS.length - 1;
                  return (
                    <motion.div
                      key={item.label}
                      variants={rowVariants}
                      style={{
                        display:    'flex',
                        alignItems: 'center',
                        gap:        '16px',
                        padding:    '10px 0',
                        position:   'relative',
                        zIndex:     1,
                      }}
                    >
                      {/* Step circle — funnel active/completed state */}
                      <div style={{
                        width:          '32px',
                        height:         '32px',
                        borderRadius:   '50%',
                        background:     i === 0
                          ? '#0DD8C0'
                          : 'rgba(13,216,192,0.08)',
                        border:         i === 0
                          ? '2px solid #0DD8C0'
                          : '1.5px solid rgba(13,216,192,0.25)',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        boxShadow:      i === 0
                          ? '0 0 0 4px rgba(13,216,192,0.12), 0 0 16px rgba(13,216,192,0.30)'
                          : 'none',
                        transition:     'all 0.35s ease',
                        filter:         i === 0
                          ? 'none'
                          : 'none',
                      }}>
                        {/* Icon inside circle — invert color when active */}
                        <span style={{
                          display:    'flex',
                          alignItems: 'center',
                          filter:     i === 0 ? 'brightness(0) saturate(100%)' : 'none',
                        }}>
                          <item.Icon />
                        </span>
                      </div>

                      {/* Text — matches funnel sidebar step meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontFamily:  "'Inter', sans-serif",
                          fontSize:    '13.5px',
                          fontWeight:  i === 0 ? 500 : 400,
                          color:       i === 0
                            ? 'rgba(255,255,255,0.93)'
                            : 'rgba(255,255,255,0.60)',
                          margin:      '0 0 2px',
                          lineHeight:  1.3,
                          transition:  'color 0.3s ease',
                        }}>
                          {item.label}
                        </p>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontSize:   '11px',
                          fontWeight: 300,
                          color:      i === 0
                            ? 'rgba(255,255,255,0.38)'
                            : 'rgba(255,255,255,0.20)',
                          margin:     0,
                          lineHeight: 1.4,
                          transition: 'color 0.3s ease',
                        }}>
                          {item.sub}
                        </p>
                      </div>

                      {/* Check dot — teal glow */}
                      <div style={{
                        width:        '6px',
                        height:       '6px',
                        borderRadius: '50%',
                        background:   i === 0 ? '#0DD8C0' : 'rgba(13,216,192,0.30)',
                        boxShadow:    i === 0 ? '0 0 8px rgba(13,216,192,0.55)' : 'none',
                        flexShrink:   0,
                        transition:   'all 0.3s ease',
                      }} />
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Card footer — "Need help?" style from funnel */}
              <div style={{
                margin:       '0 24px 20px',
                padding:      '14px 16px',
                background:   'rgba(13,216,192,0.04)',
                border:       '1px solid rgba(13,216,192,0.12)',
                borderRadius: '10px',
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
              }}>
                <div style={{
                  width:          '32px',
                  height:         '32px',
                  borderRadius:   '50%',
                  background:     'rgba(13,216,192,0.10)',
                  border:         '1px solid rgba(13,216,192,0.20)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  flexShrink:     0,
                }}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#0DD8C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M9 1L3 9h5l-1 6 6-8H8z" />
                  </svg>
                </div>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize:   '12px',
                  fontWeight: 300,
                  color:      'rgba(255,255,255,0.45)',
                  margin:     0,
                  lineHeight: 1.5,
                }}>
                  Every signal computed fresh from live APIs — never cached guesswork.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Responsive ────────────────────────────────────────────── */}
      <style>{`
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 52px !important;
          }
        }
        @media (max-width: 520px) {
          .pricing-grid { padding: 0 !important; }
        }
      `}</style>
    </section>
  );
}
