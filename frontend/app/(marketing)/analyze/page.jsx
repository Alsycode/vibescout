// FILE: app/(marketing)/analyze/page.jsx
// PURPOSE: Property search entry point — redesigned to match funnel design philosophy.
//          Teal accent, funnel-style card + header, same background decoration.

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

// Fixed star positions
const STARS = [
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45],
  [60, 40, 0.35], [95, 45, 0.60], [77, 52, 0.45], [67, 62, 0.40], [86, 67, 0.55],
  [72, 74, 0.45], [90, 77, 0.35], [63, 27, 0.50], [97, 13, 0.40], [75, 37, 0.45],
  [55, 70, 0.55], [80, 84, 0.45], [92, 88, 0.35], [68, 87, 0.65], [58, 54, 0.40],
  [87, 57, 0.45], [76, 71, 0.35], [93, 31, 0.55], [61, 47, 0.45], [84, 19, 0.40],
  [70, 3, 0.60], [96, 61, 0.45], [59, 81, 0.55], [86, 44, 0.35], [74, 91, 0.45],
];

function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
      <div style={{
        position: 'absolute', right: '5%', top: '5%',
        width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(13,216,192,0.045) 0%, transparent 65%)',
        transform: 'translate(15%, -15%)',
      }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>
    </div>
  );
}

export default function AnalyzePage() {
  const router      = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [resolved,    setResolved]    = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    api.get('/auth/me')
      .then(() => setAuthChecked(true))
      .catch((err) => {
        if (err?.response?.status === 401) {
          router.replace('/login');
        } else {
          setAuthChecked(true);
        }
      });
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

  const isConfirm = !!resolved;

  return (
    <div
      className="teal-layout"
      style={{ minHeight: '100vh', background: 'var(--color-bg)', position: 'relative' }}
    >
      <BgDecoration />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '96px 24px 48px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          className="funnel-content-card animate-fade-up"
          style={{ maxWidth: '520px', padding: '40px 44px' }}
        >
          {/* ── Step badge ── */}
          <span
            style={{
              display: 'inline-block',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
              background: 'rgba(13,216,192,0.08)',
              border: '1px solid rgba(13,216,192,0.22)',
              borderRadius: '20px',
              padding: '4px 14px',
              marginBottom: '18px',
            }}
          >
            PROPERTY AUDIT
          </span>

          {/* ── Heading ── */}
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.93)',
              lineHeight: 1.2,
              margin: '0 0 10px',
            }}
          >
            {isConfirm ? 'Confirm location' : 'Where is the property?'}
          </h1>

          <p
            style={{
              fontSize: '14px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.40)',
              margin: '0 0 20px',
              lineHeight: 1.55,
            }}
          >
            {isConfirm
              ? 'Make sure the pin is on the correct location before proceeding.'
              : 'Enter the property name or address you are considering.'}
          </p>

          {/* Teal accent line */}
          <div
            style={{
              width: '56px',
              height: '2px',
              borderRadius: '2px',
              background: 'linear-gradient(90deg, var(--color-accent), rgba(13,216,192,0.2))',
              marginBottom: '28px',
            }}
          />

          {/* ── Error ── */}
          {error && (
            <div
              style={{
                background: 'var(--color-danger-bg)',
                border: '1px solid var(--color-danger-border)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: 'var(--color-danger)',
                fontSize: '13px',
                fontWeight: 300,
              }}
            >
              {error}
            </div>
          )}

          {/* ── Content ── */}
          {!isConfirm ? (
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
                    marginTop: '16px',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.40)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
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
                      flexShrink: 0,
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
                  margin: '16px auto 0',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.30)',
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
    </div>
  );
}
