'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ShinyButton } from '@/components/ui/shiny-button';
import IntelligenceCard from '@/components/IntelligenceCard';
import HeroCanvas from '@/components/HeroCanvas';
import LoadingScreen from '@/components/LoadingScreen';

// Below-fold sections — code-split, do not affect FCP/LCP
const LocationIntelligence = dynamic(() => import('@/components/vibescout/location-intelligence'));
const SignalsRefined        = dynamic(() => import('@/components/vibescout/signals-refined'));
const IntelligenceEngine    = dynamic(() => import('@/components/vibescout/intelligence-engine'));
const CaseStudies           = dynamic(() => import('@/components/vibescout/case-studies'));
const Pricing               = dynamic(() => import('@/components/vibescout/pricing'));

// ── Status strip content ───────────────────────────────────────────────────────
const STRIP_TEXT =
  'SYSTEM OPERATIONAL  ·  847 REPORTS TODAY  ·  LAST GENERATED: 4 MIN AGO  ·  BENGALURU  ·  MUMBAI  ·  PUNE  ·  HYDERABAD  ·  ';



// ─────────────────────────────────────────────────────────────────────────────
//  StatusStrip — infinite marquee at bottom of hero
// ─────────────────────────────────────────────────────────────────────────────
function StatusStrip() {
  const content = STRIP_TEXT.repeat(3);
  return (
    <div
      style={{
        borderTop:    '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background:   'rgba(255,255,255,0.015)',
        overflow:     'hidden',
        padding:      '10px 0',
      }}
    >
      <div
        style={{
          display:        'flex',
          whiteSpace:     'nowrap',
          animation:      'marqueeScroll 40s linear infinite',
          width:          'max-content',
        }}
      >
        {/* Duplicate for seamless loop */}
        {[0, 1].map((k) => (
          <span
            key={k}
            style={{
              fontFamily:    "'Geist Mono', monospace",
              fontSize:      '9px',
              fontWeight:    400,
              letterSpacing: '0.10em',
              color:         'rgba(255,255,255,0.28)',
              paddingRight:  '0',
            }}
          >
            {content}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  LandingPage
// ─────────────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router       = useRouter();
  const cardWrapRef  = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [canvasLoaded, setCanvasLoaded] = useState(false);

  // Scroll-driven 3D card flatten — first 100px of scroll
  useEffect(() => {
    const wrap = cardWrapRef.current;
    if (!wrap) return;

    const onScroll = () => {
      const progress = Math.min(window.scrollY / 100, 1);
      const ry = -8 * (1 - progress);
      const rx =  3 * (1 - progress);
      wrap.style.transform = `perspective(1200px) rotateY(${ry}deg) rotateX(${rx}deg)`;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // IntersectionObserver — adds sectionEnter animation to .reveal elements
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).style.animation =
              'sectionEnter 700ms cubic-bezier(0.25,0.46,0.45,0.94) forwards';
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    container.querySelectorAll<HTMLElement>('.reveal').forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ background: '#080812', minHeight: '100vh' }}
    >
      <div className="noise-overlay" />

      {/* ── Loading screen — exits once first 20 canvas frames are ready ── */}
      <AnimatePresence>
        {!canvasLoaded && (
          <LoadingScreen progress={loadProgress} />
        )}
      </AnimatePresence>

      {/* ═══════════════════════════════════════════════════════════════
          SCROLL CANVAS ANIMATION
      ═══════════════════════════════════════════════════════════════ */}
      <HeroCanvas
        onLoadProgress={setLoadProgress}
        onLoadComplete={() => setCanvasLoaded(true)}
      />

      {/* ═══════════════════════════════════════════════════════════════
          HERO (original — pushed below the canvas section)
      ═══════════════════════════════════════════════════════════════ */}
      <section
        className="hero-outer"
        style={{
          position:           'relative',
          minHeight:          'calc(100vh - 60px)', // 60px = nav height
          display:            'flex',
          flexDirection:      'column',
          justifyContent:     'center',
          overflow:           'hidden',
          backgroundImage:    'var(--grid-bg-image)',
          backgroundSize:     'var(--grid-bg-size)',
          backgroundPosition: 'center center',
        }}
      >
        {/* Ambient amber radial glow */}
        <div
          aria-hidden
          style={{
            position:      'absolute',
            inset:         0,
            background:    'radial-gradient(ellipse 900px 500px at 50% 65%, rgba(232,160,48,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Two-column grid */}
        <div
          className="hero-grid"
          style={{ position: 'relative' }}
        >
          {/* ── LEFT COLUMN ──────────────────────────────────────── */}
          <div>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{
                width:      '18px',
                height:     '1px',
                flexShrink: 0,
                background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.7))',
              }} />
              <p style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '10px',
                fontWeight:    600,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color:         '#03d3bd',
                margin:        0,
                whiteSpace:    'nowrap',
              }}>
                WHAT YOUR BROKER WON&apos;T TELL YOU
              </p>
              <div style={{
                height:     '1px',
                width:      '64px',
                flexShrink: 0,
                background: 'linear-gradient(90deg, rgba(34,211,238,0.55) 0%, transparent 100%)',
              }} />
            </div>

            {/* Headline */}
            <h1 style={{ margin: '0 0 24px' }}>
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
                The property market
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
                is not designed to inform you.
              </span>
            </h1>

            {/* Subline */}
            <p
              style={{
                fontFamily:  "'Inter', sans-serif",
                fontSize:    'clamp(15px, 1.8vw, 18px)',
                fontWeight:  400,
                lineHeight:  1.65,
                color:       'rgba(255,255,255,0.45)',
                maxWidth:    '480px',
                margin:      0,
              }}
            >
              Six signals the listing never showed you. Sourced live. Computed
              deterministically. Yours in under 5 minutes.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <ShinyButton onClick={() => router.push('/analyze')}>
                Run Intelligence on a Property →
              </ShinyButton>

              <Link
                href="/report/preview"
                style={{
                  textDecoration:'none',
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      '13px',
                  fontWeight:    400,
                  color:         'rgba(255,255,255,0.40)',
                  letterSpacing: '0.01em',
                  transition:    'color 150ms ease',
                  padding:       '14px 0',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
              >
                See a sample report
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN — IntelligenceCard ──────────────── */}
          <div className="hero-card-col">
            {/* Wrapper receives scroll-driven flatten transform */}
            <div
              ref={cardWrapRef}
              style={{
                transform:       'perspective(1200px) rotateY(-8deg) rotateX(3deg)',
                transformOrigin: 'center center',
                animation:       'cardLand 900ms cubic-bezier(0.25,0.46,0.45,0.94) 300ms both',
                willChange:      'transform',
              }}
            >
              <IntelligenceCard width={520} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATUS STRIP ──────────────────────────────────── */}
      <StatusStrip />

      {/* S2: Information Gap */}
      <LocationIntelligence />

      {/* S3: Six Signals */}
      <SignalsRefined />

      {/* S4: Architecture of Trust */}
      <IntelligenceEngine />

      {/* S6: Case Studies */}
      <CaseStudies />

      {/* S7: Pricing */}
      <Pricing />

      {/* Inline keyframe for cardLand */}
      <style>{`
        @keyframes cardLand {
          from {
            opacity: 0;
            transform: perspective(1200px) rotateY(-12deg) rotateX(5deg) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: perspective(1200px) rotateY(-8deg) rotateX(3deg) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
