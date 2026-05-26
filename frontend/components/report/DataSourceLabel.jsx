// FILE: components/report/DataSourceLabel.jsx
// PURPOSE: Renders the data source label below signal values.
//          News-aware source map per Section 2.5 §19.
//          SILENT_SOURCES (live, computed, gnews, fallback) render nothing.
//          Never says 'unavailable', 'missing', or 'no data'.

'use client';

function daysSince(updatedAt) {
  if (!updatedAt) return 'some';
  const ms = Date.now() - new Date(updatedAt).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days === 0) return 'today';
  if (days === 1) return '1 day';
  return `${days} days`;
}

const SOURCE_LABELS = {
  cache: (updatedAt) => `Updated ${daysSince(updatedAt)} ago`,
  city_average: () => 'City average',
  seasonal: () => 'Seasonal average',
  estimated: () => 'Estimated',
  seed: () => 'Area average',
  newsapi: () => 'Via NewsAPI',
  'google-rss': () => 'Via Google News',
};

const SILENT_SOURCES = new Set(['live', 'computed', 'gnews', 'fallback']);

export function DataSourceLabel({ source, updatedAt }) {
  if (!source || SILENT_SOURCES.has(source)) return null;

  const getText = SOURCE_LABELS[source];
  if (!getText) return null;

  const text = getText(updatedAt);
  if (!text) return null;

  return (
    <span
      style={{
        display: 'block',
        marginTop: '4px',
        fontSize: '11px',
        fontWeight: 300,
        color: 'var(--color-text-muted)',
        opacity: 0.8,
      }}
    >
      {text}
    </span>
  );
}

export default DataSourceLabel;
