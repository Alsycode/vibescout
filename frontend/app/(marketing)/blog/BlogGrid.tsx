'use client';

import Link from 'next/link';
import type { BlogPost } from '@/lib/blog';

const CATEGORY_COLORS: Record<string, string> = {
  'Signal Deep Dive':       '#22D3EE',
  'Financial Intelligence': '#34D399',
  'Buying Guide':           '#E8A030',
};

export default function BlogGrid({ posts }: { posts: BlogPost[] }) {
  return (
    <section
      className="blog-grid-outer"
      style={{
        maxWidth:            '1280px',
        margin:              '0 auto',
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
        gap:                 '24px',
      }}
    >
      {posts.map((post, i) => {
        const accentColor = CATEGORY_COLORS[post.category] ?? '#E8A030';
        const dateStr = new Date(post.date).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        });

        return (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            style={{ textDecoration: 'none', display: 'block' }}
          >
            <article
              style={{
                background:   '#10101E',
                borderTop:    '1px solid rgba(255,255,255,0.10)',
                borderRight:  '1px solid rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                borderLeft:   '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                boxShadow:    '0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.06)',
                padding:       '28px',
                height:        '100%',
                display:       'flex',
                flexDirection: 'column',
                gap:           '16px',
                transition:    'border-top-color 200ms ease, transform 200ms ease, box-shadow 200ms ease',
                cursor:        'pointer',
                animation:     `sectionEnter 600ms cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80}ms both`,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget;
                el.style.borderTopColor = 'rgba(255,255,255,0.18)';
                el.style.transform      = 'translateY(-3px)';
                el.style.boxShadow      = '0 0 0 1px rgba(255,255,255,0.05), 0 32px 100px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget;
                el.style.borderTopColor = 'rgba(255,255,255,0.10)';
                el.style.transform      = 'translateY(0)';
                el.style.boxShadow      = '0 0 0 1px rgba(255,255,255,0.03), 0 24px 80px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.06)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                    fontSize:      '9px',
                    fontWeight:    500,
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                    color:         accentColor,
                  }}
                >
                  {post.category}
                </span>
              </div>

              <h2
                style={{
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      '18px',
                  fontWeight:    700,
                  letterSpacing: '-0.02em',
                  lineHeight:    1.25,
                  color:         'rgba(255,255,255,0.90)',
                  margin:        0,
                  flex:          '1 0 auto',
                }}
              >
                {post.title}
              </h2>

              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize:   '13px',
                  fontWeight: 400,
                  lineHeight: 1.6,
                  color:      'rgba(255,255,255,0.40)',
                  margin:     0,
                }}
              >
                {post.excerpt}
              </p>

              <div
                style={{
                  display:         'flex',
                  alignItems:      'center',
                  justifyContent:  'space-between',
                  borderTop:       '1px solid rgba(255,255,255,0.05)',
                  paddingTop:      '14px',
                  marginTop:       'auto',
                }}
              >
                <span
                  style={{
                    fontFamily:    "'Geist Mono', monospace",
                    fontSize:      '10px',
                    color:         'rgba(255,255,255,0.25)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {dateStr}
                </span>
                <span
                  style={{
                    fontFamily:    "'Geist Mono', monospace",
                    fontSize:      '10px',
                    color:         'rgba(255,255,255,0.25)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {post.readTime} min read
                </span>
              </div>
            </article>
          </Link>
        );
      })}
    </section>
  );
}
