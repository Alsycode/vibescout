// FILE: hooks/useAnalyze.js
// PURPOSE: Manages the analyze flow — calls POST /analyze/start, then polls
//          GET /analyze/:id/status until 'completed'. Hard cap 60s, 3s poll interval.

'use client';

import { useState, useRef, useCallback } from 'react';
import api from '../lib/api';

export function useAnalyze() {
  const [sessionId, setSessionId] = useState(null);
  const [shadowPropertyId, setShadowPropertyId] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'starting' | 'pending' | 'completed' | 'error'
  const [error, setError] = useState(null);
  const pollRef = useRef(null);
  const startTimeRef = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    (id) => {
      startTimeRef.current = Date.now();

      pollRef.current = setInterval(async () => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= 60_000) {
          stopPolling();
          setStatus('error');
          setError('Analysis timed out. Please try again.');
          return;
        }

        try {
          const { data } = await api.get(`/analyze/${id}/status`);
          if (data.status === 'completed') {
            stopPolling();
            setStatus('completed');
          }
        } catch {
          // Network blip — keep polling until hard cap
        }
      }, 3000);
    },
    [stopPolling]
  );

  const startAnalysis = useCallback(
    async ({ lat, lng, name, placeId }) => {
      setStatus('starting');
      setError(null);

      try {
        const { data } = await api.post('/analyze/start', {
          lat,
          lng,
          name,
          placeId: placeId ?? null,
          confirmed: true,
        });

        setSessionId(data.sessionId);
        setShadowPropertyId(data.shadowPropertyId);
        setStatus('pending');
        pollStatus(data.sessionId);

        return data;
      } catch (err) {
        setStatus('error');
        setError(err?.response?.data?.error ?? 'Failed to start analysis.');
        throw err;
      }
    },
    [pollStatus]
  );

  const reset = useCallback(() => {
    stopPolling();
    setSessionId(null);
    setShadowPropertyId(null);
    setStatus('idle');
    setError(null);
  }, [stopPolling]);

  return {
    sessionId,
    shadowPropertyId,
    status,
    error,
    startAnalysis,
    reset,
  };
}
