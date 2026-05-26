'use client';

import { useState, useCallback } from 'react';
import api from '../../lib/api';

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1.5" fill="currentColor" />
    </svg>
  );
}

function GhostLine({ width = '100%', height = 10, opacity = 0.18 }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 6,
        background: `rgba(34,211,238,${opacity})`,
        flexShrink: 0,
      }}
    />
  );
}

function LockedChapter({ title, icon }) {
  return (
    <div
      style={{
        maxWidth: 672,
        width: '100%',
        margin: '0 auto',
        padding: '28px 32px',
        background: 'rgba(8,16,34,0.55)',
        border: '1px solid rgba(34,211,238,0.08)',
        borderRadius: 16,
        position: 'relative',
        overflow: 'hidden',
        filter: 'blur(3px)',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 13, opacity: 0.5 }}>{icon}</span>
        <GhostLine width={120} height={9} opacity={0.25} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <GhostLine width="90%" />
        <GhostLine width="75%" />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <GhostLine width={80} height={32} opacity={0.12} />
          <GhostLine width={80} height={32} opacity={0.12} />
          <GhostLine width={80} height={32} opacity={0.12} />
        </div>
        <GhostLine width="60%" />
        <GhostLine width="82%" />
      </div>
    </div>
  );
}

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

export default function ReportPaywall({ report, sessionId, onUnlocked }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headline = report?.headline ?? 'Your property analysis is ready.';
  const matchKeywords = report?.matchKeywords ?? [];
  const verdict = report?.verdict ?? '';
  const summary = report?.summary ?? {};
  const propertyName = report?.propertyName;
  const listingType = report?.listingType;

  const verdictPreview = verdict.length > 90
    ? verdict.slice(0, 87).trimEnd() + '…'
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
      description: 'Full Property Report',
      order_id: order.id,
      theme: { color: '#22D3EE' },
      modal: {
        ondismiss: () => setLoading(false),
      },
      handler: async (response) => {
        try {
          await api.post('/payment/verify', {
            sessionId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        paddingBottom: 120,
      }}
    >
      {/* ── Preview: Summary Card ─────────────────────────────────── */}
      <div
        style={{
          maxWidth: 672,
          width: '100%',
          margin: '0 auto 24px',
          padding: '36px 40px',
          background: 'rgba(8,16,34,0.75)',
          border: '1px solid rgba(34,211,238,0.16)',
          borderRadius: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top accent */}
        <div
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 1,
            background: 'linear-gradient(90deg,transparent,rgba(34,211,238,0.55),transparent)',
          }}
        />

        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.65)', marginBottom: 5 }}>
              Vibe Intelligence
            </p>
            {propertyName && (
              <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,0.5)' }}>
                {propertyName}
              </p>
            )}
          </div>
          {listingType && (
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 11px', borderRadius: 9999, background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.2)', color: 'rgba(34,211,238,0.7)' }}>
              {listingType === 'sale' ? 'For Sale' : 'For Rent'}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.25, letterSpacing: '-0.02em', marginBottom: 20 }}>
          {headline}
        </h1>

        {/* Keywords — show first 3, blur the rest */}
        {matchKeywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {matchKeywords.slice(0, 3).map((kw, i) => (
              <span
                key={i}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 13px', fontSize: 11, fontWeight: 400, letterSpacing: '0.04em', color: 'rgba(34,211,238,0.85)', background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.22)', borderRadius: 9999 }}
              >
                {kw}
              </span>
            ))}
            {matchKeywords.length > 3 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 13px', fontSize: 11, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9999, filter: 'blur(3px)', userSelect: 'none' }}>
                +{matchKeywords.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Verdict — truncated */}
        {verdictPreview && (
          <div style={{ padding: '12px 16px', background: 'rgba(8,16,34,0.55)', border: '1px solid rgba(34,211,238,0.08)', borderLeft: '2px solid rgba(34,211,238,0.35)', borderRadius: '0 10px 10px 0', marginBottom: 24 }}>
            <p style={{ fontSize: 14, fontWeight: 300, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7 }}>
              {verdictPreview}
            </p>
          </div>
        )}

        {/* Flag counts */}
        <div style={{ borderTop: '1px solid rgba(34,211,238,0.08)', paddingTop: 18 }}>
          <p style={{ fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(34,211,238,0.4)', marginBottom: 12 }}>
            Flag Scan Results
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {summary.totalRedFlags > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(8,16,34,0.6)', border: '1px solid rgba(34,211,238,0.07)', borderRadius: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4645A', boxShadow: '0 0 8px rgba(212,100,90,0.6)', flexShrink: 0 }} />
                <span style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{summary.totalRedFlags}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Red Flag{summary.totalRedFlags !== 1 ? 's' : ''}</span>
              </div>
            )}
            {summary.totalCautions > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(8,16,34,0.6)', border: '1px solid rgba(34,211,238,0.07)', borderRadius: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#D4A853', boxShadow: '0 0 8px rgba(212,168,83,0.6)', flexShrink: 0 }} />
                <span style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{summary.totalCautions}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Caution{summary.totalCautions !== 1 ? 's' : ''}</span>
              </div>
            )}
            {summary.totalPasses > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'rgba(8,16,34,0.6)', border: '1px solid rgba(34,211,238,0.07)', borderRadius: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6ECB7A', boxShadow: '0 0 8px rgba(110,203,122,0.6)', flexShrink: 0 }} />
                <span style={{ fontSize: 22, fontWeight: 600, color: 'rgba(255,255,255,0.92)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{summary.totalPasses}</span>
                <span style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Pass{summary.totalPasses !== 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Locked ghost chapters ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
        <LockedChapter title="Environmental Scan" icon="🌿" />
        <LockedChapter title="Personal Matrix" icon="🧭" />
        <LockedChapter title="Financial Analysis" icon="📊" />

        {/* Fade-out gradient over ghost cards */}
        <div
          style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 220,
            background: 'linear-gradient(to bottom, transparent, var(--color-bg) 80%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Unlock CTA — fixed bottom bar ────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          padding: '20px 24px 28px',
          background: 'linear-gradient(to top, rgba(4,8,20,0.98) 60%, transparent)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {error && (
          <p style={{ fontSize: 12, color: '#D4645A', textAlign: 'center', maxWidth: 400 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleUnlock}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            maxWidth: 420,
            padding: '16px 28px',
            background: loading
              ? 'rgba(34,211,238,0.15)'
              : 'linear-gradient(135deg, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.12) 100%)',
            border: '1px solid rgba(34,211,238,0.45)',
            borderRadius: 14,
            color: loading ? 'rgba(34,211,238,0.4)' : 'rgba(34,211,238,0.95)',
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : '0 0 32px rgba(34,211,238,0.15)',
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.3) 0%, rgba(34,211,238,0.18) 100%)';
              e.currentTarget.style.boxShadow = '0 0 48px rgba(34,211,238,0.25)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.12) 100%)';
              e.currentTarget.style.boxShadow = '0 0 32px rgba(34,211,238,0.15)';
            }
          }}
        >
          {loading ? (
            <span style={{ opacity: 0.6 }}>Processing…</span>
          ) : (
            <>
              <LockIcon />
              <span>Unlock Full Report</span>
              <span
                style={{
                  marginLeft: 4,
                  padding: '2px 10px',
                  background: 'rgba(34,211,238,0.15)',
                  border: '1px solid rgba(34,211,238,0.3)',
                  borderRadius: 9999,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                ₹99
              </span>
            </>
          )}
        </button>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>
          One-time payment · UPI, Cards &amp; Net Banking · Secured by Razorpay
        </p>
      </div>
    </div>
  );
}
