'use client';

import { useRef, useEffect } from 'react';

const testimonials = [
  {
    text: "I was about to sign a lease in a noisy neighbourhood near a highway. Vibescout flagged it immediately. Saved me from a decision I would have regretted.",
    img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Priya Nair",
    role: "Renter, Bengaluru",
  },
  {
    text: "The AQI report showed the area I was eyeing had consistently poor air quality. As someone with allergies, that was exactly what I needed to know.",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Arjun Mehta",
    role: "Buyer, Pune",
  },
  {
    text: "The commute score calculated my exact travel time to office using my preferred mode. No other tool does this. Completely changed how I shortlist properties.",
    img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Ritu Sharma",
    role: "IT Professional, Hyderabad",
  },
  {
    text: "Sunlight analysis was a feature I didn't know I needed. West-facing flat with afternoon glare — Vibescout flagged it before I wasted a site visit.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Kabir Desai",
    role: "First-time Buyer, Mumbai",
  },
  {
    text: "I compared three flats in the same area. The budget fitness score helped me understand which one actually fits my income. Genuinely useful.",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Ananya Iyer",
    role: "Renter, Chennai",
  },
  {
    text: "The local news section surfaced a planned industrial project near the plot I was considering. Nothing on the listing mentioned it. Vibescout did.",
    img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Siddharth Rao",
    role: "Investor, NCR",
  },
  {
    text: "Got the full report for ₹99. That report saved me from an overpriced flat in a flood-prone zone. Worth every rupee, a hundred times over.",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Meera Pillai",
    role: "Buyer, Kochi",
  },
  {
    text: "Most property tools show you listings. Vibescout shows you the truth about what living there actually feels like. That's a completely different product.",
    img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Nikhil Saxena",
    role: "Renter, Ahmedabad",
  },
  {
    text: "The amenities score matched my priorities exactly — schools and hospitals scored high for the area. We moved in two months ago. Couldn't be happier.",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=80&h=80",
    name: "Deepa Krishnan",
    role: "Family Buyer, Coimbatore",
  },
];

const stats = [
  { num: '8,200+', label: 'Properties audited' },
  { num: '4.9 / 5', label: 'Avg. rating' },
  { num: '₹99',    label: 'Full report, one-time' },
];

const col1 = testimonials.slice(0, 3);
const col2 = testimonials.slice(3, 6);
const col3 = testimonials.slice(6, 9);

function TestimonialCard({ t }) {
  return (
    <article className="vs-t-card">
      <span className="vs-t-quote" aria-hidden="true">&ldquo;</span>
      <p className="vs-t-text">{t.text}</p>
      <footer className="vs-t-footer">
        <img
          className="vs-t-avatar"
          src={t.img}
          alt={`Photo of ${t.name}`}
          width={36}
          height={36}
          loading="lazy"
        />
        <div>
          <div className="vs-t-name">{t.name}</div>
          <div className="vs-t-role">{t.role}</div>
        </div>
      </footer>
    </article>
  );
}

function TestimonialsColumn({ items, duration, className = '' }) {
  const trackRef = useRef(null);
  const doubled = [...items, ...items];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pause  = () => (track.style.animationPlayState = 'paused');
    const resume = () => (track.style.animationPlayState = 'running');
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    return () => {
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
    };
  }, []);

  return (
    <div className={`vs-t-col ${className}`}>
      <div
        ref={trackRef}
        className="vs-t-track"
        style={{ animationDuration: `${duration}s` }}
      >
        {doubled.map((t, i) => (
          <TestimonialCard key={`${t.name}-${i}`} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <>
      <style>{`
        .vs-t-root {
          font-family: 'Outfit', sans-serif;
          font-weight: 300;
          background: var(--color-bg, #050505);
          color: rgba(255,255,255,0.9);
          padding: 96px 24px 100px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          overflow: hidden;
          line-height: 1.7;
        }

        .vs-t-root::before {
          content: '';
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%);
          width: 700px; height: 280px;
          background: radial-gradient(ellipse at 50% 0%, rgba(231,197,138,.06) 0%, transparent 70%);
          pointer-events: none;
        }

        /* divider line above section */
        .vs-t-root::after {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.07), transparent);
          pointer-events: none;
        }

        .vs-t-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 460px;
          text-align: center;
          margin-bottom: 64px;
          animation: vsTUp .85s cubic-bezier(.16,1,.3,1) .05s both;
        }

        @keyframes vsTUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .vs-t-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: .36em;
          text-transform: uppercase;
          color: rgba(231,197,138,.65);
          margin-bottom: 20px;
        }

        .vs-t-eyebrow-line {
          display: inline-block;
          width: 26px; height: 1px;
          background: rgba(231,197,138,.3);
        }

        .vs-t-heading {
          font-size: clamp(1.9rem, 4vw, 2.75rem);
          font-weight: 500;
          letter-spacing: -0.015em;
          line-height: 1.1;
          color: rgba(255,255,255,0.92);
          margin-bottom: 14px;
        }

        .vs-t-heading em {
          font-style: normal;
          color: rgba(231,197,138,.92);
        }

        .vs-t-subtitle {
          font-size: 14px;
          font-weight: 300;
          color: rgba(255,255,255,.5);
          line-height: 1.7;
          max-width: 340px;
        }

        /* Columns */
        .vs-t-cols {
          width: 100%;
          max-width: 960px;
          display: flex;
          gap: 16px;
          justify-content: center;
          height: 600px;
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 13%, black 87%, transparent);
          mask-image: linear-gradient(to bottom, transparent, black 13%, black 87%, transparent);
        }

        .vs-t-col { flex: 0 0 288px; }

        .vs-t-col-sm { display: none; }
        .vs-t-col-md { display: none; }

        @media (min-width: 620px)  { .vs-t-col-sm { display: block; } }
        @media (min-width: 940px)  { .vs-t-col-md { display: block; } }

        .vs-t-track {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: vsTScroll linear infinite;
        }

        @keyframes vsTScroll {
          0%   { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }

        /* Card */
        .vs-t-card {
          background: rgba(11,11,11,0.9);
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 16px;
          padding: 24px 22px 20px;
          cursor: default;
          position: relative;
          overflow: hidden;
          transition: border-color .3s ease, transform .3s cubic-bezier(.34,1.56,.64,1), box-shadow .3s ease;
        }

        .vs-t-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(231,197,138,.18), transparent);
          opacity: 0;
          transition: opacity .3s;
        }

        .vs-t-card:hover {
          border-color: rgba(231,197,138,.3);
          transform: translateY(-4px) scale(1.012);
          box-shadow: 0 18px 44px rgba(0,0,0,.55), 0 0 0 1px rgba(231,197,138,.12);
        }

        .vs-t-card:hover::before { opacity: 1; }

        .vs-t-quote {
          display: block;
          font-size: 34px;
          line-height: 1;
          color: rgba(231,197,138,.12);
          font-weight: 600;
          margin-bottom: 4px;
          font-family: Georgia, serif;
        }

        .vs-t-text {
          font-size: 13px;
          font-weight: 300;
          line-height: 1.68;
          color: rgba(255,255,255,.52);
          margin-bottom: 18px;
          transition: color .3s;
        }

        .vs-t-card:hover .vs-t-text { color: rgba(255,255,255,.72); }

        .vs-t-footer {
          display: flex;
          align-items: center;
          gap: 10px;
          border-top: 1px solid rgba(255,255,255,.05);
          padding-top: 14px;
        }

        .vs-t-avatar {
          width: 34px; height: 34px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 1.5px solid rgba(255,255,255,.09);
          transition: border-color .3s;
        }

        .vs-t-card:hover .vs-t-avatar { border-color: rgba(231,197,138,.5); }

        .vs-t-name {
          font-size: 12.5px;
          font-weight: 500;
          color: rgba(255,255,255,.88);
          letter-spacing: .01em;
          line-height: 1.3;
        }

        .vs-t-role {
          font-size: 10.5px;
          font-weight: 400;
          color: rgba(255,255,255,.3);
          letter-spacing: .05em;
          margin-top: 2px;
        }

        /* Stat strip */
        .vs-t-stats {
          display: flex;
          gap: 36px;
          margin-top: 48px;
          align-items: center;
          animation: vsTUp .85s cubic-bezier(.16,1,.3,1) .35s both;
        }

        .vs-t-stat { text-align: center; }

        .vs-t-stat-num {
          display: block;
          font-size: 21px;
          font-weight: 500;
          font-variant-numeric: tabular-nums;
          color: rgba(231,197,138,.9);
          letter-spacing: -.01em;
        }

        .vs-t-stat-label {
          display: block;
          font-size: 10px;
          font-weight: 400;
          letter-spacing: .2em;
          text-transform: uppercase;
          color: rgba(255,255,255,.3);
          margin-top: 3px;
        }

        .vs-t-stat-div {
          width: 1px;
          height: 32px;
          background: rgba(255,255,255,.07);
          flex-shrink: 0;
        }
      `}</style>

      <section className="vs-t-root" aria-labelledby="vs-t-heading">
        <div className="vs-t-header">
          <span className="vs-t-eyebrow">
            <span className="vs-t-eyebrow-line" />
            What buyers & renters say
            <span className="vs-t-eyebrow-line" />
          </span>
          <h2 className="vs-t-heading" id="vs-t-heading">
            Decisions backed<br />by <em>real intelligence</em>
          </h2>
          <p className="vs-t-subtitle">
            From noise and air quality to commute and budget fit — people use
            Vibescout to know what a property is really like before they commit.
          </p>
        </div>

        <div
          className="vs-t-cols"
          role="region"
          aria-label="Scrolling testimonials"
        >
          <TestimonialsColumn items={col1} duration={18} />
          <TestimonialsColumn items={col2} duration={22} className="vs-t-col-sm" />
          <TestimonialsColumn items={col3} duration={20} className="vs-t-col-md" />
        </div>

        <div className="vs-t-stats" aria-label="Key metrics">
          {stats.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
              {i > 0 && <div className="vs-t-stat-div" role="separator" />}
              <div className="vs-t-stat">
                <span className="vs-t-stat-num">{s.num}</span>
                <span className="vs-t-stat-label">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
