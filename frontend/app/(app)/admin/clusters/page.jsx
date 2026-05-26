// FILE: app/(app)/admin/clusters/page.jsx
// PURPOSE: Admin clusters panel — list all clusters with freshness indicators,
//          manual refresh button per cluster (POST /admin/clusters/:id/refresh).

'use client';

import { useEffect, useState, useCallback } from 'react';
import ClusterHealthBadge from '../../../../components/admin/ClusterHealthBadge';
import api from '../../../../lib/api';

const SIGNAL_OPTIONS = [
  { key: 'aqi', label: 'AQI' },
  { key: 'weather', label: 'Weather' },
  { key: 'solar', label: 'Solar' },
  { key: 'noise', label: 'Noise' },
  { key: 'amenities', label: 'Amenities' },
];

function ClusterRow({ cluster, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(['aqi', 'weather', 'solar']);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setShowTypeSelector(false);
    try {
      const types = selectedTypes.join(',');
      await onRefresh(cluster._id || cluster.clusterId, types);
    } finally {
      setRefreshing(false);
    }
  }

  function toggleType(key) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  const lastUpdated = cluster.updatedAt || cluster.cachedAQI?.updatedAt;

  return (
    <div
      className="glass-card"
      style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-md)',
        flexWrap: 'wrap',
      }}
    >
      {/* Cluster ID */}
      <div style={{ flex: 1, minWidth: '160px' }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--color-text-primary)',
            fontFamily: 'monospace',
          }}
        >
          {cluster.clusterId}
        </p>
        <p style={{ fontSize: '11px', fontWeight: 300, color: 'var(--color-text-muted)', marginTop: '2px' }}>
          {cluster.centroidLat?.toFixed(4)}, {cluster.centroidLng?.toFixed(4)}
        </p>
      </div>

      {/* Signal freshness pills */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {SIGNAL_OPTIONS.map(({ key, label }) => {
          const sigData = cluster[`cached${key.charAt(0).toUpperCase() + key.slice(1)}`];
          const sigUpdatedAt = sigData?.updatedAt;
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '0.04em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                {label}
              </span>
              <ClusterHealthBadge updatedAt={sigUpdatedAt} showAge />
            </div>
          );
        })}
      </div>

      {/* Last searched */}
      {cluster.lastSearchedAt && (
        <div style={{ minWidth: '100px', textAlign: 'right' }}>
          <p style={{ fontSize: '11px', fontWeight: 300, color: 'var(--color-text-muted)' }}>
            Last searched
          </p>
          <p style={{ fontSize: '12px', fontWeight: 400, color: 'var(--color-text-secondary)' }}>
            {new Date(cluster.lastSearchedAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
            })}
          </p>
        </div>
      )}

      {/* Refresh controls */}
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowTypeSelector((v) => !v)}
            style={{
              fontSize: '12px',
              fontWeight: 400,
              padding: '5px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            ▾ Types
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing || selectedTypes.length === 0}
            style={{
              fontSize: '12px',
              fontWeight: 400,
              padding: '5px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-accent-35)',
              background: 'var(--color-accent-15)',
              color: 'var(--color-accent-90)',
              cursor: refreshing || selectedTypes.length === 0 ? 'not-allowed' : 'pointer',
              opacity: refreshing || selectedTypes.length === 0 ? 0.5 : 1,
              transition: 'all var(--duration-fast) ease',
              whiteSpace: 'nowrap',
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Type selector dropdown */}
        {showTypeSelector && (
          <div
            className="glass-elevated"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 6px)',
              padding: 'var(--space-sm)',
              borderRadius: 'var(--radius-md)',
              zIndex: 20,
              minWidth: '130px',
            }}
          >
            {SIGNAL_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 8px',
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: 'var(--color-text-primary)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(key)}
                  onChange={() => toggleType(key)}
                  style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                {label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClustersPage() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staleOnly, setStaleOnly] = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  const fetchClusters = useCallback(() => {
    setLoading(true);
    const endpoint = staleOnly ? '/admin/clusters/stale' : '/admin/clusters';
    api
      .get(endpoint)
      .then((res) => setClusters(res.data?.clusters ?? res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [staleOnly]);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  async function handleRefresh(clusterId, types) {
    try {
      const res = await api.post(`/admin/clusters/${clusterId}/refresh`, null, {
        params: { types },
      });
      setRefreshResult({ ok: true, clusterId });
      setTimeout(() => setRefreshResult(null), 3000);
      fetchClusters();
    } catch (err) {
      setRefreshResult({ ok: false, clusterId, error: err.message });
      setTimeout(() => setRefreshResult(null), 4000);
    }
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      {/* Page header */}
      <div style={{ marginBottom: 'var(--space-xl)' }}>
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
          ADMIN / CLUSTERS
        </p>
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
          }}
        >
          Clusters
        </h1>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '6px',
          }}
        >
          Geographic signal cache zones. Refresh individual signal types on demand.
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-md)',
          alignItems: 'center',
          marginBottom: 'var(--space-lg)',
          flexWrap: 'wrap',
        }}
      >
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 300,
            color: 'var(--color-text-secondary)',
          }}
        >
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => setStaleOnly(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          Show stale only
        </label>
        <button
          className="btn-secondary"
          onClick={fetchClusters}
          style={{ fontSize: '13px', padding: '6px 14px' }}
        >
          Refresh list
        </button>
        {!loading && clusters.length > 0 && (
          <span style={{ fontSize: '12px', fontWeight: 300, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
            {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Refresh toast */}
      {refreshResult && (
        <div
          style={{
            padding: 'var(--space-sm) var(--space-md)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            background: refreshResult.ok ? 'var(--color-success-bg)' : 'rgba(212,100,90,0.12)',
            border: `1px solid ${refreshResult.ok ? 'var(--color-success-border)' : 'var(--color-danger-border)'}`,
            fontSize: '13px',
            fontWeight: 300,
            color: refreshResult.ok ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          {refreshResult.ok
            ? `Cluster ${refreshResult.clusterId} refresh triggered.`
            : `Refresh failed: ${refreshResult.error}`}
        </div>
      )}

      {/* Cluster list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <div
          className="glass-card"
          style={{ padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--color-text-muted)' }}>
            {staleOnly ? 'No stale clusters found.' : 'No clusters found.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {clusters.map((cluster) => (
            <ClusterRow
              key={cluster._id || cluster.clusterId}
              cluster={cluster}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
