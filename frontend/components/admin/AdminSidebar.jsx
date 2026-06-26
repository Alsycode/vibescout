// FILE: components/admin/AdminSidebar.jsx
// PURPOSE: Admin sidebar — redesigned to match reference: icons, Settings/Help, user profile card.

'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, UserCheck,
  Network, Gavel, History, Settings, HelpCircle,
  ChevronDown, BookOpen,
} from 'lucide-react';

const TEAL = '#13DEB9';

const NAV_ITEMS = [
  { label: 'Overview',           href: '/admin',                  icon: LayoutDashboard, exact: true },
  { label: 'Audited Properties', href: '/admin/shadow-properties', icon: Building2 },
  { label: 'Leads',              href: '/admin/leads',             icon: Users },
  { label: 'Brokers',            href: '/admin/brokers',           icon: UserCheck },
  { label: 'Clusters',           href: '/admin/clusters',          icon: Network },
  { label: 'Blog',               href: '/admin/blog',              icon: BookOpen },
];

const LEAD_SUBNAV = [
  { label: 'Hot',  href: '/admin/leads?tier=hot',  dot: '#E63946' },
  { label: 'Warm', href: '/admin/leads?tier=warm', dot: '#F59E0B' },
];

const PHASE2_ITEMS = [
  { label: 'Auction Market', icon: Gavel },
  { label: 'Bid History',    icon: History },
];

const BOTTOM_ITEMS = [
  { label: 'Settings',      href: '/admin/settings',  icon: Settings },
  { label: 'Help & Support', href: '/admin/help',     icon: HelpCircle },
];

export default function AdminSidebar({ isOpen = false, onClose }) {
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  function isActive(href, exact) {
    if (exact) return pathname === href;
    return pathname?.startsWith(href);
  }

  function isLeadSubnavActive(href) {
    const url  = new URL(href, 'http://x');
    const tier = url.searchParams.get('tier');
    return pathname === '/admin/leads' && searchParams.get('tier') === tier;
  }

  const navLink = (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '9px 20px',
    fontSize: '13px',
    fontWeight: active ? 500 : 400,
    color: active ? TEAL : 'rgba(255,255,255,0.5)',
    textDecoration: 'none',
    borderLeft: `2px solid ${active ? TEAL : 'transparent'}`,
    background: active ? `${TEAL}0E` : 'transparent',
    transition: 'all 0.15s ease',
    cursor: 'pointer',
  });

  return (
    <aside
      className={`admin-sidebar-el${isOpen ? ' sidebar-open' : ''}`}
      style={{
        position:             'fixed',
        top:                  0,
        left:                 0,
        width:                '240px',
        height:               '100vh',
        background:           'rgba(12, 12, 24, 0.97)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight:          '1px solid rgba(255,255,255,0.06)',
        display:              'flex',
        flexDirection:        'column',
        zIndex:               40,
        overflowY:            'auto',
      }}
    >

      {/* ── Logo ─────────────────────────────────────── */}
      <div style={{ padding: '24px 20px 20px' }}>
        <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '8px',
            background: `${TEAL}20`, border: `1px solid ${TEAL}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                stroke={TEAL} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 5L9.5 6.5V9.5L7 11L4.5 9.5V6.5L7 5Z"
                fill={TEAL} fillOpacity="0.35" stroke={TEAL} strokeWidth="0.75" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)', lineHeight: 1, letterSpacing: '-0.01em' }}>
              VibeScout
            </p>
            <p style={{ fontSize: '10px', fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginTop: '3px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Admin Panel
            </p>
          </div>
        </Link>
      </div>

      {/* ── Main nav ─────────────────────────────────── */}
      <nav style={{ flex: 1, paddingTop: '4px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {NAV_ITEMS.map((item) => {
            const active   = isActive(item.href, item.exact);
            const Icon     = item.icon;
            const isLeads  = item.href === '/admin/leads';

            return (
              <li key={item.href}>
                <Link href={item.href} style={navLink(active)}>
                  <Icon size={15} strokeWidth={active ? 2 : 1.75}
                    color={active ? TEAL : 'rgba(255,255,255,0.38)'}
                    style={{ flexShrink: 0 }}
                  />
                  {item.label}
                </Link>

                {/* Lead subnav */}
                {isLeads && (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {LEAD_SUBNAV.map((sub) => {
                      const subActive = isLeadSubnavActive(sub.href);
                      return (
                        <li key={sub.href}>
                          <Link href={sub.href} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 20px 6px 47px',
                            fontSize: '12px',
                            fontWeight: subActive ? 500 : 300,
                            color: subActive ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)',
                            textDecoration: 'none',
                            transition: 'color 0.15s ease',
                          }}>
                            <span style={{
                              width: '6px', height: '6px', borderRadius: '50%',
                              background: sub.dot,
                              opacity: subActive ? 1 : 0.45,
                              flexShrink: 0,
                              transition: 'opacity 0.15s ease',
                            }} />
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

        {/* ── Divider ──────────────────────────────── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '12px 16px' }} />

        {/* ── Phase 2 items ────────────────────────── */}
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {PHASE2_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 20px',
                  opacity: 0.35, cursor: 'not-allowed', userSelect: 'none',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={15} strokeWidth={1.75} color="rgba(255,255,255,0.5)" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 500, padding: '2px 7px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.08)',
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.03em',
                  }}>
                    Phase 2
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom section ───────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', paddingBottom: '8px' }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;
          return (
            <Link key={item.label} href={item.href} style={navLink(active)}>
              <Icon size={15} strokeWidth={1.75}
                color={active ? TEAL : 'rgba(255,255,255,0.38)'}
                style={{ flexShrink: 0 }}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ── User profile card ────────────────────────── */}
      <div style={{
        margin: '8px 12px 16px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: '10px',
        cursor: 'pointer',
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '50%',
          background: `${TEAL}25`, border: `1.5px solid ${TEAL}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: TEAL, lineHeight: 1 }}>A</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Admin User
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            admin@vibescout.com
          </p>
        </div>
        <ChevronDown size={13} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
      </div>
    </aside>
  );
}
