'use client';

import React, { useRef, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type VerdictKey = 'proceed' | 'pass' | 'caution' | 'red_flag';

interface Signal {
  label:     string;
  value:     string;
  source:    string;
  verdict:   VerdictKey;
  sparkline?: string;
}

interface IntelligenceCardProps {
  property?:      string;
  generated?:     string;
  overallVerdict?: VerdictKey;
  verdictLabel?:  string;
  signalCount?:   string;
  signals?:       Signal[];
  sources?:       string;
  generatedIn?:   string;
  width?:         number;
  style?:         React.CSSProperties;
  compact?:       boolean;
}

// ── Sample data (Koramangala demo) ────────────────────────────────────────────

const SAMPLE_SPARKLINES = {
  aqi:      '0,16 12,14 24,11 36,13 48,12 60,10 72,11 84,9  96,10',
  noise:    '0,10 12,12 24,14 36,11 48,13 60,12 72,10 84,11 96,10',
  solar:    '0,8  12,7  24,6  36,5  48,5  60,6  72,7  84,7  96,8 ',
  commute:  '0,10 12,12 24,15 36,14 48,16 60,15 72,16 84,15 96,14',
  financial:'0,14 12,13 24,12 36,14 48,15 60,16 72,15 84,14 96,13',
  news:     '0,12 12,11 24,10 36,11 48,10 60,12 72,11 84,10 96,11',
};

const SAMPLE_SIGNALS: Signal[] = [
  { label: 'AIR QUALITY',   value: '42 AQI',      source: 'Good · OpenAQ · Koramangala-01 · 47m ago', verdict: 'proceed', sparkline: SAMPLE_SPARKLINES.aqi      },
  { label: 'NOISE RISK',    value: '38 dB est.',   source: 'Low · OSM/Overpass model',                  verdict: 'proceed', sparkline: SAMPLE_SPARKLINES.noise    },
  { label: 'SOLAR YIELD',   value: '4.8 kWh/m²',  source: 'High · Google Solar API',                   verdict: 'proceed', sparkline: SAMPLE_SPARKLINES.solar    },
  { label: 'COMMUTE TIME',  value: '47 min',       source: 'Google Maps · Tue 08:30',                   verdict: 'caution', sparkline: SAMPLE_SPARKLINES.commute  },
  { label: 'FINANCIAL FIT', value: '+12% above',   source: 'Comparable sales · area avg',               verdict: 'caution', sparkline: SAMPLE_SPARKLINES.financial },
  { label: 'LOCAL NEWS',    value: 'No flags',     source: 'GNews · 2h ago',                            verdict: 'proceed', sparkline: SAMPLE_SPARKLINES.news     },
];

// ── Verdict maps ───────────────────────────────────────────────────────────────

const VERDICT_COLOR: Record<VerdictKey, string> = {
  proceed: '#34D399', pass: '#34D399', caution: '#F59E0B', red_flag: '#E63946',
};
const VERDICT_RGB: Record<VerdictKey, string> = {
  proceed: '52,211,153', pass: '52,211,153', caution: '245,158,11', red_flag: '230,57,70',
};
const VERDICT_LABEL_MAP: Record<VerdictKey, string> = {
  proceed: 'PASS', pass: 'PASS', caution: 'CAUTION', red_flag: 'FLAG',
};

// ── Row SVG icons (14 × 14, cyan stroke) ──────────────────────────────────────

function AQIIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 7h1.5l1-3 1.5 6 1.5-4 1.5 2 1-1h3.5" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function NoiseRowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path d="M1 7h1l1-3 1.5 6 1.5-4 1.5 2 1-1h3.5" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function SolarRowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="6" rx="0.5" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2"/>
      <line x1="7"    y1="1"   x2="7"    y2="3"   stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10.2" y1="2"   x2="9.3"  y2="3.2" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="3.8"  y1="2"   x2="4.7"  y2="3.2" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function CommuteRowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="3.5" y="2" width="7" height="8" rx="1" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2"/>
      <rect x="4.5" y="3" width="5" height="2.5" rx="0.5" stroke="rgba(34,211,238,0.45)" strokeWidth="0.8"/>
      <circle cx="5.5" cy="8"  r="0.7" fill="rgba(34,211,238,0.65)"/>
      <circle cx="8.5" cy="8"  r="0.7" fill="rgba(34,211,238,0.65)"/>
      <line x1="4"  y1="11.5" x2="5.5" y2="10" stroke="rgba(34,211,238,0.55)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="10" y1="11.5" x2="8.5" y2="10" stroke="rgba(34,211,238,0.55)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function FinancialRowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5.5" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2"/>
      <text x="7" y="9.5" textAnchor="middle" fill="rgba(34,211,238,0.65)" fontSize="6" fontFamily="sans-serif">₹</text>
    </svg>
  );
}
function NewsRowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="2" y="2" width="8.5" height="9" rx="1" stroke="rgba(34,211,238,0.65)" strokeWidth="1.2"/>
      <path d="M10.5 4.5v6a1.5 1.5 0 003 0v-6" stroke="rgba(34,211,238,0.45)" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="3.5" y1="4.5" x2="6.5" y2="4.5" stroke="rgba(34,211,238,0.35)" strokeWidth="0.8"/>
      <line x1="3.5" y1="6"   x2="9"   y2="6"   stroke="rgba(34,211,238,0.35)" strokeWidth="0.8"/>
      <line x1="3.5" y1="7.5" x2="9"   y2="7.5" stroke="rgba(34,211,238,0.35)" strokeWidth="0.8"/>
      <line x1="3.5" y1="9"   x2="7"   y2="9"   stroke="rgba(34,211,238,0.35)" strokeWidth="0.8"/>
    </svg>
  );
}

const SIGNAL_ICONS: Record<string, () => React.ReactElement> = {
  'AIR QUALITY':   AQIIcon,
  'NOISE RISK':    NoiseRowIcon,
  'SOLAR YIELD':   SolarRowIcon,
  'COMMUTE TIME':  CommuteRowIcon,
  'FINANCIAL FIT': FinancialRowIcon,
  'LOCAL NEWS':    NewsRowIcon,
};

// ── Card header icon ───────────────────────────────────────────────────────────

function CardShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 1.5L2.5 3.75V8C2.5 11.25 4.9 14.17 8 15C11.1 14.17 13.5 11.25 13.5 8V3.75L8 1.5Z"
        stroke="rgba(34,211,238,0.85)" strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M5.5 8L7 9.5L10.5 6" stroke="rgba(34,211,238,0.85)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Live indicator ─────────────────────────────────────────────────────────────

function LiveIndicator() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span
        className="animate-live-pulse"
        style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#22D3EE', boxShadow: '0 0 8px rgba(34,211,238,0.8)', flexShrink: 0 }}
      />
      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '9px', fontWeight: 500, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.06em' }}>
        LIVE
      </span>
    </span>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ points, verdict }: { points: string; verdict: VerdictKey }) {
  const color =
    verdict === 'red_flag' ? 'rgba(230,57,70,0.45)'
    : verdict === 'caution' ? 'rgba(245,158,11,0.45)'
    : 'rgba(52,211,153,0.40)';
  return (
    <svg width="52" height="18" viewBox="0 0 96 20" style={{ display: 'block', flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

// ── Signal row ─────────────────────────────────────────────────────────────────

function SignalRow({ signal, isLast, pad }: { signal: Signal; isLast: boolean; pad: number }) {
  const color = VERDICT_COLOR[signal.verdict];
  const rgb   = VERDICT_RGB[signal.verdict];
  const Icon  = SIGNAL_ICONS[signal.label];

  return (
    <div
      className="ic-row"
      style={{
        display:             'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems:          'center',
        gap:                 '12px',
        padding:             `10px ${pad}px`,
        borderBottom:        isLast ? 'none' : '1px solid rgba(255,255,255,0.038)',
        transition:          'background 140ms ease',
        cursor:              'default',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.022)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
    >
      {/* Icon container */}
      <div className="ic-row-icon" style={{
        width:          '32px',
        height:         '32px',
        borderRadius:   '8px',
        background:     'rgba(255,255,255,0.038)',
        border:         '1px solid rgba(255,255,255,0.065)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        flexShrink:     0,
      }}>
        {Icon ? <Icon /> : null}
      </div>

      {/* Label + value + sparkline + source */}
      <div style={{ minWidth: 0 }}>
        <p style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      '8.5px',
          fontWeight:    500,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color:         'rgba(255,255,255,0.27)',
          margin:        '0 0 3px',
        }}>
          {signal.label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '14px',
            fontWeight:    400,
            color:         'rgba(255,255,255,0.82)',
            letterSpacing: '-0.01em',
            lineHeight:    1,
          }}>
            {signal.value}
          </span>
          {signal.sparkline && <span className="ic-sparkline"><Sparkline points={signal.sparkline} verdict={signal.verdict} /></span>}
        </div>
        <p style={{
          fontFamily:   "'Inter', sans-serif",
          fontSize:     '9.5px',
          fontWeight:   400,
          color:        'rgba(255,255,255,0.28)',
          marginTop:    '2px',
          lineHeight:   1,
          overflow:     'hidden',
          textOverflow: 'ellipsis',
          whiteSpace:   'nowrap',
        }}>
          {signal.source}
        </p>
      </div>

      {/* Glowing verdict dot */}
      <div style={{
        width:        '8px',
        height:       '8px',
        borderRadius: '50%',
        background:   color,
        boxShadow:    `0 0 8px rgba(${rgb},0.65)`,
        flexShrink:   0,
      }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function IntelligenceCard({
  property       = '3BHK · Koramangala 5th Block, Bengaluru',
  generated      = 'SAMPLE REPORT · GENERATED JUNE 14 2026 · 11:47PM',
  overallVerdict = 'proceed',
  verdictLabel   = 'PROCEED WITH CONFIDENCE',
  signalCount    = '6 / 6 SIGNALS CHECKED',
  signals        = SAMPLE_SIGNALS,
  sources        = 'OPENAQ · OSM · GOOGLE SOLAR · GMAPS · GNEWS',
  generatedIn    = 'GENERATED IN 3M 47S',
  width          = 520,
  style,
  compact        = false,
}: IntelligenceCardProps): React.ReactElement {
  const pad      = compact ? 16 : 18;
  const cardRef  = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const verdictColor = VERDICT_COLOR[overallVerdict];
  const verdictRgb   = VERDICT_RGB[overallVerdict];

  useEffect(() => {
    const card  = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;

    let rafId = 0;

    const applyTilt = (clientX: number, clientY: number) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const r  = card.getBoundingClientRect();
        const x  = clientX - r.left;
        const y  = clientY - r.top;
        const cx = r.width  / 2;
        const cy = r.height / 2;
        card.style.transition = 'transform 80ms linear';
        card.style.transform  = `perspective(1000px) rotateX(${-((y - cy) / cy) * 5}deg) rotateY(${((x - cx) / cx) * 7}deg)`;
        const gx = Math.round((x / r.width)  * 100);
        const gy = Math.round((y / r.height) * 100);
        glare.style.opacity    = '1';
        glare.style.transition = 'opacity 80ms linear';
        glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(34,211,238,0.06) 0%, rgba(255,255,255,0.03) 38%, transparent 65%)`;
      });
    };

    const resetTilt = () => {
      cancelAnimationFrame(rafId);
      card.style.transition  = 'transform 600ms cubic-bezier(0.25,0.46,0.45,0.94)';
      card.style.transform   = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
      glare.style.opacity    = '0';
      glare.style.transition = 'opacity 500ms ease';
    };

    const onMove  = (e: MouseEvent) => applyTilt(e.clientX, e.clientY);
    const onLeave = () => resetTilt();

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    };
    const onTouchEnd = () => resetTilt();

    card.addEventListener('mousemove',  onMove);
    card.addEventListener('mouseleave', onLeave);
    card.addEventListener('touchmove',  onTouchMove, { passive: true });
    card.addEventListener('touchend',   onTouchEnd);
    return () => {
      cancelAnimationFrame(rafId);
      card.removeEventListener('mousemove',  onMove);
      card.removeEventListener('mouseleave', onLeave);
      card.removeEventListener('touchmove',  onTouchMove);
      card.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={cardRef}
      style={{
        width:        '100%',
        maxWidth:     `${width}px`,
        background:   'linear-gradient(145deg, #0e0e1e 0%, #0b0b19 60%, #090914 100%)',
        border:       '1px solid rgba(255,255,255,0.07)',
        borderTop:    '1px solid rgba(255,255,255,0.13)',
        borderRadius: '16px',
        overflow:     'hidden',
        position:     'relative',
        willChange:   'transform',
        cursor:       'default',
        boxShadow: [
          '0 0 0 1px rgba(255,255,255,0.03)',
          '0 32px 100px rgba(0,0,0,0.65)',
          '0 0 60px rgba(34,211,238,0.04)',
          'inset 0 1px 0 rgba(255,255,255,0.06)',
        ].join(', '),
        ...style,
      }}
    >
      {/* ── HEADER BAR ─────────────────────────────────────── */}
      <div style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '10px',
        padding:      `13px ${pad}px`,
        background:   'rgba(34,211,238,0.025)',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
      }}>
        {/* Shield icon container */}
        <div style={{
          width:          '30px',
          height:         '30px',
          borderRadius:   '8px',
          background:     'rgba(34,211,238,0.07)',
          border:         '1px solid rgba(34,211,238,0.18)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
          boxShadow:      '0 0 12px rgba(34,211,238,0.06)',
        }}>
          <CardShieldIcon />
        </div>

        {/* Title */}
        <span style={{
          fontFamily:    "'Inter', sans-serif",
          fontSize:      '10px',
          fontWeight:    600,
          textTransform: 'uppercase',
          letterSpacing: '0.11em',
          color:         'rgba(255,255,255,0.82)',
          flex:          1,
        }}>
          VIBESCOUT INTELLIGENCE
        </span>

        {/* Live + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LiveIndicator />
          <span className="ic-time" style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '9px',
            fontWeight:    400,
            color:         'rgba(255,255,255,0.30)',
            letterSpacing: '0.04em',
          }}>
            12 MIN AGO
          </span>
        </div>
      </div>

      {/* ── PROPERTY IDENTIFIER ────────────────────────────── */}
      <div style={{ padding: `13px ${pad}px`, borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize:   '13px',
          fontWeight: 500,
          color:      'rgba(255,255,255,0.88)',
          lineHeight: 1,
          margin:     0,
        }}>
          {property}
        </p>
        <p style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9.5px',
          fontWeight:    400,
          color:         'rgba(255,255,255,0.28)',
          letterSpacing: '0.04em',
          marginTop:     '4px',
          margin:        '4px 0 0',
        }}>
          {generated}
        </p>
      </div>

      {/* ── VERDICT BLOCK ──────────────────────────────────── */}
      <div style={{ padding: `12px ${pad}px`, borderBottom: '1px solid rgba(255,255,255,0.055)' }}>
        <div style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
          padding:      '10px 14px',
          background:   `rgba(${verdictRgb},0.04)`,
          border:       `1px solid rgba(${verdictRgb},0.22)`,
          borderRadius: '8px',
          boxShadow:    `0 0 24px rgba(${verdictRgb},0.10), inset 0 1px 0 rgba(${verdictRgb},0.05)`,
        }}>
          {/* Glowing dot */}
          <div style={{
            width:        '8px',
            height:       '8px',
            borderRadius: '50%',
            background:   verdictColor,
            boxShadow:    `0 0 10px rgba(${verdictRgb},0.80)`,
            flexShrink:   0,
          }} />
          <span style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '12px',
            fontWeight:    500,
            color:         verdictColor,
            letterSpacing: '0.06em',
            flex:          1,
          }}>
            {verdictLabel}
          </span>
          <span className="ic-badge" style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '9px',
            fontWeight:    400,
            color:         `rgba(${verdictRgb},0.55)`,
            letterSpacing: '0.04em',
            flexShrink:    0,
            padding:       '3px 8px',
            border:        `1px solid rgba(${verdictRgb},0.20)`,
            borderRadius:  '4px',
            background:    `rgba(${verdictRgb},0.06)`,
          }}>
            {signalCount}
          </span>
        </div>
      </div>

      {/* ── SIGNAL ROWS ────────────────────────────────────── */}
      <div>
        {signals.map((sig, i) => (
          <SignalRow key={sig.label} signal={sig} isLast={i === signals.length - 1} pad={pad} />
        ))}
      </div>

      {/* ── CARD FOOTER ────────────────────────────────────── */}
      <div className="ic-footer" style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        padding:        `10px ${pad}px`,
        background:     'rgba(255,255,255,0.015)',
        borderTop:      '1px solid rgba(255,255,255,0.04)',
      }}>
        <span className="ic-sources" style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9px',
          fontWeight:    400,
          color:         'rgba(255,255,255,0.20)',
          letterSpacing: '0.04em',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
          whiteSpace:    'nowrap',
        }}>
          SOURCES: {sources}
        </span>
        <span style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9px',
          fontWeight:    400,
          color:         'rgba(255,255,255,0.20)',
          letterSpacing: '0.04em',
          flexShrink:    0,
          marginLeft:    '16px',
        }}>
          {generatedIn}
        </span>
      </div>

      {/* ── RESPONSIVE OVERRIDES ───────────────────────────── */}
      <style>{`
        @media (max-width: 480px) {
          .ic-sparkline { display: none !important; }
          .ic-badge     { display: none !important; }
          .ic-time      { display: none !important; }
          .ic-footer    { flex-direction: column; gap: 4px; align-items: flex-start; }
          .ic-sources   { white-space: normal !important; overflow: visible !important; }
          .ic-row       { gap: 8px !important; }
          .ic-row-icon  { width: 26px !important; height: 26px !important; }
        }
        @media (max-width: 360px) {
          .ic-row-icon { display: none !important; }
        }
      `}</style>

      {/* ── DYNAMIC GLARE OVERLAY ──────────────────────────── */}
      <div
        ref={glareRef}
        aria-hidden
        style={{
          position:     'absolute',
          inset:        0,
          borderRadius: '16px',
          pointerEvents:'none',
          zIndex:       20,
          opacity:      0,
          mixBlendMode: 'screen',
          background:   'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.06) 0%, transparent 65%)',
          transition:   'opacity 400ms ease',
        }}
      />
    </div>
  );
}
