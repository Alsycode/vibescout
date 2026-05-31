// FILE: src/lib/fetchWithTimeout.js
// PURPOSE: Shared fetch-with-timeout utility — replaces 5 duplicate copies across services (FAIL-01)

import fetch from 'node-fetch';

export async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}
