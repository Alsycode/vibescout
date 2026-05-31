// FILE: app/(marketing)/layout.jsx
// PURPOSE: Marketing route group layout — SSR, no auth, no socket.
//          Google Maps Script loaded here for LocationSearch Path A (Places Autocomplete).

import Script from 'next/script';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function MarketingLayout({ children }) {
  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
        strategy="afterInteractive"
      />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

