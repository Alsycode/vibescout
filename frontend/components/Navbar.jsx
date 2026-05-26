// FILE: components/Navbar.jsx
// PURPOSE: Global navigation bar — glass surface, blur(24px), border-bottom only.
//          Uses Section 2.5 tokens throughout. No opaque backgrounds.

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Navbar() {
  const pathname = usePathname();

  function handleLogout() {
    Cookies.remove('vb_token');
    window.location.href = '/login';
  }

  const isAdmin = false; // populated from token if needed by individual pages

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.028)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 var(--space-lg)',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            color: 'var(--color-accent)',
            fontWeight: 500,
            fontSize: '15px',
            letterSpacing: '0.04em',
            textDecoration: 'none',
            transition: 'color var(--duration-fast) ease',
          }}
        >
          Vibescout
        </Link>

        {/* Navigation links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
          {/* <NavLink href="/analyze" current={pathname} label="Analyze" />
          <NavLink href="/funnel" current={pathname} label="Funnel" /> */}
 <NavLink href="#" current={pathname} label="Analyze" />
          <NavLink href="#" current={pathname} label="Funnel" />
        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, current, label }) {
  const isActive = current?.startsWith(href);
  return (
    <Link
      href={href}
      style={{
        color: isActive
          ? 'var(--color-accent-90)'
          : 'var(--color-text-secondary)',
        fontSize: '13px',
        fontWeight: 400,
        textDecoration: 'none',
        letterSpacing: '0.02em',
        transition: 'color var(--duration-fast) ease',
      }}
    >
      {label}
    </Link>
  );
}
