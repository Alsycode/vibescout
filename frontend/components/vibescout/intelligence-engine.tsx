'use client';

import Image from 'next/image';

const GOLD = '#D4AF37';

export default function IntelligenceEngine() {
  return (
    <section style={{ padding: '120px 48px 0', maxWidth: '1000px', margin: '0 auto' }}>
      <style>{`
        .ie-stage {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 11;
          margin-top: 24px;
        }
        .ie-chip {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 70%;
          max-width: 700px;
          z-index: 2;
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          color: GOLD,
          fontFamily: "'Outfit', sans-serif",
          marginBottom: '12px',
        }}>
          SECTION 5: INTELLIGENCE ENGINE
        </p>
        <h2 style={{
          fontSize: '34px',
          fontWeight: 600,
          color: '#F5F2EA',
          fontFamily: "'Outfit', sans-serif",
          margin: '0 0 12px',
          lineHeight: 1.1,
        }}>
          Intelligence Engine
        </h2>
        <p style={{
          fontSize: '14px',
          fontWeight: 300,
          color: 'rgba(245,242,234,0.5)',
          fontFamily: "'Outfit', sans-serif",
          lineHeight: 1.6,
          maxWidth: '540px',
        }}>
          Data Convergence: Real-time Intelligence Processing. Multiple signals are analyzed
          in parallel to forge a single, deterministic property verdict.
        </p>
      </div>

      {/* Stage */}
      <div className="ie-stage">
        {/* Radial gold glow behind chip */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '70%',
          height: '70%',
          background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.30) 0%, rgba(212,175,55,0.10) 40%, transparent 70%)',
          filter: 'blur(30px)',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        {/* Chip image */}
        <div
          className="ie-chip"
          style={{
            maskImage: 'radial-gradient(ellipse 78% 78% at 50% 50%, #000 55%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 78% 78% at 50% 50%, #000 55%, transparent 100%)',
          }}
        >
          <Image
            src="/chip.png"
            alt="Verdict Engine chip"
            width={760}
            height={520}
            style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
            priority
          />
        </div>
      </div>
    </section>
  );
}
