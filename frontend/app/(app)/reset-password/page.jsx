'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '../../../lib/api';

const STARS = [
  [8, 12, 0.45], [22, 5, 0.60], [38, 22, 0.35], [14, 38, 0.50],
  [48, 8, 0.40], [5, 55, 0.30], [65, 8, 0.45], [82, 5, 0.65],
  [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45], [95, 45, 0.60],
];

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [success, setSuccess]     = useState(false);
  const [error, setError]         = useState('');
  const [focused, setFocused]     = useState(null);

  if (!token) {
    return (
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '13px', color: '#E63946', marginBottom: '20px' }}>
          Invalid or missing reset token.
        </p>
        <Link href="/forgot-password" style={{ color: '#0DD8C0', textDecoration: 'none', fontSize: '13px' }}>
          Request a new reset link
        </Link>
      </div>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => router.replace('/login'), 3000);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Invalid or expired reset link.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(110,203,122,0.12)', border: '1px solid rgba(110,203,122,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6ECB7A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', margin: '0 0 10px' }}>
          Password updated
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Your password has been reset. Redirecting to sign in…
        </p>
        <Link href="/login" style={{ display: 'block', width: '100%', padding: '13px', background: '#0DD8C0', color: '#080812', fontWeight: 600, fontSize: '14px', textDecoration: 'none', borderRadius: '10px', textAlign: 'center' }}>
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '10px' }}>
          ◆ NEW PASSWORD
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px' }}>
          Reset your password
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', margin: 0 }}>
          Choose a new password for your account.
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.22)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#E63946', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {[
          { id: 'password', label: 'New password', value: password, setter: setPassword, placeholder: '••••••••' },
          { id: 'confirm',  label: 'Confirm password', value: confirm, setter: setConfirm, placeholder: '••••••••' },
        ].map(({ id, label, value, setter, placeholder }) => (
          <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
              {label}
            </label>
            <input
              type="password" required value={value}
              onChange={(e) => setter(e.target.value)}
              onFocus={() => setFocused(id)} onBlur={() => setFocused(null)}
              placeholder={placeholder}
              style={{
                fontSize: '14px', padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${focused === id ? 'rgba(13,216,192,0.50)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '10px', color: 'rgba(255,255,255,0.88)', outline: 'none',
                width: '100%', boxSizing: 'border-box', transition: 'border-color 200ms ease',
                boxShadow: focused === id ? '0 0 0 3px rgba(13,216,192,0.08)' : 'none',
              }}
            />
          </div>
        ))}

        <button type="submit" disabled={loading} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', padding: '13px 24px',
          background: loading ? 'rgba(13,216,192,0.12)' : '#0DD8C0',
          border: 'none', borderRadius: '10px',
          color: loading ? 'rgba(13,216,192,0.45)' : '#080812',
          fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all 200ms ease',
        }}>
          {loading ? 'Updating…' : 'Set new password →'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <Suspense fallback={<p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
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
