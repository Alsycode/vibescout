// FILE: app/(app)/admin/leads/[id]/page.jsx
// PURPOSE: Lead detail — verdictObject display, scoreBreakdown per signal,
//          dataSource, signal cards. await params per Next.js 15 spec.

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import LeadScoreBar from '../../../../../components/admin/LeadScoreBar';
import LeadSignalCard from '../../../../../components/admin/LeadSignalCard';
import api from '../../../../../lib/api';

function BreakdownRow({ label, points, max }) {
  const pct = max > 0 ? Math.round((points / max) * 100) : 0;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        padding: 'var(--space-xs) 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'var(--color-text-secondary)',
          minWidth: '120px',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: '3px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'var(--color-accent)',
            borderRadius: '2px',
          }}
        />
      </div>
      <span
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--color-accent)',
          minWidth: '40px',
          textAlign: 'right',
        }}
      >
        {points}
      </span>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <p
      style={{
        fontSize: '11px',
        fontWeight: 400,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'var(--color-text-gold)',
        marginBottom: 'var(--space-md)',
        marginTop: 'var(--space-xl)',
      }}
    >
      {children}
    </p>
  );
}

export default function LeadDetail({ params }) {
  const { id } = use(params);
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/leads/${id}`)
      .then((res) => setLead(res.data?.lead ?? res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }} />
        <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-md)' }} />
        <div className="skeleton" style={{ height: '300px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <Link href="/admin/leads" style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          ← Back to leads
        </Link>
        <div className="glass-card" style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-lg)' }}>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-danger)' }}>
            {error ? `Failed to load: ${error}` : 'Lead not found.'}
          </p>
        </div>
      </div>
    );
  }

  const v = lead.verdictObject ?? {};
  const bd = lead.scoreBreakdown ?? {};
  const ds = lead.dataSource ?? {};
  const prefs = lead.preferences ?? {};
  const intel = lead.shadowPropertyId?.intelligence ?? {};

  const BREAKDOWN_MAX = {
    budget: 25,
    financial: 20,
    lifestyle: 15,
    environmental: 10,
    commute: 10,
    readiness: 5,
    location: 15,
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Back link */}
      <Link
        href="/admin/leads"
        style={{
          fontSize: '13px',
          fontWeight: 300,
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: 'var(--space-lg)',
        }}
      >
        ← Back to leads
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
          LEAD DETAIL
        </p>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          {lead.shadowPropertyId?.name ?? 'Property Lead'}
        </h1>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '6px',
          }}
        >
          Session: {lead.sessionId} &nbsp;·&nbsp; Type: {lead.listingType} &nbsp;·&nbsp; Stage: {lead.stage ?? 'new'}
        </p>
      </div>

      {/* Score bar */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <LeadScoreBar score={lead.compositeScore} tier={lead.scoreTier} />
      </div>

      {/* Score breakdown */}
      {Object.keys(bd).length > 0 && (
        <>
          <SectionTitle>SCORE BREAKDOWN</SectionTitle>
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {Object.entries(bd).map(([key, pts]) => (
              <BreakdownRow
                key={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                points={pts}
                max={BREAKDOWN_MAX[key] ?? 25}
              />
            ))}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 'var(--space-sm)',
                marginTop: '4px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
                Total
              </span>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-accent)' }}>
                {lead.compositeScore} / 100
              </span>
            </div>
          </div>
        </>
      )}

      {/* Verdict summary */}
      {Object.keys(v).length > 0 && (
        <>
          <SectionTitle>VERDICT SIGNALS</SectionTitle>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            <LeadSignalCard
              signalName="Noise"
              rawValue={v.estimatedDb}
              rawUnit="dB"
              userPreference={prefs.step3?.noiseSensitivity}
              verdict={v.noiseVerdict}
              source={ds.noise}
            />
            <LeadSignalCard
              signalName="Air Quality"
              rawValue={v.aqiValue}
              rawUnit="AQI"
              userPreference={prefs.step3?.aqiSensitivity}
              verdict={v.aqiVerdict}
              source={ds.aqi}
            />
            <LeadSignalCard
              signalName="Solar"
              rawValue={v.peakSunHours}
              rawUnit="hrs"
              userPreference={prefs.step4?.facingDirection}
              verdict={v.solarVerdict}
              source={ds.solar}
            />
            <LeadSignalCard
              signalName="Amenities"
              rawValue={v.nearestHospitalM != null ? `${v.nearestHospitalM}m` : null}
              userPreference={prefs.step5?.amenityPriorities?.join(', ')}
              verdict={v.amenityVerdict}
              source={ds.amenities}
            />
            <LeadSignalCard
              signalName="Commute"
              rawValue={v.estimatedCommuteMins}
              rawUnit="min"
              userPreference={prefs.step1?.wfhStatus === 'full-time' ? 'WFH full-time' : prefs.step1?.commuteMode}
              verdict={v.commuteVerdict}
            />
            <LeadSignalCard
              signalName="Budget"
              rawValue={v.propertyBudgetBracket}
              userPreference={v.userBudgetBracket ? `User range: ${v.userBudgetBracket}` : null}
              verdict={v.budgetVerdict}
            />
          </div>
        </>
      )}

      {/* Verdict summary counts */}
      {(v.totalRedFlags != null || v.totalCautions != null) && (
        <>
          <SectionTitle>SUMMARY</SectionTitle>
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              gap: 'var(--space-xl)',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Red Flags', count: v.totalRedFlags, color: 'var(--color-danger)' },
              { label: 'Cautions', count: v.totalCautions, color: 'var(--color-warning)' },
              { label: 'Passes', count: v.totalPasses, color: 'var(--color-nature)' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                  {label}
                </span>
                <span style={{ fontSize: '24px', fontWeight: 500, color, lineHeight: 1 }}>
                  {count ?? '—'}
                </span>
              </div>
            ))}
            {v.headline && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
                  Verdict headline
                </span>
                <span style={{ fontSize: '14px', fontWeight: 300, color: 'var(--color-text-primary)' }}>
                  {v.headline}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Data sources */}
      {Object.keys(ds).length > 0 && (
        <>
          <SectionTitle>DATA SOURCES</SectionTitle>
          <div
            className="glass-card"
            style={{
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {Object.entries(ds).map(([signal, source]) => (
              <div
                key={signal}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: 'var(--space-xs) 0',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                  {signal}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-muted)', letterSpacing: '0.02em' }}>
                  {source}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
