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

function formatSeconds(secs: number) {
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const sec = secs % 60;
  return `${mins}m ${sec}s`;
}

export default function FunnelAnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(7);
  const [activeTab, setActiveTab] = useState<'completion' | 'timing' | 'errors' | 'devices' | 'events'>('completion');

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics/funnel?daysBack=${daysBack}`, { credentials: 'include' });
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (res.status === 403) {
          setError('Admin access required');
          return;
        }
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
        <p style={{ fontSize: '16px', color: '#D4645A' }}>Admin access required</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>
          Funnel Analytics
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
          Track user progression, drop-off rates, and time per step
        </p>
      </div>

      {/* Time range selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        {[7, 14, 30].map(days => (
          <button
            key={days}
            onClick={() => setDaysBack(days)}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: days === daysBack ? 600 : 400,
              color: days === daysBack ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)',
              background: days === daysBack ? 'rgba(13,216,192,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${days === daysBack ? 'rgba(13,216,192,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Last {days} days
          </button>
        ))}
      </div>

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', overflowX: 'auto' }}>
        {['completion', 'timing', 'errors', 'devices', 'events'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '12px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? 'rgba(13,216,192,0.9)' : 'rgba(255,255,255,0.4)',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid rgba(13,216,192,0.6)' : 'none',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading analytics...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '16px', background: 'rgba(212,100,90,0.1)', border: '1px solid rgba(212,100,90,0.3)', borderRadius: '8px' }}>
          <p style={{ color: '#D4645A', margin: 0 }}>{error}</p>
        </div>
      )}

      {data && !loading && (
        <>
          {/* COMPLETION RATES TAB */}
          {activeTab === 'completion' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Funnel Completion Rates</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Step</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Users Reached</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Completion Rate</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Drop-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.completionRates.map(row => (
                      <tr key={row.step} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 500 }}>{row.label}</span> <span style={{ color: 'rgba(255,255,255,0.3)' }}>Step {row.step}</span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.usersReached}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${row.completionRate}%`, height: '100%', background: 'rgba(110,203,122,0.8)' }} />
                            </div>
                            <span style={{ color: 'rgba(110,203,122,0.8)', fontWeight: 500 }}>{row.completionRate}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: row.dropoffPercent > 20 ? '#D4645A' : row.dropoffPercent > 10 ? '#D4A853' : 'rgba(255,255,255,0.5)' }}>
                          {row.dropoffPercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TIMING TAB */}
          {activeTab === 'timing' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Time Spent per Step</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Step</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Avg Time</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Median</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>P95</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Max</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Sample Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.avgTimePerStep.map(row => (
                      <tr key={row.step} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 500 }}>{row.label}</span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px', color: row.avgSeconds > 300 ? '#D4A853' : 'rgba(255,255,255,0.7)' }}>
                          {formatSeconds(row.avgSeconds)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{formatSeconds(row.medianSeconds)}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{formatSeconds(row.p95Seconds)}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{formatSeconds(row.maxSeconds)}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.sampleSize}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ERRORS TAB */}
          {activeTab === 'errors' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Error Rates by Step</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Step</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Error Count</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Total Attempts</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Error Rate</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Top Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.errorRates.map(row => (
                      <tr key={row.step} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.label}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.errorCount}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.totalAttempts}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: row.errorRate > 20 ? '#D4645A' : row.errorRate > 10 ? '#D4A853' : 'rgba(255,255,255,0.5)' }}>
                          {row.errorRate}%
                        </td>
                        <td style={{ padding: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                          {row.topErrors.slice(0, 2).map((e, i) => (
                            <div key={i}>{e}</div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DEVICE COMPARISON TAB */}
          {activeTab === 'devices' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Device Comparison</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Device Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Total Sessions</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Completions</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.deviceComparison.map(row => (
                      <tr key={row.deviceType} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '12px', fontSize: '13px', textTransform: 'capitalize', fontWeight: 500 }}>{row.deviceType}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.totalSessions}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.completions}</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${row.completionRate}%`, height: '100%', background: 'rgba(110,203,122,0.8)' }} />
                            </div>
                            <span style={{ color: 'rgba(110,203,122,0.8)', fontWeight: 500 }}>{row.completionRate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RECENT EVENTS TAB */}
          {activeTab === 'events' && (
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Recent Events</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>User</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Step</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Action</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Time</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Duration</th>
                      <th style={{ padding: '8px', textAlign: 'left', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Device</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentEvents.slice(0, 50).map((e, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                          <div>{e.userName || 'Unknown'}</div>
                          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{e.userEmail}</div>
                        </td>
                        <td style={{ padding: '8px' }}>{e.stepLabel}</td>
                        <td style={{ padding: '8px' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            background: e.action === 'error' ? 'rgba(212,100,90,0.2)' : e.action === 'exit' ? 'rgba(110,203,122,0.2)' : 'rgba(232,160,48,0.2)',
                            color: e.action === 'error' ? '#D4645A' : e.action === 'exit' ? '#6ECB7A' : '#E8A030',
                            fontSize: '10px',
                            fontWeight: 500,
                          }}>
                            {e.action}
                          </span>
                        </td>
                        <td style={{ padding: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>
                          {new Date(e.timestamp).toLocaleTimeString()}
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px' }}>
                          {e.timeSpentSeconds ? formatSeconds(e.timeSpentSeconds) : '—'}
                        </td>
                        <td style={{ padding: '8px', fontSize: '11px', textTransform: 'capitalize' }}>
                          {e.deviceType}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
