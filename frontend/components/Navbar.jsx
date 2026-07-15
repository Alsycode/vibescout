// FILE: components/Navbar.jsx
// PURPOSE: Global navigation — intelligence-section aesthetic.
//          Geist Mono labels · teal status dot · amber badge CTA · ◆ active marker.

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ShinyButton } from '@/components/ui/shiny-button';
import Cookies from 'js-cookie';

const NAV_LINKS = [
  { href: '/#how-it-works', label: 'HOW IT WORKS'  },
  { href: '/#sample',       label: 'SAMPLE REPORT' },
  { href: '/#pricing',      label: 'PRICING'        },
  { href: '/blog',          label: 'BLOG'           },
];

export default function Navbar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const [open, setOpen]         = useState(false);
  const [atTop, setAtTop]       = useState(true);
  const [authed, setAuthed]     = useState(false);
  const [initial, setInitial]   = useState('U');
  const [dropOpen, setDropOpen] = useState(false);
  const drawerRef = useRef(null);
  const btnRef    = useRef(null);
  const dropRef   = useRef(null);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    Cookies.remove('vb_token');
    setAuthed(false);
    setOpen(false);
    setDropOpen(false);
    router.push('/');
  }

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY < 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(async (r) => {
        if (r.ok) {
          setAuthed(true);
          const data = await r.json();
          const letter = data?.user?.name?.[0] ?? data?.user?.email?.[0] ?? 'U';
          setInitial(letter.toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => { setOpen(false); setDropOpen(false); }, [pathname]);

  // drawer click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (btnRef.current && btnRef.current.contains(e.target)) return;
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  // dropdown click-outside
  useEffect(() => {
    if (!dropOpen) return;
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <nav
        style={{
          position:             'fixed',
          top:                  0,
          left:                 0,
          right:                0,
          zIndex:               100,
          height:               '60px',
          background:           atTop ? 'transparent' : 'rgba(12,12,24,0.94)',
          backdropFilter:       atTop ? 'none' : 'blur(18px)',
          WebkitBackdropFilter: atTop ? 'none' : 'blur(18px)',
          borderBottom:         atTop ? '1px solid transparent' : '1px solid rgba(232,160,48,0.10)',
          transition:           'background 300ms ease, border-color 300ms ease',
        }}
      >
        <div
          aria-hidden
          style={{
            position:       'absolute',
            bottom:         0,
            left:           0,
            right:          0,
            height:         '1px',
            background:     'linear-gradient(90deg, transparent 0%, rgba(232,160,48,0.35) 40%, rgba(232,160,48,0.35) 60%, transparent 100%)',
            opacity:        atTop ? 0 : 1,
            transition:     'opacity 300ms ease',
            pointerEvents:  'none',
          }}
        />

        <div className="nav-inner">
          {/* ── Logo ─────────────────────────────────────────── */}
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <span
              aria-hidden
              style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   '#22D3EE',
                boxShadow:    '0 0 7px rgba(34,211,238,0.9), 0 0 18px rgba(34,211,238,0.35)',
                flexShrink:   0,
                display:      'inline-block',
              }}
            />
            <span
              style={{
                fontFamily:    "'Geist Mono', monospace",
                fontSize:      '13px',
                fontWeight:    500,
                letterSpacing: '0.10em',
                color:         'rgba(255,255,255,0.92)',
              }}
            >
              VIBESCOUT
            </span>
          </Link>

          {/* ── Desktop nav ───────────────────────────────────── */}
          <div className="nav-links">
            {NAV_LINKS.map(({ href, label }) => (
              <NavLink key={href} href={href} label={label} pathname={pathname} />
            ))}

            {/* User avatar dropdown */}
            {authed && (
              <div ref={dropRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropOpen(v => !v)}
                  aria-label="Account menu"
                  style={{
                    width:        32,
                    height:       32,
                    borderRadius: '50%',
                    background:   dropOpen ? 'rgba(13,216,192,0.18)' : 'rgba(13,216,192,0.10)',
                    border:       `1px solid ${dropOpen ? 'rgba(13,216,192,0.45)' : 'rgba(13,216,192,0.25)'}`,
                    cursor:       'pointer',
                    display:      'flex',
                    alignItems:   'center',
                    justifyContent: 'center',
                    fontFamily:   "'Geist Mono', monospace",
                    fontSize:     '11px',
                    fontWeight:   700,
                    color:        '#0DD8C0',
                    transition:   'all 150ms ease',
                    flexShrink:   0,
                  }}
                  onMouseEnter={(e) => {
                    if (!dropOpen) {
                      e.currentTarget.style.background = 'rgba(13,216,192,0.16)';
                      e.currentTarget.style.borderColor = 'rgba(13,216,192,0.40)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!dropOpen) {
                      e.currentTarget.style.background = 'rgba(13,216,192,0.10)';
                      e.currentTarget.style.borderColor = 'rgba(13,216,192,0.25)';
                    }
                  }}
                >
                  {initial}
                </button>

                {dropOpen && (
                  <div style={{
                    position:     'absolute',
                    top:          'calc(100% + 10px)',
                    right:        0,
                    minWidth:     160,
                    background:   'rgba(10,10,22,0.97)',
                    border:       '1px solid rgba(255,255,255,0.09)',
                    borderRadius: 10,
                    backdropFilter: 'blur(20px)',
                    boxShadow:    '0 12px 40px rgba(0,0,0,0.55)',
                    overflow:     'hidden',
                    zIndex:       200,
                  }}>
                    {/* top teal accent */}
                    <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(13,216,192,0.5), transparent)' }} />

                    <DropItem href="/my-reports" label="MY REPORTS" icon={
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                    } onClick={() => setDropOpen(false)} />

                    <DropItem href="/profile" label="PROFILE" icon={
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    } onClick={() => setDropOpen(false)} />

                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '2px 0' }} />

                    <button
                      onClick={handleLogout}
                      style={{
                        width:         '100%',
                        display:       'flex',
                        alignItems:    'center',
                        gap:           8,
                        padding:       '10px 14px',
                        background:    'none',
                        border:        'none',
                        cursor:        'pointer',
                        fontFamily:    "'Geist Mono', monospace",
                        fontSize:      '9px',
                        fontWeight:    500,
                        letterSpacing: '0.12em',
                        color:         'rgba(255,80,80,0.65)',
                        transition:    'all 150ms ease',
                        textAlign:     'left',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,80,80,0.06)'; e.currentTarget.style.color = 'rgba(255,80,80,0.90)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,80,80,0.65)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      LOGOUT
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <ShinyButton href="/analyze" className="shiny-cta-nav">
              ◆ RUN INTELLIGENCE
            </ShinyButton>
          </div>

          {/* ── Mobile hamburger ─────────────────────────────── */}
          <button
            ref={btnRef}
            className="nav-hamburger-btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            style={{
              border: '1px solid rgba(34,211,238,0.22)',
              color:  'rgba(34,211,238,0.80)',
            }}
          >
            {open ? (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="2.5" y1="2.5" x2="12.5" y2="12.5"/>
                <line x1="12.5" y1="2.5" x2="2.5" y2="12.5"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="1.5" y1="4"   x2="13.5" y2="4"/>
                <line x1="1.5" y1="7.5" x2="13.5" y2="7.5"/>
                <line x1="1.5" y1="11"  x2="13.5" y2="11"/>
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────── */}
      <div ref={drawerRef} className={`nav-mobile-drawer${open ? ' is-open' : ''}`}>
        <div
          aria-hidden
          style={{
            position:   'absolute',
            top:        0,
            left:       0,
            right:      0,
            height:     '1px',
            background: 'linear-gradient(90deg, transparent, rgba(232,160,48,0.5), transparent)',
          }}
        />

        {/* Status row */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           '6px',
          padding:       '14px 8px 10px',
          borderBottom:  '1px solid rgba(255,255,255,0.04)',
          marginBottom:  '4px',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', display: 'inline-block', flexShrink: 0,
            background: '#34D399', boxShadow: '0 0 6px rgba(52,211,153,0.8)',
          }} />
          <span style={{
            fontFamily:    "'Geist Mono', monospace",
            fontSize:      '8px',
            fontWeight:    500,
            letterSpacing: '0.14em',
            color:         'rgba(52,211,153,0.55)',
          }}>
            SYSTEMS ACTIVE
          </span>
        </div>

        {NAV_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="nav-mobile-link"
            onClick={() => setOpen(false)}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', color: 'inherit' }}>
              {label}
            </span>
          </Link>
        ))}

        {authed && (
          <Link href="/my-reports" className="nav-mobile-link" onClick={() => setOpen(false)}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', color: 'inherit' }}>
              MY REPORTS
            </span>
          </Link>
        )}

        {authed && (
          <Link href="/profile" className="nav-mobile-link" onClick={() => setOpen(false)}>
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', color: 'inherit' }}>
              PROFILE
            </span>
          </Link>
        )}

        {authed && (
          <button
            onClick={handleLogout}
            className="nav-mobile-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          >
            <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: '10px', fontWeight: 500, letterSpacing: '0.14em', color: 'rgba(255,80,80,0.70)' }}>
              LOGOUT
            </span>
          </button>
        )}

        <div className="nav-mobile-cta">
          <ShinyButton href="/analyze">
            ◆ RUN INTELLIGENCE
          </ShinyButton>
        </div>
      </div>
    </>
  );
}

function NavLink({ href, label, pathname }) {
  const isActive = pathname === href || (href !== '/' && pathname?.startsWith(href));

  return (
    <Link
      href={href}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        gap:            '5px',
        textDecoration: 'none',
        fontFamily:     "'Geist Mono', monospace",
        fontSize:       '9.5px',
        fontWeight:     500,
        letterSpacing:  '0.12em',
        color:          isActive ? '#E8A030' : 'rgba(255,255,255,0.38)',
        transition:     'color 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.82)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = isActive ? '#E8A030' : 'rgba(255,255,255,0.38)'; }}
    >
      {isActive && (
        <span style={{ fontSize: '6px', color: '#E8A030', flexShrink: 0, lineHeight: 1 }}>◆</span>
      )}
      {label}
    </Link>
  );
}

function DropItem({ href, label, icon, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            8,
        padding:        '10px 14px',
        textDecoration: 'none',
        fontFamily:     "'Geist Mono', monospace",
        fontSize:       '9px',
        fontWeight:     500,
        letterSpacing:  '0.12em',
        color:          'rgba(255,255,255,0.50)',
        transition:     'all 150ms ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.88)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.50)'; }}
    >
      {icon}
      {label}
    </Link>
  );
}
