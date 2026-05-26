// FILE: app/(app)/admin/shadow-properties/[id]/page.jsx
// PURPOSE: Shadow property detail — all 5 signal values + dataSource per signal.
//          Full intelligence display, read-only. await params per Next.js 15 spec.

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import DataSourceLabel from '../../../../../components/report/DataSourceLabel';
import api from '../../../../../lib/api';

function SignalRow({ label, value, unit, source, updatedAt }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 'var(--space-sm) 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'var(--color-text-secondary)',
          flexShrink: 0,
          marginRight: 'var(--space-md)',
        }}
      >
        {label}
      </span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {value != null ? value : '—'}
          {unit && value != null && (
            <span style={{ fontWeight: 300, color: 'var(--color-text-secondary)', marginLeft: '4px' }}>
              {unit}
            </span>
          )}
        </span>
        {source && (
          <DataSourceLabel source={source} updatedAt={updatedAt} />
        )}
      </div>
    </div>
  );
}

function SignalCard({ title, children }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 'var(--space-lg)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      <p
        style={{
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-gold)',
          marginBottom: 'var(--space-md)',
        }}
      >
        {title}
      </p>
      {children}
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    fetching: { bg: 'rgba(93,116,138,0.12)', text: 'var(--color-env)', border: 'rgba(93,116,138,0.25)' },
    completed: { bg: 'var(--color-success-bg)', text: 'var(--color-success)', border: 'var(--color-success-border)' },
  };
  const c = colors[status] || { bg: 'rgba(255,255,255,0.04)', text: 'var(--color-text-muted)', border: 'rgba(255,255,255,0.07)' };
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status ?? '—'}
    </span>
  );
}

export default function ShadowPropertyDetail({ params }) {
  const { id } = use(params);
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/shadow-properties/${id}`)
      .then((res) => setProperty(res.data?.shadowProperty ?? res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-md)' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <Link
          href="/admin/shadow-properties"
          style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)', textDecoration: 'none' }}
        >
          ← Back to properties
        </Link>
        <div
          className="glass-card"
          style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-lg)' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-danger)' }}>
            {error ? `Failed to load: ${error}` : 'Property not found.'}
          </p>
        </div>
      </div>
    );
  }

  const intel = property.intelligence ?? {};
  const ds = property.dataSource ?? {};
  const specs = property.userProvidedSpecs ?? {};

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Back link */}
      <Link
        href="/admin/shadow-properties"
        style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 'var(--space-lg)',
        }}
      >
        ← Back to properties
      </Link>

      {/* Header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-gold)',
            marginBottom: '6px',
          }}
        >
          SHADOW PROPERTY DETAIL
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {property.name}
          </h1>
          <StatusPill status={property.status} />
        </div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '6px',
          }}
        >
          Session: {property.sessionId} &nbsp;·&nbsp;
          Cluster: {property.clusterId ?? 'unassigned'}
        </p>
      </div>

      {/* Basic info */}
      <SignalCard title="PROPERTY DETAILS">
        <SignalRow label="Coordinates" value={property.coordinates ? `${property.coordinates.lat?.toFixed(5)}, ${property.coordinates.lng?.toFixed(5)}` : null} />
        <SignalRow label="Listing type" value={specs.listingType} />
        <SignalRow label="Budget bracket" value={specs.budgetBracket} />
        <SignalRow label="BHK" value={specs.bhk} />
        <SignalRow label="Floor" value={specs.floor} />
        <SignalRow
          label="Created"
          value={property.createdAt ? new Date(property.createdAt).toLocaleString('en-IN') : null}
        />
      </SignalCard>

      <div style={{ height: 'var(--space-lg)' }} />

      {/* Intelligence signals */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 'var(--space-lg)',
        }}
      >
        {/* AQI */}
        <SignalCard title="AIR QUALITY (AQI)">
          <SignalRow label="AQI value" value={intel.aqi?.value} />
          <SignalRow label="Category" value={intel.aqi?.category} />
          <div style={{ paddingTop: 'var(--space-xs)' }}>
            <DataSourceLabel source={ds.aqi ?? intel.aqi?.source} />
          </div>
        </SignalCard>

        {/* Noise */}
        <SignalCard title="NOISE LEVEL">
          <SignalRow label="Estimated dB" value={intel.noise?.estimatedDb} unit="dB" />
          <SignalRow label="Category" value={intel.noise?.category} />
          <div style={{ paddingTop: 'var(--space-xs)' }}>
            <DataSourceLabel source={ds.noise ?? intel.noise?.source} />
          </div>
        </SignalCard>

        {/* Solar */}
        <SignalCard title="SOLAR VIABILITY">
          <SignalRow label="Peak sun hours" value={intel.solar?.peakSunHours} unit="hrs" />
          <SignalRow label="Viability" value={intel.solar?.viability} />
          <div style={{ paddingTop: 'var(--space-xs)' }}>
            <DataSourceLabel source={ds.solar ?? intel.solar?.source} />
          </div>
        </SignalCard>

        {/* Weather */}
        <SignalCard title="WEATHER">
          <SignalRow label="Temperature" value={intel.weather?.temp} unit="°C" />
          <SignalRow label="Humidity" value={intel.weather?.humidity} unit="%" />
          <div style={{ paddingTop: 'var(--space-xs)' }}>
            <DataSourceLabel source={ds.weather ?? intel.weather?.source} />
          </div>
        </SignalCard>

        {/* Amenities */}
        <SignalCard title="AMENITIES">
          <SignalRow
            label="Nearest school"
            value={intel.amenities?.schools?.[0]?.distanceM != null
              ? `${intel.amenities.schools[0].distanceM}m`
              : null}
          />
          <SignalRow
            label="Nearest hospital"
            value={intel.amenities?.hospitals?.[0]?.distanceM != null
              ? `${intel.amenities.hospitals[0].distanceM}m`
              : null}
          />
          <SignalRow
            label="Nearest park"
            value={intel.amenities?.parks?.[0]?.distanceM != null
              ? `${intel.amenities.parks[0].distanceM}m`
              : null}
          />
          <SignalRow
            label="Nearest gym"
            value={intel.amenities?.gyms?.[0]?.distanceM != null
              ? `${intel.amenities.gyms[0].distanceM}m`
              : null}
          />
          <SignalRow
            label="Nearest cafe"
            value={intel.amenities?.cafes?.[0]?.distanceM != null
              ? `${intel.amenities.cafes[0].distanceM}m`
              : null}
          />
          <div style={{ paddingTop: 'var(--space-xs)' }}>
            <DataSourceLabel source={ds.amenities ?? intel.amenities?.source} />
          </div>
        </SignalCard>

        {/* Local news */}
        <SignalCard title="LOCAL NEWS">
          <SignalRow
            label="Headlines"
            value={intel.localNews?.headlines?.length != null
              ? `${intel.localNews.headlines.length} found`
              : '0 found'}
          />
          <div style={{ paddingTop: 'var(--space-xs)' }}>
            <DataSourceLabel source={ds.localNews ?? intel.localNews?.source} />
          </div>
          {intel.localNews?.headlines?.length > 0 && (
            <div style={{ marginTop: 'var(--space-sm)' }}>
              {intel.localNews.headlines.slice(0, 3).map((h, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: '12px',
                    fontWeight: 300,
                    color: 'var(--color-text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '4px',
                  }}
                >
                  · {typeof h === 'string' ? h : h.title}
                </p>
              ))}
            </div>
          )}
        </SignalCard>
      </div>
    </div>
  );
}
