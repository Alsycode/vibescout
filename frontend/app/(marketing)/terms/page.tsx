export const metadata = {
  title: 'Terms of Service — VibeScout',
  description: 'VibeScout Terms of Service',
};

const LAST_UPDATED = 'June 28, 2026';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By accessing or using VibeScout ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service. VibeScout is operated by Alsycode Technologies and is available to users in India.',
  },
  {
    title: '2. Description of Service',
    body: 'VibeScout provides property intelligence reports based on publicly available data, third-party APIs, and deterministic algorithms. Reports include environmental signals (AQI, noise, solar), commute estimates, amenity proximity, and financial fit assessments. Reports are informational and should not be treated as professional real-estate, financial, legal, or investment advice.',
  },
  {
    title: '3. User Accounts',
    body: 'You must create an account to access the Service. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. You must provide accurate information at registration. We reserve the right to terminate accounts that provide false information.',
  },
  {
    title: '4. Payments',
    body: 'Full property intelligence reports are available for ₹199 per report (one-time, non-recurring). Payments are processed by Razorpay, a PCI-DSS compliant payment gateway. We do not store card or bank account details. All prices are inclusive of applicable taxes. Refunds are available within 24 hours of purchase — contact us at support@vibescout.in.',
  },
  {
    title: '5. Accuracy of Data',
    body: 'VibeScout uses live data feeds and third-party sources. While we use algorithmic verification to reduce errors, we cannot guarantee the absolute accuracy of all data points. AQI readings, noise estimates, commute times, and amenity distances are approximations. Always verify critical data independently before making property decisions.',
  },
  {
    title: '6. Intellectual Property',
    body: 'All content on VibeScout — including the verdict engine, report templates, UI design, and brand assets — is the property of Alsycode Technologies. You may not copy, distribute, or commercially use any part of the Service without written permission.',
  },
  {
    title: '7. Prohibited Use',
    body: 'You may not use the Service to scrape data at scale, reverse-engineer report algorithms, resell report content, or use the platform for any unlawful purpose. Accounts found in violation may be terminated without notice.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'To the maximum extent permitted by law, VibeScout and Alsycode Technologies shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including any property decisions made based on reports. Our total liability shall not exceed the amount you paid for the relevant report.',
  },
  {
    title: '9. Termination',
    body: 'We reserve the right to suspend or terminate your account at our discretion if we believe you have violated these Terms. You may delete your account at any time by contacting us.',
  },
  {
    title: '10. Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the new Terms. We will notify users of material changes via email.',
  },
  {
    title: '11. Governing Law',
    body: 'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.',
  },
  {
    title: '12. Contact',
    body: 'For questions about these Terms, contact us at support@vibescout.in.',
  },
];

const STARS: [number, number, number][] = [
  [65, 8, 0.45], [82, 5, 0.65], [91, 19, 0.40], [73, 15, 0.55], [88, 32, 0.45],
  [60, 40, 0.35], [95, 45, 0.60], [77, 52, 0.45], [67, 62, 0.40], [86, 67, 0.55],
  [72, 74, 0.45], [90, 77, 0.35], [63, 27, 0.50], [97, 13, 0.40], [75, 37, 0.45],
  [55, 70, 0.55], [80, 84, 0.45], [68, 87, 0.65], [87, 57, 0.45], [93, 31, 0.55],
];

function BgDecoration() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }} aria-hidden="true">
      <div style={{ position: 'absolute', right: '8%', top: '5%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(13,216,192,0.042) 0%, transparent 65%)', transform: 'translate(15%, -15%)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 100 100" preserveAspectRatio="none">
        {STARS.map(([cx, cy, op], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.22" fill={`rgba(255,255,255,${op})`} />
        ))}
      </svg>
      <svg style={{ position: 'absolute', right: '-4%', bottom: '-4%', width: '60%', height: '72%', opacity: 0.12 }} viewBox="0 0 720 580" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="wg-terms" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290" stroke="url(#wg-terms)" strokeWidth="1.6" fill="none" />
        <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335" stroke="url(#wg-terms)" strokeWidth="1.3" fill="none" opacity="0.85" />
        <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#wg-terms)" strokeWidth="1.0" fill="none" opacity="0.70" />
        <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255" stroke="url(#wg-terms)" strokeWidth="1.4" fill="none" opacity="0.75" />
      </svg>
    </div>
  );
}

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080812', color: '#fff', paddingTop: '80px', position: 'relative' }}>
      <BgDecoration />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '16px' }}>
          ◆ LEGAL
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.2 }}>
          Terms of Service
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '40px' }}>
          Last updated: {LAST_UPDATED}
        </p>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {SECTIONS.map(({ title, body }, idx) => (
            <div
              key={title}
              style={{
                background: 'rgba(8,12,28,0.75)',
                border: '1px solid rgba(255,255,255,0.065)',
                borderRadius: '14px',
                padding: '22px 28px',
                marginBottom: idx < SECTIONS.length - 1 ? '10px' : 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(13,216,192,0.7)', flexShrink: 0 }} />
                <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.82)', margin: 0, letterSpacing: '0.01em' }}>{title}</h2>
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.44)', lineHeight: 1.78, margin: 0, paddingLeft: '14px' }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '24px' }}>
          <a href="/privacy" style={{ fontSize: '13px', color: 'rgba(13,216,192,0.65)', textDecoration: 'none' }}>Privacy Policy →</a>
          <a href="/pricing" style={{ fontSize: '13px', color: 'rgba(13,216,192,0.65)', textDecoration: 'none' }}>Pricing →</a>
        </div>
      </div>
    </div>
  );
}
