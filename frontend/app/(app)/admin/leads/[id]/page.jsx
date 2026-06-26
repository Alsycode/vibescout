// FILE: app/(app)/admin/leads/[id]/page.jsx
// PURPOSE: Lead detail — redesigned to match premium enterprise dashboard reference.
//          Preserves all data fetching, verdict signals, scoreBreakdown, dataSource.

'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Search, Bell, Plus, Calendar, Tag, Flag,
  Globe, User, Clock, FileText, Shield, MapPin, Car,
  Leaf, DollarSign, Heart, Zap,
} from 'lucide-react';
import VerdictBadge from '../../../../../components/report/VerdictBadge';
import DataSourceLabel from '../../../../../components/report/DataSourceLabel';
import api from '../../../../../lib/api';

/* ─── Design tokens ─────────────────────────────────────── */
const TEAL = '#13DEB9';
const TEAL_DIM = 'rgba(19,222,185,0.12)';

const TIER_COLOR = {
  hot:      '#E63946',
  warm:     TEAL,
  lukewarm: '#E8A030',
  cold:     'rgba(255,255,255,0.35)',
};

const BREAKDOWN_MAX = {
  budget: 25, financial: 20, lifestyle: 15,
  environmental: 10, commute: 10, readiness: 5, location: 15,
};

const BREAKDOWN_ICON = {
  budget:      <DollarSign size={13} />,
  financial:   <Zap size={13} />,
  lifestyle:   <Heart size={13} />,
  environmental: <Leaf size={13} />,
  commute:     <Car size={13} />,
  readiness:   <Shield size={13} />,
  location:    <MapPin size={13} />,
};

/* ─── Circular gauge ─────────────────────────────────────── */
function ScoreGauge({ score, tier }) {
  const SIZE = 160;
  const SW   = 10;
  const R    = SIZE / 2 - SW / 2;
  const C    = 2 * Math.PI * R;
  const pct  = Math.min(100, Math.max(0, score ?? 0));
  const off  = C - (pct / 100) * C;
  const col  = TIER_COLOR[tier] ?? TEAL;

  return (
    <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
        <circle r={R} cx={SIZE / 2} cy={SIZE / 2} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth={SW} />
        <motion.circle
          r={R} cx={SIZE / 2} cy={SIZE / 2} fill="none"
          stroke={col} strokeWidth={SW} strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }}
          style={{ filter: `drop-shadow(0 0 8px ${col}70)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '40px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.03em' }}>
          {pct}
        </span>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>/ 100</span>
      </div>
    </div>
  );
}

/* ─── Score bar row ──────────────────────────────────────── */
function ScoreRow({ label, value, max, icon, delay = 0 }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        color: 'rgba(255,255,255,0.4)', minWidth: '110px', fontSize: '13px', flexShrink: 0,
      }}>
        {icon}
        {label}
      </div>
      <div style={{
        flex: 1, height: '4px', background: 'rgba(255,255,255,0.06)',
        borderRadius: '2px', overflow: 'hidden',
      }}>
        <motion.div
          style={{ height: '100%', background: TEAL, borderRadius: '2px' }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.4 + delay }}
        />
      </div>
      <span style={{ fontSize: '13px', fontWeight: 600, color: TEAL, minWidth: '20px', textAlign: 'right' }}>
        {value ?? 0}
      </span>
    </div>
  );
}

/* ─── Radar chart ────────────────────────────────────────── */
function RadarChart({ breakdown, maxValues }) {
  const cx = 155, cy = 155, maxR = 100;
  const entries = Object.entries(breakdown);
  const n = entries.length;
  if (n < 3) return null;

  const angle = (i) => (i * 2 * Math.PI) / n - Math.PI / 2;
  const pt = (i, r) => [cx + r * Math.cos(angle(i)), cy + r * Math.sin(angle(i))];

  const scorePts = entries.map(([k, v], i) => {
    const r = maxR * Math.min(1, (v / (maxValues[k] ?? 25)));
    return pt(i, r);
  });

  const gridRings = [0.25, 0.5, 0.75, 1];
  const outerPts  = entries.map((_, i) => pt(i, maxR));

  return (
    <svg viewBox="0 0 310 310" style={{ width: '100%', maxWidth: '310px' }}>
      {/* Grid */}
      {gridRings.map((lvl) => (
        <polygon key={lvl}
          points={entries.map((_, i) => pt(i, maxR * lvl).join(',')).join(' ')}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"
        />
      ))}
      {/* Axes */}
      {outerPts.map(([px, py], i) => (
        <line key={i} x1={cx} y1={cy} x2={px} y2={py}
          stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {/* Score polygon */}
      <motion.polygon
        points={scorePts.map(p => p.join(',')).join(' ')}
        fill={`${TEAL}22`}
        stroke={TEAL}
        strokeWidth="2"
        strokeLinejoin="round"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.35 }}
        style={{ transformOrigin: `${cx}px ${cy}px`, filter: `drop-shadow(0 0 8px ${TEAL}45)` }}
      />
      {/* Dots */}
      {scorePts.map(([px, py], i) => (
        <motion.circle key={i} cx={px} cy={py} r="5"
          fill={TEAL}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 + i * 0.05 }}
          style={{ filter: `drop-shadow(0 0 4px ${TEAL})` }}
        />
      ))}
      {/* Labels */}
      {entries.map(([k], i) => {
        const [px, py] = pt(i, maxR + 26);
        const label = k.charAt(0).toUpperCase() + k.slice(1);
        return (
          <text key={i} x={px} y={py} textAnchor="middle" dominantBaseline="middle"
            fontSize="11" fill="rgba(255,255,255,0.4)" fontFamily="Inter, sans-serif">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* ─── Info row ───────────────────────────────────────────── */
function InfoRow({ icon, label, value, highlight = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center' }}>{icon}</span>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)' }}>{label}</span>
      </div>
      <span style={{
        fontSize: '13px', fontWeight: 400,
        color: highlight ? TEAL : (value === '—' ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.80)'),
      }}>
        {value}
      </span>
    </div>
  );
}

/* ─── Signal card ────────────────────────────────────────── */
function SignalCard({ signalName, rawValue, rawUnit, userPreference, verdict, source, sourceUpdatedAt }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      padding: '18px 20px',
    }}>
      <p style={{
        fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: TEAL, opacity: 0.8, marginBottom: '10px',
      }}>
        {signalName}
      </p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '6px' }}>
        <span style={{ fontSize: '24px', fontWeight: 700, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>
          {rawValue != null ? rawValue : '—'}
        </span>
        {rawUnit && rawValue != null && (
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{rawUnit}</span>
        )}
      </div>
      {userPreference != null && (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginBottom: '8px' }}>
          Pref: {userPreference}
        </p>
      )}
      {verdict && <div style={{ marginTop: '6px' }}><VerdictBadge verdict={verdict} /></div>}
      {source && <DataSourceLabel source={source} updatedAt={sourceUpdatedAt} />}
    </div>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function Skeleton({ h = 60, mb = 16 }) {
  return (
    <div style={{
      height: h, borderRadius: '12px', marginBottom: mb,
      background: 'rgba(255,255,255,0.04)',
      animation: 'skeletonPulse 1.5s ease-in-out infinite',
    }} />
  );
}

/* ─── Section label ──────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: TEAL, opacity: 0.8, marginBottom: '20px',
    }}>
      {children}
    </p>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function LeadDetail({ params }) {
  const { id } = use(params);
  const [lead, setLead]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/leads/${id}`)
      .then((res) => setLead(res.data?.data ?? res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px' }}>
        <style>{`@keyframes skeletonPulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
        <Skeleton h={48} mb={24} />
        <Skeleton h={80} mb={20} />
        <Skeleton h={260} mb={20} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <Skeleton h={300} mb={0} />
          <Skeleton h={300} mb={0} />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div style={{ maxWidth: '1100px' }}>
        <Link href="/admin/leads" style={{
          fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
          display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '24px',
        }}>
          <ArrowLeft size={14} /> Back to leads
        </Link>
        <div style={{
          background: 'rgba(230,57,70,0.06)', border: '1px solid rgba(230,57,70,0.2)',
          borderRadius: '12px', padding: '24px',
        }}>
          <p style={{ fontSize: '13px', color: '#E63946' }}>
            {error ? `Failed to load: ${error}` : 'Lead not found.'}
          </p>
        </div>
      </div>
    );
  }

  const v     = lead.verdictObject    ?? {};
  const bd    = lead.scoreBreakdown   ?? {};
  const ds    = lead.dataSource       ?? {};
  const prefs = lead.preferences      ?? {};

  const tierColor   = TIER_COLOR[lead.scoreTier] ?? TEAL;
  const leadIdShort = `LD-${id?.slice(-5).toUpperCase() ?? '00000'}`;
  const createdDate = lead.createdAt ? new Date(lead.createdAt) : null;
  const updatedDate = lead.updatedAt ? new Date(lead.updatedAt) : null;

  const formatDate = (d) =>
    d ? `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : '—';

  const bdEntries = Object.entries(bd);

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item      = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } } };

  return (
    <>
      <style>{`
        @keyframes skeletonPulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
        .vs-back:hover { color: rgba(255,255,255,0.75) !important; }
        .vs-card:hover { border-color: rgba(255,255,255,0.11) !important; }
        .vs-info-row:last-child { border-bottom: none !important; }
      `}</style>

      <motion.div
        style={{ maxWidth: '1100px' }}
        variants={container} initial="hidden" animate="show"
      >
        {/* ── Top bar ───────────────────────────────────────── */}
        <motion.div variants={item} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '32px', paddingBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap', gap: '12px',
        }}>
          <Link href="/admin/leads" className="vs-back" style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}>
            <ArrowLeft size={14} strokeWidth={2} /> Back to leads
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '8px', padding: '8px 14px', cursor: 'text',
            }}>
              <Search size={13} color="rgba(255,255,255,0.28)" />
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.22)', userSelect: 'none' }}>
                Search anything...
              </span>
              <kbd style={{
                marginLeft: '20px', fontSize: '11px', color: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', padding: '1px 5px',
              }}>⌘ K</kbd>
            </div>
            <button style={{
              width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={15} color="rgba(255,255,255,0.4)" />
            </button>
            <button style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: TEAL, color: '#08120E', fontWeight: 700, fontSize: '13px',
              border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer',
              boxShadow: `0 0 20px ${TEAL}30`,
            }}>
              <Plus size={14} strokeWidth={2.5} /> Add Lead
            </button>
          </div>
        </motion.div>

        {/* ── Page header ───────────────────────────────────── */}
        <motion.div variants={item} style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: '24px', marginBottom: '28px', flexWrap: 'wrap',
        }}>
          <div>
            <p style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em',
              textTransform: 'uppercase', color: TEAL, marginBottom: '8px', opacity: 0.9,
            }}>
              Lead Detail
            </p>
            <h1 style={{
              fontSize: '28px', fontWeight: 700, color: 'rgba(255,255,255,0.92)',
              lineHeight: 1.1, marginBottom: '8px', letterSpacing: '-0.02em',
            }}>
              {lead.propertyName ?? lead.shadowPropertyId?.name ?? 'Property Lead'}
            </h1>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', fontWeight: 300 }}>
              Session: {lead.sessionId}&nbsp;•&nbsp;Type: {lead.listingType}&nbsp;•&nbsp;Stage: {lead.stage ?? 'new'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexShrink: 0, flexWrap: 'wrap' }}>
            {/* Lead ID card */}
            <div className="vs-card" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '12px',
              transition: 'border-color 0.2s ease',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: TEAL_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calendar size={15} color={TEAL} />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)', marginBottom: '3px' }}>Lead ID</p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: TEAL, letterSpacing: '0.02em' }}>{leadIdShort}</p>
              </div>
            </div>

            {/* Created At card */}
            <div className="vs-card" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '12px',
              transition: 'border-color 0.2s ease',
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Calendar size={15} color="rgba(255,255,255,0.4)" />
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)', marginBottom: '3px' }}>Created At</p>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
                  {formatDate(createdDate)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Main score card ────────────────────────────────── */}
        <motion.div variants={item} className="vs-card" style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px', padding: '32px 36px',
          marginBottom: '20px',
          display: 'flex', gap: '0', alignItems: 'center',
          transition: 'border-color 0.2s ease',
        }}>
          {/* Gauge + label */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', flexShrink: 0, paddingRight: '40px' }}>
            <ScoreGauge score={lead.compositeScore} tier={lead.scoreTier} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Lead Score</span>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px',
                  background: `${tierColor}18`, color: tierColor,
                  border: `1px solid ${tierColor}35`,
                  textTransform: 'capitalize', letterSpacing: '0.02em',
                }}>
                  {lead.scoreTier ?? 'warm'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', maxWidth: '175px', lineHeight: 1.55 }}>
                {v.headline ?? 'This lead has moderate potential. Keep going, almost there! ✨'}
              </p>
            </div>
          </div>

          {/* Divider */}
          <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255,255,255,0.06)', flexShrink: 0, marginRight: '40px' }} />

          {/* Breakdown bars */}
          {bdEntries.length > 0 && (
            <div style={{ flex: 1, minWidth: '280px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 44px' }}>
                {bdEntries.map(([key, pts], i) => (
                  <ScoreRow
                    key={key}
                    label={key.charAt(0).toUpperCase() + key.slice(1)}
                    value={pts}
                    max={BREAKDOWN_MAX[key] ?? 25}
                    icon={BREAKDOWN_ICON[key]}
                    delay={i * 0.06}
                  />
                ))}
              </div>

              <div style={{
                display: 'flex', justifyContent: 'flex-end', alignItems: 'baseline',
                gap: '6px', marginTop: '24px', paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.38)', marginRight: '4px' }}>Total Score</span>
                <span style={{ fontSize: '24px', fontWeight: 700, color: TEAL, letterSpacing: '-0.02em' }}>
                  {lead.compositeScore ?? 0}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>/ 100</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Bottom two cards ───────────────────────────────── */}
        <div className="admin-two-col-grid" style={{ marginBottom: '20px' }}>

          {/* Radar chart */}
          {bdEntries.length > 0 && (
            <motion.div variants={item} className="vs-card" style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '28px',
              transition: 'border-color 0.2s ease',
            }}>
              <SectionLabel>Score Breakdown</SectionLabel>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <RadarChart breakdown={bd} maxValues={BREAKDOWN_MAX} />
              </div>
            </motion.div>
          )}

          {/* Lead information */}
          <motion.div variants={item} className="vs-card" style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '28px',
            transition: 'border-color 0.2s ease',
          }}>
            <SectionLabel>Lead Information</SectionLabel>
            <div>
              <InfoRow icon={<Tag size={14} />} label="Type"
                value={lead.listingType ? lead.listingType.charAt(0).toUpperCase() + lead.listingType.slice(1) : '—'}
              />
              <InfoRow icon={<Flag size={14} />} label="Stage"
                value={lead.stage ? lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1) : 'New'}
              />
              <InfoRow icon={<Globe size={14} />} label="Source" value="Website" />
              <InfoRow icon={<User size={14} />} label="Assigned To" value="—" />
              <InfoRow icon={<Clock size={14} />} label="Last Updated" value={formatDate(updatedDate)} />
              <InfoRow icon={<FileText size={14} />} label="Notes" value="—" />
            </div>
          </motion.div>
        </div>

        {/* ── Verdict signals ────────────────────────────────── */}
        {Object.keys(v).length > 0 && (
          <motion.div variants={item}>
            <p style={{
              fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
              textTransform: 'uppercase', color: TEAL, opacity: 0.8,
              marginBottom: '16px', marginTop: '4px',
            }}>
              Verdict Signals
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '20px',
            }}>
              <SignalCard signalName="Noise"
                rawValue={v.estimatedDb} rawUnit="dB"
                userPreference={prefs.step3?.noiseSensitivity}
                verdict={v.noiseVerdict} source={ds.noise}
              />
              <SignalCard signalName="Air Quality"
                rawValue={v.aqiValue} rawUnit="AQI"
                userPreference={prefs.step3?.aqiSensitivity}
                verdict={v.aqiVerdict} source={ds.aqi}
              />
              <SignalCard signalName="Solar"
                rawValue={v.peakSunHours} rawUnit="hrs"
                userPreference={prefs.step4?.facingDirection}
                verdict={v.solarVerdict} source={ds.solar}
              />
              <SignalCard signalName="Amenities"
                rawValue={v.nearestHospitalM != null ? `${v.nearestHospitalM}m` : null}
                userPreference={prefs.step5?.amenityPriorities?.join(', ')}
                verdict={v.amenityVerdict} source={ds.amenities}
              />
              <SignalCard signalName="Commute"
                rawValue={v.estimatedCommuteMins} rawUnit="min"
                userPreference={prefs.step1?.wfhStatus === 'full-time' ? 'WFH full-time' : prefs.step1?.commuteMode}
                verdict={v.commuteVerdict}
              />
              <SignalCard signalName="Budget"
                rawValue={v.propertyBudgetBracket}
                userPreference={v.userBudgetBracket ? `User: ${v.userBudgetBracket}` : null}
                verdict={v.budgetVerdict}
              />
            </div>
          </motion.div>
        )}

        {/* ── Verdict summary ────────────────────────────────── */}
        {(v.totalRedFlags != null || v.totalCautions != null) && (
          <motion.div variants={item} className="vs-card" style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px 28px',
            display: 'flex', gap: '40px', flexWrap: 'wrap', marginBottom: '20px',
          }}>
            {[
              { label: 'Red Flags', count: v.totalRedFlags,  color: '#E63946' },
              { label: 'Cautions',  count: v.totalCautions,  color: '#F59E0B' },
              { label: 'Passes',    count: v.totalPasses,    color: '#34D399' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                  {label}
                </span>
                <span style={{ fontSize: '28px', fontWeight: 700, color, lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {count ?? '—'}
                </span>
              </div>
            ))}
            {v.headline && (
              <div style={{ flex: 1, minWidth: '200px' }}>
                <span style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', display: 'block', marginBottom: '6px' }}>
                  Verdict
                </span>
                <span style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(255,255,255,0.75)' }}>
                  {v.headline}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Data sources ───────────────────────────────────── */}
        {Object.keys(ds).length > 0 && (
          <motion.div variants={item} className="vs-card" style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '16px', padding: '24px 28px',
          }}>
            <SectionLabel>Data Sources</SectionLabel>
            {Object.entries(ds).map(([signal, source]) => (
              <div key={signal} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
              }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                  {signal}
                </span>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', letterSpacing: '0.02em' }}>
                  {source}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
