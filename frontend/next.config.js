// FILE: frontend/next.config.js
// PURPOSE: Next.js 15 App Router config — image domains, environment passthrough

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Stage 1.4 — root package.json + package-lock.json sit one level up from this
  // frontend package, which made Next.js guess at the workspace root and warn on
  // every build. Pin it explicitly to this directory (there's no actual monorepo
  // workspace here, just a backend + frontend sharing one repo).
  outputFileTracingRoot: import.meta.dirname,
  // SEC-07 — `hostname: '**'` made the built-in image optimizer
  // (`/_next/image?url=<any https URL>`) an open proxy: fetch/relay any
  // attacker-supplied URL through this server's IP, no app code involved.
  // Audited every next/image usage in this app (Navbar, Footer, CarSlider,
  // CarStage, timeline-gallery) — all reference local /public assets. The
  // few genuinely remote images in the app (news headline thumbnails,
  // Picsum/Unsplash placeholders, admin blog cover uploads) are all rendered
  // via plain <img>, not next/image, so they never touch this allowlist.
  // Add a host here only when a real next/image usage needs it.
  images: {
    remotePatterns: [],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/:path*`,
      },
    ];
  },
  // SEC-08 — enforced headers first (safe: none of them depend on knowing
  // every script/style source up front). CSP ships Report-Only for now per
  // the plan (report-only first, then enforce) — Next.js App Router pages
  // here use plenty of inline `style={{}}` (style-src needs 'unsafe-inline'
  // to not be flooded with noise) and no nonce plumbing exists yet, so
  // flipping straight to enforcing risks silently breaking pages. The
  // directives below were built from an actual audit of this app's external
  // resources (Google Maps JS SDK + Places autocomplete, Razorpay Checkout,
  // Google Fonts via @import) rather than copied defaults.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' https://maps.googleapis.com https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://maps.googleapis.com https://api.razorpay.com https://lumberjack.razorpay.com",
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), camera=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()',
          },
          { key: 'Content-Security-Policy-Report-Only', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
