// FILE: app/(app)/admin/shadow-properties/page.jsx
// PURPOSE: Admin shadow properties list — read-only DataTable filtered by
//          status and listingType. Name | Coords | Status | Type | Date.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '../../../../components/admin/DataTable';
import api from '../../../../lib/api';

const STATUS_OPTIONS = ['', 'fetching', 'completed'];
const TYPE_OPTIONS = ['', 'sale', 'rent'];

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
        whiteSpace: 'nowrap',
      }}
    >
      {status ?? '—'}
    </span>
  );
}

const COLUMNS = [
  {
    header: 'Property Name',
    accessor: 'name',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'var(--color-text-primary)' }}>
        {row.name || '—'}
      </span>
    ),
  },
  {
    header: 'Coordinates',
    accessor: 'coordinates',
    nowrap: true,
    render: (row) =>
      row.coordinates?.lat != null
        ? `${row.coordinates.lat.toFixed(4)}, ${row.coordinates.lng.toFixed(4)}`
        : '—',
  },
  {
    header: 'Status',
    accessor: 'status',
    render: (row) => <StatusPill status={row.status} />,
  },
  {
    header: 'Type',
    accessor: 'listingType',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
        {row.userProvidedSpecs?.listingType ?? '—'}
      </span>
    ),
  },
  {
    header: 'BHK',
    accessor: 'bhk',
    render: (row) => row.userProvidedSpecs?.bhk ?? '—',
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

export default function ShadowPropertiesPage() {
  const router = useRouter();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [listingType, setListingType] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status) params.status = status;
    if (listingType) params.listingType = listingType;
    api
      .get('/admin/shadow-properties', { params })
      .then((res) => setData(res.data?.shadowProperties ?? res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, listingType]);

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
          ADMIN / AUDITED PROPERTIES
        </p>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          Shadow Properties
        </h1>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '6px',
          }}
        >
          Read-only. User-triggered property audits.
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
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          <option value="fetching">Fetching</option>
          <option value="completed">Completed</option>
        </select>
        <select value={listingType} onChange={(e) => setListingType(e.target.value)} style={selectStyle}>
          <option value="">All types</option>
          <option value="sale">Sale</option>
          <option value="rent">Rent</option>
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
            {data.length} record{data.length !== 1 ? 's' : ''}
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
          onRowClick={(row) => router.push(`/admin/shadow-properties/${row._id}`)}
          emptyMessage="No shadow properties found matching the selected filters."
        />
      )}
    </div>
  );
}
