// FILE: app/(marketing)/analyze/page.jsx
// PURPOSE: Property search entry point — minimalist search page.
//          Uses LocationSearch for 3-path geocoding, LocationConfirmMap for confirmation.
//          On confirm: POST /analyze/start, redirect to /funnel?sessionId=xxx.

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import LocationSearch from '../../../components/LocationSearch';
import api from '../../../lib/api';

const LocationConfirmMap = dynamic(
  () => import('../../../components/LocationConfirmMap'),
  { ssr: false }
);

export default function AnalyzePage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [resolved, setResolved] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(() => setAuthChecked(true))
      .catch(() => router.replace('/login'));
  }, [router]);

  if (!authChecked) {
    return <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }} />;
  }

  async function handleConfirm({ lat, lng } = {}) {
    if (!resolved) return;
    setLoading(true);
    setError('');

    const confirmedLat = lat ?? resolved.lat;
    const confirmedLng = lng ?? resolved.lng;

    try {
      const { data } = await api.post('/analyze/start', {
        lat: confirmedLat,
        lng: confirmedLng,
        name: resolved.name,
        placeId: resolved.placeId ?? null,
        confirmed: true,
      });

      router.push(`/funnel?sessionId=${data.sessionId}`);
    } catch (err) {
      setError(err?.response?.data?.error ?? 'Could not start analysis. Please try again.');
      setLoading(false);
    }
  }

  function handleReset() {
    setResolved(null);
    setError('');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-lg)',
        paddingTop: '96px',
      }}
    >
      <div
        className="glass-elevated animate-fade-up"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: 'var(--space-xl)',
        }}
      >
        {/* Header */}
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
            Property Audit
          </p>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {resolved ? 'Confirm location' : 'Where is the property?'}
          </h1>
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-secondary)',
              marginTop: 'var(--space-xs)',
              lineHeight: 1.5,
            }}
          >
            {resolved
              ? 'Make sure the pin is on the correct location before proceeding.'
              : 'Enter the property name or address you are considering.'}
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

        {/* Search or Confirm */}
        {!resolved ? (
          <LocationSearch onResolved={setResolved} />
        ) : (
          <div>
            <LocationConfirmMap
              lat={resolved.lat}
              lng={resolved.lng}
              name={resolved.name}
              onConfirm={handleConfirm}
            />

            {loading && (
              <p
                style={{
                  marginTop: 'var(--space-md)',
                  textAlign: 'center',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: 'var(--color-text-secondary)',
                }}
              >
                <span
                  className="animate-glow-pulse"
                  style={{
                    display: 'inline-block',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--color-accent)',
                    marginRight: 'var(--space-sm)',
                    verticalAlign: 'middle',
                  }}
                />
                Scanning environment...
              </p>
            )}

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              style={{
                display: 'block',
                margin: 'var(--space-md) auto 0',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                fontSize: '13px',
                fontWeight: 300,
                cursor: loading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                opacity: loading ? 0.3 : 1,
              }}
            >
              Choose a different location
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
