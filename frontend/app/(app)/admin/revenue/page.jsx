'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/adminApi';

const DAYS_OPTIONS = [7, 14, 30, 60, 90];

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

const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n ?? 0);

const shortDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });

const dateTime = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata',
  });

export default function RevenuePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysBack, setDaysBack] = useState(30);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/admin/revenue?daysBack=${daysBack}`)
      .then((res) => { setData(res.data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [daysBack]);

  const series = data?.series ?? [];
  const maxDay = Math.max(1, ...series.map((d) => d.revenue));

  const stats = data && [
    { label: `Revenue · ${daysBack}d`, value: inr(data.period.revenue), color: '#34D399' },
    { label: 'Paid Unlocks',          value: data.period.payments.toLocaleString('en-IN'), color: 'var(--color-accent)' },
    { label: 'Avg Order Value',       value: inr(data.period.avgOrderValue), color: '#F59E0B' },
    { label: 'Abandoned Checkouts',   value: data.period.abandonedCheckouts.toLocaleString('en-IN'), color: '#E63946' },
    { label: 'All-time Revenue',      value: inr(data.allTime.revenue), color: 'rgba(255,255,255,0.85)', sub: `${data.allTime.payments.toLocaleString('en-IN')} payments` },
  ];

  return (
    <div style={{ maxWidth: '1100px' }}>

      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Analytics
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Revenue
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Money collected from paid report unlocks. Dev/test unlocks are excluded.
        </p>
      </div>

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
      </div>

      {loading && <div className="skeleton" style={{ height: '320px', borderRadius: 'var(--radius-lg)' }} />}

      {error && !loading && (
        <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-md)', background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.20)' }}>
          <p style={{ fontSize: '13px', fontWeight: 300, color: '#E63946', margin: 0 }}>{error}</p>
        </div>
      )}

      {!loading && !error && data && (
        <>
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
            {stats.map((s) => (
              <div key={s.label} className="admin-stat-card" style={{ flex: 1, minWidth: '170px', padding: '16px 20px' }}>
                <p style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)', marginBottom: '10px' }}>
                  {s.label}
                </p>
                <p style={{ fontSize: '26px', fontWeight: 600, color: s.color, lineHeight: 1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </p>
                {s.sub && (
                  <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.28)', marginTop: '6px' }}>{s.sub}</p>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', padding: '20px', marginBottom: '28px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: '16px' }}>
              Daily revenue
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '140px' }}>
              {series.map((d) => (
                <div
                  key={d.date}
                  title={`${shortDate(d.date)} — ${inr(d.revenue)} (${d.payments} payment${d.payments === 1 ? '' : 's'})`}
                  style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'flex-end' }}
                >
                  <div style={{
                    width: '100%',
                    height: `${(d.revenue / maxDay) * 100}%`,
                    minHeight: d.revenue > 0 ? '3px' : '1px',
                    background: d.revenue > 0 ? '#34D399' : 'rgba(255,255,255,0.08)',
                    borderRadius: '2px 2px 0 0',
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.28)' }}>
              <span>{series[0] && shortDate(series[0].date)}</span>
              <span>{series.length > 0 && shortDate(series[series.length - 1].date)}</span>
            </div>
          </div>

          {data.recent.length > 0 ? (
            <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Paid at', 'User', 'Amount', 'Channel', 'Razorpay payment'].map((h) => (
                        <th key={h} style={TH_STYLE}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((p) => (
                      <tr key={p.id}>
                        <td style={{ ...TD_STYLE, whiteSpace: 'nowrap' }}>{dateTime(p.paidAt)}</td>
                        <td style={TD_STYLE}>
                          <span style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{p.user?.name ?? '—'}</span>
                          <br />
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{p.user?.email ?? ''}</span>
                        </td>
                        <td style={{ ...TD_STYLE, color: '#34D399', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{inr(p.amount)}</td>
                        <td style={{ ...TD_STYLE, textTransform: 'capitalize' }}>{p.source}</td>
                        <td style={{ ...TD_STYLE, fontFamily: 'monospace', fontSize: '12px', color: 'rgba(255,255,255,0.40)' }}>
                          {p.razorpayPaymentId ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)' }}>
              <div className="admin-empty">
                <p style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.30)' }}>
                  No paid unlocks yet. Revenue appears here once a user pays ₹199 to unlock a report.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
