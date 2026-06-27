// FILE: app/(app)/register/page.jsx
// PURPOSE: Register page — teal accent matching funnel design system.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '../../../lib/api';
import { CoreSpinLoader } from '../../../components/ui/core-spin-loader';

const STARS = [
  [12, 8, 0.45], [28, 18, 0.55], [42, 6, 0.35], [6, 42, 0.50],
  [50, 22, 0.40], [18, 58, 0.30], [35, 72, 0.50], [48, 55, 0.35],
  [8, 78, 0.45], [22, 88, 0.40], [38, 82, 0.30], [46, 38, 0.50],
  [14, 28, 0.35], [30, 35, 0.45], [44, 92, 0.30],
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55],
  [88, 32, 0.45], [95, 45, 0.60], [77, 52, 0.45], [86, 67, 0.55],
];

const TRUST_ITEMS = [
  { text: '6 live intelligence signals per report' },
  { text: 'Deterministic verdicts — not AI guesswork' },
  { text: '₹199 one-time · no subscription' },
];

const REDIRECT_LOADER = {
  title: 'Creating your account',
  messages: ['Setting up your profile...', 'Getting things ready...', 'Almost there...'],
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, phone, password });

      if (data.token) {
        Cookies.set('vb_token', data.token, { expires: 7, sameSite: 'lax' });
      }

      setLoading(false);
      setRedirecting(true);
      router.replace('/analyze');
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Registration failed. Please try again.');
      setLoading(false);
    }
  }

  const inputStyle = (field) => ({
    fontFamily: "'Inter', sans-serif",
    fontSize: '14px',
    padding: '11px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${focusedField === field ? 'rgba(13,216,192,0.50)' : 'rgba(255,255,255,0.09)'}`,
    borderRadius: '10px',
    color: 'rgba(255,255,255,0.88)',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color 200ms ease, box-shadow 200ms ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(13,216,192,0.08)' : 'none',
  });

  const labelStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: '10px',
    fontWeight: 600,
    letterSpacing: '0.10em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.40)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      backgroundImage: 'var(--grid-bg-image)',
      backgroundSize: '64px 64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '24px',
    }}>
      {/* ── Star field ── */}
      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>

      {/* ── Ambient glows ── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-15%', right: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,192,0.050) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,192,0.025) 0%, transparent 65%)' }} />
      </div>

      {/* ── Wave lines ── */}
      <svg aria-hidden style={{ position: 'absolute', right: '-4%', bottom: '-4%', width: '60%', height: '72%', opacity: 0.13, pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 720 580" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wg-register" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290"  stroke="url(#wg-register)" strokeWidth="1.6" fill="none" />
        <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335"  stroke="url(#wg-register)" strokeWidth="1.3" fill="none" opacity="0.85" />
        <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#wg-register)" strokeWidth="1.0" fill="none" opacity="0.70" />
        <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255"  stroke="url(#wg-register)" strokeWidth="1.4" fill="none" opacity="0.75" />
        <path d="M-80 475 C120 425 290 505 460 470 C600 435 715 375 860 425" stroke="url(#wg-register)" strokeWidth="0.8" fill="none" opacity="0.55" />
        <path d="M-80 260 C30 218 140 285 260 258 C390 228 500 172 670 215"  stroke="url(#wg-register)" strokeWidth="1.1" fill="none" opacity="0.60" />
      </svg>

      {/* ── Two-column layout ── */}
      <div className="auth-layout" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '980px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

        {/* ── LEFT: Brand copy ── */}
        <div className="auth-brand-col" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <div style={{ width: '18px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(13,216,192,0.7))' }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0DD8C0', margin: 0 }}>
              VIBESCOUT INTELLIGENCE
            </p>
            <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, rgba(13,216,192,0.55), transparent)' }} />
          </div>

          <h1 style={{ margin: '0 0 20px' }}>
            <span style={{ display: 'block', fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.12, color: 'rgba(255,255,255,0.92)' }}>
              Audit your next property
            </span>
            <span style={{ display: 'block', fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 3.2vw, 44px)', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.12, color: '#0DD8C0', textShadow: '0 0 48px rgba(13,216,192,0.22)' }}>
              before you sign anything.
            </span>
          </h1>

          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 400, lineHeight: 1.70, color: 'rgba(255,255,255,0.38)', margin: '0 0 36px', maxWidth: '340px' }}>
            Six signals the listing never showed you — sourced live, computed in minutes, yours forever.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {TRUST_ITEMS.map(({ text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '8px', color: 'rgba(13,216,192,0.65)', flexShrink: 0 }}>◆</span>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.52)', margin: 0, lineHeight: 1.5 }}>{text}</p>
              </div>
            ))}
          </div>

          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '9px', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.20)', marginTop: '32px', textTransform: 'uppercase' }}>
            BENGALURU · MUMBAI · PUNE · HYDERABAD
          </p>
        </div>

        {/* ── RIGHT: Form card ── */}
        <div className="auth-form-card" style={{ padding: '36px 40px' }}>
          {redirecting ? (
            <CoreSpinLoader title={REDIRECT_LOADER.title} messages={REDIRECT_LOADER.messages} />
          ) : (
            <>
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '10px' }}>
                  ◆ CREATE ACCOUNT
                </p>
                <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                  Get started
                </h2>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                  Audit any property in under 5 minutes
                </p>
              </div>

              {error && (
                <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.22)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E63946', flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#E63946', margin: 0, fontWeight: 400 }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="name" style={labelStyle}>Full name</label>
                  <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} onFocus={() => setFocusedField('name')} onBlur={() => setFocusedField(null)} placeholder="Your name" style={inputStyle('name')} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="email" style={labelStyle}>Email</label>
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)} placeholder="you@example.com" style={inputStyle('email')} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="phone" style={labelStyle}>Phone number</label>
                  <input id="phone" type="tel" required autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} onFocus={() => setFocusedField('phone')} onBlur={() => setFocusedField(null)} placeholder="+91 98765 43210" style={inputStyle('phone')} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label htmlFor="password" style={labelStyle}>Password</label>
                  <input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} placeholder="Min 6 characters" style={inputStyle('password')} />
                </div>

                <button
                  type="submit" disabled={loading}
                  style={{
                    marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    width: '100%', padding: '13px 24px',
                    background: loading ? 'rgba(13,216,192,0.12)' : '#0DD8C0',
                    border: 'none', borderRadius: '10px',
                    color: loading ? 'rgba(13,216,192,0.45)' : '#080812',
                    fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600,
                    letterSpacing: '-0.01em', cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 200ms ease',
                    boxShadow: loading ? 'none' : '0 8px 24px rgba(13,216,192,0.22)',
                  }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = '#0BB8A6'; e.currentTarget.style.boxShadow = '0 0 0 1px #0DD8C0, 0 8px 32px rgba(13,216,192,0.28)'; } }}
                  onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = '#0DD8C0'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(13,216,192,0.22)'; } }}
                >
                  {loading ? <span style={{ opacity: 0.7 }}>Creating account…</span> : <><span>Create account</span><span style={{ opacity: 0.6, fontSize: '12px' }}>→</span></>}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '22px 0 18px' }}>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '9px', color: 'rgba(255,255,255,0.20)', letterSpacing: '0.08em' }}>OR</span>
                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <p style={{ textAlign: 'center', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#0DD8C0', textDecoration: 'none', fontWeight: 500 }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.75'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-form-card {
          border: 1px solid transparent;
          border-radius: 18px;
          background:
            linear-gradient(rgba(10,10,22,0.96), rgba(10,10,22,0.96)) padding-box,
            conic-gradient(
              from var(--gradient-angle, 0deg),
              transparent 0%,
              #067a6f     20%,
              #0dd7bf     30%,
              #067a6f     40%,
              transparent 50%,
              transparent 70%,
              #067a6f     80%,
              #0dd7bf     85%,
              #067a6f     90%,
              transparent 100%
            ) border-box;
          box-shadow: 0 32px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: gradient-rotate 4s linear infinite;
        }
        .auth-layout {
          grid-template-columns: 1fr 1fr;
          gap: 80px;
        }
        @media (max-width: 860px) {
          .auth-layout {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
            max-width: 460px !important;
          }
          .auth-brand-col {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
