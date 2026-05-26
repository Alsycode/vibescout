// FILE: app/(app)/admin/page.jsx
// PURPOSE: Admin dashboard — 4 StatCards (Total Audits, Leads by tier,
//          Active Brokers, Cluster Health). Data from GET /admin/leads/stats.
//          Admin panel glass rules: blur cap 16px, minimal glow, no gradients.

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatCard from '../../../components/admin/StatCard';
import api from '../../../lib/api';

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

  const hot = stats?.byTier?.hot ?? 0;
  const warm = stats?.byTier?.warm ?? 0;
  const lukewarm = stats?.byTier?.lukewarm ?? 0;
  const cold = stats?.byTier?.cold ?? 0;
  const totalLeads = hot + warm + lukewarm + cold;
  const freshClusters = stats?.clusterHealth?.fresh ?? 0;
  const totalClusters = stats?.clusterHealth?.total ?? 0;

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 'var(--space-2xl)' }}>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-gold)',
            marginBottom: '6px',
          }}
        >
          ADMIN
        </p>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          Overview
        </h1>
      </div>

      {/* 4 StatCards */}
      {loading ? (
        <div style={{ display: 'flex', gap: 'var(--space-lg)', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{
                flex: 1,
                minWidth: '180px',
                height: '96px',
                borderRadius: 'var(--radius-lg)',
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          className="glass-card"
          style={{
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-2xl)',
          }}
        >
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-danger)' }}>
            Failed to load stats — {error}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-lg)',
            flexWrap: 'wrap',
            marginBottom: 'var(--space-2xl)',
          }}
        >
          <StatCard
            label="Total Audits"
            value={stats?.totalShadowProperties ?? '—'}
            sublabel="All time"
            accentColor="var(--color-accent)"
          />
          <StatCard
            label="Hot Leads"
            value={hot}
            sublabel={`${totalLeads} total leads`}
            accentColor="var(--color-danger)"
          />
          <StatCard
            label="Active Brokers"
            value={stats?.activeBrokers ?? '—'}
            sublabel="Phase 2 ready"
            accentColor="var(--color-env)"
          />
          <StatCard
            label="Cluster Health"
            value={totalClusters > 0 ? `${freshClusters}/${totalClusters}` : '—'}
            sublabel="Fresh / total"
            accentColor="var(--color-nature)"
          />
        </div>
      )}

      {/* Leads tier breakdown */}
      {!loading && !error && stats && (
        <div style={{ marginBottom: 'var(--space-2xl)' }}>
          <p
            style={{
              fontSize: '11px',
              fontWeight: 400,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-gold)',
              marginBottom: 'var(--space-md)',
            }}
          >
            LEADS BY TIER
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
            {[
              { label: 'Hot', count: hot, color: 'var(--color-danger)', href: '/admin/leads?tier=hot' },
              { label: 'Warm', count: warm, color: 'var(--color-warning)', href: '/admin/leads?tier=warm' },
              { label: 'Lukewarm', count: lukewarm, color: 'var(--color-accent)', href: '/admin/leads?tier=lukewarm' },
              { label: 'Cold', count: cold, color: 'var(--color-text-muted)', href: '/admin/leads?tier=cold' },
            ].map(({ label, count, color, href }) => (
              <Link
                key={label}
                href={href}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="glass-subtle"
                  style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-sm)',
                    cursor: 'pointer',
                    transition: 'background var(--duration-fast) ease',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 400,
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 500,
                      color: color,
                      marginLeft: '4px',
                    }}
                  >
                    {count}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick access links */}
      <div>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 400,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--color-text-gold)',
            marginBottom: 'var(--space-md)',
          }}
        >
          QUICK ACCESS
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
          {[
            {
              href: '/admin/shadow-properties',
              label: 'Audited Properties',
              meta: stats?.totalShadowProperties != null ? `${stats.totalShadowProperties} records` : null,
            },
            {
              href: '/admin/leads',
              label: 'All Leads',
              meta: totalLeads > 0 ? `${totalLeads} records` : null,
            },
            {
              href: '/admin/brokers',
              label: 'Brokers',
              meta: stats?.totalBrokers != null ? `${stats.totalBrokers} records` : null,
            },
            {
              href: '/admin/clusters',
              label: 'Clusters',
              meta: totalClusters > 0 ? `${totalClusters} clusters` : null,
            },
          ].map(({ href, label, meta }) => (
            <Link
              key={href}
              href={href}
              style={{ textDecoration: 'none', flex: '1', minWidth: '160px' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  transition: 'border-color var(--duration-normal) ease, transform var(--duration-normal) var(--ease-smooth)',
                  height: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 400,
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {label}
                </span>
                {meta && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 300,
                      color: 'var(--color-text-muted)',
                    }}
                  >
                    {meta}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
