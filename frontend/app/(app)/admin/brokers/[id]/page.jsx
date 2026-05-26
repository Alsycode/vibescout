// FILE: app/(app)/admin/brokers/[id]/page.jsx
// PURPOSE: Broker detail — broker info, isActive toggle, assigned leads list.
//          await params per Next.js 15 spec.

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LeadScoreBar from '../../../../../components/admin/LeadScoreBar';
import api from '../../../../../lib/api';

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'var(--space-sm) 0',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}
    >
      <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-primary)' }}>
        {value ?? '—'}
      </span>
    </div>
  );
}

const TIER_COLORS = {
  hot: 'var(--color-danger)',
  warm: 'var(--color-warning)',
  lukewarm: 'var(--color-accent)',
  cold: 'var(--color-text-muted)',
};

export default function BrokerDetail({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [broker, setBroker] = useState(null);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/brokers/${id}`)
      .then((res) => setBroker(res.data?.broker ?? res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    api
      .get(`/admin/brokers/${id}/leads`)
      .then((res) => setLeads(res.data?.leads ?? res.data ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLeadsLoading(false));
  }, [id]);

  async function handleToggle() {
    if (!broker) return;
    setToggling(true);
    try {
      await api.patch(`/admin/brokers/${broker._id}/status`);
      setBroker((prev) => ({ ...prev, isActive: !prev.isActive }));
    } catch (err) {
      console.error(err);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <div className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-lg)' }} />
        <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-lg)' }} />
      </div>
    );
  }

  if (error || !broker) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <Link href="/admin/brokers" style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          ← Back to brokers
        </Link>
        <div className="glass-card" style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', marginTop: 'var(--space-lg)' }}>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-danger)' }}>
            {error ? `Failed to load: ${error}` : 'Broker not found.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Back link */}
      <Link
        href="/admin/brokers"
        style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)', textDecoration: 'none', display: 'inline-block', marginBottom: 'var(--space-lg)' }}
      >
        ← Back to brokers
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <div>
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
            BROKER DETAIL
          </p>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              lineHeight: 1.2,
            }}
          >
            {broker.name}
          </h1>
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)', marginTop: '6px' }}>
            {broker.agency || 'No agency'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 10px',
              borderRadius: 'var(--radius-pill)',
              background: broker.isActive ? 'var(--color-success-bg)' : 'rgba(255,255,255,0.04)',
              color: broker.isActive ? 'var(--color-success)' : 'var(--color-text-muted)',
              border: broker.isActive ? '1px solid var(--color-success-border)' : '1px solid rgba(255,255,255,0.07)',
            }}
          >
            {broker.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            className="btn-secondary"
            onClick={handleToggle}
            disabled={toggling}
            style={{ opacity: toggling ? 0.5 : 1, fontSize: '13px', padding: '6px 14px' }}
          >
            {broker.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Broker info */}
      <div
        className="glass-card"
        style={{
          padding: 'var(--space-lg)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-xl)',
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
          BROKER DETAILS
        </p>
        <InfoRow label="Name" value={broker.name} />
        <InfoRow label="Email" value={broker.email} />
        <InfoRow label="Phone" value={broker.phone} />
        <InfoRow label="Agency" value={broker.agency} />
        <InfoRow
          label="Member since"
          value={broker.createdAt ? new Date(broker.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : null}
        />
        <InfoRow label="Total bids" value={broker.totalBids ?? 0} />
      </div>

      {/* Phase 2 note */}
      <div
        className="glass-subtle"
        style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-xl)',
          borderLeft: '2px solid rgba(93,116,138,0.4)',
        }}
      >
        <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--color-text-muted)' }}>
          Lead assignment and bid history are available in Phase 2. The leads below are shown for reference only.
        </p>
      </div>

      {/* Assigned leads */}
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
        ASSIGNED LEADS
      </p>

      {leadsLoading ? (
        <div className="skeleton" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />
      ) : leads.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: 'var(--space-lg)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)' }}>
            No leads assigned to this broker.
          </p>
        </div>
      ) : (
        <div
          className="glass-card"
          style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
        >
          {leads.map((lead, i) => (
            <div
              key={lead._id || i}
              onClick={() => router.push(`/admin/leads/${lead._id}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-sm) var(--space-lg)',
                borderBottom: i < leads.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                cursor: 'pointer',
                transition: 'background var(--duration-fast) ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', fontWeight: 400, color: 'var(--color-text-primary)' }}>
                  {lead.shadowPropertyId?.name ?? 'Property'}
                </p>
                <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--color-text-muted)' }}>
                  {lead.listingType} · {lead.stage ?? 'new'}
                </p>
              </div>
              <div style={{ minWidth: '120px' }}>
                <LeadScoreBar score={lead.compositeScore} tier={lead.scoreTier} showLabel={false} compact />
                <span style={{ fontSize: '11px', fontWeight: 400, color: TIER_COLORS[lead.scoreTier] ?? 'var(--color-text-muted)' }}>
                  {lead.compositeScore ?? '—'} · {lead.scoreTier}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
