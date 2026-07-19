'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import api from '../../../lib/api';

const STEP_LABELS = {
  0: 'Context', 1: 'Commute', 2: 'Lifestyle', 3: 'Environment',
  4: 'Home Usage', 5: 'Amenities', 6: 'Community', 7: 'Financial', 8: 'Review',
};
const LS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function findActiveFunnelSession() {
  try {
    let best = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('vs_funnel_')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > LS_TTL_MS) { localStorage.removeItem(key); continue; }
      if (parsed.step < 2) continue; // not meaningful enough to prompt
      if (!best || parsed.ts > best.ts) {
        best = { ...parsed, sessionId: key.replace('vs_funnel_', ''), key };
      }
    }
    return best;
  } catch { return null; }
}

function ResumeBanner({ session, onDismiss }) {
  const stepLabel = STEP_LABELS[session.step] ?? `Step ${session.step}`;
  const savedAgo  = Math.round((Date.now() - session.ts) / 60000);
  const agoText   = savedAgo < 60
    ? `${savedAgo}m ago`
    : savedAgo < 1440
      ? `${Math.round(savedAgo / 60)}h ago`
      : `${Math.round(savedAgo / 1440)}d ago`;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      padding: '14px 20px',
      borderRadius: '12px',
      background: 'rgba(13,216,192,0.05)',
      border: '1px solid rgba(13,216,192,0.18)',
      marginBottom: '32px',
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#0DD8C0', boxShadow: '0 0 8px rgba(13,216,192,0.6)', flexShrink: 0,
        }} />
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.82)' }}>
            Unfinished analysis — paused at <span style={{ color: '#0DD8C0' }}>{stepLabel}</span>
          </p>
          <p style={{ margin: '3px 0 0', fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.30)' }}>
            Last saved {agoText} · {session.listingType ?? 'sale'} property
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
        <Link
          href={`/funnel?sessionId=${session.sessionId}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '7px 14px', borderRadius: '8px',
            background: 'rgba(13,216,192,0.12)', border: '1px solid rgba(13,216,192,0.30)',
            fontSize: '11px', fontWeight: 600, color: '#0DD8C0',
            textDecoration: 'none', letterSpacing: '0.04em',
            transition: 'background 150ms ease',
          }}
        >
          Continue →
        </Link>
        <button
          onClick={onDismiss}
          style={{
            padding: '7px 12px', borderRadius: '8px',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '11px', fontWeight: 400, color: 'rgba(255,255,255,0.30)',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}

function EmptyState() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            '16px',
      padding:        '80px 24px',
      textAlign:      'center',
    }}>
      <div style={{
        width:        '48px',
        height:       '48px',
        borderRadius: '12px',
        border:       '1px solid rgba(3,211,189,0.18)',
        background:   'rgba(3,211,189,0.05)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        marginBottom: '4px',
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(3,211,189,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="13" y2="17"/>
        </svg>
      </div>
      <p style={{
        fontFamily:    "'Geist Mono', monospace",
        fontSize:      '11px',
        fontWeight:    500,
        letterSpacing: '0.12em',
        color:         'rgba(255,255,255,0.28)',
        margin:        0,
        textTransform: 'uppercase',
      }}>
        No reports yet
      </p>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontSize:   '14px',
        color:      'rgba(255,255,255,0.35)',
        margin:     0,
        maxWidth:   '280px',
        lineHeight: 1.55,
      }}>
        Run your first property analysis to see results here.
      </p>
      <Link
        href="/analyze"
        style={{
          marginTop:     '8px',
          display:       'inline-flex',
          alignItems:    'center',
          gap:           '6px',
          padding:       '10px 20px',
          background:    'rgba(3,211,189,0.10)',
          border:        '1px solid rgba(3,211,189,0.28)',
          borderRadius:  '8px',
          textDecoration: 'none',
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '10px',
          fontWeight:    500,
          letterSpacing: '0.12em',
          color:         '#03d3bd',
          transition:    'background 150ms ease',
        }}
      >
        ◆ RUN INTELLIGENCE
      </Link>
    </div>
  );
}

function ReportCard({ report }) {
  const isRent = report.listingType === 'rent';

  return (
    <div style={{
      background:   'rgba(255,255,255,0.025)',
      border:       '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding:      '22px 24px',
      display:      'flex',
      flexDirection: 'column',
      gap:          '14px',
      transition:   'border-color 200ms ease, background 200ms ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(3,211,189,0.22)';
      e.currentTarget.style.background  = 'rgba(3,211,189,0.04)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
      e.currentTarget.style.background  = 'rgba(255,255,255,0.025)';
    }}
    >
      {/* Top row: badge + paid chip */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{
          display:       'inline-flex',
          alignItems:    'center',
          padding:       '3px 9px',
          borderRadius:  '4px',
          background:    isRent ? 'rgba(139,92,246,0.12)' : 'rgba(232,160,48,0.10)',
          border:        `1px solid ${isRent ? 'rgba(139,92,246,0.25)' : 'rgba(232,160,48,0.22)'}`,
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9px',
          fontWeight:    500,
          letterSpacing: '0.12em',
          color:         isRent ? 'rgba(167,139,250,0.85)' : 'rgba(232,160,48,0.85)',
          textTransform: 'uppercase',
        }}>
          {isRent ? 'RENT' : 'SALE'}
        </span>

        {report.paid ? (
          <span style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '4px',
            padding:       '3px 8px',
            borderRadius:  '4px',
            background:    'rgba(52,211,153,0.08)',
            border:        '1px solid rgba(52,211,153,0.20)',
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '9px',
            fontWeight:    500,
            letterSpacing: '0.10em',
            color:         'rgba(52,211,153,0.75)',
          }}>
            ✓ UNLOCKED
          </span>
        ) : (
          <span style={{
            display:       'inline-flex',
            alignItems:    'center',
            padding:       '3px 8px',
            borderRadius:  '4px',
            background:    'rgba(255,255,255,0.04)',
            border:        '1px solid rgba(255,255,255,0.08)',
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '9px',
            fontWeight:    500,
            letterSpacing: '0.10em',
            color:         'rgba(255,255,255,0.28)',
          }}>
            PREVIEW
          </span>
        )}
      </div>

      {/* Property name */}
      <div>
        <p style={{
          fontFamily:  "'Inter', sans-serif",
          fontSize:    '15px',
          fontWeight:  500,
          color:       'rgba(255,255,255,0.88)',
          margin:      0,
          lineHeight:  1.4,
          overflow:    'hidden',
          display:     '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {report.propertyName || 'Property Report'}
        </p>
        <p style={{
          fontFamily:    "'Geist Mono', monospace",
          fontSize:      '9.5px',
          color:         'rgba(255,255,255,0.28)',
          margin:        '6px 0 0',
          letterSpacing: '0.08em',
        }}>
          {formatDate(report.generatedAt)}
        </p>
      </div>

      {/* Footer: View Report CTA */}
      <Link
        href={`/report/${report.sessionId}`}
        style={{
          display:        'inline-flex',
          alignItems:     'center',
          justifyContent: 'center',
          gap:            '6px',
          padding:        '9px 16px',
          borderRadius:   '8px',
          background:     'rgba(3,211,189,0.08)',
          border:         '1px solid rgba(3,211,189,0.20)',
          textDecoration: 'none',
          fontFamily:     "'Geist Mono', monospace",
          fontSize:       '9.5px',
          fontWeight:     500,
          letterSpacing:  '0.11em',
          color:          '#03d3bd',
          marginTop:      'auto',
          transition:     'background 150ms ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(3,211,189,0.15)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(3,211,189,0.08)'; }}
      >
        VIEW REPORT →
      </Link>
    </div>
  );
}

export default function MyReportsPage() {
  const [reports, setReports]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => {
    api.get('/report')
      .then(({ data }) => setReports(data.reports ?? []))
      .catch(() => setError('Could not load reports. Please try again.'))
      .finally(() => setLoading(false));

    setActiveSession(findActiveFunnelSession());
  }, []);

  function handleDismiss() {
    if (activeSession?.key) localStorage.removeItem(activeSession.key);
    setActiveSession(null);
  }

  return (
    <div style={{ background: '#080812', minHeight: '100vh' }}>
      <Navbar />

      <div style={{
        maxWidth:   '960px',
        margin:     '0 auto',
        padding:    '100px 24px 80px',
      }}>
        {/* Resume banner */}
        {activeSession && (
          <ResumeBanner session={activeSession} onDismiss={handleDismiss} />
        )}

        {/* Page header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width:      '18px',
              height:     '1px',
              background: 'linear-gradient(90deg, transparent, rgba(3,211,189,0.7))',
            }} />
            <span style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              fontWeight:    600,
              letterSpacing: '0.14em',
              color:         '#03d3bd',
              textTransform: 'uppercase',
            }}>
              YOUR AUDIT HISTORY
            </span>
          </div>
          <h1 style={{
            fontFamily:  "'Instrument Serif', serif",
            fontSize:    'clamp(28px, 4vw, 44px)',
            fontWeight:  400,
            color:       'rgba(255,255,255,0.92)',
            margin:      0,
            lineHeight:  1.1,
          }}>
            My Reports
          </h1>
          {!loading && reports.length > 0 && (
            <p style={{
              fontFamily:  "'Inter', sans-serif",
              fontSize:    '14px',
              color:       'rgba(255,255,255,0.35)',
              margin:      '10px 0 0',
            }}>
              {reports.length} {reports.length === 1 ? 'report' : 'reports'} generated
            </p>
          )}
        </div>

        {/* Content */}
        {loading && (
          <div style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '10px',
            padding:       '48px 0',
            justifyContent: 'center',
          }}>
            <div style={{
              width:        '16px',
              height:       '16px',
              border:       '1.5px solid rgba(3,211,189,0.25)',
              borderTop:    '1.5px solid #03d3bd',
              borderRadius: '50%',
              animation:    'spin 0.8s linear infinite',
            }} />
            <span style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              letterSpacing: '0.12em',
              color:         'rgba(255,255,255,0.28)',
            }}>
              LOADING REPORTS...
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && error && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '14px',
            color:      'rgba(255,100,100,0.7)',
            padding:    '48px 0',
            textAlign:  'center',
          }}>
            {error}
          </p>
        )}

        {!loading && !error && reports.length === 0 && <EmptyState />}

        {!loading && !error && reports.length > 0 && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap:                 '16px',
          }}>
            {reports.map((r) => (
              <ReportCard key={r.sessionId} report={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
