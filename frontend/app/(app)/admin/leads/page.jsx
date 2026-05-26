// FILE: app/(app)/admin/leads/page.jsx
// PURPOSE: Admin leads list — read-only DataTable filtered by tier, listingType,
//          and stage. No edit actions in Phase 1.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import DataTable from '../../../../components/admin/DataTable';
import LeadScoreBar from '../../../../components/admin/LeadScoreBar';
import api from '../../../../lib/api';

const TIER_COLORS = {
  hot: 'var(--color-danger)',
  warm: 'var(--color-warning)',
  lukewarm: 'var(--color-accent)',
  cold: 'var(--color-text-muted)',
};

function TierPill({ tier }) {
  const color = TIER_COLORS[tier] ?? TIER_COLORS.cold;
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 500,
        padding: '3px 10px',
        borderRadius: 'var(--radius-pill)',
        background: `${color}18`,
        color: color,
        border: `1px solid ${color}30`,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {tier ?? '—'}
    </span>
  );
}

const COLUMNS = [
  {
    header: 'Property',
    accessor: 'propertyName',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'var(--color-text-primary)' }}>
        {row.shadowPropertyId?.name ?? 'Unknown property'}
      </span>
    ),
  },
  {
    header: 'Score',
    accessor: 'compositeScore',
    render: (row) => (
      <div style={{ minWidth: '100px' }}>
        <LeadScoreBar score={row.compositeScore} tier={row.scoreTier} showLabel={false} compact />
        <span style={{ fontSize: '12px', fontWeight: 400, color: TIER_COLORS[row.scoreTier] ?? 'var(--color-text-muted)' }}>
          {row.compositeScore ?? '—'}
        </span>
      </div>
    ),
  },
  {
    header: 'Tier',
    accessor: 'scoreTier',
    render: (row) => <TierPill tier={row.scoreTier} />,
  },
  {
    header: 'Type',
    accessor: 'listingType',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
        {row.listingType ?? '—'}
      </span>
    ),
  },
  {
    header: 'Stage',
    accessor: 'stage',
    render: (row) => (
      <span style={{ fontWeight: 300, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
        {row.stage ?? 'new'}
      </span>
    ),
  },
  {
    header: 'Created',
    accessor: 'createdAt',
    nowrap: true,
    render: (row) =>
      row.createdAt
        ? new Date(row.createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : '—',
  },
];

function LeadsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const initialTier = searchParams.get('tier') ?? '';
  const [tier, setTier] = useState(initialTier);
  const [listingType, setListingType] = useState('');
  const [stage, setStage] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (tier) params.scoreTier = tier;
    if (listingType) params.listingType = listingType;
    if (stage) params.stage = stage;
    api
      .get('/admin/leads', { params })
      .then((res) => setData(res.data?.leads ?? res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tier, listingType, stage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const selectStyle = {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '13px',
    fontWeight: 300,
    padding: '6px 12px',
    outline: 'none',
    cursor: 'pointer',
    minWidth: '130px',
  };

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Page header */}
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
          ADMIN / LEADS
        </p>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          Leads
        </h1>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '6px',
          }}
        >
          Read-only in Phase 1. Broker assignment coming in Phase 2.
        </p>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <select value={tier} onChange={(e) => setTier(e.target.value)} style={selectStyle}>
          <option value="">All tiers</option>
          <option value="hot">Hot</option>
          <option value="warm">Warm</option>
          <option value="lukewarm">Lukewarm</option>
          <option value="cold">Cold</option>
        </select>
        <select value={listingType} onChange={(e) => setListingType(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
        </select>
        <select value={stage} onChange={(e) => setStage(e.target.value)} style={selectStyle}>
          <option value="">All stages</option>
          <option value="new">New</option>
          <option value="listed">Listed</option>
          <option value="sold">Sold</option>
          <option value="expired">Expired</option>
        </select>
        {data.length > 0 && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'var(--color-text-muted)',
              marginLeft: 'auto',
            }}
          >
            {data.length} lead{data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div
          className="skeleton"
          style={{ height: '320px', borderRadius: 'var(--radius-lg)' }}
        />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={data}
          onRowClick={(row) => router.push(`/admin/leads/${row._id}`)}
          emptyMessage="No leads found matching the selected filters."
        />
      )}
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />}>
      <LeadsContent />
    </Suspense>
  );
}
