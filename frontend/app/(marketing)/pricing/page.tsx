export const metadata = {
  title: 'Pricing — VibeScout',
  description: 'One report, one price. ₹199 for full property intelligence — no subscription, no hidden fees.',
};

const INCLUDED = [
  'Air Quality Index (AQI) signal',
  'Acoustic profile & noise estimate',
  'Solar exposure & panel viability',
  'Commute time (real Google Directions data)',
  'Amenity proximity (schools, hospitals, parks, gyms)',
  'Vastu & facing direction verdict',
  'Community character match',
  'Budget & affordability analysis',
  'Local news intelligence',
  'Shareable report link',
  'Verdict explanation — why this score',
  'Interactive property map',
];

const NOT_INCLUDED = [
  'Ongoing price tracking',
  'Multiple property comparison (coming soon)',
  'Broker consultation',
];

const FAQ = [
  {
    q: 'Do I need to pay before I see anything?',
    a: 'No. You run your analysis, see the signal summary and verdict, then unlock the full report for ₹199. You only pay if you want the deep-dive.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. Each report is a one-time ₹199 payment. Run 3 reports, pay ₹597 total. No recurring charges ever.',
  },
  {
    q: "What if I'm not satisfied?",
    a: "Contact us within 24 hours of unlock and we'll issue a full refund — no questions asked.",
  },
  {
    q: 'Is my payment secure?',
    a: 'Yes. Payments are processed by Razorpay, a PCI-DSS compliant payment gateway. VibeScout never stores your card details.',
  },
  {
    q: 'How long is my report valid?',
    a: 'Reports are cached for 7 days. After that, live signals (AQI, noise, amenities) are re-fetched when you re-run. Your unlock is permanent — you can always view the report.',
  },
  {
    q: 'Can I share my report?',
    a: 'Yes. Every unlocked report has a shareable link. Recipients can read the full report without needing an account or paying.',
  },
];

const STARS: [number, number, number][] = [
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45],
  [60, 40, 0.35], [95, 45, 0.60], [77, 52, 0.45], [67, 62, 0.40], [86, 67, 0.55],
  [72, 74, 0.45], [90, 77, 0.35], [63, 27, 0.50], [97, 13, 0.40], [75, 37, 0.45],
  [55, 70, 0.55], [80, 84, 0.45], [92, 88, 0.35], [68, 87, 0.65], [58, 54, 0.40],
  [87, 57, 0.45], [76, 71, 0.35], [93, 31, 0.55], [61, 47, 0.45], [84, 19, 0.40],
  [70, 3, 0.60], [96, 61, 0.45], [59, 81, 0.55], [86, 44, 0.35], [74, 91, 0.45],
];

function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
      <div style={{ position: 'absolute', right: '8%', top: '5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,192,0.048) 0%, transparent 65%)', transform: 'translate(15%, -15%)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>
      <svg style={{ position: 'absolute', right: '-4%', bottom: '-4%', width: '60%', height: '72%', opacity: 0.13 }} viewBox="0 0 720 580" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wg-p" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290" stroke="url(#wg-p)" strokeWidth="1.6" fill="none" />
        <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335" stroke="url(#wg-p)" strokeWidth="1.3" fill="none" opacity="0.85" />
        <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#wg-p)" strokeWidth="1.0" fill="none" opacity="0.70" />
        <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255" stroke="url(#wg-p)" strokeWidth="1.4" fill="none" opacity="0.75" />
        <path d="M-80 475 C120 425 290 505 460 470 C600 435 715 375 860 425" stroke="url(#wg-p)" strokeWidth="0.8" fill="none" opacity="0.55" />
      </svg>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080812', color: '#fff', paddingTop: '80px', position: 'relative' }}>
      <BgDecoration />

      {/* Hero */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 20px 0', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.7)', marginBottom: '16px' }}>
          ◆ TRANSPARENT PRICING
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 400, lineHeight: 1.1, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
          One report,<br />
          <span style={{ color: 'rgba(232,160,48,0.85)' }}>one price.</span>
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: '480px', margin: '0 auto 48px' }}>
          No subscription. No trial. No upsell. Run an analysis, see the summary free, then unlock the full report if it's the right property.
        </p>
      </div>

      {/* Pricing card */}
      <div style={{ maxWidth: '440px', margin: '0 auto', padding: '0 20px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'linear-gradient(rgba(10,10,22,0.98), rgba(10,10,22,0.98)) padding-box, conic-gradient(from 0deg, transparent 0%, rgba(232,160,48,0.4) 20%, rgba(232,160,48,0.7) 30%, rgba(232,160,48,0.4) 40%, transparent 50%, transparent 70%, rgba(232,160,48,0.4) 80%, rgba(232,160,48,0.7) 85%, rgba(232,160,48,0.4) 90%, transparent 100%) border-box',
          border: '1px solid transparent',
          borderRadius: '20px',
          padding: '36px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(13,216,192,0.04)',
        }}>
          {/* Price */}
          <div style={{ textAlign: 'center', marginBottom: '32px', paddingBottom: '28px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(232,160,48,0.55)', marginBottom: '8px' }}>Full Property Intelligence</p>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 700, color: 'rgba(232,160,48,0.8)', marginTop: '8px' }}>₹</span>
              <span style={{ fontSize: '72px', fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.04em' }}>199</span>
            </div>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' }}>per report · one-time · no recurring charges</p>
          </div>

          {/* What's included */}
          <div style={{ marginBottom: '28px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.55)', marginBottom: '14px' }}>What's included</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {INCLUDED.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="7" cy="7" r="6.5" fill="rgba(13,216,192,0.10)" stroke="rgba(13,216,192,0.30)" strokeWidth="1"/>
                    <polyline points="4,7 6,9 10,5" stroke="#0DD8C0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Not included */}
          <div style={{ marginBottom: '28px', padding: '16px', background: 'rgba(255,255,255,0.025)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>Not included (yet)</p>
            {NOT_INCLUDED.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < NOT_INCLUDED.length - 1 ? '7px' : 0 }}>
                <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)' }}>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <a href="/analyze" style={{
            display: 'block', width: '100%', padding: '14px',
            background: 'rgba(232,160,48,0.15)', border: '1px solid rgba(232,160,48,0.35)',
            borderRadius: '12px', color: 'rgba(232,160,48,0.9)', fontSize: '14px',
            fontWeight: 600, textDecoration: 'none', textAlign: 'center',
            boxSizing: 'border-box',
          }}>
            Run Intelligence →
          </a>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center', marginTop: '10px' }}>
            See the summary free. Pay only to unlock.
          </p>
        </div>

        {/* Payment badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '20px', flexWrap: 'wrap' }}>
          {['Razorpay Secured', 'UPI / Cards / NetBanking', 'PCI-DSS Compliant'].map(text => (
            <span key={text} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="rgba(13,216,192,0.45)"/></svg>
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 20px 80px', position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.55)', textAlign: 'center', marginBottom: '10px' }}>◆ FAQ</p>
        <h2 style={{ fontSize: '22px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: '32px', fontFamily: "'Instrument Serif', serif" }}>
          Frequently asked questions
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FAQ.map(({ q, a }, i) => (
            <div key={i} style={{ background: 'rgba(8,12,28,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '20px 24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.82)', margin: '0 0 8px', lineHeight: 1.4 }}>{q}</p>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.42)', margin: 0, lineHeight: 1.65 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
