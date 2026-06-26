'use client';

// Section 5: WHAT YOU RECEIVE — Verdict Showcase
// 680px IntelligenceCard centered, verdictStamp animation on entry

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import IntelligenceCard from '@/components/IntelligenceCard';

export default function ReportPreview() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
      },
      { threshold: 0.10 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="sample"
      className="section-pad-std"
      style={{
        background:      '#080812',
        backgroundImage: 'var(--grid-bg-image)',
        backgroundSize:  '64px 64px',
        position:        'relative',
        overflow:        'hidden',
      }}
    >
      {/* Inline keyframe for verdictStamp */}
      <style>{`
        @keyframes verdictStamp {
          0%   { opacity: 0; transform: scale(1.08); filter: blur(2px); }
          60%  { opacity: 1; transform: scale(0.97); filter: blur(0); }
          80%  { transform: scale(1.01); }
          100% { transform: scale(1); }
        }
        .verdict-stamp-enter {
          animation: verdictStamp 500ms cubic-bezier(0.34,1.56,0.64,1) both;
        }
      `}</style>

      {/* Ambient green glow behind card */}
      <div
        aria-hidden
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          background:
            'radial-gradient(ellipse 700px 500px at 50% 55%, rgba(52,211,153,0.04) 0%, transparent 70%)',
        }}
      />

      <div
        style={{
          maxWidth: '1280px',
          margin:   '0 auto',
          position: 'relative',
        }}
      >
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          {/* Eyebrow with flanking lines */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '22px' }}>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={visible ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              style={{
                height:          '1px',
                width:           '48px',
                flexShrink:      0,
                transformOrigin: 'right center',
                background:      'linear-gradient(270deg, rgba(34,211,238,0.55) 0%, transparent 100%)',
              }}
            />
            <span style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '10px',
              fontWeight:    600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color:         'rgba(34,211,238,0.75)',
              whiteSpace:    'nowrap',
            }}>
              WHAT YOU RECEIVE
            </span>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={visible ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
              style={{
                height:          '1px',
                width:           '48px',
                flexShrink:      0,
                transformOrigin: 'left center',
                background:      'linear-gradient(90deg, rgba(34,211,238,0.55) 0%, transparent 100%)',
              }}
            />
          </div>

          {/* Instrument Serif italic heading */}
          <h2 style={{ margin: '0 0 20px' }}>
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
              A complete intelligence report.
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
              In under 5 minutes.
            </span>
          </h2>

          {/* Body */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '15px',
            fontWeight: 400,
            lineHeight: 1.78,
            color:      'rgba(255,255,255,0.42)',
            maxWidth:   '540px',
            margin:     '0 auto',
          }}>
            Every VibeScout report includes all six signals, a consolidated
            verdict, raw data sources, and a generation timestamp. No
            subscriptions. ₹199 per report, generated live.
          </p>
        </motion.div>

        {/* Card — centered, 680px, verdictStamp on entry */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'center',
            opacity:        visible ? 1 : 0,
            transition:     'opacity 300ms ease 200ms',
          }}
        >
          <div
            className={visible ? 'verdict-stamp-enter' : ''}
            style={{
              animationDelay: '300ms',
            }}
          >
            <IntelligenceCard
              width={680}
              style={{
                boxShadow: [
                  '0 0 0 1px rgba(255,255,255,0.04)',
                  '0 40px 120px rgba(0,0,0,0.70)',
                  '0 0 160px rgba(52,211,153,0.07)',
                  'inset 0 1px 0 rgba(255,255,255,0.07)',
                ].join(', '),
              }}
            />
          </div>
        </div>

        {/* Feature cards — styled to match intelligence-section card language */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="report-feature-grid"
          style={{ marginTop: '40px' }}
        >
          {[
            { value: '₹199',         label: 'per report',             rgb: '232,160,48',  color: '#E8A030' },
            { value: 'LIVE',         label: 'generated · not cached', rgb: '34,211,238',  color: '#22D3EE' },
            { value: 'NO SUB',       label: 'no subscription needed', rgb: '52,211,153',  color: '#34D399' },
            { value: 'PDF',          label: 'export included',        rgb: '34,211,238',  color: '#22D3EE' },
          ].map((f, i) => (
            <div
              key={f.value}
              style={{
                background:   '#0C0C18',
                borderRadius: '12px',
                border:       '1px solid rgba(255,255,255,0.06)',
                borderTop:    `1px solid rgba(${f.rgb},0.40)`,
                padding:      '18px 20px',
                boxShadow: [
                  `0 0 0 1px rgba(${f.rgb},0.08)`,
                  `0 0 40px rgba(${f.rgb},0.10)`,
                  '0 16px 48px rgba(0,0,0,0.50)',
                  'inset 0 1px 0 rgba(255,255,255,0.05)',
                ].join(', '),
                position:     'relative',
                overflow:     'hidden',
              }}
            >
              {/* Inner top glow */}
              <div aria-hidden style={{
                position:      'absolute',
                top:           0, left: 0, right: 0,
                height:        '80px',
                pointerEvents: 'none',
                background:    `radial-gradient(ellipse 80% 60px at 50% 0%, rgba(${f.rgb},0.12) 0%, transparent 100%)`,
              }} />

              {/* Status dot */}
              <div style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   f.color,
                boxShadow:    `0 0 8px rgba(${f.rgb},0.80)`,
                marginBottom: '14px',
              }} />

              {/* Value */}
              <p style={{
                fontFamily:    "'Geist Mono', monospace",
                fontSize:      '22px',
                fontWeight:    400,
                color:         f.color,
                letterSpacing: '-0.02em',
                lineHeight:    1,
                margin:        '0 0 6px',
                textShadow:    `0 0 24px rgba(${f.rgb},0.35)`,
              }}>
                {f.value}
              </p>

              {/* Label */}
              <p style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '11px',
                fontWeight:    400,
                color:         'rgba(255,255,255,0.35)',
                letterSpacing: '0.01em',
                lineHeight:    1.5,
                margin:        0,
              }}>
                {f.label}
              </p>
            </div>
          ))}
        </motion.div>

        <style>{`
          .report-feature-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            max-width: 680px;
            margin-left: auto;
            margin-right: auto;
          }
          @media (max-width: 640px) {
            .report-feature-grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        `}</style>
      </div>
    </section>
  );
}
