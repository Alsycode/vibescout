// FILE: app/(app)/login/page.jsx
// PURPOSE: Login page — glass-elevated card on void background.
//          On success: stores vb_token cookie, redirects to /admin (role:admin) or /funnel.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '../../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });

      // Cookie is set by the server (httpOnly). Store a non-httpOnly copy
      // for client-side role checks when the server hasn't set it yet.
      if (data.token) {
        Cookies.set('vb_token', data.token, { expires: 7, sameSite: 'lax' });
      }

      const role = data.user?.role;
      if (role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/analyze');
      }
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
      }}
    >
      <div
        className="glass-elevated animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: 'var(--space-xl)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-gold)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            Vibescout
          </p>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-xs)',
            }}
          >
            Sign in to your account
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              background: 'var(--color-danger-bg)',
              border: '1px solid var(--color-danger-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-sm) var(--space-md)',
              marginBottom: 'var(--space-md)',
              color: 'var(--color-danger)',
              fontSize: '13px',
              fontWeight: 300,
            }}
          >
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label
              htmlFor="email"
              style={{
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                padding: '12px var(--space-md)',
                fontSize: '15px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
            <label
              htmlFor="password"
              style={{
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: '12px var(--space-md)',
                fontSize: '15px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              marginTop: 'var(--space-sm)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.25 : 1,
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        {/* Register link */}
        <p
          style={{
            marginTop: 'var(--space-lg)',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-secondary)',
          }}
        >
          No account?{' '}
          <Link
            href="/register"
            style={{
              color: 'var(--color-accent-70)',
              textDecoration: 'none',
              transition: 'color var(--duration-fast) ease',
            }}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
