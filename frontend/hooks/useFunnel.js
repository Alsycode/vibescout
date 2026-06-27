// FILE: hooks/useFunnel.js
// PURPOSE: Manages funnel state — current step (1–8), step data accumulation,
//          listingTypeContext from ContextScreen, POST /funnel/save per step,
//          handles complete=true on Step 8. Supports resume via localStorage
//          and cross-device pre-fill via GET /funnel/progress.

'use client';

import { useState, useCallback, useEffect } from 'react';
import api from '../lib/api';

const LS_KEY = (sessionId) => `vs_funnel_${sessionId}`;
const LS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readSession(sessionId) {
  try {
    const raw = localStorage.getItem(LS_KEY(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > LS_TTL_MS) {
      localStorage.removeItem(LS_KEY(sessionId));
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(sessionId, step, stepData, listingType) {
  try {
    localStorage.setItem(
      LS_KEY(sessionId),
      JSON.stringify({ step, stepData, listingType, ts: Date.now() })
    );
  } catch {
    // localStorage quota exceeded or unavailable — silent
  }
}

export function useFunnel(sessionId) {
  const [step, setStep] = useState(1);
  const [stepData, setStepData] = useState({});
  const [listingTypeContext, setListingTypeContextState] = useState('sale');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resume state: null = no saved session, object = candidate for resume banner
  const [resumeCandidate, setResumeCandidate] = useState(null);
  // Server preferences used as pre-fill defaults when no localStorage entry
  const [serverDefaults, setServerDefaults] = useState(null);

  useEffect(() => {
    if (!sessionId) return;

    const saved = readSession(sessionId);
    if (saved && saved.step > 1) {
      setResumeCandidate(saved);
      return;
    }

    // No saved session for this sessionId — try server defaults for pre-fill
    api.get('/funnel/progress')
      .then((res) => {
        const prefs = res.data?.preferences;
        if (!prefs) return;
        // Map server preferences (step1…step7) to stepData shape
        const defaults = {};
        for (let i = 1; i <= 7; i++) {
          if (prefs[`step${i}`]) defaults[i] = prefs[`step${i}`];
        }
        if (Object.keys(defaults).length > 0) setServerDefaults(defaults);
      })
      .catch(() => {}); // non-fatal
  }, [sessionId]);

  const applyResume = useCallback(() => {
    if (!resumeCandidate) return;
    setStep(resumeCandidate.step);
    setStepData(resumeCandidate.stepData);
    setListingTypeContextState(resumeCandidate.listingType ?? 'sale');
    setResumeCandidate(null);
  }, [resumeCandidate]);

  const dismissResume = useCallback(() => {
    if (!sessionId) return;
    localStorage.removeItem(LS_KEY(sessionId));
    setResumeCandidate(null);
  }, [sessionId]);

  const setListingTypeContext = useCallback((type) => {
    setListingTypeContextState(type);
  }, []);

  const saveStep = useCallback(
    async (stepNumber, data) => {
      setLoading(true);
      setError('');

      const isComplete = stepNumber === 8;

      try {
        await api.post('/funnel/save', {
          sessionId,
          step: stepNumber,
          data,
          complete: isComplete,
        });

        const nextStepData = (prev) => ({ ...prev, [stepNumber]: data });
        setStepData((prev) => {
          const updated = nextStepData(prev);
          if (!isComplete) {
            writeSession(sessionId, stepNumber + 1, updated, listingTypeContext);
          }
          return updated;
        });

        if (!isComplete) {
          setStep(stepNumber + 1);
        }

        return isComplete;
      } catch (err) {
        setError(err?.response?.data?.error ?? 'Could not save. Please try again.');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [sessionId, listingTypeContext]
  );

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  return {
    step,
    setStep,
    stepData,
    serverDefaults,
    listingTypeContext,
    setListingTypeContext,
    loading,
    error,
    saveStep,
    goBack,
    resumeCandidate,
    applyResume,
    dismissResume,
  };
}
