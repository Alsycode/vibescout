export const metadata = {
  title: 'Privacy Policy — VibeScout',
  description: 'VibeScout Privacy Policy — how we collect, use, and protect your data.',
};

const LAST_UPDATED = 'June 28, 2026';

const SECTIONS = [
  {
    title: '1. What We Collect',
    body: 'We collect information you provide directly: name, email address, phone number, and password (stored as a bcrypt hash). We also collect property analysis data including location coordinates, property specifications, funnel preferences, and report data you generate. We do not collect payment card details — these are handled by Razorpay.',
  },
  {
    title: '2. How We Use Your Data',
    body: 'We use your data to: generate property intelligence reports, personalise your analysis based on stated preferences, send transactional emails (report completion, password reset), maintain your report history, and improve the accuracy of our signal models. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Third-Party Services',
    body: 'We use the following third-party services: Google Maps/Places API (commute and amenity data), OpenWeatherMap / Ambee (AQI and weather), GNews / NewsAPI (local news headlines), Razorpay (payment processing), Groq (AI label generation — property data is sent to Groq for summarisation only). Each service has its own privacy policy. Property coordinates and preferences may be transmitted to these services as part of report generation.',
  },
  {
    title: '4. Data Storage',
    body: 'Your data is stored on MongoDB Atlas (India region) and cached on Upstash Redis. Report data is retained for 7 days in cache and permanently in your account history. We use industry-standard encryption in transit (TLS) and at rest.',
  },
  {
    title: '5. Cookies',
    body: 'We use a single session cookie ("vb_session") to maintain your authenticated session. This cookie is HttpOnly, Secure in production, and expires after 7 days. We do not use advertising cookies or third-party tracking pixels.',
  },
  {
    title: '6. Your Rights',
    body: 'You have the right to: access your personal data (via /profile), correct inaccurate data, delete your account and associated data (contact us at support@vibescout.in), export your report history. We will respond to data requests within 30 days.',
  },
  {
    title: '7. Data Retention',
    body: 'We retain your account data for as long as your account is active. Report snapshots are retained permanently in your account history to ensure you can always access reports you paid for. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law.',
  },
  {
    title: '8. Children',
    body: 'VibeScout is not directed at children under 18. We do not knowingly collect personal data from minors. If you believe a minor has provided data to us, contact us and we will delete it promptly.',
  },
  {
    title: '9. Changes to This Policy',
    body: 'We may update this Privacy Policy. Material changes will be communicated by email. Continued use of the Service constitutes acceptance of the updated policy.',
  },
  {
    title: '10. Contact',
    body: 'For privacy-related questions or data requests, contact us at support@vibescout.in or write to: Alsycode Technologies, Bengaluru, Karnataka, India.',
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
          <linearGradient id="wg-priv" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#0DD8C0" stopOpacity="0" />
            <stop offset="30%"  stopColor="#0DD8C0" stopOpacity="0.90" />
            <stop offset="100%" stopColor="#0DD8C0" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <path d="M-80 340 C60 290 200 370 350 335 C490 300 600 240 760 290" stroke="url(#wg-priv)" strokeWidth="1.6" fill="none" />
        <path d="M-80 385 C80 335 230 415 390 380 C530 345 640 285 800 335" stroke="url(#wg-priv)" strokeWidth="1.3" fill="none" opacity="0.85" />
        <path d="M-80 430 C100 380 260 460 430 425 C570 390 680 330 840 380" stroke="url(#wg-priv)" strokeWidth="1.0" fill="none" opacity="0.70" />
        <path d="M-80 300 C40 255 165 330 300 300 C440 268 555 208 720 255" stroke="url(#wg-priv)" strokeWidth="1.4" fill="none" opacity="0.75" />
      </svg>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#080812', color: '#fff', paddingTop: '80px', position: 'relative' }}>
      <BgDecoration />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '60px 20px 80px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(13,216,192,0.65)', marginBottom: '16px' }}>
          ◆ LEGAL
        </p>
        <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.2 }}>
          Privacy Policy
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
          <a href="/terms" style={{ fontSize: '13px', color: 'rgba(13,216,192,0.65)', textDecoration: 'none' }}>Terms of Service →</a>
          <a href="/pricing" style={{ fontSize: '13px', color: 'rgba(13,216,192,0.65)', textDecoration: 'none' }}>Pricing →</a>
        </div>
      </div>
    </div>
  );
}
