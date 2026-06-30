// FILE: app/(app)/funnel/page.jsx
// PURPOSE: Funnel page — redesigned to match reference image.
//          Teal accent system, star/wave background, cleaned sidebar (no icons),
//          single journey banner. All business logic preserved unchanged.

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFunnel } from '../../../hooks/useFunnel';
import ContextScreen from '../../../components/ContextScreen';
import FunnelStep from '../../../components/FunnelStep';
import Navbar from '../../../components/Navbar';
import { CoreSpinLoader } from '../../../components/ui/core-spin-loader';

// Analytics tracking helper
async function logAnalyticsEvent(sessionId, step, action, timeSpentMs = null, errorMessage = null) {
  try {
    await fetch('/funnel/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        step,
        action,
        timeSpentMs,
        errorMessage,
        deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
      }),
    });
  } catch (err) {
    console.error('[Analytics] Log failed:', err);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Per-step loader content ───────────────────────────────────────────────────

const STEP_LOADERS = {
  context: {
    title: 'Pinning your property',
    messages: ['Verifying location...', 'Locking address...', 'Setting up analysis...'],
  },
  1: {
    title: 'Saving commute preferences',
    messages: ['Mapping your route...', 'Checking traffic data...', 'Loading next step...'],
  },
  2: {
    title: 'Logging lifestyle data',
    messages: ['Syncing your profile...', 'Building preferences...', 'Loading next step...'],
  },
  3: {
    title: 'Queuing environmental scan',
    messages: ['Preparing air check...', 'Noise model loading...', 'Loading next step...'],
  },
  4: {
    title: 'Saving home usage data',
    messages: ['Reading orientation...', 'Parsing Vastu params...', 'Loading next step...'],
  },
  5: {
    title: 'Logging amenity priorities',
    messages: ['Scanning nearby places...', 'Mapping distances...', 'Loading next step...'],
  },
  6: {
    title: 'Profiling the neighbourhood',
    messages: ['Reading community data...', 'Analysing local vibe...', 'Loading next step...'],
  },
  7: {
    title: 'Running budget analysis',
    messages: ['Crunching rental data...', 'Checking price fit...', 'Loading final step...'],
  },
  8: {
    title: 'Generating your report',
    messages: ['Running 6 signal checks...', 'Fetching live data...', 'Computing verdicts...', 'Preparing insights...', 'Almost ready...'],
  },
};

// ── Sidebar step definitions ──────────────────────────────────────────────────

const SIDEBAR_STEPS = [
  { phase: 'context', label: 'Property',          subtitle: 'Where is the property?' },
  { phase: 1,         label: 'Location & Commute', subtitle: 'Work and accessibility' },
  { phase: 2,         label: 'Lifestyle',           subtitle: 'What describes you' },
  { phase: 3,         label: 'Environmental',       subtitle: 'Air quality & noise' },
  { phase: 4,         label: 'Home Usage',          subtitle: 'Vastu & orientation' },
  { phase: 5,         label: 'Amenities',           subtitle: 'What matters most' },
  { phase: 6,         label: 'Community',           subtitle: 'Neighbourhood vibe' },
  { phase: 7,         label: 'Financial',           subtitle: 'Budget & costs' },
  { phase: 8,         label: 'Your Report',         subtitle: 'Insights & recommendations' },
];

// ── Fixed star positions [cx%, cy%, opacity] ──────────────────────────────────

const STARS = [
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45],
  [60, 40, 0.35], [95, 45, 0.60], [77, 52, 0.45], [67, 62, 0.40], [86, 67, 0.55],
  [72, 74, 0.45], [90, 77, 0.35], [63, 27, 0.50], [97, 13, 0.40], [75, 37, 0.45],
  [55, 70, 0.55], [80, 84, 0.45], [92, 88, 0.35], [68, 87, 0.65], [58, 54, 0.40],
  [87, 57, 0.45], [76, 71, 0.35], [93, 31, 0.55], [61, 47, 0.45], [84, 19, 0.40],
  [70, 3, 0.60], [96, 61, 0.45], [59, 81, 0.55], [86, 44, 0.35], [74, 91, 0.45],
  [50, 22, 0.30], [53, 66, 0.50], [99, 75, 0.35], [64, 91, 0.60], [78, 10, 0.45],
  [56, 35, 0.40], [83, 42, 0.50], [69, 58, 0.35], [94, 24, 0.45], [62, 79, 0.40],
];

// ── Background decoration (stars + wave lines) ────────────────────────────────

function FunnelBgDecoration() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Ambient radial teal glow — upper right */}
      <div
        style={{
          position: 'absolute',
          right: '8%',
          top: '5%',
          width: '55vw',
          height: '55vw',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(13,216,192,0.050) 0%, transparent 65%)',
          transform: 'translate(15%, -15%)',
        }}
      />

      {/* Scattered stars — viewBox uses % so they scale with viewport */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>

      {/* Flowing teal wave lines — bottom-right quadrant */}
      <svg
        style={{
          position: 'absolute',
          right: '-4%',
          bottom: '-4%',
          width: '60%',
          height: '72%',
          opacity: 0.16,
        }}
        viewBox="0 0 720 580"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="wg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path
          d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290"
          stroke="url(#wg)" strokeWidth="1.6" fill="none"
        />
        <path
          d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335"
          stroke="url(#wg)" strokeWidth="1.3" fill="none" opacity="0.85"
        />
        <path
          d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380"
          stroke="url(#wg)" strokeWidth="1.0" fill="none" opacity="0.70"
        />
        <path
          d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255"
          stroke="url(#wg)" strokeWidth="1.4" fill="none" opacity="0.75"
        />
        <path
          d="M-80 475 C120 425 290 505 460 470 C600 435 715 375 860 425"
          stroke="url(#wg)" strokeWidth="0.8" fill="none" opacity="0.55"
        />
        <path
          d="M-80 260 C30 218 140 285 260 258 C390 228 500 172 670 215"
          stroke="url(#wg)" strokeWidth="1.1" fill="none" opacity="0.60"
        />
        <path
          d="M-80 520 C140 470 320 548 500 514 C640 482 750 422 900 470"
          stroke="url(#wg)" strokeWidth="0.7" fill="none" opacity="0.45"
        />
      </svg>
    </div>
  );
}

// ── Mobile stepper header ─────────────────────────────────────────────────────

function MobileStepper({ currentPhase }) {
  const currentStepIndex =
    currentPhase === 'context' ? 0 : typeof currentPhase === 'number' ? currentPhase : 0;
  const stepsRemaining = SIDEBAR_STEPS.length - 1 - currentStepIndex;

  return (
    <div className="mobile-stepper">
      <p className="mobile-stepper-label">
        STEP {currentStepIndex + 1} OF {SIDEBAR_STEPS.length}
      </p>

      <div className="mobile-stepper-row">
        {SIDEBAR_STEPS.map((s, i) => {
          const isCompleted = i < currentStepIndex;
          const isActive    = i === currentStepIndex;
          const isLast      = i === SIDEBAR_STEPS.length - 1;

          return (
            <div key={i} className="mobile-stepper-item">
              <div
                className={`mobile-stepper-circle${
                  isCompleted ? ' msc-completed' : isActive ? ' msc-active' : ' msc-upcoming'
                }`}
              >
                {isCompleted ? (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
                    stroke="currentColor" strokeWidth="2.2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              {!isLast && (
                <div className={`mobile-stepper-line${isCompleted ? ' msl-done' : ''}`} />
              )}
            </div>
          );
        })}
      </div>

      {stepsRemaining > 0 && (
        <p className="mobile-stepper-remaining">{stepsRemaining} steps to go</p>
      )}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function FunnelSidebar({ currentPhase }) {
  function getState(phase) {
    if (currentPhase === 'context') {
      return phase === 'context' ? 'active' : 'upcoming';
    }
    if (phase === 'context') return 'completed';
    if (phase === currentPhase) return 'active';
    if (typeof phase === 'number' && typeof currentPhase === 'number' && phase < currentPhase)
      return 'completed';
    return 'upcoming';
  }

  return (
    <aside className="funnel-sidebar">
      <p
        className="funnel-sidebar-title"
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: 'var(--color-accent)',
          marginBottom: '32px',
        }}
      >
        Your Audit Journey
      </p>

      <div style={{ position: 'relative' }}>
        {/* Vertical connector gradient line */}
        <div
          className="funnel-step-connector"
          style={{
            position: 'absolute',
            left: 15,
            top: 28,
            bottom: 28,
            width: 1,
            background:
              'linear-gradient(to bottom, var(--color-accent-35) 0%, rgba(255,255,255,0.03) 100%)',
          }}
        />

        {SIDEBAR_STEPS.map((s, i) => {
          const state       = getState(s.phase);
          const isActive    = state === 'active';
          const isCompleted = state === 'completed';

          const circleStyle = {
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '12px',
            fontWeight: 600,
            position: 'relative',
            zIndex: 1,
            transition: 'all 0.35s ease',
            ...(isActive
              ? {
                  background: 'var(--color-accent)',
                  border: '2px solid var(--color-accent)',
                  color: '#080812',
                  boxShadow:
                    '0 0 0 4px var(--color-accent-15), 0 0 18px var(--color-accent-35)',
                }
              : isCompleted
              ? {
                  background: 'rgba(13, 216, 192, 0.08)',
                  border: '1.5px solid var(--color-accent)',
                  color: 'var(--color-accent)',
                }
              : {
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  color: 'rgba(255, 255, 255, 0.20)',
                }),
          };

          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '10px 0',
              }}
            >
              <div style={circleStyle}>
                {isCompleted ? (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              <div className="funnel-step-meta" style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontSize: '13.5px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive
                      ? 'rgba(255,255,255,0.93)'
                      : isCompleted
                      ? 'rgba(255,255,255,0.48)'
                      : 'rgba(255,255,255,0.22)',
                    margin: 0,
                    lineHeight: 1.3,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 300,
                    color: isActive
                      ? 'rgba(255,255,255,0.38)'
                      : 'rgba(255,255,255,0.12)',
                    margin: 0,
                    lineHeight: 1.3,
                    transition: 'color 0.3s ease',
                  }}
                >
                  {s.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      {/* ── Need help? card ── */}
      <div className="funnel-need-help">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(13,216,192,0.10)',
              border: '1px solid rgba(13,216,192,0.20)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
              <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
              <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.88)', margin: '0 0 4px' }}>
              Need help?
            </p>
            <p style={{ fontSize: '11.5px', fontWeight: 300, color: 'rgba(255,255,255,0.38)', margin: 0, lineHeight: 1.55 }}>
              Our AI engine analyzes 100+ data points to deliver the best property insights.
            </p>
          </div>
        </div>
        <button
          style={{
            width: '100%',
            padding: '9px 0',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-accent)',
            background: 'rgba(13,216,192,0.08)',
            border: '1px solid rgba(13,216,192,0.22)',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'background 0.2s ease, border-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(13,216,192,0.14)';
            e.currentTarget.style.borderColor = 'rgba(13,216,192,0.40)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(13,216,192,0.08)';
            e.currentTarget.style.borderColor = 'rgba(13,216,192,0.22)';
          }}
        >
          Learn more
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 6h8M6 2l4 4-4 4"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}

// ── Journey banner (bottom of main) ──────────────────────────────────────────

function JourneyBanner() {
  return (
    <div className="funnel-journey-banner">
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(13, 216, 192, 0.10)',
          border: '1px solid rgba(13, 216, 192, 0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 16 16"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 1L3 9h5l-1 6 6-8H8z" />
        </svg>
      </div>
      <div>
        <p
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          Your journey to smarter property decisions
        </p>
        <p
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'rgba(255,255,255,0.38)',
            margin: 0,
            lineHeight: 1.4,
          }}
        >
          We'll guide you through {SIDEBAR_STEPS.length} simple steps
        </p>
      </div>
    </div>
  );
}

// ── Resume banner ─────────────────────────────────────────────────────────────

function ResumeBanner({ stepLabel, onResume, onStartOver }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-lg)',
        padding: 'var(--space-lg) 0',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(13,216,192,0.10)',
          border: '1px solid rgba(13,216,192,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </div>

      <div>
        <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          You left off at <span style={{ color: 'var(--color-accent)', fontWeight: 500 }}>{stepLabel}</span>.
          <br />Pick up where you left off or start fresh.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', maxWidth: 320 }}>
        <button
          type="button"
          className="btn-primary"
          onClick={onResume}
          style={{ width: '100%' }}
        >
          Resume from {stepLabel}
        </button>
        <button
          type="button"
          onClick={onStartOver}
          style={{
            width: '100%',
            padding: '11px 0',
            fontSize: '13px',
            fontWeight: 400,
            color: 'var(--color-text-secondary)',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease, color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)';
            e.currentTarget.style.color = 'rgba(255,255,255,0.75)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          Start over
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FunnelPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const sessionId    = searchParams.get('sessionId');

  const {
    step,
    stepData,
    serverDefaults,
    listingTypeContext,
    setListingTypeContext,
    loading,
    error,
    saveStep,
    resumeCandidate,
    applyResume,
    dismissResume,
  } = useFunnel(sessionId);

  const [contextDone,      setContextDone]      = useState(false);
  const [animKey,          setAnimKey]          = useState(0);
  const [transitioning,    setTransitioning]    = useState(false);
  const [activeLoaderStep, setActiveLoaderStep] = useState(null);

  // Analytics tracking refs
  const stepEntryTimeRef = useRef(null);
  const lastTrackedStepRef = useRef(null);

  // Track step entry (when user enters a new step)
  useEffect(() => {
    if (contextDone && step && step !== lastTrackedStepRef.current) {
      stepEntryTimeRef.current = Date.now();
      lastTrackedStepRef.current = step;
      logAnalyticsEvent(sessionId, step, 'enter');
    }
  }, [step, contextDone, sessionId]);

  // Track context entry
  useEffect(() => {
    if (!contextDone) {
      stepEntryTimeRef.current = Date.now();
      logAnalyticsEvent(sessionId, 0, 'enter');
    }
  }, [sessionId]);

  const handleContextComplete = useCallback(
    async (listingType) => {
      setActiveLoaderStep('context');
      setTransitioning(true);
      setListingTypeContext(listingType);
      setContextDone(true);
      await delay(1400);
      setTransitioning(false);
      setActiveLoaderStep(null);
      setAnimKey((k) => k + 1);
    },
    [setListingTypeContext],
  );

  const handleResume = useCallback(() => {
    applyResume();
    setContextDone(true);
  }, [applyResume]);

  const handleStartOver = useCallback(() => {
    dismissResume();
  }, [dismissResume]);

  const handleStepSubmit = useCallback(
    async (data) => {
      const currentStep = step;
      const timeSpentMs = stepEntryTimeRef.current ? Date.now() - stepEntryTimeRef.current : null;

      // Log exit event with time spent
      await logAnalyticsEvent(sessionId, currentStep, 'exit', timeSpentMs);

      setActiveLoaderStep(currentStep);
      setTransitioning(true);
      const [isComplete] = await Promise.all([
        saveStep(currentStep, data),
        delay(currentStep === 8 ? 0 : 1200),
      ]);
      if (isComplete) {
        // loader stays visible (step 8 config) until page navigates
        router.push(`/report/${sessionId}`);
        return;
      }
      setTransitioning(false);
      setActiveLoaderStep(null);
      setAnimKey((k) => k + 1);
    },
    [step, saveStep, router, sessionId],
  );

  if (!sessionId) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 var(--space-md)',
          background: 'var(--color-bg)',
        }}
      >
        <div
          className="glass-card"
          style={{
            maxWidth: '448px',
            width: '100%',
            padding: 'var(--space-lg)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'var(--color-text-secondary)',
              marginBottom: 'var(--space-md)',
            }}
          >
            No session found. Please start your property analysis from the search page.
          </p>
          <a
            href="/analyze"
            className="btn-primary"
            style={{ display: 'inline-block', textDecoration: 'none' }}
          >
            Go to Search
          </a>
        </div>
      </div>
    );
  }

  const currentPhase = contextDone ? step : 'context';

  return (
    <>
      <Navbar />
      <div className="funnel-layout" style={{ paddingTop: '60px' }}>
        <FunnelBgDecoration />

        <FunnelSidebar currentPhase={currentPhase} />

        <main className="funnel-main">
          <MobileStepper currentPhase={currentPhase} />

          <div className="funnel-card-shell">
            <div
              className="funnel-content-card"
              key={transitioning ? `loader-${activeLoaderStep}` : animKey}
            >
            {transitioning ? (
              <CoreSpinLoader
                title={STEP_LOADERS[activeLoaderStep]?.title}
                messages={STEP_LOADERS[activeLoaderStep]?.messages}
              />
            ) : resumeCandidate ? (
              <ResumeBanner
                stepLabel={SIDEBAR_STEPS.find((s) => s.phase === resumeCandidate.step)?.label ?? `Step ${resumeCandidate.step}`}
                onResume={handleResume}
                onStartOver={handleStartOver}
              />
            ) : !contextDone ? (
              <ContextScreen
                sessionId={sessionId}
                onComplete={handleContextComplete}
              />
            ) : (
              <FunnelStep
                step={step}
                stepData={stepData}
                initialData={(stepData[step] ?? serverDefaults?.[step]) || null}
                listingTypeContext={listingTypeContext}
                onSubmit={handleStepSubmit}
                loading={loading}
              />
            )}

            {error && (
              <p
                style={{
                  color: 'var(--color-danger)',
                  fontSize: '13px',
                  fontWeight: 300,
                  textAlign: 'center',
                  marginTop: 'var(--space-md)',
                }}
              >
                {error}
              </p>
            )}
            </div>
          </div>

          <JourneyBanner />
        </main>
      </div>
    </>
  );
}
