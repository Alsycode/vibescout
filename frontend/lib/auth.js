// FILE: lib/auth.js
// PURPOSE: Server-side helper — decodes vb_token JWT cookie and returns user payload.
//          Used in server components and page.jsx files for conditional auth logic.

import { cookies } from 'next/headers';

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('vb_token')?.value;
  if (!token) return null;
  try {
    const [, payload] = token.split('.');
    // Base64url → base64 → JSON
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const decoded = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
    if (!decoded?.userId) return null;
    return decoded;
  } catch {
    return null;
  }
}
