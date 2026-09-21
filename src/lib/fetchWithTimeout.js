// FILE: src/lib/fetchWithTimeout.js
// PURPOSE: Shared fetch-with-timeout utility — replaces duplicate copies across services (FAIL-01).
//          Also records every outbound third-party call for the admin API-usage dashboard, and
//          (PERF-7) runs every call through providerGuard's per-provider concurrency cap +
//          circuit breaker + daily spend cap.

import fetch from 'node-fetch';
import { recordApiCall, providerFromUrl } from '../services/apiUsage.service.js';
import { guardedCall } from './providerGuard.js';

export async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const provider = providerFromUrl(url);

  const doFetch = async () => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      recordApiCall(url, { ok: res.ok });
      // 429/5xx are provider-health signals, not just "this one request failed" —
      // throw so the circuit breaker sees them, without changing the Response
      // contract callers rely on (`if (!res.ok) ...`): caught below and handed back.
      if (res.status === 429 || res.status >= 500) {
        const err = new Error(`${provider} responded ${res.status}`);
        err.response = res;
        throw err;
      }
      return res;
    } catch (err) {
      clearTimeout(id);
      if (!err.response) recordApiCall(url, { ok: false });
      throw err;
    }
  };

  try {
    return await guardedCall(provider, doFetch);
  } catch (err) {
    if (err.response) return err.response;
    throw err;
  }
}
