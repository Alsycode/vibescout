'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, Building2, Users, UserCheck,
  Network, Gavel, History, Settings, HelpCircle,
  BookOpen, TrendingUp, BarChart2, ChevronRight,
} from 'lucide-react';

const TEAL      = '#0DD8C0';
const TEAL_BG   = 'rgba(13,216,192,0.08)';
const TEAL_BDR  = 'rgba(13,216,192,0.35)';

const NAV_SECTIONS = [
  {
    label: 'Core',
    items: [
      { label: 'Overview',           href: '/admin',                  icon: LayoutDashboard, exact: true },
      { label: 'Audited Properties', href: '/admin/shadow-properties', icon: Building2 },
      { label: 'Leads',              href: '/admin/leads',             icon: Users, hasSubnav: true },
      // { label: 'Brokers',            href: '/admin/brokers',           icon: UserCheck },
      // { label: 'Clusters',           href: '/admin/clusters',          icon: Network },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog',               href: '/admin/blog',              icon: BookOpen },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { label: 'Funnel Analytics',   href: '/admin/funnel-analytics',  icon: TrendingUp },
      { label: 'Conversion',         href: '/admin/conversion',        icon: BarChart2 },
    ],
  },
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
  const pathname     = usePathname();
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
    padding: '8px 20px',
    fontSize: '13px',
    fontWeight: active ? 500 : 400,
    color: active ? TEAL : 'rgba(255,255,255,0.45)',
    textDecoration: 'none',
    borderLeft: `2px solid ${active ? TEAL : 'transparent'}`,
    background: active ? TEAL_BG : 'transparent',
    transition: 'all 0.12s ease',
    cursor: 'pointer',
    borderRadius: '0 6px 6px 0',
    marginRight: '8px',
  });

  const hoverNavLink = (active) => ({
    ...navLink(active),
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
        background:           '#0C0C18',
        borderRight:          '1px solid rgba(255,255,255,0.06)',
        display:              'flex',
        flexDirection:        'column',
        zIndex:               40,
        overflowY:            'auto',
        overflowX:            'hidden',
      }}
    >

      {/* ── Logo ─────────────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 16px' }}>
        <Link href="/admin" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '9px',
            background: 'rgba(13,216,192,0.10)',
            border: `1px solid ${TEAL_BDR}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L13 4.5V9.5L7 13L1 9.5V4.5L7 1Z"
                stroke={TEAL} strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M7 5L9.5 6.5V9.5L7 11L4.5 9.5V6.5L7 5Z"
                fill={TEAL} fillOpacity="0.30" stroke={TEAL} strokeWidth="0.75" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.90)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              VibeScout
            </p>
            <p style={{ fontSize: '10px', fontWeight: 500, color: TEAL, opacity: 0.6, marginTop: '3px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Admin
            </p>
          </div>
        </Link>
      </div>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 0 8px' }} />

      {/* ── Sectioned nav ────────────────────────────────────── */}
      <nav style={{ flex: 1 }}>
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label}>
            {si > 0 && (
              <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '10px 16px' }} />
            )}
            <span className="admin-section-label">{section.label}</span>

            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {section.items.map((item) => {
                const active  = isActive(item.href, item.exact);
                const Icon    = item.icon;

                return (
                  <li key={item.href}>
                    <Link href={item.href} style={navLink(active)}>
                      <Icon
                        size={14}
                        strokeWidth={active ? 2 : 1.75}
                        color={active ? TEAL : 'rgba(255,255,255,0.35)'}
                        style={{ flexShrink: 0 }}
                      />
                      <span style={{ flex: 1 }}>{item.label}</span>
                    </Link>

                    {/* Lead subnav */}
                    {item.hasSubnav && (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {LEAD_SUBNAV.map((sub) => {
                          const subActive = isLeadSubnavActive(sub.href);
                          return (
                            <li key={sub.href}>
                              <Link href={sub.href} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '5px 20px 5px 46px',
                                fontSize: '12px',
                                fontWeight: subActive ? 500 : 300,
                                color: subActive ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.30)',
                                textDecoration: 'none',
                                transition: 'color 0.12s ease',
                              }}>
                                <span style={{
                                  width: '5px', height: '5px', borderRadius: '50%',
                                  background: sub.dot,
                                  opacity: subActive ? 1 : 0.5,
                                  flexShrink: 0,
                                  transition: 'opacity 0.12s ease',
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
          </div>
        ))}

        {/* ── Phase 2 items ──────────────────────────────────── */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '10px 16px' }} />
        <span className="admin-section-label">Coming Soon</span>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {PHASE2_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.label}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 20px',
                  opacity: 0.30,
                  cursor: 'not-allowed',
                  userSelect: 'none',
                  marginRight: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={14} strokeWidth={1.75} color="rgba(255,255,255,0.5)" />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{item.label}</span>
                  </div>
                  <span style={{
                    fontSize: '9px', fontWeight: 600, padding: '2px 7px',
                    borderRadius: '20px',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.35)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}>
                    P2
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ── Bottom section ───────────────────────────────────── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '8px 0' }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon   = item.icon;
          return (
            <Link key={item.label} href={item.href} style={navLink(active)}>
              <Icon size={14} strokeWidth={1.75}
                color={active ? TEAL : 'rgba(255,255,255,0.32)'}
                style={{ flexShrink: 0 }}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* ── User profile card ────────────────────────────────── */}
      <div style={{
        margin: '8px 12px 14px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '10px',
        padding: '11px 13px',
        display: 'flex', alignItems: 'center', gap: '10px',
        cursor: 'pointer',
        transition: 'background 150ms ease, border-color 150ms ease',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: 'rgba(13,216,192,0.15)',
          border: `1.5px solid ${TEAL_BDR}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: TEAL, lineHeight: 1 }}>A</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.82)', lineHeight: 1, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Admin User
          </p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', lineHeight: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            admin@vibescout.com
          </p>
        </div>
        <ChevronRight size={12} color="rgba(255,255,255,0.25)" style={{ flexShrink: 0 }} />
      </div>
    </aside>
  );
}
