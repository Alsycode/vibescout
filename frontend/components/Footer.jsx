'use client';

import { useRef, useState } from 'react';
import { Mail, MapPin } from 'lucide-react';

// ── Star positions [cx%, cy%, opacity] — matches funnel bg ────────────────────

const STARS = [
  [5, 15, 0.40], [18, 8, 0.55], [32, 22, 0.35], [48, 5, 0.50], [62, 18, 0.40],
  [75, 10, 0.60], [88, 25, 0.35], [10, 55, 0.45], [25, 45, 0.35], [40, 65, 0.50],
  [55, 40, 0.40], [70, 60, 0.55], [85, 45, 0.35], [15, 80, 0.45], [30, 72, 0.30],
  [50, 85, 0.50], [65, 75, 0.40], [80, 88, 0.35], [92, 70, 0.45], [8, 35, 0.35],
  [45, 30, 0.45], [78, 35, 0.40], [95, 15, 0.50], [22, 90, 0.35], [58, 92, 0.40],
];

const IconX = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconGithub = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const IconLinkedin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ── Teal hover text effect ───────────────────────────────────────────────────

function TextHoverEffect({ text }) {
  const svgRef  = useRef(null);
  const gradRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e) {
    if (!svgRef.current || !gradRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    gradRef.current.setAttribute('cx', `${((e.clientX - rect.left) / rect.width) * 100}%`);
    gradRef.current.setAttribute('cy', `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }

  return (
    <>
      <style>{`
        @keyframes vs-draw {
          from { stroke-dashoffset: 1000; }
          to   { stroke-dashoffset: 0; }
        }
        .vs-draw-text {
          stroke-dasharray: 1000;
          stroke-dashoffset: 1000;
          animation: vs-draw 4s ease-in-out forwards;
        }
      `}</style>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 300 100"
        xmlns="http://www.w3.org/2000/svg"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
        style={{ userSelect: 'none', cursor: 'default' }}
      >
        <defs>
          <linearGradient id="vs-textGradient" gradientUnits="userSpaceOnUse">
            {hovered && (
              <>
                <stop offset="0%"   stopColor="#0DD8C0" />
                <stop offset="30%"  stopColor="#06b6d4" />
                <stop offset="55%"  stopColor="#0DD8C0" />
                <stop offset="80%"  stopColor="#067a6f" />
                <stop offset="100%" stopColor="#0DD8C0" />
              </>
            )}
          </linearGradient>
          <radialGradient
            ref={gradRef}
            id="vs-revealMask"
            gradientUnits="userSpaceOnUse"
            cx="50%" cy="50%" r="22%"
          >
            <stop offset="0%"   stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id="vs-textMask">
            <rect x="0" y="0" width="100%" height="100%" fill="url(#vs-revealMask)" />
          </mask>
        </defs>

        {/* Ghost outline */}
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          strokeWidth="0.3"
          style={{
            fill: 'transparent',
            stroke: 'rgba(13,216,192,0.10)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >{text}</text>

        {/* Draw-on stroke */}
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          strokeWidth="0.3"
          className="vs-draw-text"
          style={{
            fill: 'transparent',
            stroke: 'rgba(13,216,192,0.28)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em',
          }}
        >{text}</text>

        {/* Teal colour reveal on hover */}
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          stroke="url(#vs-textGradient)"
          strokeWidth="0.3"
          mask="url(#vs-textMask)"
          style={{
            fill: 'transparent',
            fontFamily: 'Inter, sans-serif',
            fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em',
          }}
        >{text}</text>
      </svg>
    </>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────

const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Analyze a Property', href: '/analyze'       },
      { label: 'How It Works',       href: '/#how-it-works' },
      { label: 'Pricing',            href: '/#pricing'      },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',   href: '#' },
      { label: 'Privacy', href: '#' },
      { label: 'Terms',   href: '#' },
    ],
  },
];

const contactItems = [
  { icon: <Mail size={14} />,   text: 'hello@vibescout.com', href: 'mailto:hello@vibescout.com' },
  { icon: <MapPin size={14} />, text: 'India' },
];

const socialLinks = [
  { icon: <IconX />,        label: 'X / Twitter', href: '#' },
  { icon: <IconGithub />,   label: 'GitHub',      href: '#' },
  { icon: <IconLinkedin />, label: 'LinkedIn',     href: '#' },
];

// ── Footer ─────────────────────────────────────────────────────────────────

export default function Footer() {
  return (
    <footer
      style={{
        position:   'relative',
        overflow:   'hidden',
        background: '#080812',
        borderTop:  '1px solid rgba(255,255,255,0.05)',
        marginTop:  '80px',
      }}
    >
      {/* ── Star field ───────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}
      >
        {/* Ambient teal glow — upper right */}
        <div style={{
          position:     'absolute',
          right:        '8%',
          top:          '5%',
          width:        '45vw',
          height:       '45vw',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(13,216,192,0.045) 0%, transparent 65%)',
          transform:    'translate(15%, -15%)',
        }} />

        {/* Scattered stars */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {STARS.map(([cx, cy, op], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
          ))}
        </svg>

        {/* Teal wave lines — bottom-right, matches funnel */}
        <svg
          style={{
            position:          'absolute',
            right:             '-4%',
            bottom:            '-4%',
            width:             '55%',
            height:            '80%',
            opacity:           0.13,
          }}
          viewBox="0 0 720 580"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="ft-wg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
              <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
              <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
            </linearGradient>
          </defs>
          <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290"  stroke="url(#ft-wg)" strokeWidth="1.6" fill="none" />
          <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335"  stroke="url(#ft-wg)" strokeWidth="1.3" fill="none" opacity="0.85" />
          <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#ft-wg)" strokeWidth="1.0" fill="none" opacity="0.70" />
          <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255"  stroke="url(#ft-wg)" strokeWidth="1.4" fill="none" opacity="0.75" />
          <path d="M-80 475 C120 425 290 505 460 470 C600 435 715 375 860 425" stroke="url(#ft-wg)" strokeWidth="0.8" fill="none" opacity="0.55" />
        </svg>
      </div>

      {/* Teal top accent line — matches funnel's border-right accent */}
      <div
        aria-hidden="true"
        style={{
          position:   'absolute',
          top:        0,
          left:       0,
          right:      0,
          height:     '1px',
          background: 'linear-gradient(90deg, transparent, rgba(13,216,192,0.30), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="footer-inner"
        style={{ position: 'relative', zIndex: 1, maxWidth: '1120px', margin: '0 auto' }}
      >
        {/* ── Main grid ── */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap:                 '48px 32px',
            paddingBottom:       '48px',
            borderBottom:        '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {/* Brand col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              {/* Brand label — funnel sidebar-title style */}
              <p style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '10px',
                fontWeight:    600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color:         '#0DD8C0',
                marginBottom:  '8px',
              }}>
                VibeScout
              </p>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize:   '13px',
                fontWeight: 300,
                color:      'rgba(255,255,255,0.40)',
                lineHeight: 1.65,
                maxWidth:   '220px',
                margin:     0,
              }}>
                Real intelligence for real estate decisions. Know before you buy or rent.
              </p>
            </div>

            {/* Contact items — funnel step meta style */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contactItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Teal icon circle — matches funnel "Need help?" icon */}
                  <div style={{
                    width:          '26px',
                    height:         '26px',
                    borderRadius:   '50%',
                    background:     'rgba(13,216,192,0.08)',
                    border:         '1px solid rgba(13,216,192,0.18)',
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    flexShrink:     0,
                    color:          '#0DD8C0',
                  }}>
                    {item.icon}
                  </div>
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{
                        fontFamily:  "'Inter', sans-serif",
                        fontSize:    '12px',
                        fontWeight:  300,
                        color:       'rgba(255,255,255,0.40)',
                        textDecoration: 'none',
                        transition:  'color 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(13,216,192,0.85)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.40)'}
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.40)' }}>
                      {item.text}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Link cols */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              {/* Section title — funnel sidebar-title style */}
              <p style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '10px',
                fontWeight:    600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color:         'rgba(13,216,192,0.55)',
                marginBottom:  '20px',
                margin:        '0 0 20px',
              }}>
                {section.title}
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                {section.links.map((link) => (
                  <li key={link.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Funnel connector dot */}
                    <span style={{
                      width:        '4px',
                      height:       '4px',
                      borderRadius: '50%',
                      background:   'rgba(13,216,192,0.25)',
                      flexShrink:   0,
                    }} />
                    <a
                      href={link.href}
                      style={{
                        fontFamily:     "'Inter', sans-serif",
                        fontSize:       '13px',
                        fontWeight:     300,
                        color:          'rgba(255,255,255,0.40)',
                        textDecoration: 'none',
                        transition:     'color 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(13,216,192,0.85)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.40)'}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div style={{
          display:         'flex',
          justifyContent:  'space-between',
          alignItems:      'center',
          padding:         '20px 0 24px',
          flexWrap:        'wrap',
          gap:             '16px',
        }}>
          <p style={{
            fontFamily: "'Geist Mono', monospace",
            fontSize:   '10px',
            fontWeight: 400,
            color:      'rgba(255,255,255,0.20)',
            letterSpacing: '0.04em',
            margin:     0,
          }}>
            © 2026 VibeScout · All rights reserved
          </p>

          {/* Social icons — funnel step completed circle style */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                style={{
                  width:          '32px',
                  height:         '32px',
                  borderRadius:   '50%',
                  background:     'rgba(13,216,192,0.05)',
                  border:         '1px solid rgba(13,216,192,0.14)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  color:          'rgba(255,255,255,0.30)',
                  textDecoration: 'none',
                  transition:     'all 150ms ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color       = '#0DD8C0';
                  e.currentTarget.style.background  = 'rgba(13,216,192,0.10)';
                  e.currentTarget.style.borderColor = 'rgba(13,216,192,0.30)';
                  e.currentTarget.style.boxShadow   = '0 0 12px rgba(13,216,192,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color       = 'rgba(255,255,255,0.30)';
                  e.currentTarget.style.background  = 'rgba(13,216,192,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(13,216,192,0.14)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
              >
                {icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Large hover text — desktop only ── */}
      <div
        style={{
          height:         '220px',
          marginTop:      '-60px',
          marginBottom:   '-50px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          pointerEvents:  'auto',
        }}
        className="footer-hover-text"
      >
        <TextHoverEffect text="VibeScout" />
      </div>

      <style>{`
        .footer-inner {
          padding: 56px clamp(24px, 5vw, 80px) 0;
        }
        @media (max-width: 768px) {
          .footer-hover-text { display: none !important; }
        }
      `}</style>
    </footer>
  );
}
