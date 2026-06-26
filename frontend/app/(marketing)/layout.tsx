import Script from 'next/script';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// Static page — no per-request data; revalidate once per hour via ISR
export const revalidate = 3600;

export default function MarketingLayout({ children }) {
  return (
    <>
      {/* lazyOnload defers Maps until the page is fully idle, keeping it off the critical path */}
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}&libraries=places&loading=async`}
        strategy="lazyOnload"
      />
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}

