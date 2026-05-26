'use client';

import { useRef, useState } from 'react';
import { Mail, MapPin } from 'lucide-react';

const IconX = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const IconGithub = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

const IconLinkedin = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

// ── Text hover SVG effect (no framer-motion — direct DOM for gradient) ──────
function TextHoverEffect({ text }) {
  const svgRef = useRef(null);
  const gradRef = useRef(null);
  const [hovered, setHovered] = useState(false);

  function handleMouseMove(e) {
    if (!svgRef.current || !gradRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = `${((e.clientX - rect.left) / rect.width) * 100}%`;
    const cy = `${((e.clientY - rect.top) / rect.height) * 100}%`;
    gradRef.current.setAttribute('cx', cx);
    gradRef.current.setAttribute('cy', cy);
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
                <stop offset="0%"   stopColor="#E7C58A" />
                <stop offset="30%"  stopColor="#D4A853" />
                <stop offset="55%"  stopColor="#22d3ee" />
                <stop offset="80%"  stopColor="#E7C58A" />
                <stop offset="100%" stopColor="#B4D2AA" />
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
            stroke: 'rgba(231,197,138,0.12)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
          }}
        >{text}</text>

        {/* Draw-on stroke — CSS animation, no framer-motion */}
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          strokeWidth="0.3"
          className="vs-draw-text"
          style={{
            fill: 'transparent',
            stroke: 'rgba(231,197,138,0.35)',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em',
          }}
        >{text}</text>

        {/* Colour reveal on hover */}
        <text
          x="50%" y="50%"
          textAnchor="middle" dominantBaseline="middle"
          stroke="url(#vs-textGradient)"
          strokeWidth="0.3"
          mask="url(#vs-textMask)"
          style={{
            fill: 'transparent',
            fontFamily: 'Outfit, sans-serif',
            fontSize: '56px', fontWeight: 700, letterSpacing: '-0.02em',
          }}
        >{text}</text>
      </svg>
    </>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────
const footerLinks = [
  {
    title: 'Product',
    links: [
      { label: 'Analyze a Property', href: '#' },
      { label: 'How It Works',       href: '#' },
      { label: 'Pricing',            href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',       href: '#' },
      { label: 'Privacy',     href: '#' },
      { label: 'Terms',       href: '#' },
    ],
  },
];

const contactItems = [
  {
    icon: <Mail size={15} />,
    text: 'hello@vibescout.com',
    href: 'mailto:hello@vibescout.com',
  },
  {
    icon: <MapPin size={15} />,
    text: 'India',
  },
];

const socialLinks = [
  { icon: <IconX />,        label: 'X / Twitter', href: '#' },
  { icon: <IconGithub />,   label: 'GitHub',      href: '#' },
  { icon: <IconLinkedin />, label: 'LinkedIn',     href: '#' },
];

export default function Footer() {
  return (
    <footer
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'rgba(5,5,5,0.98)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        marginTop: '80px',
      }}
    >
      {/* Radial bg glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(231,197,138,0.04) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top accent line */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '1px',
          background:
            'linear-gradient(90deg, transparent, rgba(231,197,138,0.25), transparent)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1120px',
          margin: '0 auto',
          padding: '64px 32px 0',
        }}
      >
        {/* ── Main grid ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '48px 32px',
            paddingBottom: '48px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Brand col */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(231,197,138,0.55)',
                  marginBottom: '4px',
                }}
              >
                Vibescout
              </p>
              <p
                style={{
                  fontSize: '13px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.45)',
                  lineHeight: 1.65,
                  maxWidth: '220px',
                }}
              >
                Real intelligence for real estate decisions. Know before you buy or rent.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {contactItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ color: 'rgba(231,197,138,0.5)', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  {item.href ? (
                    <a
                      href={item.href}
                      style={{
                        fontSize: '12px',
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.45)',
                        textDecoration: 'none',
                        transition: 'color 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(231,197,138,0.85)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span style={{ fontSize: '12px', fontWeight: 300, color: 'rgba(255,255,255,0.45)' }}>
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
              <p
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.35)',
                  marginBottom: '18px',
                }}
              >
                {section.title}
              </p>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px', listStyle: 'none', padding: 0, margin: 0 }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      style={{
                        fontSize: '13px',
                        fontWeight: 300,
                        color: 'rgba(255,255,255,0.45)',
                        textDecoration: 'none',
                        transition: 'color 150ms ease',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(231,197,138,0.85)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.45)'}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0 24px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(255,255,255,0.25)' }}>
            © {new Date().getFullYear()} Vibescout. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            {socialLinks.map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                style={{
                  color: 'rgba(255,255,255,0.25)',
                  textDecoration: 'none',
                  transition: 'color 150ms ease',
                  display: 'flex',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(231,197,138,0.75)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
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
          height: '220px',
          marginTop: '-60px',
          marginBottom: '-50px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'auto',
        }}
        className="footer-hover-text"
      >
        <TextHoverEffect text="Vibescout" />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .footer-hover-text { display: none !important; }
        }
      `}</style>
    </footer>
  );
}
