// FILE: components/AuthGuard.jsx
// PURPOSE: Client-side auth guard — verifies session via GET /auth/me (works with httpOnly cookies),
//          redirects to /login on 401. Skips auth check on /login and /register to prevent loops.

'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '../lib/api';

const PUBLIC_PATHS = ['/login', '/register'];

export default function AuthGuard({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  useEffect(() => {
    if (isPublic) {
      setChecked(true);
      return;
    }
    api.get('/auth/me')
      .then(() => setChecked(true))
      .catch(() => router.replace('/login'));
  }, [pathname, isPublic, router]);

  if (!checked && !isPublic) {
    // Brief invisible hold while auth check runs — no spinner per Section 2.5 §16
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
        }}
      />
    );
  }

  return children;
}
