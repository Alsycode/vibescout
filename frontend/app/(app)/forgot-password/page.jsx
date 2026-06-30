'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

const STARS = [
  [8, 12, 0.45], [22, 5, 0.60], [38, 22, 0.35], [14, 38, 0.50],
  [48, 8, 0.40], [5, 55, 0.30], [30, 48, 0.55], [44, 28, 0.40],
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55],
  [88, 32, 0.45], [95, 45, 0.60], [77, 52, 0.45], [86, 67, 0.55],
];

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080812',
      backgroundImage: 'var(--grid-bg-image)', backgroundSize: '64px 64px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden', padding: '24px',
    }}>
      <svg aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />)}
      </svg>
      <div aria-hidden style={{ position: 'absolute', top: '-10%', right: '-5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,192,0.05) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '420px' }}>
        <div className="auth-form-card" style={{ padding: '40px' }}>
          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(13,216,192,0.12)', border: '1px solid rgba(13,216,192,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0DD8C0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '10px' }}>
                ◆ CHECK YOUR INBOX
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', margin: '0 0 12px' }}>
                Reset link sent
              </h2>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 28px' }}>
                If <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</strong> has an account, a reset link is on its way. Check spam if you don't see it.
              </p>
              <Link href="/login" style={{ display: 'block', width: '100%', padding: '13px', background: '#0DD8C0', color: '#080812', fontWeight: 600, fontSize: '14px', textDecoration: 'none', borderRadius: '10px', textAlign: 'center' }}>
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '10px' }}>
                  ◆ ACCOUNT RECOVERY
                </p>
                <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px' }}>
                  Forgot your password?
                </h2>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                  Enter your email and we'll send a reset link.
                </p>
              </div>

              {error && (
                <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.22)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
                  <p style={{ fontSize: '12px', color: '#E63946', margin: 0 }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
                    Email address
                  </label>
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                    placeholder="you@example.com"
                    style={{
                      fontSize: '14px', padding: '12px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${focused ? 'rgba(13,216,192,0.50)' : 'rgba(255,255,255,0.09)'}`,
                      borderRadius: '10px', color: 'rgba(255,255,255,0.88)', outline: 'none',
                      width: '100%', boxSizing: 'border-box', transition: 'border-color 200ms ease',
                      boxShadow: focused ? '0 0 0 3px rgba(13,216,192,0.08)' : 'none',
                    }}
                  />
                </div>

                <button type="submit" disabled={loading} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  width: '100%', padding: '13px 24px',
                  background: loading ? 'rgba(13,216,192,0.12)' : '#0DD8C0',
                  border: 'none', borderRadius: '10px',
                  color: loading ? 'rgba(13,216,192,0.45)' : '#080812',
                  fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 200ms ease',
                }}>
                  {loading ? 'Sending…' : 'Send reset link →'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: '20px 0 0' }}>
                <Link href="/login" style={{ color: '#0DD8C0', textDecoration: 'none', fontWeight: 500 }}>
                  ← Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>

      <style>{`
        .auth-form-card {
          border: 1px solid transparent; border-radius: 18px;
          background: linear-gradient(rgba(10,10,22,0.96), rgba(10,10,22,0.96)) padding-box,
            conic-gradient(from var(--gradient-angle, 0deg), transparent 0%, #067a6f 20%, #0dd7bf 30%, #067a6f 40%, transparent 50%, transparent 70%, #067a6f 80%, #0dd7bf 85%, #067a6f 90%, transparent 100%) border-box;
          box-shadow: 0 32px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.04);
          animation: gradient-rotate 4s linear infinite;
        }
      `}</style>
    </div>
  );
}
