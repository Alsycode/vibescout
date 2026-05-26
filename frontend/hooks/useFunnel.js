// FILE: hooks/useFunnel.js
// PURPOSE: Manages funnel state — current step (1–8), step data accumulation,
//          listingTypeContext from ContextScreen, POST /funnel/save per step,
//          handles complete=true on Step 8.

'use client';

import { useState, useCallback } from 'react';
import api from '../lib/api';

export function useFunnel(sessionId) {
  const [step, setStep] = useState(1);
  const [stepData, setStepData] = useState({});
  const [listingTypeContext, setListingTypeContext] = useState('sale');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        setStepData((prev) => ({ ...prev, [stepNumber]: data }));

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
    [sessionId]
  );

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  return {
    step,
    setStep,
    stepData,
    listingTypeContext,
    setListingTypeContext,
    loading,
    error,
    saveStep,
    goBack,
  };
}
