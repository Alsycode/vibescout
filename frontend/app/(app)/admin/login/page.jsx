// FILE: app/(app)/admin/login/page.jsx
// PURPOSE: Admin-only login — posts to /admin/auth/login (separate cookie/session
//          from the customer login at /login). No signup link, no forgot-password
//          link — admin accounts are provisioned directly, not self-served.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Invalid email or password.');
      }

      router.replace('/admin');
    } catch (err) {
      setError(err.message ?? 'Invalid email or password.');
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080812',
      backgroundImage: 'var(--grid-bg-image)',
      backgroundSize: '64px 64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '40px',
        borderRadius: '18px',
        background: 'linear-gradient(rgba(10,10,22,0.96), rgba(10,10,22,0.96)) padding-box, rgba(255,255,255,0.08) border-box',
        border: '1px solid transparent',
        boxShadow: '0 32px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.04)',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: "'Geist Mono', monospace", fontSize: '9px', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '10px' }}>
            ◆ RESTRICTED ACCESS
          </p>
          <h1 style={{ fontFamily: "'Inter', sans-serif", fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.92)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
            Haum Admin
          </h1>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
            Sign in with your admin account
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.22)', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#E63946', flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#E63946', margin: 0, fontWeight: 400 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="email" style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
              Email
            </label>
            <input
              id="email" type="email" required autoComplete="email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')} onBlur={() => setFocusedField(null)}
              placeholder="admin@haum.com"
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: '14px', padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${focusedField === 'email' ? 'rgba(13,216,192,0.50)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '10px', color: 'rgba(255,255,255,0.88)', outline: 'none',
                width: '100%', boxSizing: 'border-box', transition: 'border-color 200ms ease',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(13,216,192,0.08)' : 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="password" style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.40)' }}>
              Password
            </label>
            <input
              id="password" type="password" required autoComplete="current-password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)}
              placeholder="••••••••"
              style={{
                fontFamily: "'Inter', sans-serif", fontSize: '14px', padding: '12px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${focusedField === 'password' ? 'rgba(13,216,192,0.50)' : 'rgba(255,255,255,0.09)'}`,
                borderRadius: '10px', color: 'rgba(255,255,255,0.88)', outline: 'none',
                width: '100%', boxSizing: 'border-box', transition: 'border-color 200ms ease',
                boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(13,216,192,0.08)' : 'none',
              }}
            />
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
          >
            {loading ? <span style={{ opacity: 0.7 }}>Signing in…</span> : <><span>Sign in</span><span style={{ opacity: 0.6, fontSize: '12px' }}>→</span></>}
          </button>
        </form>
      </div>
    </div>
  );
}
