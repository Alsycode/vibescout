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
    <div style={{ background: '#080812', minHeight: '100vh' }}>
      <div className="noise-overlay" />

      <section
        style={{
          paddingTop:   '120px',
          paddingBottom: '64px',
          paddingLeft:  '80px',
          paddingRight: '80px',
          maxWidth:     '1280px',
          margin:       '0 auto',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <p
          style={{
            fontFamily:    "'Inter', sans-serif",
            fontSize:      '10px',
            fontWeight:    500,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color:         '#E8A030',
            marginBottom:  '16px',
          }}
        >
          INTELLIGENCE JOURNAL
        </p>
        <h1
          style={{
            fontFamily:   "'Inter', sans-serif",
            fontSize:     'clamp(36px, 4.5vw, 64px)',
            fontWeight:   800,
            letterSpacing:'-0.04em',
            lineHeight:   0.95,
            color:        'rgba(255,255,255,0.92)',
            margin:       '0 0 20px',
          }}
        >
          What the listing<br />never tells you.
        </h1>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize:   '16px',
            fontWeight: 400,
            lineHeight: 1.65,
            color:      'rgba(255,255,255,0.40)',
            maxWidth:   '520px',
            margin:     0,
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
