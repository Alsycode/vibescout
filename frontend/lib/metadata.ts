import type { Metadata } from 'next';

// ── Site-wide constants ───────────────────────────────────────────────────────
// Single source of truth. Update `url` before going to production.
export const siteConfig = {
  name: 'VibeScout',
  url: 'https://vibescout.com',
  description:
    'What your broker won\'t tell you about any property — in 5 minutes. Six live signals: air quality, noise, solar potential, commute, financial fit, and local news. Sourced live. Computed deterministically.',
  twitterHandle: '@vibescout',
  defaultOgImage: '/opengraph-image.png',
} as const;

// ── Canonical URL builder ─────────────────────────────────────────────────────
// Ensures consistent absolute URLs with no trailing slash (root excluded).
export function buildCanonical(path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  const normalised = clean.length > 1 ? clean.replace(/\/$/, '') : clean;
  return `${siteConfig.url}${normalised}`;
}

// ── Per-page metadata builder ─────────────────────────────────────────────────
interface BuildMetadataOptions {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description,
  path,
  ogImage = siteConfig.defaultOgImage,
  ogType = 'website',
  noIndex = false,
}: BuildMetadataOptions): Metadata {
  const canonical = buildCanonical(path);

  return {
    title,
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      type: ogType,
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
  };
}

// ── Blanket noindex preset ────────────────────────────────────────────────────
// Export this from any layout/page that must never appear in search results.
export const noIndexMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

// ── JSON-LD: Organization ─────────────────────────────────────────────────────
// Tells search engines who owns this site. Injected once in the root layout.
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [] as string[],
  };
}

// ── JSON-LD: WebSite + SearchAction ──────────────────────────────────────────
// Enables Google Sitelinks Searchbox for the domain.
// The urlTemplate must match the actual search param your /analyze page accepts.
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/analyze?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
