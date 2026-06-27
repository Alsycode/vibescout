// FILE: app/layout.jsx
// PURPOSE: Root layout — noise overlay, global CSS import

import './globals.css';

export const metadata = {
  title: 'VibeScout — Property Intelligence',
  description:
    "What your broker won't tell you about any property — in 5 minutes. Six live signals: air quality, noise, solar potential, commute, financial fit, and local news. Sourced live. Computed deterministically.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body>
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
