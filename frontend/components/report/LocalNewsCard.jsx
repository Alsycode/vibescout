// FILE: components/report/LocalNewsCard.jsx
// PURPOSE: Local news intelligence feed — Aetheris aesthetic.
//          Cyber news briefing with teal left-border accents per headline.

'use client';

import { DataSourceLabel } from './DataSourceLabel';

function SignalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9" cy="9" r="2" fill="rgba(231,197,138,0.7)" />
      <path
        d="M5.5 12.5A5 5 0 0 1 5.5 5.5"
        stroke="rgba(231,197,138,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12.5 5.5A5 5 0 0 1 12.5 12.5"
        stroke="rgba(231,197,138,0.5)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M3 15A9 9 0 0 1 3 3"
        stroke="rgba(231,197,138,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 3A9 9 0 0 1 15 15"
        stroke="rgba(231,197,138,0.25)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatPublishedAt(publishedAt) {
  if (!publishedAt) return null;
  const d = new Date(publishedAt);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  const diffMs = now - d;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function sanitize(str) {
  if (!str) return '';
  return str
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/<[^>]*>?/g, '')  // also strips truncated unclosed tags like <a href="..."
    .trim();
}

function HeadlineItem({ headline }) {
  const timeAgo = formatPublishedAt(headline.publishedAt);
  const title = sanitize(headline.title);
  const snippet = sanitize(headline.snippet);

  const inner = (
    <div
      style={{
        padding: '12px 14px 12px 16px',
        background: 'rgba(11,11,11,0.55)',
        border: '1px solid rgba(231,197,138,0.07)',
        borderLeft: '2px solid rgba(231,197,138,0.3)',
        borderRadius: '0 10px 10px 0',
        transition: 'border-color var(--duration-fast) ease, background var(--duration-fast) ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: headline.snippet ? '6px' : '0',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'rgba(255,255,255,0.82)',
            lineHeight: 1.5,
            flex: 1,
          }}
        >
          {title}
        </p>
        {timeAgo && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 300,
              color: 'rgba(231,197,138,0.4)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              paddingTop: '2px',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {timeAgo}
          </span>
        )}
      </div>
      {snippet && (
        <p
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.55,
            marginBottom: headline.source ? '4px' : '0',
          }}
        >
          {snippet}
        </p>
      )}
      {headline.source && (
        <p
          style={{
            fontSize: '10px',
            fontWeight: 400,
            letterSpacing: '0.06em',
            color: 'rgba(231,197,138,0.35)',
            textTransform: 'uppercase',
          }}
        >
          {headline.source}
        </p>
      )}
    </div>
  );

if (headline.url) {
  return (
    <div
      onClick={() => window.open(headline.url, '_blank', 'noopener,noreferrer')}
      style={{
        cursor: 'pointer',
        display: 'block',
      }}
      onMouseEnter={(e) => {
        const div = e.currentTarget.querySelector('div');
        if (div) {
          div.style.borderLeftColor = 'rgba(231,197,138,0.6)';
          div.style.background = 'rgba(11,11,11,0.75)';
        }
      }}
      onMouseLeave={(e) => {
        const div = e.currentTarget.querySelector('div');
        if (div) {
          div.style.borderLeftColor = 'rgba(231,197,138,0.3)';
          div.style.background = 'rgba(11,11,11,0.55)';
        }
      }}
    >
      {inner}
    </div>
  );
}

  return inner;
}

export default function LocalNewsCard({ localNews }) {
  const headlines = localNews?.headlines ?? [];
  const source = localNews?.source ?? 'fallback';
  const updatedAt = localNews?.updatedAt;
  const hasHeadlines = headlines.length > 0;

  return (
    <div
      className="glass-cyber-card reveal"
      style={{
        padding: '24px',
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '20px',
        }}
      >
        <div>
          <p
            style={{
              fontSize: '10px',
              fontWeight: 500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(231,197,138,0.55)',
              marginBottom: '5px',
            }}
          >
            Local Intelligence
          </p>
          <p
            style={{
              fontSize: '17px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Area News Briefing
          </p>
        </div>
        <SignalIcon />
      </div>

      {hasHeadlines ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {headlines.slice(0, 5).map((h, i) => (
            <HeadlineItem key={i} headline={h} />
          ))}

          {headlines.length > 5 && (
            <p
              style={{
                fontSize: '11px',
                fontWeight: 300,
                color: 'rgba(231,197,138,0.35)',
                textAlign: 'center',
                paddingTop: '4px',
                letterSpacing: '0.04em',
              }}
            >
              +{headlines.length - 5} more signals
            </p>
          )}

          <div
            style={{
              marginTop: '4px',
              paddingTop: '12px',
              borderTop: '1px solid rgba(231,197,138,0.07)',
            }}
          >
            <DataSourceLabel source={source} updatedAt={updatedAt} />
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '20px',
            background: 'rgba(11,11,11,0.55)',
            border: '1px solid rgba(231,197,138,0.07)',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '4px',
            }}
          >
            No recent local headlines found.
          </p>
          <p
            style={{
              fontSize: '12px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.28)',
            }}
          >
            News coverage for this area is limited at this time.
          </p>
        </div>
      )}

      {localNews?.label && (
        <p
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.38)',
            lineHeight: 1.6,
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid rgba(231,197,138,0.07)',
          }}
        >
          {localNews.label}
        </p>
      )}
    </div>
  );
}
