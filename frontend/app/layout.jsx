// FILE: app/layout.jsx
// PURPOSE: Root layout — Outfit font, noise overlay, global CSS import

import './globals.css';

export const metadata = {
  title: 'Vibescout — Property Intelligence',
  description: 'Audit any property you find. Real data, not listings.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="noise-overlay" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
