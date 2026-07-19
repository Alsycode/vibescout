'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '../../../../components/admin/DataTable';
import api from '../../../../lib/api';

function StatusPill({ status }) {
  const colors = {
    fetching:  { bg: 'rgba(93,116,138,0.12)', text: '#5D748A', border: 'rgba(93,116,138,0.25)' },
    completed: { bg: 'rgba(52,211,153,0.10)', text: '#34D399', border: 'rgba(52,211,153,0.25)' },
  };
  const c = colors[status] || { bg: 'rgba(255,255,255,0.04)', text: 'rgba(255,255,255,0.30)', border: 'rgba(255,255,255,0.08)' };
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      whiteSpace: 'nowrap', letterSpacing: '0.02em',
    }}>
      {status ?? '—'}
    </span>
  );
}

const COLUMNS = [
  {
    header: 'Property Name',
    accessor: 'name',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.82)' }}>
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
        ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>
            {row.coordinates.lat.toFixed(4)}, {row.coordinates.lng.toFixed(4)}
          </span>
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
      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.50)', textTransform: 'capitalize', fontSize: '12px' }}>
        {row.userProvidedSpecs?.listingType ?? '—'}
      </span>
    ),
  },
  {
    header: 'BHK',
    accessor: 'bhk',
    render: (row) => (
      <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
        {row.userProvidedSpecs?.bhk ?? '—'}
      </span>
    ),
  },
  {
    header: 'Created',
    accessor: 'createdAt',
    nowrap: true,
    render: (row) =>
      row.createdAt
        ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
  },
];

const STATUS_PILLS = [['', 'All statuses'], ['fetching', 'Fetching'], ['completed', 'Completed']];
const TYPE_PILLS   = [['', 'All types'], ['sale', 'Sale'], ['rent', 'Rent']];

export default function ShadowPropertiesPage() {
  const router     = useRouter();
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [status, setStatus]       = useState('');
  const [listingType, setListingType] = useState('');

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (status)      params.status      = status;
    if (listingType) params.listingType = listingType;
    api
      .get('/admin/shadow-properties', { params })
      .then((res) => setData(res.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status, listingType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Audited Properties
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Audited Properties
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Read-only. User-triggered property audits.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUS_PILLS.map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} className={`admin-filter-pill${status === v ? ' active' : ''}`}>
            {l}
          </button>
        ))}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
        {TYPE_PILLS.map(([v, l]) => (
          <button key={v} onClick={() => setListingType(v)} className={`admin-filter-pill${listingType === v ? ' active' : ''}`}>
            {l}
          </button>
        ))}
        {!loading && data.length > 0 && (
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', marginLeft: 'auto', letterSpacing: '0.02em' }}>
            {data.length} record{data.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <DataTable
          columns={COLUMNS}
          data={data}
          onRowClick={(row) => router.push(`/admin/shadow-properties/${row._id}`)}
          emptyMessage="No properties match the selected filters."
        />
      )}
    </div>
  );
}
