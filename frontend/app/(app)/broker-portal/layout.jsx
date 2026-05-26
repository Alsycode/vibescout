// FILE: app/(app)/broker-portal/layout.jsx
// PURPOSE: Broker portal Phase 2 stub — "Broker portal coming in Phase 2" message.
//          Full auth guard applied. No active UI — Phase 2 adds broker role + bidding.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

function decodeToken(token) {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function BrokerPortalLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get('vb_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded) {
      router.push('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="animate-glow-pulse"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-xl)',
      }}
    >
      <div
        className="glass-elevated"
        style={{
          maxWidth: '520px',
          width: '100%',
          padding: 'var(--space-2xl)',
          textAlign: 'center',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-accent-15)',
            border: '1px solid var(--color-accent-35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-lg)',
          }}
        >
          <span
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-accent)',
              letterSpacing: '-0.02em',
            }}
          >
            V
          </span>
        </div>

        {/* Phase tag */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-env)',
            background: 'rgba(93,116,138,0.12)',
            border: '1px solid rgba(93,116,138,0.25)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px 10px',
            marginBottom: 'var(--space-md)',
          }}
        >
          Phase 2
        </span>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
            marginBottom: 'var(--space-md)',
          }}
        >
          Broker Portal
        </h1>

        <p
          style={{
            fontSize: '15px',
            fontWeight: 300,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.7,
            marginBottom: 'var(--space-lg)',
          }}
        >
          The broker portal is coming in Phase 2. Brokers will be able to bid on
          high-intent leads, view matched properties, and manage their pipeline
          from this dashboard.
        </p>

        <div
          className="glass-subtle"
          style={{
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-xl)',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
            }}
          >
            Phase 2 will include: 5-minute auction windows, per-bid Razorpay
            payments, real-time lead alerts, and CRM-style lead tracking.
          </p>
        </div>

        <a
          href="/"
          style={{
            display: 'inline-block',
            textDecoration: 'none',
          }}
        >
          <button className="btn-secondary" style={{ fontSize: '14px' }}>
            ← Back to home
          </button>
        </a>
      </div>
    </div>
  );
}
