'use client';

import { useState, useCallback } from 'react';
import api from '../../lib/api';
import { ShinyButton } from '../ui/shiny-button';

// ── Background decoration (mirrors funnel) ────────────────────────────────────

const STARS = [
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45],
  [60, 40, 0.35], [95, 45, 0.60], [77, 52, 0.45], [67, 62, 0.40], [86, 67, 0.55],
  [72, 74, 0.45], [90, 77, 0.35], [63, 27, 0.50], [97, 13, 0.40], [75, 37, 0.45],
  [55, 70, 0.55], [80, 84, 0.45], [92, 88, 0.35], [68, 87, 0.65], [58, 54, 0.40],
  [87, 57, 0.45], [76, 71, 0.35], [93, 31, 0.55], [61, 47, 0.45], [84, 19, 0.40],
  [70, 3, 0.60], [96, 61, 0.45], [59, 81, 0.55], [86, 44, 0.35], [74, 91, 0.45],
];

function PaywallBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
      <div style={{
        position: 'absolute', right: '8%', top: '5%',
        width: '55vw', height: '55vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,216,192,0.045) 0%, transparent 65%)',
        transform: 'translate(15%, -15%)',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>
      <svg style={{ position: 'absolute', right: '-4%', bottom: '-4%', width: '60%', height: '72%', opacity: 0.14 }}
        viewBox="0 0 720 580" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pwg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290" stroke="url(#pwg)" strokeWidth="1.6" fill="none" />
        <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335" stroke="url(#pwg)" strokeWidth="1.3" fill="none" opacity="0.85" />
        <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#pwg)" strokeWidth="1.0" fill="none" opacity="0.70" />
        <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255" stroke="url(#pwg)" strokeWidth="1.4" fill="none" opacity="0.75" />
        <path d="M-80 475 C120 425 290 505 460 470 C600 435 715 375 860 425" stroke="url(#pwg)" strokeWidth="0.8" fill="none" opacity="0.55" />
      </svg>
    </div>
  );
}

// ── Flag dot ──────────────────────────────────────────────────────────────────

function FlagDot({ color, glow }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
      background: color, boxShadow: `0 0 8px ${glow}`,
      display: 'inline-block',
    }} />
  );
}

// ── Locked chapter row (funnel-step style) ────────────────────────────────────

function LockedChapter({ index, label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 16,
      padding: '18px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      {/* Step circle — locked state */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.09)',
        color: 'rgba(255,255,255,0.20)',
        fontSize: 13,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10, fontWeight: 500,
            letterSpacing: '0.13em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.20)', margin: 0,
          }}>
            {label}
          </p>
          <span style={{
            padding: '2px 8px', borderRadius: 4,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            fontFamily: "'Geist Mono', monospace",
            fontSize: 8, fontWeight: 500, letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase',
          }}>LOCKED</span>
        </div>
        {/* Blurred ghost content */}
        <div style={{ filter: 'blur(4px)', userSelect: 'none', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ height: 9, borderRadius: 5, background: 'rgba(13,216,192,0.15)', width: '78%' }} />
          <div style={{ height: 9, borderRadius: 5, background: 'rgba(13,216,192,0.10)', width: '55%' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <div style={{ height: 28, width: 72, borderRadius: 7, background: 'rgba(255,255,255,0.07)' }} />
            <div style={{ height: 28, width: 72, borderRadius: 7, background: 'rgba(255,255,255,0.05)' }} />
            <div style={{ height: 28, width: 72, borderRadius: 7, background: 'rgba(255,255,255,0.04)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Razorpay loader ───────────────────────────────────────────────────────────

function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ReportPaywall({ report, sessionId, onUnlocked }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const headline       = report?.headline ?? 'Your property analysis is ready.';
  const matchKeywords  = report?.matchKeywords ?? [];
  const verdict        = report?.verdict ?? '';
  const summary        = report?.summary ?? {};
  const propertyName   = report?.propertyName;
  const listingType    = report?.listingType;

  const verdictPreview = verdict.length > 120
    ? verdict.slice(0, 117).trimEnd() + '…'
    : verdict;

  const handleUnlock = useCallback(async () => {
    setError('');
    setLoading(true);

    const loaded = await loadRazorpay();
    if (!loaded) {
      setError('Could not load payment gateway. Check your connection.');
      setLoading(false);
      return;
    }

    let order;
    try {
      const { data } = await api.post('/payment/create-order', { sessionId });
      order = data;
    } catch {
      setError('Failed to create payment order. Please try again.');
      setLoading(false);
      return;
    }

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name: 'VibeScout',
      description: 'Full Property Intelligence Report',
      order_id: order.id,
      theme: { color: '#0DD8C0' },
      modal: { ondismiss: () => setLoading(false) },
      handler: async (response) => {
        try {
          await api.post('/payment/verify', {
            sessionId,
            razorpay_order_id:    response.razorpay_order_id,
            razorpay_payment_id:  response.razorpay_payment_id,
            razorpay_signature:   response.razorpay_signature,
          });
          onUnlocked();
        } catch {
          setError('Payment verification failed. Contact support if amount was deducted.');
          setLoading(false);
        }
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', () => {
      setError('Payment failed. Please try again.');
      setLoading(false);
    });
    rzp.open();
  }, [sessionId, onUnlocked]);

  const handleDevUnlock = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      await api.post('/payment/dev-unlock', { sessionId });
      onUnlocked();
    } catch {
      setError('Dev unlock failed.');
      setLoading(false);
    }
  }, [sessionId, onUnlocked]);

  return (
    <div style={{ minHeight: '100vh', background: '#080812', position: 'relative' }}>
      <PaywallBg />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 720, margin: '0 auto', padding: '48px 24px 180px' }}>

        {/* ── Section label ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 18, height: 1, background: 'linear-gradient(90deg, transparent, rgba(13,216,192,0.7))' }} />
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 10, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#0DD8C0',
          }}>
            PROPERTY INTELLIGENCE · PREVIEW
          </span>
        </div>

        {/* ── Preview card ───────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 8,
        }}>
          {/* Top teal accent line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(13,216,192,0.55), transparent)',
          }} />

          <div style={{ padding: '28px 28px 24px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <p style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9, fontWeight: 500,
                  letterSpacing: '0.16em', textTransform: 'uppercase',
                  color: 'rgba(232,160,48,0.70)', margin: '0 0 6px',
                }}>
                  VIBESCOUT INTELLIGENCE
                </p>
                {propertyName && (
                  <p style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 12, fontWeight: 400,
                    letterSpacing: '0.06em',
                    color: 'rgba(255,255,255,0.45)', margin: 0,
                  }}>
                    {propertyName}
                  </p>
                )}
              </div>
              {listingType && (
                <span style={{
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 9, fontWeight: 500,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '4px 12px', borderRadius: 4,
                  background: 'rgba(13,216,192,0.07)',
                  border: '1px solid rgba(13,216,192,0.20)',
                  color: 'rgba(13,216,192,0.70)',
                  flexShrink: 0,
                }}>
                  {listingType === 'sale' ? 'FOR SALE' : 'FOR RENT'}
                </span>
              )}
            </div>

            {/* Headline */}
            <h1 style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(22px, 3.5vw, 34px)',
              fontWeight: 400, lineHeight: 1.2,
              color: 'rgba(255,255,255,0.92)',
              margin: '0 0 18px',
            }}>
              {headline}
            </h1>

            {/* Keywords */}
            {matchKeywords.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20 }}>
                {matchKeywords.slice(0, 4).map((kw, i) => (
                  <span key={i} style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 10, fontWeight: 400,
                    letterSpacing: '0.06em',
                    padding: '4px 12px', borderRadius: 4,
                    color: 'rgba(13,216,192,0.80)',
                    background: 'rgba(13,216,192,0.07)',
                    border: '1px solid rgba(13,216,192,0.20)',
                  }}>
                    {kw}
                  </span>
                ))}
                {matchKeywords.length > 4 && (
                  <span style={{
                    fontFamily: "'Geist Mono', monospace",
                    fontSize: 10, padding: '4px 12px', borderRadius: 4,
                    color: 'rgba(255,255,255,0.22)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    filter: 'blur(3px)', userSelect: 'none',
                  }}>
                    +{matchKeywords.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Verdict preview */}
            {verdictPreview && (
              <div style={{
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.02)',
                borderLeft: '2px solid rgba(13,216,192,0.35)',
                borderRadius: '0 10px 10px 0',
                marginBottom: 24,
              }}>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14, fontWeight: 300,
                  color: 'rgba(255,255,255,0.55)',
                  lineHeight: 1.75, margin: 0,
                }}>
                  {verdictPreview}
                </p>
              </div>
            )}

            {/* Flag scan summary */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 18 }}>
              <p style={{
                fontFamily: "'Geist Mono', monospace",
                fontSize: 9, fontWeight: 500,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(13,216,192,0.40)', margin: '0 0 12px',
              }}>
                SIGNAL SCAN RESULTS
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {summary.totalRedFlags > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                  }}>
                    <FlagDot color="#D4645A" glow="rgba(212,100,90,0.55)" />
                    <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: "'Geist Mono', monospace" }}>
                      {summary.totalRedFlags}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                      Red Flag{summary.totalRedFlags !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {summary.totalCautions > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                  }}>
                    <FlagDot color="#D4A853" glow="rgba(212,168,83,0.55)" />
                    <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: "'Geist Mono', monospace" }}>
                      {summary.totalCautions}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                      Caution{summary.totalCautions !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                {summary.totalPasses > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 16px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                  }}>
                    <FlagDot color="#6ECB7A" glow="rgba(110,203,122,0.55)" />
                    <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.88)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: "'Geist Mono', monospace" }}>
                      {summary.totalPasses}
                    </span>
                    <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9, fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                      Pass{summary.totalPasses !== 1 ? 'es' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Locked chapters ────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>
          {/* Vertical connector — mirrors funnel sidebar */}
          <div style={{
            position: 'absolute', left: 15, top: 16, bottom: 80, width: 1,
            background: 'linear-gradient(to bottom, rgba(13,216,192,0.20) 0%, rgba(255,255,255,0.02) 100%)',
          }} />

          <div style={{ paddingLeft: 0 }}>
            <LockedChapter index={1} label="Environmental Scan" />
            <LockedChapter index={2} label="Personal Matrix" />
            <LockedChapter index={3} label="Financial Analysis" />
            <LockedChapter index={4} label="Community Pulse" />
          </div>

          {/* Fade-out gradient over ghost cards */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 160,
            background: 'linear-gradient(to bottom, transparent, #080812 85%)',
            pointerEvents: 'none',
          }} />
        </div>
      </div>

      {/* ── Unlock CTA — fixed bottom bar ──────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        padding: '16px 24px 28px',
        background: 'linear-gradient(to top, rgba(8,8,18,0.99) 55%, transparent)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      }}>
        {/* Section label above button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <div style={{ width: 14, height: 1, background: 'rgba(232,160,48,0.45)' }} />
          <span style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 9, fontWeight: 600,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: 'rgba(232,160,48,0.55)',
          }}>
            UNLOCK FULL INTELLIGENCE
          </span>
          <div style={{ width: 14, height: 1, background: 'rgba(232,160,48,0.45)' }} />
        </div>

        {error && (
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize: 11, color: '#D4645A',
            textAlign: 'center', maxWidth: 400, margin: 0,
            letterSpacing: '0.04em',
          }}>
            {error}
          </p>
        )}

        <div style={{ width: '100%', maxWidth: 440, opacity: loading ? 0.55 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
          <ShinyButton onClick={handleUnlock} className="shiny-cta-paywall">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading ? (
                <>
                  <div style={{ position: 'relative', width: 16, height: 16, flexShrink: 0 }}>
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px dashed rgba(13,216,192,0.5)', animation: 'spin 10s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: 1, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'rgba(13,216,192,0.9)', animation: 'spin 1.4s linear infinite' }} />
                    <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', border: '1.5px solid transparent', borderBottomColor: 'rgba(168,85,247,0.85)', animation: 'spin 2s linear infinite reverse' }} />
                    <div style={{ position: 'absolute', inset: 0, animation: 'spin 2.5s linear infinite' }}>
                      <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: 2, borderRadius: '50%', background: '#0DD8C0' }} />
                    </div>
                  </div>
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                  </svg>
                  <span>Unlock Full Report</span>
                  <span style={{
                    padding: '2px 10px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    fontSize: 11, fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}>₹199</span>
                </>
              )}
            </div>
          </ShinyButton>
        </div>

        <p style={{
          fontFamily: "'Geist Mono', monospace",
          fontSize: 9, fontWeight: 400,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.20)', margin: 0, textAlign: 'center',
        }}>
          ONE-TIME PAYMENT · UPI, CARDS &amp; NET BANKING · SECURED BY RAZORPAY
        </p>

        {process.env.NEXT_PUBLIC_DEV_UNLOCK === 'true' && (
          <button
            onClick={handleDevUnlock}
            disabled={loading}
            style={{
              marginTop: 2, padding: '7px 16px',
              background: 'transparent',
              border: '1px dashed rgba(255,255,255,0.18)',
              borderRadius: 7,
              fontFamily: "'Geist Mono', monospace",
              fontSize: 10, letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.35)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            ⚙ DEV: SKIP PAYMENT &amp; UNLOCK
          </button>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .shiny-cta-paywall { width: 100%; justify-content: center; padding: 0.9rem 1.75rem; font-family: 'Geist Mono', monospace; font-size: 0.75rem; letter-spacing: 0.09em; border-radius: 10px; }
      `}</style>
    </div>
  );
}
