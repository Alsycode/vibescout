'use client';

import { useRef } from 'react';
import { motion, useInView, type Variants } from 'framer-motion';
import { TestimonialsColumn, type Testimonial } from '@/components/ui/testimonials-columns-1';

const TESTIMONIALS: Testimonial[] = [
  {
    text:   "I ran a report before signing the lease. VibeScout flagged 71dB noise from a construction corridor right next door. My broker never mentioned it once.",
    image:  'https://randomuser.me/api/portraits/men/32.jpg',
    name:   'Arjun Sharma',
    role:   'Software Engineer · Bengaluru',
    signal: 'NOISE SIGNAL',
  },
  {
    text:   "The financial fit score showed the flat was 22% above comparable blocks. I used that number to negotiate ₹8,000 off the monthly rent. The landlord caved immediately.",
    image:  'https://randomuser.me/api/portraits/women/44.jpg',
    name:   'Priya Menon',
    role:   'Product Manager · Mumbai',
    signal: 'FINANCIAL FIT',
  },
  {
    text:   "Three signals came back red on a property I'd already mentally committed to. Saved me from a decision I would have spent two years regretting.",
    image:  'https://randomuser.me/api/portraits/women/68.jpg',
    name:   'Kavya Reddy',
    role:   'Marketing Lead · Hyderabad',
    signal: 'VERDICT',
  },
  {
    text:   "Air quality came back at 78 AQI — Moderate. It's right near the NH48. The broker called it a 'premium arterial location.' I found that funny.",
    image:  'https://randomuser.me/api/portraits/men/55.jpg',
    name:   'Rahul Joshi',
    role:   'Entrepreneur · Pune',
    signal: 'AQ SIGNAL',
  },
  {
    text:   "I've started using VibeScout for every shortlist. The commute signal alone has ruled out four flats I would have wasted weekends visiting.",
    image:  'https://randomuser.me/api/portraits/women/12.jpg',
    name:   'Ananya Krishnan',
    role:   'Management Consultant · Bengaluru',
    signal: 'COMMUTE SIGNAL',
  },
  {
    text:   "My broker said 'calm residential.' The noise score said 68dB. I found a better unit in the next block for ₹5,000 less. The report paid for itself in the first week.",
    image:  'https://randomuser.me/api/portraits/men/76.jpg',
    name:   'Siddharth Nair',
    role:   'Architect · Chennai',
    signal: 'NOISE SIGNAL',
  },
  {
    text:   "The solar yield analysis was what closed the deal for us. 5.1 kWh/m² on the south-facing rooftop unit — exactly what our investment calculator needed.",
    image:  'https://randomuser.me/api/portraits/women/22.jpg',
    name:   'Meera Pillai',
    role:   'Sustainability Analyst · Bengaluru',
    signal: 'SOLAR SIGNAL',
  },
  {
    text:   "Ran the report. Downloaded the PDF. Forwarded it to my parents on WhatsApp. That's how easy the decision became. They stopped asking me to 'just see the place first.'",
    image:  'https://randomuser.me/api/portraits/men/41.jpg',
    name:   'Dev Malhotra',
    role:   'NRI Buyer · Returning to Pune',
    signal: 'PDF REPORT',
  },
  {
    text:   "The report took four minutes. My broker took three weeks to give me half as much information — and it was all positive. The signals were more honest.",
    image:  'https://randomuser.me/api/portraits/women/90.jpg',
    name:   'Sneha Agarwal',
    role:   'Doctor · Gurugram',
    signal: 'INTELLIGENCE',
  },
];

const col1 = TESTIMONIALS.slice(0, 3);
const col2 = TESTIMONIALS.slice(3, 6);
const col3 = TESTIMONIALS.slice(6, 9);

const STARS = [
  [8, 14, 0.40], [22, 7, 0.55], [38, 20, 0.35], [14, 38, 0.50],
  [48, 10, 0.40], [5, 55, 0.30], [30, 48, 0.55], [44, 28, 0.40],
  [18, 70, 0.35], [42, 78, 0.50], [12, 82, 0.40], [35, 62, 0.45],
  [50, 42, 0.30], [6, 30, 0.50], [26, 92, 0.35],
];

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 22, filter: 'blur(2px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)', transition: { duration: 0.65, ease: EASE } },
};

const stagger: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.10, delayChildren: 0.05 } },
};

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView     = useInView(sectionRef, { once: true, margin: '-80px 0px' });

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      style={{
        background: '#080812',
        position:   'relative',
        overflow:   'hidden',
        padding:    'clamp(80px, 10vw, 130px) clamp(24px, 5vw, 80px)',
      }}
    >
      {/* ── Star field ─────────────────────────────────────── */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {STARS.map(([cx, cy, op], i) => (
            <circle key={i} cx={cx} cy={cy} r="0.20" fill={`rgba(255,255,255,${op})`} />
          ))}
        </svg>

        {/* Ambient amber glow — upper left */}
        <div style={{
          position:     'absolute',
          left:         '15%',
          top:          '8%',
          width:        '40vw',
          height:       '40vw',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(232,160,48,0.035) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Teal glow — lower right */}
        <div style={{
          position:     'absolute',
          right:        '5%',
          bottom:       '10%',
          width:        '45vw',
          height:       '45vw',
          borderRadius: '50%',
          background:   'radial-gradient(circle, rgba(3,211,189,0.040) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Section header ─────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ maxWidth: '600px', marginBottom: '64px' }}
        >
          {/* Eyebrow */}
          <motion.div
            variants={fadeUp}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}
          >
            <p style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      '10px',
              fontWeight:    600,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color:         '#03d3bd',
              margin:        0,
              whiteSpace:    'nowrap',
            }}>
              VERIFIED BUYERS
            </p>
            <div style={{
              height:     '1px',
              width:      '48px',
              background: 'linear-gradient(90deg, #03d3bd, transparent)',
              flexShrink: 0,
            }} />
          </motion.div>

          {/* Headline */}
          <motion.h2 variants={fadeUp} style={{ margin: '0 0 18px' }}>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(30px, 3.6vw, 52px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.14,
              color:         'rgba(255,255,255,0.92)',
            }}>
              Six signals.
            </span>
            <span style={{
              display:       'block',
              fontFamily:    "'Instrument Serif', serif",
              fontStyle:     'normal',
              fontSize:      'clamp(30px, 3.6vw, 52px)',
              fontWeight:    400,
              letterSpacing: '-0.01em',
              lineHeight:    1.14,
              color:         '#03d3bd',
              textShadow:    '0 0 40px rgba(3,211,189,0.22)',
            }}>
              One honest report.
            </span>
          </motion.h2>

          {/* Subline */}
          <motion.p
            variants={fadeUp}
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize:   '15px',
              fontWeight: 400,
              lineHeight: 1.70,
              color:      'rgba(255,255,255,0.38)',
              margin:     0,
            }}
          >
            Real buyers. Real properties. Real signals that the listing never included.
          </motion.p>
        </motion.div>

        {/* ── Scrolling columns ──────────────────────────────── */}
        <div
          style={{
            display:         'flex',
            justifyContent:  'center',
            gap:             '16px',
            maxHeight:       '720px',
            overflow:        'hidden',
            maskImage:       'linear-gradient(to bottom, transparent 0%, #080812 8%, #080812 88%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #080812 8%, #080812 88%, transparent 100%)',
          }}
        >
          {/* Column 1 — always visible */}
          <TestimonialsColumn
            testimonials={col1}
            duration={18}
            style={{ flex: '0 0 300px' }}
          />

          {/* Column 2 — hidden on mobile */}
          <TestimonialsColumn
            testimonials={col2}
            duration={22}
            style={{ flex: '0 0 300px' }}
            className="testimonials-col-md"
          />

          {/* Column 3 — hidden on tablet */}
          <TestimonialsColumn
            testimonials={col3}
            duration={20}
            style={{ flex: '0 0 300px' }}
            className="testimonials-col-lg"
          />
        </div>

        {/* ── Bottom stat bar ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            marginTop:   '56px',
            paddingTop:  '32px',
            borderTop:   '1px solid rgba(255,255,255,0.06)',
            display:     'flex',
            flexWrap:    'wrap',
            gap:         '40px',
            alignItems:  'center',
          }}
        >
          {[
            { value: '847+',  label: 'Reports generated today'  },
            { value: '4 min', label: 'Average time to full report' },
            { value: '6',     label: 'Live intelligence signals'  },
            { value: '₹199',  label: 'One-time · No subscription' },
          ].map(({ value, label }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{
                fontFamily:    "'Geist Mono', monospace",
                fontSize:      'clamp(20px, 2.2vw, 28px)',
                fontWeight:    400,
                color:         'rgba(232,160,48,0.88)',
                letterSpacing: '-0.03em',
                lineHeight:    1,
              }}>
                {value}
              </span>
              <span style={{
                fontFamily:    "'Inter', sans-serif",
                fontSize:      '11px',
                fontWeight:    400,
                color:         'rgba(255,255,255,0.30)',
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Responsive column visibility */}
      <style>{`
        .testimonials-col-md { display: flex !important; }
        .testimonials-col-lg { display: flex !important; }

        @media (max-width: 900px) {
          .testimonials-col-lg { display: none !important; }
        }
        @media (max-width: 640px) {
          .testimonials-col-md { display: none !important; }
        }
      `}</style>
    </section>
  );
}
