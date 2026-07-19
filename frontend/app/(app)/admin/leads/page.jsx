'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DataTable from '../../../../components/admin/DataTable';
import LeadScoreBar from '../../../../components/admin/LeadScoreBar';
import api from '../../../../lib/api';

const TIER_COLORS = {
  hot:      '#E63946',
  warm:     '#F59E0B',
  lukewarm: '#0DD8C0',
  cold:     'rgba(255,255,255,0.30)',
};

const PAGE_SIZE = 7;

function TierPill({ tier }) {
  const color = TIER_COLORS[tier] ?? TIER_COLORS.cold;
  return (
    <span style={{
      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
      borderRadius: 'var(--radius-pill)',
      background: `${color}14`,
      color: color,
      border: `1px solid ${color}35`,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {tier ?? '—'}
    </span>
  );
}

const COLUMNS = [
  {
    header: 'Property',
    accessor: 'propertyName',
    render: (row) => (
      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.82)' }}>
        {row.propertyName ?? row.shadowPropertyId?.name ?? 'Unknown property'}
      </span>
    ),
  },
  {
    header: 'Score',
    accessor: 'compositeScore',
    render: (row) => (
      <div style={{ minWidth: '110px' }}>
        <LeadScoreBar score={row.compositeScore} tier={row.scoreTier} showLabel={false} compact />
        <span style={{ fontSize: '11px', fontWeight: 500, color: TIER_COLORS[row.scoreTier] ?? 'rgba(255,255,255,0.30)', marginTop: '3px', display: 'block' }}>
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
      <span style={{ fontWeight: 400, color: 'rgba(255,255,255,0.50)', textTransform: 'capitalize', fontSize: '12px' }}>
        {row.listingType ?? '—'}
      </span>
    ),
  },
  {
    header: 'Stage',
    accessor: 'stage',
    render: (row) => (
      <span style={{ fontWeight: 300, color: 'rgba(255,255,255,0.35)', textTransform: 'capitalize', fontSize: '12px' }}>
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
        ? new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
  },
];

const TIER_PILLS  = [['', 'All'], ['hot', 'Hot'], ['warm', 'Warm'], ['lukewarm', 'Lukewarm'], ['cold', 'Cold']];
const TYPE_PILLS  = [['', 'All types'], ['sale', 'Sale'], ['rent', 'Rent']];
const STAGE_PILLS = [['', 'All stages'], ['new', 'New'], ['listed', 'Listed'], ['sold', 'Sold'], ['expired', 'Expired']];

function Pagination({ page, pages, total, onPage }) {
  if (pages <= 1) return null;
  const start = (page - 1) * PAGE_SIZE + 1;
  const end   = Math.min(page * PAGE_SIZE, total);

  const btnBase = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: '30px', height: '30px', borderRadius: '7px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'transparent',
    color: 'rgba(255,255,255,0.55)',
    cursor: 'pointer',
    transition: 'all 120ms ease',
    fontFamily: 'Inter, sans-serif',
  };

  const pageNums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      pageNums.push(i);
    } else if (pageNums[pageNums.length - 1] !== '…') {
      pageNums.push('…');
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.02em' }}>
        Showing {start}–{end} of {total} lead{total !== 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          style={{ ...btnBase, opacity: page === 1 ? 0.3 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
          onClick={() => page > 1 && onPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft size={14} />
        </button>
        {pageNums.map((n, i) =>
          n === '…' ? (
            <span key={`ellipsis-${i}`} style={{ fontSize: '12px', color: 'rgba(255,255,255,0.22)', padding: '0 4px' }}>…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              style={{
                ...btnBase,
                background: n === page ? 'rgba(13,216,192,0.12)' : 'transparent',
                border:     n === page ? '1px solid rgba(13,216,192,0.30)' : '1px solid rgba(255,255,255,0.08)',
                color:      n === page ? '#0DD8C0' : 'rgba(255,255,255,0.55)',
                fontWeight: n === page ? 600 : 400,
                fontSize: '12px',
              }}
            >
              {n}
            </button>
          )
        )}
        <button
          style={{ ...btnBase, opacity: page === pages ? 0.3 : 1, cursor: page === pages ? 'not-allowed' : 'pointer' }}
          onClick={() => page < pages && onPage(page + 1)}
          disabled={page === pages}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function LeadsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const initialTier = searchParams.get('tier') ?? '';
  const [tier, setTier]               = useState(initialTier);
  const [listingType, setListingType] = useState('');
  const [stage, setStage]             = useState('');
  const [page, setPage]               = useState(1);

  const [data, setData]     = useState([]);
  const [total, setTotal]   = useState(0);
  const [pages, setPages]   = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { page, limit: PAGE_SIZE };
    if (tier)        params.scoreTier   = tier;
    if (listingType) params.listingType = listingType;
    if (stage)       params.stage       = stage;
    api
      .get('/admin/leads', { params })
      .then((res) => {
        setData(res.data?.data ?? []);
        setTotal(res.data?.total ?? 0);
        setPages(res.data?.pages ?? 1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tier, listingType, stage, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function applyFilter(setter) {
    return (val) => {
      setter(val);
      setPage(1);
    };
  }

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Leads
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Leads
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Read-only in Phase 1. Broker assignment coming in Phase 2.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {TIER_PILLS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => applyFilter(setTier)(v)}
              className={`admin-filter-pill${tier === v ? ' active' : ''}`}
            >
              {v === 'hot'  && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E63946', flexShrink: 0 }} />}
              {v === 'warm' && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />}
              {l}
            </button>
          ))}
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
          {TYPE_PILLS.map(([v, l]) => (
            <button key={v} onClick={() => applyFilter(setListingType)(v)} className={`admin-filter-pill${listingType === v ? ' active' : ''}`}>
              {l}
            </button>
          ))}
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px' }} />
          {STAGE_PILLS.map(([v, l]) => (
            <button key={v} onClick={() => applyFilter(setStage)(v)} className={`admin-filter-pill${stage === v ? ' active' : ''}`}>
              {l}
            </button>
          ))}
          {!loading && total > 0 && (
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', marginLeft: 'auto', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
              {total} lead{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
      ) : (
        <>
          <DataTable
            columns={COLUMNS}
            data={data}
            onRowClick={(row) => router.push(`/admin/leads/${row._id}`)}
            emptyMessage="No leads match the selected filters."
          />
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </>
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
