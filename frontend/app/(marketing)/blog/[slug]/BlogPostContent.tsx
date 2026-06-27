'use client';

import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';
import { ShinyButton } from '@/components/ui/shiny-button';

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
    <div className="grid-surface" style={{ background: '#080812', minHeight: '100vh' }}>
      <div className="noise-overlay" />

      <header
        style={{
          position: 'relative',
          maxWidth: '760px',
          margin:   '0 auto',
          padding:  '120px 40px 56px',
          overflow: 'hidden',
        }}
      >
        {/* Ambient teal glow behind header */}
        <div
          aria-hidden
          style={{
            position:      'absolute',
            inset:         0,
            background:    'radial-gradient(ellipse 600px 300px at 50% 40%, rgba(3,211,189,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

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
            marginBottom:  '44px',
            transition:    'color 150ms ease',
            position:      'relative',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
        >
          ← INTELLIGENCE JOURNAL
        </Link>

        {/* Eyebrow — decorative lines + category */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', position: 'relative' }}>
          <div style={{
            width:      '18px',
            height:     '1px',
            flexShrink: 0,
            background: `linear-gradient(90deg, transparent, ${accentColor}B3)`,
          }} />
          <span
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              fontWeight:    600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color:         accentColor,
              whiteSpace:    'nowrap',
            }}
          >
            {post.category}
          </span>
          <div style={{
            height:     '1px',
            width:      '64px',
            flexShrink: 0,
            background: `linear-gradient(90deg, ${accentColor}8C 0%, transparent 100%)`,
          }} />
        </div>

        <h1
          style={{
            fontFamily:    "'Instrument Serif', serif",
            fontStyle:     'normal',
            fontSize:      'clamp(28px, 4vw, 56px)',
            fontWeight:    400,
            letterSpacing: '-0.01em',
            lineHeight:    1.08,
            color:         'rgba(255,255,255,0.92)',
            margin:        '0 0 20px',
            position:      'relative',
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

        {/* CTA card — homepage design language */}
        <div
          style={{
            position:      'relative',
            marginTop:     '64px',
            background:    '#161628',
            borderTop:     '1px solid rgba(255,255,255,0.14)',
            borderRight:   '1px solid rgba(255,255,255,0.07)',
            borderBottom:  '1px solid rgba(255,255,255,0.04)',
            borderLeft:    '1px solid rgba(255,255,255,0.07)',
            borderRadius:  '16px',
            padding:       '40px',
            boxShadow:     '0 0 0 1px rgba(255,255,255,0.03), 0 32px 100px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.07)',
            overflow:      'hidden',
          }}
        >
          {/* Ambient teal glow */}
          <div
            aria-hidden
            style={{
              position:      'absolute',
              inset:         0,
              background:    'radial-gradient(ellipse 500px 250px at 0% 100%, rgba(3,211,189,0.07) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />

          {/* Eyebrow — decorative lines + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', position: 'relative' }}>
            <div style={{
              width:      '18px',
              height:     '1px',
              flexShrink: 0,
              background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.7))',
            }} />
            <span style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '10px',
              fontWeight:    600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color:         '#03d3bd',
              whiteSpace:    'nowrap',
            }}>
              PUT IT TO USE
            </span>
            <div style={{
              height:     '1px',
              width:      '64px',
              flexShrink: 0,
              background: 'linear-gradient(90deg, rgba(34,211,238,0.55) 0%, transparent 100%)',
            }} />
          </div>

          {/* Headline — Instrument Serif */}
          <p style={{ margin: '0 0 12px', position: 'relative' }}>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(22px, 3vw, 32px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.1,
              color:         'rgba(255,255,255,0.92)',
            }}>
              Run these signals
            </span>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(22px, 3vw, 32px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.1,
              color:         '#03d3bd',
              textShadow:    '0 0 32px rgba(3,211,189,0.25)',
            }}>
              on your property.
            </span>
          </p>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '14px',
              lineHeight: 1.65,
              color:      'rgba(255,255,255,0.38)',
              margin:     '0 0 28px',
              maxWidth:   '420px',
              position:   'relative',
            }}
          >
            AQI, noise risk, solar access, commute, financials — sourced live, computed
            deterministically. Under 5 minutes.
          </p>

          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <ShinyButton href="/analyze">
              Run Intelligence on a Property →
            </ShinyButton>
            <Link
              href="/report/preview"
              style={{
                textDecoration: 'none',
                fontFamily:     "'Inter', sans-serif",
                fontSize:       '13px',
                fontWeight:     400,
                color:          'rgba(255,255,255,0.35)',
                letterSpacing:  '0.01em',
                transition:     'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.70)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
            >
              See a sample report
            </Link>
          </div>
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
