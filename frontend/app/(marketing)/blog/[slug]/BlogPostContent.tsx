'use client';

import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';

const CATEGORY_COLORS: Record<string, string> = {
  'Signal Deep Dive':       '#22D3EE',
  'Financial Intelligence': '#34D399',
  'Buying Guide':           '#E8A030',
};

export default function BlogPostContent({ post }: { post: BlogPost }) {
  const accentColor = CATEGORY_COLORS[post.category] ?? '#E8A030';
  const dateStr = new Date(post.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div style={{ background: '#080812', minHeight: '100vh' }}>
      <div className="noise-overlay" />

      <header
        style={{
          maxWidth: '760px',
          margin:   '0 auto',
          padding:  '120px 40px 56px',
        }}
      >
        <Link
          href="/blog"
          style={{
            display:       'inline-flex',
            alignItems:    'center',
            gap:           '6px',
            textDecoration:'none',
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '11px',
            color:         'rgba(255,255,255,0.30)',
            letterSpacing: '0.06em',
            marginBottom:  '40px',
            transition:    'color 150ms ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
        >
          ← INTELLIGENCE JOURNAL
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span
            style={{
              width:        '5px',
              height:       '5px',
              borderRadius: '50%',
              background:   accentColor,
              boxShadow:    `0 0 6px ${accentColor}80`,
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              fontWeight:    500,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color:         accentColor,
            }}
          >
            {post.category}
          </span>
        </div>

        <h1
          style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      'clamp(28px, 4vw, 48px)',
            fontWeight:    800,
            letterSpacing: '-0.03em',
            lineHeight:    1.08,
            color:         'rgba(255,255,255,0.92)',
            margin:        '0 0 20px',
          }}
        >
          {post.title}
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '18px',
            fontWeight: 400,
            lineHeight: 1.65,
            color:      'rgba(255,255,255,0.45)',
            margin:     '0 0 32px',
          }}
        >
          {post.excerpt}
        </p>

        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '24px',
            paddingTop: '24px',
            borderTop:  '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <span
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '11px',
              color:         'rgba(255,255,255,0.30)',
              letterSpacing: '0.04em',
            }}
          >
            {dateStr}
          </span>
          <span
            style={{
              width:        '3px',
              height:       '3px',
              borderRadius: '50%',
              background:   'rgba(255,255,255,0.15)',
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '11px',
              color:         'rgba(255,255,255,0.30)',
              letterSpacing: '0.04em',
            }}
          >
            {post.readTime} MIN READ
          </span>
        </div>
      </header>

      <article
        style={{
          maxWidth: '760px',
          margin:   '0 auto',
          padding:  '0 40px 120px',
        }}
      >
        <div
          className="blog-content"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <div
          style={{
            display:    'flex',
            flexWrap:   'wrap',
            gap:        '8px',
            marginTop:  '56px',
            paddingTop: '32px',
            borderTop:  '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {post.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily:    "'Geist Mono', monospace",
                fontSize:      '10px',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color:         'rgba(255,255,255,0.30)',
                background:    'rgba(255,255,255,0.04)',
                border:        '1px solid rgba(255,255,255,0.07)',
                borderRadius:  '4px',
                padding:       '5px 10px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          style={{
            marginTop:    '56px',
            background:   '#0C0C18',
            border:       '1px solid rgba(232,160,48,0.15)',
            borderRadius: '12px',
            padding:      '32px',
          }}
        >
          <p
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '9px',
              fontWeight:    500,
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
              color:         '#E8A030',
              margin:        '0 0 12px',
            }}
          >
            PUT IT TO USE
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '17px',
              fontWeight: 700,
              color:      'rgba(255,255,255,0.88)',
              margin:     '0 0 8px',
            }}
          >
            Run these signals on your property.
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '14px',
              lineHeight: 1.6,
              color:      'rgba(255,255,255,0.40)',
              margin:     '0 0 24px',
            }}
          >
            AQI, noise risk, solar access, commute, financials — sourced live, computed
            deterministically. Under 5 minutes.
          </p>
          <Link
            href="/analyze"
            style={{
              display:       'inline-block',
              textDecoration:'none',
              background:    '#E8A030',
              color:         '#080812',
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '13px',
              fontWeight:    600,
              letterSpacing: '0.02em',
              padding:       '12px 24px',
              borderRadius:  '6px',
              transition:    'all 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#D4911F';
              e.currentTarget.style.boxShadow  = '0 0 0 1px #E8A030, 0 4px 16px rgba(232,160,48,0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#E8A030';
              e.currentTarget.style.boxShadow  = 'none';
            }}
          >
            Run Intelligence on a Property →
          </Link>
        </div>
      </article>

      <style>{`
        .blog-content {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          line-height: 1.75;
          color: rgba(255,255,255,0.72);
        }
        .blog-content p { margin: 0 0 20px; }
        .blog-content h2 {
          font-family: 'Inter', sans-serif;
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: rgba(255,255,255,0.90);
          margin: 44px 0 16px;
          padding-top: 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .blog-content h3 {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: rgba(255,255,255,0.78);
          margin: 28px 0 10px;
        }
        .blog-content ul, .blog-content ol {
          padding-left: 20px;
          margin: 0 0 20px;
        }
        .blog-content li { margin-bottom: 8px; }
        .blog-content strong { color: rgba(255,255,255,0.88); font-weight: 600; }
        .blog-content em { color: rgba(255,255,255,0.60); font-style: italic; }
        .blog-content code {
          font-family: 'Geist Mono', monospace;
          font-size: 13px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 4px;
          padding: 2px 7px;
          color: #22D3EE;
        }
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0 28px;
          font-size: 14px;
        }
        .blog-content th {
          font-family: 'Geist Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.40);
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding: 8px 12px;
          text-align: left;
        }
        .blog-content td {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          padding: 10px 12px;
          color: rgba(255,255,255,0.65);
        }
        .blog-content tr:last-child td {
          border-bottom: none;
          color: rgba(255,255,255,0.88);
          font-weight: 600;
        }
        .blog-content a {
          color: #E8A030;
          text-decoration: none;
        }
        .blog-content a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
