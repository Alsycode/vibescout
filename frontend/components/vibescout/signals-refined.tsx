'use client';

const GOLD = '#D4AF37';

const CIRCUIT_BG =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23D4AF37' stroke-width='0.5' stroke-opacity='0.06'%3E%3Cpath d='M10 0v20h20M40 0v40h40M0 40h20v40M60 80V60h20'/%3E%3Ccircle cx='10' cy='20' r='1.5'/%3E%3Ccircle cx='40' cy='40' r='1.5'/%3E%3Ccircle cx='60' cy='60' r='1.5'/%3E%3C/g%3E%3C/svg%3E\")";

/* Top-center border glow — bright at centre, dissipates toward corners */
function TopGlow() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        top: 0,
        left: '10%',
        width: '80%',
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.95) 50%, transparent 100%)',
        boxShadow: [
          '0 0 8px 3px rgba(212,175,55,0.55)',
          '0 0 22px 6px rgba(212,175,55,0.28)',
          '0 0 50px 10px rgba(212,175,55,0.12)',
        ].join(', '),
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function CircularScore() {
  const size = 110;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = 0.88;

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F0CE82" />
            <stop offset="100%" stopColor="#B8922A" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(212,175,55,0.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#score-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ filter: 'drop-shadow(0 0 6px rgba(212,175,55,0.5))' }}
        />
      </svg>
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
  );
}

const cardBase: React.CSSProperties = {
  position: 'relative',
  background: 'rgba(13,11,7,0.96)',
  border: '1px solid rgba(212,175,55,0.15)',
  borderRadius: '16px',
  overflow: 'hidden',
};

const circuitOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: CIRCUIT_BG,
  backgroundSize: '80px 80px',
  pointerEvents: 'none',
  opacity: 0.8,
};

export default function SignalsRefined() {
  return (
    <section style={{ padding: '120px 48px 0', maxWidth: '1000px', margin: '0 auto' }}>
      <style>{`
        .sr-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 18px;
        }
        @media (max-width: 720px) {
          .sr-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: GOLD,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: '12px',
        }}>
          SECTION 6: SIGNALS (REFINED)
        </p>
        <h2 style={{
          fontSize: '34px',
          fontWeight: 600,
          color: '#F5F2EA',
          fontFamily: "'Outfit', sans-serif",
          margin: 0,
          lineHeight: 1.1,
        }}>
          Signals (Refined)
        </h2>
      </div>

      <div className="sr-grid">

        {/* ── Left large card: Location Intelligence Score ── */}
        <div style={{ ...cardBase, padding: '26px', display: 'flex', flexDirection: 'column' }}>
          <TopGlow />
          <div style={circuitOverlay} />

          {/* Header row */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#F5F2EA',
              fontFamily: "'Outfit', sans-serif",
              margin: 0,
            }}>
              Location Intelligence Score
            </h3>
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              border: '1px solid rgba(212,175,55,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          {/* Score body */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
            <CircularScore />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
              <span style={{
                fontSize: '58px',
                fontWeight: 700,
                color: '#F5F2EA',
                fontFamily: "'Outfit', sans-serif",
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
              }}>
                88<span style={{ color: GOLD }}>%</span>
              </span>
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.12em',
                color: 'rgba(245,242,234,0.6)',
                fontFamily: "'Outfit', sans-serif",
                textTransform: 'uppercase',
                lineHeight: 1.3,
              }}>
                LOCATION<br />INTELLIGENCE<br />SCORE
              </span>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            position: 'relative',
            marginTop: '24px',
            paddingTop: '18px',
            borderTop: '1px solid rgba(212,175,55,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '12px',
              fontFamily: "'Outfit', sans-serif",
              color: 'rgba(245,242,234,0.7)',
            }}>
              <span style={{ fontWeight: 700, color: GOLD, letterSpacing: '0.06em' }}>OPTIMAL INVESTMENT</span>
              <span style={{ color: 'rgba(245,242,234,0.5)' }}> - Strong Growth Potential</span>
            </span>
            <div style={{
              width: '22px', height: '22px', borderRadius: '50%',
              background: 'rgba(212,175,55,0.12)',
              border: '1px solid rgba(212,175,55,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Right stacked cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* Solar Yield */}
          <div style={{ ...cardBase, padding: '20px', flex: 1 }}>
            <TopGlow />
            <div style={circuitOverlay} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(245,242,234,0.6)',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  SOLAR YIELD
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '12px' }}>
                <div>
                  <div style={{
                    fontSize: '26px', fontWeight: 700, lineHeight: 1,
                    color: '#F5F2EA', fontFamily: "'Outfit', sans-serif",
                  }}>
                    87<span style={{ color: GOLD }}>%</span> <span style={{ fontSize: '15px', fontWeight: 600 }}>YIELD</span>
                  </div>
                  <div style={{
                    fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(245,242,234,0.45)', fontFamily: "'Outfit', sans-serif",
                    marginTop: '6px',
                  }}>
                    HIGH RADIANCE ZONE
                  </div>
                </div>
                {/* Trend line */}
                <svg width="70" height="34" viewBox="0 0 70 34" fill="none">
                  <polyline
                    points="2,30 14,24 26,26 38,16 50,18 62,6"
                    stroke={GOLD}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.5))' }}
                  />
                  <polyline points="62,6 62,2 58,4" stroke={GOLD} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Commute */}
          <div style={{ ...cardBase, padding: '20px', flex: 1 }}>
            <TopGlow />
            <div style={circuitOverlay} />
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'rgba(245,242,234,0.6)',
                  fontFamily: "'Outfit', sans-serif",
                }}>
                  COMMUTE
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="12 7 12 12 15 14" />
                  </svg>
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '26px', fontWeight: 700, lineHeight: 1,
                  color: '#F5F2EA', fontFamily: "'Outfit', sans-serif",
                }}>
                  15<span style={{ color: GOLD }}>m</span> <span style={{ fontSize: '15px', fontWeight: 600 }}>COMMUTE</span>
                </div>
                <div style={{
                  fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'rgba(245,242,234,0.45)', fontFamily: "'Outfit', sans-serif",
                  marginTop: '6px',
                }}>
                  ON-TRACK - Major Hub Access
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
