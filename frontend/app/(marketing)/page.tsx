'use client';

import React, { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "../../components/LoadingScreen";
import HeroCanvas from "../../components/HeroCanvas";
import Link from 'next/link';
import TestimonialsSection from "@/components/TestimonialsSection";
import LocationIntelligence from "@/components/vibescout/location-intelligence";
import ReportPreview from "@/components/vibescout/report-preview";
import IntelligenceEngine from "@/components/vibescout/intelligence-engine";
import SignalsRefined from "@/components/vibescout/signals-refined";
const SIGNALS = [
  {
    title: 'Air & Noise',
    label: 'ENV QUALITY',
    stat: '42 AQI',
    sub: 'OPTIMAL BREATHING ZONE',
    subColor: '#B4D2AA',
    description: 'Real-time AQI and ambient noise levels from live sensors and intelligent estimates.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7C58A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    bar: 0.28,
    barColor: '#B4D2AA',
  },
  {
    title: 'Solar Potential',
    label: 'SOLAR',
    stat: '87% YIELD',
    sub: 'HIGH RADIANCE ZONE',
    subColor: '#E7C58A',
    description: 'Peak sun hours, morning light quality, and solar panel viability for your exact location.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7C58A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
      </svg>
    ),
    bar: 0.87,
    barColor: '#E7C58A',
  },
  {
    title: 'Nearby Amenities',
    label: 'AMENITIES',
    stat: 'A+ SCORE',
    sub: 'ULTRA-CONNECTED HUB',
    subColor: '#B4D2AA',
    description: 'Schools, hospitals, parks, gyms, and cafes — mapped within 3 km of the property.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7C58A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    bar: 0.92,
    barColor: '#B4D2AA',
  },
  {
    title: 'Commute Analysis',
    label: 'COMMUTE',
    stat: '15m',
    sub: 'ON-TRACK',
    subColor: '#B4D2AA',
    description: 'Estimated commute time based on your workplace, mode of transport, and tolerance.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7C58A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    bar: 0.75,
    barColor: '#5D748A',
  },
  {
    title: 'Financial Fit',
    label: 'FINANCIAL FIT',
    stat: '₹8.4k /sqft',
    sub: '+18.2% ANNUAL ROI',
    subColor: '#B4D2AA',
    description: 'Budget alignment, affordability ratios, and financial readiness for the property.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7C58A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
    bar: 0.81,
    barColor: '#E7C58A',
  },
  {
    title: 'Local News',
    label: 'LOCAL NEWS',
    stat: 'BULLISH',
    sub: '91% POSITIVE SENTIMENT',
    subColor: '#B4D2AA',
    description: 'Recent headlines and developments around the property location, sourced live.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E7C58A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
        <line x1="10" y1="6" x2="18" y2="6" />
        <line x1="10" y1="10" x2="18" y2="10" />
        <line x1="10" y1="14" x2="14" y2="14" />
      </svg>
    ),
    bar: 0.91,
    barColor: '#B4D2AA',
  },
];

const STEPS = [
  {
    step: '01',
    tag: 'INITIATE',
    title: 'Search any property',
    description: 'Enter the address, drop a pin, or type coordinates. Any property you are considering — from any source.',
    metric: '< 3s',
    metricLabel: 'LOCATION LOCK',
  },
  {
    step: '02',
    tag: 'CONFIGURE',
    title: 'Provide context',
    description: 'Tell us the asking price, BHK, and floor. Then complete your lifestyle profile in 8 quick steps.',
    metric: '8',
    metricLabel: 'PARAMETERS',
  },
  {
    step: '03',
    tag: 'EXECUTE',
    title: 'Get your intelligence report',
    description: 'Live environmental data, commute analysis, financial fit, and a deterministic verdict — no AI hallucinations.',
    metric: '6',
    metricLabel: 'LIVE SIGNALS',
  },
];

// Inline styles as constants for reuse
const glassCard = {
  background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
  border: '1px solid rgba(231,197,138,0.12)',
  borderRadius: '12px',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const eyebrow = {
  fontSize: '10px',
  fontWeight: 400,
  letterSpacing: '0.35em',
  textTransform: 'uppercase',
  color: '#E7C58A',
  fontFamily: "'Outfit', sans-serif",
};

const sectionHeading = {
  fontSize: '28px',
  fontWeight: 500,
  color: 'rgba(255,255,255,0.9)',
  lineHeight: 1.2,
  fontFamily: "'Outfit', sans-serif",
};

const bodyText = {
  fontSize: '14px',
  fontWeight: 300,
  color: 'rgba(255,255,255,0.55)',
  lineHeight: 1.7,
  fontFamily: "'Outfit', sans-serif",
};

// Horizontal rule with gold gradient
function SectionDivider() {
  return (
    <div style={{
      width: '100%',
      height: '1px',
      background: 'linear-gradient(90deg, transparent, rgba(231,197,138,0.25) 30%, rgba(231,197,138,0.25) 70%, transparent)',
      margin: '0 auto',
    }} />
  );
}

// Corner tick decoration
function CornerTicks({ color = 'rgba(231,197,138,0.35)' }) {
  const tick: React.CSSProperties = { position: 'absolute', width: '8px', height: '8px' };
  return (
    <>
      <span style={{ ...tick, top: 0, left: 0, borderTop: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <span style={{ ...tick, top: 0, right: 0, borderTop: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
      <span style={{ ...tick, bottom: 0, left: 0, borderBottom: `1px solid ${color}`, borderLeft: `1px solid ${color}` }} />
      <span style={{ ...tick, bottom: 0, right: 0, borderBottom: `1px solid ${color}`, borderRight: `1px solid ${color}` }} />
    </>
  );
}

// Mini bar component
function DataBar({ fill, color }) {
  return (
    <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
      <div style={{
        width: `${fill * 100}%`,
        height: '100%',
        background: color,
        borderRadius: '2px',
        boxShadow: `0 0 6px ${color}80`,
        transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
      }} />
    </div>
  );
}

export default function LandingPage() {
  const containerRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  const handleProgress = useCallback((p) => setProgress(p), []);
  const handleComplete = useCallback(() => {
    setTimeout(() => setIsLoaded(true), 900);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isLoaded ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isLoaded]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    const elements = containerRef.current.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isLoaded]);

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '100vh', background: 'var(--color-bg, #050505)', fontFamily: "'Outfit', sans-serif" }}
    >
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* ─── LOADING SCREEN — untouched ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!isLoaded && <LoadingScreen key="loader" progress={progress} />}
      </AnimatePresence>

      {/* ─── HERO CANVAS — untouched ─────────────────────────────────── */}
      <HeroCanvas onLoadProgress={handleProgress} onLoadComplete={handleComplete} />

      {/* ─── POST-HERO SECTIONS ───────────────────────────────────────── */}
      <div
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1.2s cubic-bezier(0.16,1,0.3,1)',
          pointerEvents: isLoaded ? 'auto' : 'none',
          background: '#050505',
        }}
      >

        {/* ── SECTION TRANSITION: subtle grid line ── */}
        <div style={{
          position: 'relative',
          height: '80px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
        }}>
          <SectionDivider />
          {/* Center node */}
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#E7C58A',
            boxShadow: '0 0 12px rgba(231,197,138,0.6)',
          }} />
        </div>

        {/* ═══════════════════════════════════════════════════════
            HOW IT WORKS
        ═══════════════════════════════════════════════════════ */}
        <section style={{ padding: '0 24px 100px', maxWidth: '1000px', margin: '0 auto' }}>

          {/* Section header */}
          <div className="reveal" style={{ marginBottom: '56px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '20px', height: '1px', background: '#E7C58A', opacity: 0.6 }} />
                <p style={eyebrow}>Protocol</p>
                <div style={{ width: '20px', height: '1px', background: '#E7C58A', opacity: 0.6 }} />
              </div>
              <h2 style={sectionHeading}>Three steps to clarity</h2>
            </div>
            {/* Live status badge */}
            <div style={{
              ...glassCard,
              padding: '8px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#B4D2AA',
                boxShadow: '0 0 8px rgba(180,210,170,0.8)',
                animation: 'pulse 2s infinite',
              }} />
              <span style={{ ...eyebrow, fontSize: '9px', color: 'rgba(255,255,255,0.45)' }}>SYSTEM ACTIVE</span>
            </div>
          </div>

          {/* Steps grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {STEPS.map((s, i) => (
              <StepCard key={s.step} s={s} index={i} />
            ))}
          </div>
        </section>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════
            INTELLIGENCE SIGNALS
        ═══════════════════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px 100px', maxWidth: '1000px', margin: '0 auto' }}>

          {/* Section header */}
          <div className="reveal" style={{ marginBottom: '56px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '20px', height: '1px', background: '#E7C58A', opacity: 0.6 }} />
              <p style={eyebrow}>Intelligence Signals</p>
              <div style={{ width: '20px', height: '1px', background: '#E7C58A', opacity: 0.6 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <h2 style={sectionHeading}>Six layers of property intelligence</h2>
                <p style={{ ...bodyText, maxWidth: '500px', marginTop: '12px' }}>
                  Every signal is fetched live from verified sources. When live data is unavailable,
                  we fall back through a multi-tier chain — never guessing, never hallucinating.
                </p>
              </div>
              {/* Signal count chip */}
              <div style={{
                ...glassCard,
                padding: '12px 20px',
                textAlign: 'center',
                minWidth: '80px',
              }}>
                <div style={{ fontSize: '24px', fontWeight: 600, color: '#E7C58A', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>6</div>
                <div style={{ ...eyebrow, fontSize: '9px', marginTop: '4px', color: 'rgba(255,255,255,0.35)' }}>SIGNALS</div>
              </div>
            </div>
          </div>

          {/* Signals grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {SIGNALS.map((s, i) => (
              <SignalCard key={i} s={s} />
            ))}
          </div>
        </section>

     <SectionDivider />

        {/* ═══════════════════════════════════════════════════════
            LOCATION INTELLIGENCE
        ═══════════════════════════════════════════════════════ */}
        <div style={{ padding: '80px 0 0' }}>
          <LocationIntelligence />
        </div>

        {/* ═══════════════════════════════════════════════════════
            REPORT PREVIEW
        ═══════════════════════════════════════════════════════ */}
        <div style={{ paddingBottom: '80px' }}>
          <ReportPreview />
        </div>

        <SectionDivider />

        {/* ═══════════════════════════════════════════════════════
            SECTION 5 — INTELLIGENCE ENGINE
        ═══════════════════════════════════════════════════════ */}
        <div style={{ paddingBottom: '40px' }}>
          <IntelligenceEngine />
        </div>

        {/* ═══════════════════════════════════════════════════════
            SECTION 6 — SIGNALS (REFINED)
        ═══════════════════════════════════════════════════════ */}
        <div style={{ paddingBottom: '80px' }}>
          <SignalsRefined />
        </div>

<SectionDivider />
 
        {/* ═══════════════════════════════════════════════════════
            CTA
        ═══════════════════════════════════════════════════════ */}
        <section style={{ padding: '80px 24px 100px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div className="reveal">

            {/* Decorative top mark */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '40px' }}>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(231,197,138,0.3))' }} />
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="5.5" y="0" width="3" height="3" fill="#E7C58A" opacity="0.6" transform="rotate(45 7 7)" />
              </svg>
              <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(231,197,138,0.3), transparent)' }} />
            </div>

            {/* CTA card */}
            <div style={{
              ...glassCard,
              padding: '56px 48px',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Background radial glow */}
              <div style={{
                position: 'absolute',
                top: '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '300px',
                height: '200px',
                background: 'radial-gradient(ellipse, rgba(231,197,138,0.07) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              <CornerTicks color="rgba(231,197,138,0.3)" />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B4D2AA', boxShadow: '0 0 8px rgba(180,210,170,0.8)' }} />
                <p style={eyebrow}>Ready to audit</p>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#B4D2AA', boxShadow: '0 0 8px rgba(180,210,170,0.8)' }} />
              </div>

              <h2 style={{ ...sectionHeading, fontSize: '32px', marginBottom: '16px' }}>
                Found a property worth considering?
              </h2>
              <p style={{ ...bodyText, fontSize: '15px', maxWidth: '440px', margin: '0 auto 36px' }}>
                Run an intelligence audit before you commit. It takes less than 5 minutes.
              </p>

              <CtaButton href="/#"> 
          
                Audit a Property Now
              </CtaButton>

              {/* Sub note */}
              <p style={{ ...bodyText, fontSize: '12px', marginTop: '20px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' }}>
               LIVE DATA &nbsp;·&nbsp; INSTANT RESULTS
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════ */}
   

        {/* Keyframe for pulse */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          @keyframes ctaGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(231,197,138,0.25), 0 4px 24px rgba(0,0,0,0.5); }
            50% { box-shadow: 0 0 32px rgba(231,197,138,0.4), 0 4px 24px rgba(0,0,0,0.5); }
          }
        `}</style>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STEP CARD
───────────────────────────────────────────── */
function StepCard({ s, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="glass-card reveal"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '28px 24px',
        background: hovered
          ? 'linear-gradient(135deg, rgba(231,197,138,0.06) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
        border: `1px solid ${hovered ? 'rgba(231,197,138,0.3)' : 'rgba(231,197,138,0.1)'}`,
        borderRadius: '12px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: hovered
          ? '0 8px 40px rgba(0,0,0,0.5), 0 0 20px rgba(231,197,138,0.12), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
        overflow: 'hidden',
      }}
    >
      {/* Corner ticks */}
      <CornerTicks color={hovered ? 'rgba(231,197,138,0.5)' : 'rgba(231,197,138,0.2)'} />

      {/* Top row: step tag + metric */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '9px', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif",
          }}>
            {s.tag}
          </span>
        </div>
        {/* Metric chip */}
        <div style={{
          background: 'rgba(231,197,138,0.08)',
          border: '1px solid rgba(231,197,138,0.2)',
          borderRadius: '6px',
          padding: '4px 10px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#E7C58A', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: "'Outfit', sans-serif" }}>{s.metric}</div>
          <div style={{ fontSize: '8px', fontWeight: 400, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", marginTop: '2px' }}>{s.metricLabel}</div>
        </div>
      </div>

      {/* Step number */}
      <div style={{
        fontSize: '42px',
        fontWeight: 600,
        lineHeight: 1,
        marginBottom: '12px',
        color: hovered ? 'rgba(231,197,138,0.45)' : 'rgba(231,197,138,0.25)',
        fontFamily: "'Outfit', sans-serif",
        fontVariantNumeric: 'tabular-nums',
        transition: 'color 0.3s ease',
      }}>
        {s.step}
      </div>

      <h3 style={{
        fontSize: '17px', fontWeight: 500, color: 'rgba(255,255,255,0.9)',
        lineHeight: 1.2, marginBottom: '10px', fontFamily: "'Outfit', sans-serif",
      }}>
        {s.title}
      </h3>
      <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, fontFamily: "'Outfit', sans-serif" }}>
        {s.description}
      </p>

      {/* Bottom connector line */}
      {index < 2 && (
        <div style={{
          position: 'absolute',
          right: '-1px',
          top: '50%',
          width: '1px',
          height: '40px',
          transform: 'translateY(-50%)',
          background: 'linear-gradient(180deg, transparent, rgba(231,197,138,0.2), transparent)',
        }} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   SIGNAL CARD
───────────────────────────────────────────── */
function SignalCard({ s }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="glass-card reveal"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        padding: '20px',
        background: hovered
          ? 'linear-gradient(135deg, rgba(231,197,138,0.05) 0%, rgba(255,255,255,0.02) 100%)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: `1px solid ${hovered ? 'rgba(231,197,138,0.28)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '10px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: hovered
          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 16px rgba(231,197,138,0.1)'
          : '0 2px 16px rgba(0,0,0,0.35)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <span style={{ fontSize: '9px', fontWeight: 400, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', fontFamily: "'Outfit', sans-serif" }}>
          {s.label}
        </span>
        {/* Icon circle */}
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'rgba(231,197,138,0.07)',
          border: `1px solid ${hovered ? 'rgba(231,197,138,0.3)' : 'rgba(231,197,138,0.15)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'border-color 0.25s ease',
          boxShadow: hovered ? '0 0 12px rgba(231,197,138,0.15)' : 'none',
        }}>
          {s.icon}
        </div>
      </div>

      {/* Big stat */}
      <div style={{
        fontSize: '22px', fontWeight: 600,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 1, marginBottom: '4px',
        fontVariantNumeric: 'tabular-nums',
        fontFamily: "'Outfit', sans-serif",
      }}>
        {s.stat}
      </div>

      {/* Data bar */}
      <DataBar fill={s.bar} color={s.barColor} />

      {/* Sub label */}
      <div style={{
        fontSize: '9px', fontWeight: 400, letterSpacing: '0.2em',
        textTransform: 'uppercase', color: s.subColor,
        marginTop: '8px', fontFamily: "'Outfit', sans-serif",
        opacity: 0.85,
      }}>
        ◆ {s.sub}
      </div>

      {/* Description — visible on hover */}
      <div style={{
        fontSize: '12px', fontWeight: 300,
        color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.6,
        marginTop: '10px',
        fontFamily: "'Outfit', sans-serif",
        maxHeight: hovered ? '60px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        {s.description}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CTA BUTTON
───────────────────────────────────────────── */
function CtaButton({ href, children }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        textDecoration: 'none',
        padding: '14px 40px',
        fontSize: '13px',
        fontWeight: 500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: hovered ? '#050505' : '#E7C58A',
        background: hovered
          ? 'linear-gradient(135deg, #E7C58A 0%, #d4a96d 100%)'
          : 'rgba(231,197,138,0.08)',
        border: '1px solid rgba(231,197,138,0.5)',
        borderRadius: '8px',
        fontFamily: "'Outfit', sans-serif",
        boxShadow: hovered
          ? '0 0 32px rgba(231,197,138,0.4), 0 4px 16px rgba(0,0,0,0.4)'
          : '0 0 16px rgba(231,197,138,0.1)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {children}
    </Link>
  );
}