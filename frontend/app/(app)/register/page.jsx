// FILE: app/(app)/register/page.jsx
// PURPOSE: Register page — glass-elevated card on void background.
//          On success: stores vb_token cookie, redirects to /analyze.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import api from '../../../lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/register', { name, email, password });

      if (data.token) {
        Cookies.set('vb_token', data.token, { expires: 7, sameSite: 'lax' });
      }

      router.replace('/analyze');
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Registration failed. Please try again.');
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
            Create account
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-xs)',
            }}
          >
            Audit any property you find
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
              htmlFor="name"
              style={{
                fontSize: '11px',
                fontWeight: 400,
                letterSpacing: '0.04em',
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
              }}
            >
              Full name
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              className="glass-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
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
              autoComplete="new-password"
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        {/* Login link */}
        <p
          style={{
            marginTop: 'var(--space-lg)',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-secondary)',
          }}
        >
          Already have an account?{' '}
          <Link
            href="/login"
            style={{
              color: 'var(--color-accent-70)',
              textDecoration: 'none',
              transition: 'color var(--duration-fast) ease',
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
