'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/adminApi';

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

function inr(n) {
  return `₹${(n ?? 0).toLocaleString('en-IN')}`;
}

export default function ApiUsagePage() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [month, setMonth]     = useState(''); // '' = current month

  useEffect(() => {
    setLoading(true);
    const qs = month ? `?month=${month}` : '';
    api
      .get(`/admin/api-usage${qs}`)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [month]);

  const rows          = data?.rows ?? [];
  const paidRows      = rows.filter((r) => r.paid);
  const availMonths   = data?.availableMonths ?? [];

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Infrastructure
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Third-Party API Usage
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Outbound requests per provider this month, with a rough bill estimate. Provider dashboards remain the source of truth for exact charges.
        </p>
      </div>

      {/* Month selector */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <button
          onClick={() => setMonth('')}
          className={`admin-filter-pill${month === '' ? ' active' : ''}`}
        >
          Current month
        </button>
        {availMonths.map((m) => (
          <button
            key={m}
            onClick={() => setMonth(m)}
            className={`admin-filter-pill${month === m ? ' active' : ''}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Summary stats */}
      {!loading && !error && data && (
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {[
            { label: 'Total Requests',        value: (data.totalRequests ?? 0).toLocaleString(), color: 'var(--color-accent)' },
            { label: 'Est. Monthly Cost',     value: inr(data.estTotalCostInr),                   color: data.estTotalCostInr > 0 ? '#F59E0B' : '#34D399' },
            { label: 'Billable Providers',    value: String(paidRows.length),                     color: 'rgba(255,255,255,0.75)' },
          ].map((s) => (
            <div key={s.label} className="admin-stat-card" style={{ flex: 1, minWidth: '160px', padding: '16px 20px' }}>
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
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.20)' }}>
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
                  {['Provider', 'Requests', 'Errors', 'Est. Cost / mo', 'Notes'].map((h) => (
                    <th key={h} style={TH_STYLE}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.provider}>
                    <td style={{ ...TD_STYLE, color: 'rgba(255,255,255,0.80)', fontWeight: 500 }}>
                      <span style={{
                        display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%',
                        marginRight: '9px', verticalAlign: 'middle',
                        background: row.paid ? '#F59E0B' : '#34D399',
                      }} />
                      {row.provider}
                    </td>
                    <td style={{ ...TD_STYLE, fontVariantNumeric: 'tabular-nums' }}>{row.requests.toLocaleString()}</td>
                    <td style={{ ...TD_STYLE, fontVariantNumeric: 'tabular-nums', color: row.errors > 0 ? '#E63946' : 'rgba(255,255,255,0.35)' }}>
                      {row.errors.toLocaleString()}
                    </td>
                    <td style={{ ...TD_STYLE, fontVariantNumeric: 'tabular-nums', color: row.estMonthlyCostInr > 0 ? '#F59E0B' : 'rgba(255,255,255,0.35)' }}>
                      {row.estMonthlyCostInr > 0 ? inr(row.estMonthlyCostInr) : 'free'}
                    </td>
                    <td style={{ ...TD_STYLE, fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.38)', maxWidth: '320px', whiteSpace: 'normal' }}>
                      {row.note || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && rows.length === 0 && data && (
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="admin-empty">
            <p style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.30)' }}>
              No API calls recorded yet this month. Counts appear as reports are generated.
            </p>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      {!loading && !error && rows.length > 0 && (
        <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: '16px', lineHeight: 1.6 }}>
          Cost figures are rough estimates from public list prices and do not account for Google&rsquo;s $200/month credit,
          free-tier allowances beyond the first, or per-token (vs per-request) billing. Always confirm against each
          provider&rsquo;s billing console.
        </p>
      )}
    </div>
  );
}
