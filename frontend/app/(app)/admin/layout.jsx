'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '../../../components/admin/AdminSidebar';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(({ user }) => {
        if (user?.role === 'admin') {
          setAuthorized(true);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  if (!authorized) {
    return (
      <div
        className="teal-layout"
        style={{
          minHeight: '100vh',
          background: 'var(--color-bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '14px',
        }}
      >
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          border: '2px solid rgba(13,216,192,0.10)',
          borderTopColor: '#0DD8C0',
          animation: 'adminSpin 0.75s linear infinite',
        }} />
        <p style={{
          fontSize: '11px',
          color: 'rgba(255,255,255,0.20)',
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Authenticating
        </p>
      </div>
    );
  }

  return (
    <div
      className="teal-layout"
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--color-bg)',
      }}
    >
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar */}
        <div className="admin-mobile-topbar">
          <button
            className="admin-menu-btn"
            aria-label="Open sidebar"
            onClick={() => setSidebarOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
              <line x1="2" y1="4" x2="14" y2="4" />
              <line x1="2" y1="8" x2="14" y2="8" />
              <line x1="2" y1="12" x2="14" y2="12" />
            </svg>
          </button>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.45)', letterSpacing: '-0.01em' }}>
            VibeScout{' '}
            <span style={{ color: '#0DD8C0', opacity: 0.85 }}>Admin</span>
          </span>
        </div>

        <main className="admin-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
