// FILE: app/(app)/funnel/page.jsx
// PURPOSE: Funnel page — shows ContextScreen first, then renders FunnelStep for steps 1–8.
//          Step transitions: current fades out (200ms), next fades up (400ms), vertical only.
//          On Step 8 confirm: redirect to /report/[sessionId].

'use client';

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useFunnel } from '../../../hooks/useFunnel';
import ContextScreen from '../../../components/ContextScreen';
import FunnelStep from '../../../components/FunnelStep';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function FunnelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const {
    step,
    stepData,
    listingTypeContext,
    setListingTypeContext,
    loading,
    error,
    saveStep,
  } = useFunnel(sessionId);

  const [contextDone, setContextDone] = useState(false);
  const [fading, setFading] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const handleContextComplete = useCallback(
    async (listingType) => {
      setFading(true);
      await delay(200);
      setListingTypeContext(listingType);
      setContextDone(true);
      setFading(false);
      setAnimKey((k) => k + 1);
    },
    [setListingTypeContext]
  );

  const handleStepSubmit = useCallback(
    async (data) => {
      const currentStep = step;
      setFading(true);
      await delay(200);
      const isComplete = await saveStep(currentStep, data);
      if (isComplete) {
        router.push(`/report/${sessionId}`);
        return;
      }
      setFading(false);
      setAnimKey((k) => k + 1);
    },
    [step, saveStep, router, sessionId]
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-3xl) var(--space-md)',
        background: 'var(--color-bg)',
      }}
    >
      <div
        key={animKey}
        style={{
          width: '100%',
          ...(fading
            ? {
                opacity: 0,
                transform: 'translateY(20px)',
                transition: 'opacity 200ms ease, transform 200ms ease',
                animation: 'none',
              }
            : {}),
        }}
      >
        {!contextDone ? (
          <ContextScreen
            sessionId={sessionId}
            onComplete={handleContextComplete}
          />
        ) : (
          <FunnelStep
            step={step}
            stepData={stepData}
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
  );
}
