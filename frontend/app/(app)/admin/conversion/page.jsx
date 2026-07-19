'use client';

import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import api from '../../../../lib/api';

const DAYS_OPTIONS = [7, 14, 30, 60];

const TH_STYLE = {
  padding: '10px 16px',
  textAlign: 'left',
  fontSize: '10px',
  fontWeight: 600,
  color: 'rgba(255,255,255,0.30)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  background: 'rgba(255,255,255,0.015)',
  whiteSpace: 'nowrap',
};

const TD_STYLE = {
  padding: '13px 16px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.60)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

export default function ConversionAnalyticsPage() {
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [daysBack, setDaysBack]     = useState(30);
  const [listingFilter, setListingFilter] = useState('all');
  const [backfilling, setBackfilling]     = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  async function runBackfill() {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res   = await api.post('/admin/analytics/backfill');
      setBackfillResult(res.data);
      const fresh = await api.get(`/admin/analytics/conversion?daysBack=${daysBack}`);
      setData(fresh.data);
    } catch (err) {
      setBackfillResult({ error: err.message });
    } finally {
      setBackfilling(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/analytics/conversion?daysBack=${daysBack}`)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [daysBack]);

  const rows = (data?.rows ?? []).filter(
    (r) => listingFilter === 'all' || r.listingType === listingFilter
  );

  const totalGenerated    = rows.reduce((s, r) => s + r.reportsGenerated, 0);
  const totalUnlocked     = rows.reduce((s, r) => s + r.reportsUnlocked, 0);
  const overallConversion = totalGenerated > 0 ? Math.round((totalUnlocked / totalGenerated) * 100) : 0;

  const conversionColor =
    overallConversion > 30 ? '#34D399' :
    overallConversion > 15 ? '#F59E0B' :
    '#E63946';

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Analytics
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Search → Unlock Conversion
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Which BHK + budget combos generate reports vs convert to paid unlocks.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
        {DAYS_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDaysBack(d)}
            className={`admin-filter-pill${daysBack === d ? ' active' : ''}`}
          >
            {d}d
          </button>
        ))}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
        {['all', 'sale', 'rent'].map((f) => (
          <button
            key={f}
            onClick={() => setListingFilter(f)}
            className={`admin-filter-pill${listingFilter === f ? ' active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={runBackfill}
            disabled={backfilling}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              fontSize: '11px', fontWeight: 500, padding: '6px 12px',
              borderRadius: '7px',
              border: '1px solid rgba(245,158,11,0.30)',
              background: 'rgba(245,158,11,0.06)',
              color: 'rgba(245,158,11,0.80)',
              cursor: backfilling ? 'not-allowed' : 'pointer',
              opacity: backfilling ? 0.5 : 1,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 120ms ease',
            }}
          >
            <RefreshCw size={11} style={{ animation: backfilling ? 'adminSpin 0.7s linear infinite' : 'none' }} />
            {backfilling ? 'Backfilling…' : 'Backfill data'}
          </button>
        </div>
      </div>

      {/* Backfill result toast */}
      {backfillResult && (
        <div style={{
          marginBottom: '16px', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '12px', fontWeight: 300,
          background: backfillResult.error ? 'rgba(230,57,70,0.07)' : 'rgba(52,211,153,0.07)',
          border:     `1px solid ${backfillResult.error ? 'rgba(230,57,70,0.20)' : 'rgba(52,211,153,0.20)'}`,
          color:       backfillResult.error ? '#E63946' : '#34D399',
        }}>
          {backfillResult.error
            ? backfillResult.error
            : `Inserted: ${backfillResult.inserted?.report_generated ?? 0} generated, ${backfillResult.inserted?.report_unlocked ?? 0} unlocked`}
        </div>
      )}

      {/* Summary stats */}
      {!loading && !error && data && (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {[
            { label: 'Reports Generated', value: totalGenerated.toLocaleString(), color: 'var(--color-accent)' },
            { label: 'Reports Unlocked',  value: totalUnlocked.toLocaleString(),  color: '#34D399' },
            { label: 'Overall Conversion', value: `${overallConversion}%`,         color: conversionColor },
          ].map((s) => (
            <div
              key={s.label}
              className="admin-stat-card"
              style={{ flex: 1, minWidth: '160px', padding: '16px 20px' }}
            >
              <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '10px' }}>
                {s.label}
              </p>
              <p style={{ fontSize: '28px', fontWeight: 600, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />
      )}

      {/* Error */}
      {error && !loading && (
        <div style={{
          padding: '14px 18px', borderRadius: 'var(--radius-md)',
          background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.20)',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#E63946', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && rows.length > 0 && (
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Type', 'BHK', 'Budget', 'Reports', 'Unlocked', 'Conversion'].map((h) => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const pct       = row.conversionPct;
                  const barColor  = pct >= 40 ? '#34D399' : pct >= 20 ? '#F59E0B' : '#E63946';
                  return (
                    <tr key={i}>
                      <td style={TD_STYLE}>
                        <span style={{
                          padding: '3px 9px', borderRadius: '5px', fontSize: '11px', fontWeight: 500,
                          background: row.listingType === 'sale' ? 'rgba(13,216,192,0.10)' : 'rgba(245,158,11,0.10)',
                          color:      row.listingType === 'sale' ? '#0DD8C0'               : '#F59E0B',
                          border:     `1px solid ${row.listingType === 'sale' ? 'rgba(13,216,192,0.25)' : 'rgba(245,158,11,0.25)'}`,
                        }}>
                          {row.listingType}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>{row.bhk ?? '—'}</td>
                      <td style={{ ...TD_STYLE, color: 'rgba(255,255,255,0.45)' }}>{row.budgetBracket ?? '—'}</td>
                      <td style={{ ...TD_STYLE, fontVariantNumeric: 'tabular-nums' }}>{row.reportsGenerated}</td>
                      <td style={{ ...TD_STYLE, fontVariantNumeric: 'tabular-nums' }}>{row.reportsUnlocked}</td>
                      <td style={TD_STYLE}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '72px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 400ms ease' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: barColor, fontVariantNumeric: 'tabular-nums' }}>
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && rows.length === 0 && (
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="admin-empty">
            <p style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.30)' }}>
              No data for this period. Data appears as users generate and unlock reports.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
