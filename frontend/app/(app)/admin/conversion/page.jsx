'use client';

import { useEffect, useState } from 'react';
import api from '../../../../lib/api';

const DAYS_OPTIONS = [7, 14, 30, 60];

export default function ConversionAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysBack, setDaysBack] = useState(30);
  const [listingFilter, setListingFilter] = useState('all');
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState(null);

  async function runBackfill() {
    setBackfilling(true);
    setBackfillResult(null);
    try {
      const res = await api.post('/admin/analytics/backfill');
      setBackfillResult(res.data);
      // Reload data after backfill
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
    api.get(`/admin/analytics/conversion?daysBack=${daysBack}`)
      .then(res => { setData(res.data); setError(null); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [daysBack]);

  const rows = (data?.rows ?? []).filter(r => listingFilter === 'all' || r.listingType === listingFilter);

  const totalGenerated = rows.reduce((s, r) => s + r.reportsGenerated, 0);
  const totalUnlocked  = rows.reduce((s, r) => s + r.reportsUnlocked, 0);
  const overallConversion = totalGenerated > 0 ? Math.round((totalUnlocked / totalGenerated) * 100) : 0;

  return (
    <div style={{ maxWidth: '1100px' }}>
      <div style={{ marginBottom: '28px' }}>
        <p style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '6px' }}>
          ANALYTICS
        </p>
        <h1 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', lineHeight: 1.2 }}>
          Search → Unlock Conversion
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '6px' }}>
          Which BHK + budget combos generate reports vs convert to paid unlocks
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {DAYS_OPTIONS.map(d => (
            <button key={d} onClick={() => setDaysBack(d)} style={{
              padding: '7px 14px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid',
              fontWeight: d === daysBack ? 600 : 400,
              color: d === daysBack ? 'var(--color-accent)' : 'var(--color-text-muted)',
              background: d === daysBack ? 'rgba(13,216,192,0.1)' : 'rgba(255,255,255,0.04)',
              borderColor: d === daysBack ? 'rgba(13,216,192,0.35)' : 'rgba(255,255,255,0.08)',
            }}>
              {d}d
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          {['all', 'sale', 'rent'].map(f => (
            <button key={f} onClick={() => setListingFilter(f)} style={{
              padding: '7px 14px', fontSize: '12px', borderRadius: '8px', cursor: 'pointer', border: '1px solid',
              fontWeight: f === listingFilter ? 600 : 400,
              color: f === listingFilter ? 'var(--color-accent)' : 'var(--color-text-muted)',
              background: f === listingFilter ? 'rgba(13,216,192,0.1)' : 'rgba(255,255,255,0.04)',
              borderColor: f === listingFilter ? 'rgba(13,216,192,0.35)' : 'rgba(255,255,255,0.08)',
              textTransform: 'capitalize',
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Backfill banner */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={runBackfill}
          disabled={backfilling}
          style={{
            padding: '7px 16px', fontSize: '12px', borderRadius: '8px', cursor: backfilling ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(232,160,48,0.35)', color: 'rgba(232,160,48,0.9)',
            background: 'rgba(232,160,48,0.08)', opacity: backfilling ? 0.6 : 1,
          }}
        >
          {backfilling ? 'Backfilling…' : 'Backfill historical data'}
        </button>
        {backfillResult && !backfillResult.error && (
          <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
            Inserted: {backfillResult.inserted.report_generated} generated, {backfillResult.inserted.report_unlocked} unlocked
          </span>
        )}
        {backfillResult?.error && (
          <span style={{ fontSize: '12px', color: '#D4645A' }}>{backfillResult.error}</span>
        )}
      </div>

      {/* Summary stat row */}
      {!loading && !error && data && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {[
            { label: 'Reports Generated', value: totalGenerated, color: 'var(--color-accent)' },
            { label: 'Reports Unlocked', value: totalUnlocked, color: 'var(--color-nature)' },
            { label: 'Overall Conversion', value: `${overallConversion}%`, color: overallConversion > 30 ? 'var(--color-nature)' : overallConversion > 15 ? 'var(--color-warning)' : 'var(--color-danger)' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', minWidth: '160px', flex: 1 }}>
              <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginBottom: '6px', letterSpacing: '0.04em' }}>{s.label}</p>
              <p style={{ fontSize: '26px', fontWeight: 600, color: s.color, lineHeight: 1 }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>Loading...</p>}
      {error && <p style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{error}</p>}

      {!loading && !error && rows.length > 0 && (
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  {['Type', 'BHK', 'Budget', 'Reports', 'Unlocked', 'Conversion'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const pct = row.conversionPct;
                  const barColor = pct >= 40 ? 'var(--color-nature)' : pct >= 20 ? 'var(--color-warning)' : 'var(--color-danger)';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '13px 16px', fontSize: '12px' }}>
                        <span style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 500,
                          background: row.listingType === 'sale' ? 'rgba(13,216,192,0.12)' : 'rgba(211,160,93,0.12)',
                          color: row.listingType === 'sale' ? 'var(--color-accent)' : 'var(--color-text-gold)',
                        }}>
                          {row.listingType}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--color-text-primary)' }}>{row.bhk ?? '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.budgetBracket ?? '—'}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.reportsGenerated}</td>
                      <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{row.reportsUnlocked}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '80px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: barColor, transition: 'width 0.4s ease' }} />
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: barColor }}>{pct}%</span>
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

      {!loading && !error && rows.length === 0 && (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No data yet for this period. Data will appear as users generate and unlock reports.</p>
        </div>
      )}
    </div>
  );
}
