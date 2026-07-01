'use client';

// Section 4: HOW IT WORKS — Two-layer Architecture of Trust
// Layer 1: Deterministic verdictEngine (pure JS, no AI)
// Layer 2: Groq label writer (writes text only, cannot override verdict)

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

// ── Data ───────────────────────────────────────────────────────────────────────

const LAYERS = [
  {
    tag:     'LAYER 1',
    role:    'Rules-based · No AI',
    name:    'Score Engine',
    file:    'Scores every signal, no exceptions',
    color:   '#34D399',
    rgb:     '52,211,153',
    icon:    'code',
    points: [
      'Checks each signal against fixed cutoffs — e.g. AQI above 100 triggers a warning',
      'No AI involved at this step — purely live data and rules',
      'Assigns a pass, caution, or red flag to each signal',
      'Your verdict is locked the moment it\'s calculated',
      'Nothing else in the system can change it after this point',
    ],
  },
  {
    tag:     'LAYER 2',
    role:    'AI-assisted · Words Only',
    name:    'Plain-English Writer',
    file:    'Turns your score into a sentence you can read',
    color:   '#E8A030',
    rgb:     '232,160,48',
    icon:    'chat',
    points: [
      'Receives the verdict from Step 1 — never sees the raw data',
      'Writes a plain sentence for each signal (e.g. "Moderate congestion on Outer Ring Road")',
      'Every output is automatically checked before it reaches your report',
      'Cannot change, weaken, or override the Step 1 verdict',
      'If the output fails the check, a safe backup phrase is used instead',
    ],
  },
];

// ── SVG Icons ──────────────────────────────────────────────────────────────────

function CodeIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M10 8L4 14L10 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 8L24 14L18 20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChatIcon({ color }: { color: string }) {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M5 6C5 5.44772 5.44772 5 6 5H22C22.5523 5 23 5.44772 23 6V18C23 18.5523 22.5523 19 22 19H10L5 24V6Z"
        stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 11H19M9 15H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function ShieldIcon({ color = '#E8A030' }: { color?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path d="M11 2L3 5.5V11.5C3 16 6.5 20 11 21C15.5 20 19 16 19 11.5V5.5L11 2Z"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        fill={`rgba(${color === '#E8A030' ? '232,160,48' : '52,211,153'},0.08)`}/>
      <path d="M8.5 11L10.5 13L13.5 9" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Horizontal connector between cards ────────────────────────────────────────

function HorizontalConnector({ visible }: { visible: boolean }) {
  // Card header = 37px, card body padding-top = 22px, icon = 52px → icon center ≈ 37+22+26 = 85px from card top
  // We push the connector row up via a negative margin trick so dashes align with icon center
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
      width:          '96px',
      position:       'relative',
      // Shift content up so the line aligns with the icon center in each card
      paddingBottom:  '52px',
    }}>
      {/* Dashed line + Shield row */}
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 0 }}>
        {/* Left dashed */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={visible ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.45, delay: 0.55, ease: 'easeOut' }}
          style={{
            flex:            1,
            height:          '1px',
            transformOrigin: 'left center',
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(232,160,48,0.40) 0px, rgba(232,160,48,0.40) 4px, transparent 4px, transparent 9px)',
          }}
        />

        {/* Shield circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.35, delay: 0.72, ease: [0.34, 1.56, 0.64, 1] }}
          style={{
            width:          '42px',
            height:         '42px',
            borderRadius:   '50%',
            background:     'rgba(232,160,48,0.07)',
            border:         '1px solid rgba(232,160,48,0.28)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexShrink:     0,
            boxShadow:      '0 0 24px rgba(232,160,48,0.14), inset 0 1px 0 rgba(232,160,48,0.08)',
          }}
        >
          <ShieldIcon color="#E8A030" />
        </motion.div>

        {/* Right dashed */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={visible ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
          transition={{ duration: 0.45, delay: 0.55, ease: 'easeOut' }}
          style={{
            flex:            1,
            height:          '1px',
            transformOrigin: 'right center',
            backgroundImage: 'repeating-linear-gradient(90deg, rgba(232,160,48,0.40) 0px, rgba(232,160,48,0.40) 4px, transparent 4px, transparent 9px)',
          }}
        />
      </div>

      {/* VERDICT OBJECT label */}
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }}
        transition={{ duration: 0.35, delay: 0.9 }}
        style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '8px',
          fontWeight:    500,
          letterSpacing: '0.09em',
          color:         'rgba(232,160,48,0.50)',
          textAlign:     'center',
          lineHeight:    1.5,
          whiteSpace:    'nowrap',
          marginTop:     '9px',
        }}
      >
        VERDICT<br/>OBJECT
      </motion.span>
    </div>
  );
}

// ── Layer Card ─────────────────────────────────────────────────────────────────

function LayerCard({
  layer,
  index,
  visible,
}: {
  layer: typeof LAYERS[0];
  index: number;
  visible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, delay: index * 0.15 + 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={{ y: -3, transition: { duration: 0.25, ease: 'easeOut' } }}
      style={{
        flex:         1,
        background:   '#0C0C18',
        borderRadius: '12px',
        border:       `1px solid rgba(255,255,255,0.06)`,
        borderTop:    `1px solid rgba(${layer.rgb},0.45)`,
        overflow:     'hidden',
        boxShadow:    [
          `0 0 0 1px rgba(${layer.rgb},0.12)`,
          `0 0 80px rgba(${layer.rgb},0.18)`,
          `0 0 160px rgba(${layer.rgb},0.06)`,
          '0 24px 64px rgba(0,0,0,0.55)',
          'inset 0 1px 0 rgba(255,255,255,0.06)',
        ].join(', '),
        cursor: 'default',
      }}
    >
      {/* Card header */}
      <div style={{
        padding:      '12px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   `rgba(${layer.rgb},0.025)`,
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
      }}>
        {/* Status dot */}
        <div style={{
          width:        '6px',
          height:       '6px',
          borderRadius: '50%',
          background:   layer.color,
          boxShadow:    `0 0 8px rgba(${layer.rgb},0.8)`,
          flexShrink:   0,
        }} />

        {/* LAYER badge */}
        <span style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9px',
          fontWeight:    500,
          color:         layer.color,
          letterSpacing: '0.08em',
          padding:       '2px 7px',
          background:    `rgba(${layer.rgb},0.08)`,
          border:        `1px solid rgba(${layer.rgb},0.22)`,
          borderRadius:  '3px',
          flexShrink:    0,
        }}>
          {layer.tag}
        </span>

        {/* Role text */}
        <span style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      '9px',
          fontWeight:    400,
          color:         'rgba(255,255,255,0.28)',
          letterSpacing: '0.03em',
        }}>
          {layer.role}
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: '22px 22px 24px', position: 'relative' }}>
        {/* Inner top-glow wash — accent color bleeds down from top border */}
        <div aria-hidden style={{
          position:      'absolute',
          top:           0,
          left:          0,
          right:         0,
          height:        '160px',
          pointerEvents: 'none',
          background:    `radial-gradient(ellipse 90% 80px at 50% 0%, rgba(${layer.rgb},0.16) 0%, rgba(${layer.rgb},0.04) 60%, transparent 100%)`,
          borderRadius:  '0 0 12px 12px',
        }} />
        {/* Icon block + name row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
          {/* Icon square */}
          <div style={{
            width:        '52px',
            height:       '52px',
            borderRadius: '10px',
            background:   `rgba(${layer.rgb},0.08)`,
            border:       `1px solid rgba(${layer.rgb},0.20)`,
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            flexShrink:   0,
            boxShadow:    `0 0 0 5px rgba(${layer.rgb},0.08), 0 0 32px rgba(${layer.rgb},0.35), 0 0 64px rgba(${layer.rgb},0.12)`,
          }}>
            {layer.icon === 'code'
              ? <CodeIcon color={layer.color} />
              : <ChatIcon color={layer.color} />
            }
          </div>

          {/* Name + file */}
          <div style={{ paddingTop: '4px' }}>
            <h3 style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '18px',
              fontWeight:    700,
              color:         'rgba(255,255,255,0.92)',
              margin:        '0 0 4px',
              letterSpacing: '-0.02em',
              lineHeight:    1.2,
            }}>
              {layer.name}
            </h3>
            <p style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              fontWeight:    400,
              color:         `rgba(${layer.rgb},0.65)`,
              letterSpacing: '0.02em',
              margin:        0,
            }}>
              {layer.file}
            </p>
          </div>
        </div>

        {/* Points */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
          {layer.points.map((pt, i) => (
            <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize:   '10px',
                color:      layer.color,
                flexShrink: 0,
                marginTop:  '2px',
                lineHeight: 1.5,
              }}>
                ◆
              </span>
              <span style={{
                fontFamily: "'Inter', sans-serif",
                fontSize:   '13px',
                fontWeight: 400,
                lineHeight: 1.65,
                color:      'rgba(255,255,255,0.48)',
              }}>
                {pt}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────

export default function IntelligenceEngine() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-10% 0px' });

  return (
    <section
      ref={sectionRef}
      id="architecture"
      className="section-pad-std"
      style={{
        background: '#080812',
        position:   'relative',
        overflow:   'hidden',
      }}
    >
      {/* Ambient glow — strong dual-color radial anchored to card positions */}
      <div aria-hidden style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse 560px 380px at 28% 68%, rgba(52,211,153,0.13) 0%, transparent 70%)',
          'radial-gradient(ellipse 560px 380px at 72% 68%, rgba(232,160,48,0.11) 0%, transparent 70%)',
          'radial-gradient(ellipse 200px 300px at 50% 65%, rgba(232,160,48,0.06) 0%, transparent 80%)',
        ].join(', '),
      }} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative' }}>

        {/* ── Section header ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ marginBottom: '52px' }}
        >
          {/* Eyebrow + line */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <p style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '10px',
              fontWeight:    500,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color:         '#03d3bd',
              margin:        0,
              flexShrink:    0,
            }}>
              HOW IT WORKS
            </p>
            <motion.div
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
              style={{
                height:          '1px',
                width:           '120px',
                transformOrigin: 'left center',
                background:      'linear-gradient(90deg, rgba(34,211,238,0.50) 0%, transparent 100%)',
              }}
            />
          </div>

          {/* Headline */}
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
              Deterministic first. AI second.
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
              Never reversed.
            </span>
          </h2>

          {/* Body */}
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '16px',
            fontWeight: 400,
            lineHeight: 1.75,
            color:      'rgba(255,255,255,0.38)',
            maxWidth:   '620px',
            margin:     0,
          }}>
            Your pass, caution, or red flag is set by live data and fixed rules
            — no AI involved. AI only writes the sentence you read. It cannot
            see the raw numbers, change the score, or soften the result.
          </p>
        </motion.div>

        {/* ── Two-layer cards ─────────────────────────────────────────── */}
        <div className="ie-layers-flex">
          <LayerCard layer={LAYERS[0]} index={0} visible={isInView} />
          <div className="ie-connector">
            <HorizontalConnector visible={isInView} />
          </div>
          <LayerCard layer={LAYERS[1]} index={1} visible={isInView} />
        </div>

        {/* ── Anti-hallucination guarantee panel ─────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.6, delay: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            marginTop:    '28px',
            padding:      '18px 22px',
            background:   'rgba(34,211,238,0.025)',
            border:       '1px solid rgba(34,211,238,0.12)',
            borderLeft:   '3px solid rgba(34,211,238,0.40)',
            borderRadius: '10px',
            display:      'flex',
            gap:          '14px',
            alignItems:   'flex-start',
          }}
        >
          {/* Shield icon */}
          <div style={{
            width:        '32px',
            height:       '32px',
            borderRadius: '8px',
            background:   'rgba(34,211,238,0.06)',
            border:       '1px solid rgba(34,211,238,0.15)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            flexShrink:   0,
            marginTop:    '1px',
          }}>
            <ShieldIcon color="#22D3EE" />
          </div>

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '12.5px',
            fontWeight: 400,
            lineHeight: 1.7,
            color:      'rgba(255,255,255,0.38)',
            margin:     0,
          }}>
            <strong style={{ color: '#22D3EE', fontWeight: 600 }}>
              Why you can trust the verdict:{' '}
            </strong>
            Your pass / caution / red flag is decided by data and fixed rules
            before AI is involved. The AI only receives the result — never the
            raw numbers — so it cannot spin or soften what the data says. If its
            output looks wrong, a safe backup phrase is used automatically.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
