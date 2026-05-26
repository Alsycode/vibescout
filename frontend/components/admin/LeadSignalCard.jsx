// FILE: components/admin/LeadSignalCard.jsx
// PURPOSE: Signal card for lead detail — signal name, raw value, user preference,
//          VerdictBadge, and DataSourceLabel. Used in admin lead detail view.

'use client';

import VerdictBadge from '../report/VerdictBadge';
import DataSourceLabel from '../report/DataSourceLabel';

export default function LeadSignalCard({
  signalName,
  rawValue,
  rawUnit,
  userPreference,
  verdict,
  source,
  sourceUpdatedAt,
}) {
  return (
    <div
      className="glass-subtle"
      style={{
        padding: 'var(--space-md)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-xs)',
      }}
    >
      {/* Signal name */}
      <p
        style={{
          fontSize: '11px',
          fontWeight: 400,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-text-gold)',
          marginBottom: '2px',
        }}
      >
        {signalName}
      </p>

      {/* Raw value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            lineHeight: 1,
          }}
        >
          {rawValue != null ? rawValue : '—'}
        </span>
        {rawUnit && rawValue != null && (
          <span
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-secondary)',
            }}
          >
            {rawUnit}
          </span>
        )}
      </div>

      {/* User preference */}
      {userPreference != null && (
        <p
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
          }}
        >
          User preference: {userPreference}
        </p>
      )}

      {/* Verdict badge */}
      {verdict && (
        <div style={{ marginTop: '4px' }}>
          <VerdictBadge verdict={verdict} />
        </div>
      )}

      {/* Data source */}
      {source && (
        <DataSourceLabel source={source} updatedAt={sourceUpdatedAt} />
      )}
    </div>
  );
}
