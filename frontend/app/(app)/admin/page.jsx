'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Flame, UserCheck, Network, BookOpen, TrendingUp, BarChart2, ArrowRight } from 'lucide-react';
import StatCard from '../../../components/admin/StatCard';
import api from '../../../lib/api';

const QUICK_LINKS = [
  // { href: '/admin/shadow-properties', label: 'Audited Properties', icon: Building2,  metaKey: 'totalShadowProperties' },
  { href: '/admin/leads',             label: 'All Leads',          icon: Flame,       metaKey: 'totalLeads' },
  // { href: '/admin/brokers',           label: 'Brokers',            icon: UserCheck,   metaKey: 'totalBrokers' },
  // { href: '/admin/clusters',          label: 'Clusters',           icon: Network,     metaKey: 'totalClusters' },
  { href: '/admin/blog',              label: 'Blog',               icon: BookOpen,    metaFixed: 'Manage posts' },
  { href: '/admin/funnel-analytics',  label: 'Funnel Analytics',   icon: TrendingUp,  metaFixed: 'Step completion rates' },
  { href: '/admin/conversion',        label: 'Conversion',         icon: BarChart2,   metaFixed: 'Unlock funnel' },
];

const TIER_CONFIG = [
  { key: 'hot',      label: 'Hot',      color: '#E63946', href: '/admin/leads?tier=hot' },
  { key: 'warm',     label: 'Warm',     color: '#F59E0B', href: '/admin/leads?tier=warm' },
  { key: 'lukewarm', label: 'Lukewarm', color: '#0DD8C0', href: '/admin/leads?tier=lukewarm' },
  { key: 'cold',     label: 'Cold',     color: 'rgba(255,255,255,0.28)', href: '/admin/leads?tier=cold' },
];

function SectionLabel({ children }) {
  return (
    <p style={{
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.10em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.22)',
      marginBottom: '14px',
    }}>
      {children}
    </p>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/admin/leads/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const hot       = stats?.byTier?.hot       ?? 0;
  const warm      = stats?.byTier?.warm      ?? 0;
  const lukewarm  = stats?.byTier?.lukewarm  ?? 0;
  const cold      = stats?.byTier?.cold      ?? 0;
  const totalLeads        = hot + warm + lukewarm + cold;
  const freshClusters     = stats?.clusterHealth?.fresh ?? 0;
  const totalClusters     = stats?.clusterHealth?.total ?? 0;

  const metaMap = {
    totalShadowProperties: stats?.totalShadowProperties,
    totalLeads:            totalLeads || undefined,
    totalBrokers:          stats?.totalBrokers,
    totalClusters:         totalClusters || undefined,
  };

  return (
    <div style={{ maxWidth: '1100px' }}>

      {/* ── Page header ──────────────────────────────────────── */}
      <div style={{ marginBottom: '36px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em',
          textTransform: 'uppercase', color: 'var(--color-text-gold)',
          marginBottom: '8px',
        }}>
          Admin
        </p>
        <h1 style={{
          fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)',
          letterSpacing: '-0.02em', lineHeight: 1.15,
        }}>
          Overview
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Platform health at a glance.
        </p>
      </div>

      {/* ── Stat cards ───────────────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        {loading ? (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ flex: 1, minWidth: '180px', height: '108px', borderRadius: 'var(--radius-lg)' }}
              />
            ))}
          </div>
        ) : error ? (
          <div style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'rgba(230,57,70,0.06)',
            border: '1px solid rgba(230,57,70,0.18)',
          }}>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-danger)' }}>
              Failed to load stats — {error}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {/* <StatCard
              label="Total Audits"
              value={stats?.totalShadowProperties ?? '—'}
              sublabel="All time"
              accentColor="var(--color-accent)"
              icon={Building2}
            /> */}
            <StatCard
              label="Hot Leads"
              value={hot}
              sublabel={`${totalLeads} total leads`}
              accentColor="#E63946"
              icon={Flame}
            />
            {/* <StatCard
              label="Active Brokers"
              value={stats?.activeBrokers ?? '—'}
              sublabel="Phase 2 ready"
              accentColor="var(--color-env)"
              icon={UserCheck}
            /> */}
            {/* <StatCard
              label="Cluster Health"
              value={totalClusters > 0 ? `${freshClusters}/${totalClusters}` : '—'}
              sublabel="Fresh / total"
              accentColor="var(--color-nature)"
              icon={Network}
            /> */}
          </div>
        )}
      </div>

      {/* ── Lead tier breakdown ───────────────────────────────── */}
      {!loading && !error && stats && (
        <div style={{ marginBottom: '40px' }}>
          <SectionLabel>Leads by Tier</SectionLabel>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {TIER_CONFIG.map(({ key, label, color, href }) => {
              const count = stats?.byTier?.[key] ?? 0;
              return (
                <Link key={key} href={href} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    background: '#10101E',
                    border: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer',
                    transition: 'border-color 150ms ease, background 150ms ease',
                    minWidth: '120px',
                  }}>
                    <span style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                      boxShadow: `0 0 6px ${color}60`,
                    }} />
                    <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.55)' }}>
                      {label}
                    </span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color, letterSpacing: '-0.02em', marginLeft: 'auto', fontVariantNumeric: 'tabular-nums' }}>
                      {count}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Quick access ──────────────────────────────────────── */}
      <div>
        <SectionLabel>Quick Access</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
          {QUICK_LINKS.map(({ href, label, icon: Icon, metaKey, metaFixed }) => {
            const meta = metaFixed ?? (metaKey && metaMap[metaKey] != null ? `${metaMap[metaKey]} records` : null);
            return (
              <Link key={href} href={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: '#10101E',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderTop: '1px solid rgba(255,255,255,0.09)',
                  cursor: 'pointer',
                  transition: 'border-color 150ms ease, transform 150ms ease, background 150ms ease',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '9px',
                    background: 'rgba(13,216,192,0.08)',
                    border: '1px solid rgba(13,216,192,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={15} color="var(--color-accent)" strokeWidth={1.75} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.82)', lineHeight: 1, marginBottom: '4px' }}>
                      {label}
                    </p>
                    {meta && (
                      <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.28)' }}>
                        {meta}
                      </p>
                    )}
                  </div>
                  <ArrowRight size={14} color="rgba(255,255,255,0.18)" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
