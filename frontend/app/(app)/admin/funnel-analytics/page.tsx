'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface CompletionRate {
  step: number;
  label: string;
  usersReached: number;
  completionRate: number;
  dropoffPercent: number;
}

interface TimePerStep {
  step: number;
  label: string;
  avgSeconds: number;
  medianSeconds: number;
  p95Seconds: number;
  maxSeconds: number;
  sampleSize: number;
}

interface ErrorRate {
  step: number;
  label: string;
  errorCount: number;
  totalAttempts: number;
  errorRate: number;
  topErrors: string[];
}

interface DeviceComparison {
  deviceType: string;
  totalSessions: number;
  completions: number;
  completionRate: number;
}

interface Event {
  userId: string;
  userName: string;
  userEmail: string;
  sessionId: string;
  step: number;
  stepLabel: string;
  action: 'enter' | 'exit' | 'error';
  timestamp: string;
  timeSpentSeconds: number | null;
  errorMessage: string | null;
  deviceType: string;
}

interface AnalyticsData {
  daysBack: number;
  completionRates: CompletionRate[];
  avgTimePerStep: TimePerStep[];
  errorRates: ErrorRate[];
  deviceComparison: DeviceComparison[];
  recentEvents: Event[];
}

type TabKey = 'completion' | 'timing' | 'errors' | 'devices' | 'events';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'completion', label: 'Completion' },
  { key: 'timing',     label: 'Timing' },
  { key: 'errors',     label: 'Errors' },
  { key: 'devices',    label: 'Devices' },
  { key: 'events',     label: 'Events' },
];

const DAYS_OPTIONS = [7, 14, 30] as const;

function formatSeconds(secs: number) {
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const sec  = secs % 60;
  return `${mins}m ${sec}s`;
}

const TH_STYLE: React.CSSProperties = {
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

const TD_STYLE: React.CSSProperties = {
  padding: '12px 16px',
  fontSize: '13px',
  color: 'rgba(255,255,255,0.65)',
  borderBottom: '1px solid rgba(255,255,255,0.04)',
};

const PROGRESS_TRACK: React.CSSProperties = {
  width: '90px', height: '5px',
  background: 'rgba(255,255,255,0.08)',
  borderRadius: '3px',
  overflow: 'hidden',
};

export default function FunnelAnalyticsDashboard() {
  const router = useRouter();
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(7);
  const [activeTab, setActiveTab] = useState<TabKey>('completion');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics/funnel?daysBack=${daysBack}`, { credentials: 'include' });
        if (res.status === 401) { router.push('/login'); return; }
        if (res.status === 403) { setError('Admin access required'); return; }
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error fetching analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [daysBack, router]);

  if (error === 'Admin access required') {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#E63946' }}>Admin access required.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Analytics
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Funnel Analytics
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Track user progression, drop-off rates, and time per step.
        </p>
      </div>

      {/* Time range + tab filters row */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        {DAYS_OPTIONS.map((d) => (
          <button
            key={d}
            onClick={() => setDaysBack(d)}
            className={`admin-filter-pill${daysBack === d ? ' active' : ''}`}
          >
            Last {d} days
          </button>
        ))}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 4px' }} />
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`admin-filter-pill${activeTab === t.key ? ' active' : ''}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: '48px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
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

      {data && !loading && (
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {/* ── COMPLETION ─────────────────────────────────────────── */}
          {activeTab === 'completion' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={TH_STYLE}>Step</th>
                    <th style={TH_STYLE}>Users Reached</th>
                    <th style={TH_STYLE}>Completion Rate</th>
                    <th style={TH_STYLE}>Drop-off</th>
                  </tr>
                </thead>
                <tbody>
                  {data.completionRates.map((row) => (
                    <tr key={row.step}>
                      <td style={TD_STYLE}>
                        <span style={{ fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{row.label}</span>
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.22)' }}>Step {row.step}</span>
                      </td>
                      <td style={TD_STYLE}>{row.usersReached.toLocaleString()}</td>
                      <td style={TD_STYLE}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={PROGRESS_TRACK}>
                            <div style={{ width: `${row.completionRate}%`, height: '100%', background: 'rgba(52,211,153,0.75)' }} />
                          </div>
                          <span style={{ color: '#34D399', fontWeight: 500, fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
                            {row.completionRate}%
                          </span>
                        </div>
                      </td>
                      <td style={{
                        ...TD_STYLE,
                        color: row.dropoffPercent > 20 ? '#E63946' : row.dropoffPercent > 10 ? '#F59E0B' : 'rgba(255,255,255,0.35)',
                        fontWeight: row.dropoffPercent > 20 ? 500 : 300,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {row.dropoffPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── TIMING ─────────────────────────────────────────────── */}
          {activeTab === 'timing' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Step', 'Avg Time', 'Median', 'P95', 'Max', 'Samples'].map((h) => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.avgTimePerStep.map((row) => (
                    <tr key={row.step}>
                      <td style={{ ...TD_STYLE, fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{row.label}</td>
                      <td style={{ ...TD_STYLE, color: row.avgSeconds > 300 ? '#F59E0B' : 'rgba(255,255,255,0.65)' }}>
                        {formatSeconds(row.avgSeconds)}
                      </td>
                      <td style={TD_STYLE}>{formatSeconds(row.medianSeconds)}</td>
                      <td style={TD_STYLE}>{formatSeconds(row.p95Seconds)}</td>
                      <td style={TD_STYLE}>{formatSeconds(row.maxSeconds)}</td>
                      <td style={{ ...TD_STYLE, color: 'rgba(255,255,255,0.35)', fontVariantNumeric: 'tabular-nums' }}>
                        {row.sampleSize.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── ERRORS ─────────────────────────────────────────────── */}
          {activeTab === 'errors' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Step', 'Error Count', 'Total Attempts', 'Error Rate', 'Top Errors'].map((h) => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.errorRates.map((row) => (
                    <tr key={row.step}>
                      <td style={{ ...TD_STYLE, fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>{row.label}</td>
                      <td style={TD_STYLE}>{row.errorCount.toLocaleString()}</td>
                      <td style={TD_STYLE}>{row.totalAttempts.toLocaleString()}</td>
                      <td style={{
                        ...TD_STYLE,
                        color: row.errorRate > 20 ? '#E63946' : row.errorRate > 10 ? '#F59E0B' : 'rgba(255,255,255,0.35)',
                        fontWeight: row.errorRate > 20 ? 500 : 300,
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {row.errorRate}%
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: '11px', color: 'rgba(255,255,255,0.30)' }}>
                        {row.topErrors.slice(0, 2).map((e, i) => (
                          <div key={i}>{e}</div>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── DEVICES ────────────────────────────────────────────── */}
          {activeTab === 'devices' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Device', 'Total Sessions', 'Completions', 'Completion Rate'].map((h) => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.deviceComparison.map((row) => (
                    <tr key={row.deviceType}>
                      <td style={{ ...TD_STYLE, fontWeight: 500, color: 'rgba(255,255,255,0.82)', textTransform: 'capitalize' }}>{row.deviceType}</td>
                      <td style={TD_STYLE}>{row.totalSessions.toLocaleString()}</td>
                      <td style={TD_STYLE}>{row.completions.toLocaleString()}</td>
                      <td style={TD_STYLE}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={PROGRESS_TRACK}>
                            <div style={{ width: `${row.completionRate}%`, height: '100%', background: 'rgba(52,211,153,0.75)' }} />
                          </div>
                          <span style={{ color: '#34D399', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>
                            {row.completionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── EVENTS ─────────────────────────────────────────────── */}
          {activeTab === 'events' && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['User', 'Step', 'Action', 'Time', 'Duration', 'Device'].map((h) => (
                      <th key={h} style={TH_STYLE}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.recentEvents.slice(0, 50).map((e, i) => (
                    <tr key={i}>
                      <td style={{ ...TD_STYLE, fontSize: '12px' }}>
                        <p style={{ margin: 0, fontWeight: 400, color: 'rgba(255,255,255,0.65)' }}>{e.userName || 'Unknown'}</p>
                        <p style={{ margin: 0, fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.25)', marginTop: '2px' }}>{e.userEmail}</p>
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: '12px' }}>{e.stepLabel}</td>
                      <td style={TD_STYLE}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px',
                          fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
                          background: e.action === 'error' ? 'rgba(230,57,70,0.12)' : e.action === 'exit' ? 'rgba(52,211,153,0.10)' : 'rgba(245,158,11,0.10)',
                          color:      e.action === 'error' ? '#E63946'              : e.action === 'exit' ? '#34D399'               : '#F59E0B',
                          border:     `1px solid ${e.action === 'error' ? 'rgba(230,57,70,0.20)' : e.action === 'exit' ? 'rgba(52,211,153,0.20)' : 'rgba(245,158,11,0.20)'}`,
                        }}>
                          {e.action}
                        </span>
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.30)', fontVariantNumeric: 'tabular-nums' }}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                        {e.timeSpentSeconds ? formatSeconds(e.timeSpentSeconds) : '—'}
                      </td>
                      <td style={{ ...TD_STYLE, fontSize: '12px', textTransform: 'capitalize', color: 'rgba(255,255,255,0.35)' }}>
                        {e.deviceType}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
