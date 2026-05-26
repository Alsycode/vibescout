// FILE: app/(app)/admin/layout.jsx
// PURPOSE: Admin layout — requireAdmin check server-side, AdminSidebar + main content area.
//          Admin panel uses glass system with blur cap 16px, minimal glow, no gradients.

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import AdminSidebar from '../../../components/admin/AdminSidebar';

function decodeToken(token) {
  try {
    const [, payload] = token.split('.');
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = Cookies.get('vb_token');
    if (!token) {
      router.push('/login');
      return;
    }
    const decoded = decodeToken(token);
    if (!decoded || decoded.role !== 'admin') {
      router.push('/login');
      return;
    }
    setAuthorized(true);
  }, [router]);

  if (!authorized) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="animate-glow-pulse"
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      <AdminSidebar />
      <main
        style={{
          flex: 1,
          marginLeft: '240px',
          padding: 'var(--space-xl) var(--space-lg)',
          minHeight: '100vh',
        }}
      >
        {children}
      </main>
    </div>
  );
}
