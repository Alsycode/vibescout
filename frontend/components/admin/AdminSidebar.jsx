// FILE: components/admin/AdminSidebar.jsx
// PURPOSE: Admin sidebar navigation — glass-card surface, gold accent on active nav item.
//          Phase 2 items (Auction Market, Bid History): opacity-40, cursor-not-allowed, no Link — div only.
//          blur cap 16px per Section 2.5 admin rules.

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Overview', href: '/admin', exact: true },
  { label: 'Audited Properties', href: '/admin/shadow-properties' },
  { label: 'Leads', href: '/admin/leads' },
  { label: 'Brokers', href: '/admin/brokers' },
  { label: 'Clusters', href: '/admin/clusters' },
];

const LEAD_SUBNAV = [
  { label: 'Hot', href: '/admin/leads?tier=hot' },
  { label: 'Warm', href: '/admin/leads?tier=warm' },
];

const PHASE2_ITEMS = [
  { label: 'Auction Market' },
  { label: 'Bid History' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function isActive(href, exact) {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  }

  function isLeadSubnavActive(href) {
    const url = new URL(href, 'http://x');
    const tier = url.searchParams.get('tier');
    return pathname === '/admin/leads' && searchParams.get('tier') === tier;
  }

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '240px',
        height: '100vh',
        background: 'rgba(255, 255, 255, 0.028)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-lg) 0',
        zIndex: 40,
        overflowY: 'auto',
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
        <Link
          href="/admin"
          style={{
            color: 'var(--color-accent)',
            fontWeight: 500,
            fontSize: '15px',
            letterSpacing: '0.04em',
            textDecoration: 'none',
          }}
        >
          Vibescout
        </Link>
        <p
          style={{
            fontSize: '11px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            marginTop: '2px',
            letterSpacing: '0.04em',
          }}
        >
          Admin Panel
        </p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            const isLeads = item.href === '/admin/leads';

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '10px var(--space-lg)',
                    fontSize: '13px',
                    fontWeight: active ? 500 : 400,
                    color: active ? 'var(--color-accent-90)' : 'var(--color-text-secondary)',
                    textDecoration: 'none',
                    borderLeft: active
                      ? '2px solid var(--color-accent)'
                      : '2px solid transparent',
                    background: active ? 'var(--color-accent-08)' : 'transparent',
                    transition: 'all var(--duration-fast) ease',
                  }}
                >
                  {item.label}
                </Link>

                {/* Lead subnav */}
                {isLeads && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {LEAD_SUBNAV.map((sub) => {
                      const subActive = isLeadSubnavActive(sub.href);
                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            style={{
                              display: 'block',
                              padding: '6px var(--space-lg)',
                              paddingLeft: '36px',
                              fontSize: '12px',
                              fontWeight: subActive ? 500 : 300,
                              color: subActive ? 'var(--color-accent-70)' : 'var(--color-text-muted)',
                              textDecoration: 'none',
                              transition: 'color var(--duration-fast) ease',
                            }}
                          >
                            {sub.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255,255,255,0.05)',
            margin: 'var(--space-md) var(--space-lg)',
          }}
        />

        {/* Phase 2 disabled items */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {PHASE2_ITEMS.map((item) => (
            <li key={item.label}>
              <div
                style={{
                  display: 'block',
                  padding: '10px var(--space-lg)',
                  fontSize: '13px',
                  fontWeight: 300,
                  color: 'var(--color-text-secondary)',
                  opacity: 0.4,
                  cursor: 'not-allowed',
                  userSelect: 'none',
                }}
              >
                {item.label}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 300,
                    marginLeft: '6px',
                    color: 'var(--color-text-muted)',
                    opacity: 0.7,
                  }}
                >
                  Phase 2
                </span>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom section */}
      <div
        style={{
          padding: 'var(--space-md) var(--space-lg)',
          borderTop: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: '12px',
            fontWeight: 300,
            color: 'var(--color-text-muted)',
            textDecoration: 'none',
            transition: 'color var(--duration-fast) ease',
          }}
        >
          &larr; Back to site
        </Link>
      </div>
    </aside>
  );
}
