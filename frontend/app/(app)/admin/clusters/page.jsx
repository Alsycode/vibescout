'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';
import ClusterHealthBadge from '../../../../components/admin/ClusterHealthBadge';
import api from '../../../../lib/api';

const SIGNAL_OPTIONS = [
  { key: 'aqi',       label: 'AQI' },
  { key: 'weather',   label: 'Weather' },
  { key: 'solar',     label: 'Solar' },
  { key: 'noise',     label: 'Noise' },
  { key: 'amenities', label: 'Amenities' },
];

function ClusterRow({ cluster, onRefresh }) {
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedTypes, setSelectedTypes]   = useState(['aqi', 'weather', 'solar']);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    setShowTypeSelector(false);
    try {
      await onRefresh(cluster._id || cluster.clusterId, selectedTypes.join(','));
    } finally {
      setRefreshing(false);
    }
  }

  function toggleType(key) {
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
    );
  }

  return (
    <div style={{
      padding: '16px 20px',
      borderRadius: 'var(--radius-md)',
      background: '#10101E',
      border: '1px solid rgba(255,255,255,0.06)',
      borderTop: '1px solid rgba(255,255,255,0.09)',
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      flexWrap: 'wrap',
      transition: 'border-color 150ms ease',
    }}>
      {/* Cluster ID */}
      <div style={{ flex: '0 0 180px', minWidth: '140px' }}>
        <p style={{ fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.72)', fontFamily: 'var(--font-mono)', letterSpacing: '0.01em' }}>
          {cluster.clusterId}
        </p>
        <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.28)', marginTop: '3px', fontFamily: 'var(--font-mono)' }}>
          {cluster.centroidLat?.toFixed(4)}, {cluster.centroidLng?.toFixed(4)}
        </p>
      </div>

      {/* Signal freshness */}
      <div style={{ flex: 1, display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        {SIGNAL_OPTIONS.map(({ key, label }) => {
          const sigData      = cluster[`cached${key.charAt(0).toUpperCase() + key.slice(1)}`];
          const sigUpdatedAt = sigData?.updatedAt;
          return (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase' }}>
                {label}
              </span>
              <ClusterHealthBadge updatedAt={sigUpdatedAt} showAge />
            </div>
          );
        })}
      </div>

      {/* Last searched */}
      {cluster.lastSearchedAt && (
        <div style={{ minWidth: '80px', textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '10px', fontWeight: 300, color: 'rgba(255,255,255,0.22)', marginBottom: '2px' }}>Last searched</p>
          <p style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>
            {new Date(cluster.lastSearchedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </p>
        </div>
      )}

      {/* Refresh controls */}
      <div style={{ position: 'relative', display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={() => setShowTypeSelector((v) => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '11px', fontWeight: 500, padding: '6px 10px',
            borderRadius: '7px',
            border: '1px solid rgba(255,255,255,0.09)',
            background: showTypeSelector ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: 'rgba(255,255,255,0.45)',
            cursor: 'pointer',
          }}
        >
          <span>Types ({selectedTypes.length})</span>
          <ChevronDown size={11} />
        </button>
        <button
          onClick={handleRefresh}
          disabled={refreshing || selectedTypes.length === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            fontSize: '11px', fontWeight: 600, padding: '6px 12px',
            borderRadius: '7px',
            border: '1px solid rgba(13,216,192,0.30)',
            background: refreshing ? 'rgba(13,216,192,0.05)' : 'rgba(13,216,192,0.08)',
            color: 'rgba(13,216,192,0.85)',
            cursor: refreshing || selectedTypes.length === 0 ? 'not-allowed' : 'pointer',
            opacity: refreshing || selectedTypes.length === 0 ? 0.45 : 1,
            transition: 'all 120ms ease',
          }}
        >
          <RefreshCw size={11} style={{ animation: refreshing ? 'adminSpin 0.7s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </button>

        {/* Type selector dropdown */}
        {showTypeSelector && (
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)',
            background: '#161628',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '10px',
            padding: '8px',
            zIndex: 20, minWidth: '140px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.60)',
          }}>
            {SIGNAL_OPTIONS.map(({ key, label }) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', gap: '9px',
                padding: '6px 8px', cursor: 'pointer', borderRadius: '6px',
                fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.70)',
                transition: 'background 100ms ease',
              }}>
                <input
                  type="checkbox"
                  checked={selectedTypes.includes(key)}
                  onChange={() => toggleType(key)}
                  style={{ accentColor: '#0DD8C0', cursor: 'pointer', width: '13px', height: '13px' }}
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
  const [clusters, setClusters]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [staleOnly, setStaleOnly]       = useState(false);
  const [refreshResult, setRefreshResult] = useState(null);

  const fetchClusters = useCallback(() => {
    setLoading(true);
    const endpoint = staleOnly ? '/admin/clusters/stale' : '/admin/clusters';
    api
      .get(endpoint)
      .then((res) => setClusters(res.data?.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [staleOnly]);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  async function handleRefresh(clusterId, types) {
    try {
      await api.post(`/admin/clusters/${clusterId}/refresh`, null, { params: { types } });
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
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--color-text-gold)', marginBottom: '8px' }}>
          Admin · Clusters
        </p>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Clusters
        </h1>
        <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.32)', marginTop: '6px' }}>
          Geographic signal cache zones. Refresh individual signal types on demand.
        </p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={staleOnly}
            onChange={(e) => setStaleOnly(e.target.checked)}
            style={{ accentColor: '#0DD8C0', cursor: 'pointer', width: '14px', height: '14px' }}
          />
          <span style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.50)' }}>Stale only</span>
        </label>
        <button
          onClick={fetchClusters}
          className="admin-filter-pill"
          style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <RefreshCw size={11} />
          Refresh list
        </button>
        {!loading && clusters.length > 0 && (
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.22)', marginLeft: 'auto', letterSpacing: '0.02em' }}>
            {clusters.length} cluster{clusters.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Toast */}
      {refreshResult && (
        <div style={{
          padding: '11px 16px', borderRadius: 'var(--radius-md)', marginBottom: '16px',
          background: refreshResult.ok ? 'rgba(52,211,153,0.07)' : 'rgba(230,57,70,0.07)',
          border: `1px solid ${refreshResult.ok ? 'rgba(52,211,153,0.20)' : 'rgba(230,57,70,0.20)'}`,
          fontSize: '13px', fontWeight: 300,
          color: refreshResult.ok ? '#34D399' : '#E63946',
        }}>
          {refreshResult.ok
            ? `Cluster ${refreshResult.clusterId} refresh triggered.`
            : `Refresh failed: ${refreshResult.error}`}
        </div>
      )}

      {/* Cluster list */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton" style={{ height: '76px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : clusters.length === 0 ? (
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)' }}>
          <div className="admin-empty">
            <p style={{ fontSize: '13px', fontWeight: 400, color: 'rgba(255,255,255,0.38)' }}>
              {staleOnly ? 'No stale clusters found.' : 'No clusters found.'}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
