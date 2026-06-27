import { fetchPosts, BLOG_POSTS } from '@/lib/blog';
import BlogGrid from './BlogGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — VibeScout | Property Intelligence Insights',
  description:
    'Deep dives on AQI, noise pollution, rental yield, and the signals Indian property listings never show you.',
  openGraph: {
    title: 'Blog — VibeScout | Property Intelligence Insights',
    description:
      'Deep dives on AQI, noise pollution, rental yield, and the signals Indian property listings never show you.',
    type: 'website',
  },
};

export const revalidate = 3600;


export default async function BlogListingPage() {
  const apiPosts = await fetchPosts();
  const posts = apiPosts.length > 0 ? apiPosts : BLOG_POSTS;
  const sorted = [...posts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return (
    <div className="grid-surface" style={{ background: '#080812', minHeight: '100vh' }}>
      <div className="noise-overlay" />

      <section
        style={{
          position:      'relative',
          paddingTop:    '120px',
          paddingBottom: '72px',
          paddingLeft:   '80px',
          paddingRight:  '80px',
          maxWidth:      '1280px',
          margin:        '0 auto',
          borderBottom:  '1px solid rgba(255,255,255,0.05)',
          overflow:      'hidden',
        }}
      >
        {/* Ambient teal glow */}
        <div
          aria-hidden
          style={{
            position:      'absolute',
            inset:         0,
            background:    'radial-gradient(ellipse 800px 400px at 30% 80%, rgba(3,211,189,0.05) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Eyebrow — decorative lines + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', position: 'relative' }}>
          <div style={{
            width:      '18px',
            height:     '1px',
            flexShrink: 0,
            background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.7))',
          }} />
          <p style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '10px',
            fontWeight:    600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color:         '#03d3bd',
            margin:        0,
            whiteSpace:    'nowrap',
          }}>
            INTELLIGENCE JOURNAL
          </p>
          <div style={{
            height:     '1px',
            width:      '64px',
            flexShrink: 0,
            background: 'linear-gradient(90deg, rgba(34,211,238,0.55) 0%, transparent 100%)',
          }} />
        </div>

        {/* Headline — Instrument Serif with teal accent */}
        <h1 style={{ margin: '0 0 24px', position: 'relative' }}>
          <span style={{
            display:       'block',
            fontFamily:    "'Instrument Serif', serif",
            fontStyle:     'normal',
            fontSize:      'clamp(36px, 5vw, 72px)',
            fontWeight:    400,
            letterSpacing: '-0.01em',
            lineHeight:    1.08,
            color:         'rgba(255,255,255,0.92)',
          }}>
            What the listing
          </span>
          <span style={{
            display:       'block',
            fontFamily:    "'Instrument Serif', serif",
            fontStyle:     'normal',
            fontSize:      'clamp(36px, 5vw, 72px)',
            fontWeight:    400,
            letterSpacing: '-0.01em',
            lineHeight:    1.08,
            color:         '#03d3bd',
            textShadow:    '0 0 48px rgba(3,211,189,0.28)',
          }}>
            never tells you.
          </span>
        </h1>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   'clamp(15px, 1.8vw, 17px)',
            fontWeight: 400,
            lineHeight: 1.65,
            color:      'rgba(255,255,255,0.40)',
            maxWidth:   '520px',
            margin:     0,
            position:   'relative',
          }}
        >
          Research, signal breakdowns, and hard numbers on Indian property — sourced from the same data
          pipelines that power every VibeScout report.
        </p>
      </section>

      <BlogGrid posts={sorted} />
    </div>
  );
}
