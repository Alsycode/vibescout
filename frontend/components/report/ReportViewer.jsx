// FILE: components/report/ReportViewer.jsx
// PURPOSE: 4-chapter scroll structure with IntersectionObserver + stagger-children.
//          Aetheris Intelligence design language — teal chapter dividers, cyber card aesthetic.
//          Chapter order: VibeSummary → Environmental → Personal → Financial/Rental → SharePDFBar.
//          FinancialCard or RentalFitCard based on listingType.
//          Every card always shows a value. No card is ever blank.
//          BANNED WORDS: unavailable, missing, no data, data not found, failed, error.

'use client';

import { useEffect, useRef } from 'react';
import VibeSummaryCard from './VibeSummaryCard';
import AeroSonicCard from './AeroSonicCard';
import SolarPathCard from './SolarPathCard';
import LocalNewsCard from './LocalNewsCard';
import HyperPersonalCard from './HyperPersonalCard';
import CommunityPulseCard from './CommunityPulseCard';
import FinancialCard from './FinancialCard';
import RentalFitCard from './RentalFitCard';
import SharePDFBar from '../SharePDFBar';

function ChapterDivider({ overline, title }) {
  return (
    <div
      style={{
        maxWidth: '672px',
        width: '100%',
        margin: '0 auto',
        paddingBottom: '28px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '6px',
        }}
      >
        {/* Teal accent dot */}
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'rgba(231,197,138,0.6)',
            boxShadow: '0 0 8px rgba(231,197,138,0.4)',
            flexShrink: 0,
          }}
        />
        <p
          style={{
            fontSize: '9px',
            fontWeight: 500,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(231,197,138,0.5)',
          }}
        >
          {overline}
        </p>
        {/* Teal line extending right */}
        <div
          style={{
            flex: 1,
            height: '1px',
            background:
              'linear-gradient(90deg, rgba(231,197,138,0.2) 0%, transparent 100%)',
          }}
        />
      </div>
      {title && (
        <p
          style={{
            fontSize: '22px',
            fontWeight: 600,
            color: 'rgba(255,255,255,0.88)',
            letterSpacing: '-0.01em',
            paddingLeft: '19px',
          }}
        >
          {title}
        </p>
      )}
    </div>
  );
}

export default function ReportViewer({ report, shareToken, readonly, preferences }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const elements = containerRef.current.querySelectorAll('.reveal');
    elements.forEach((el) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, [report]);

  if (!report) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            className="animate-glow-pulse"
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'rgba(231,197,138,0.6)',
              boxShadow: '0 0 16px rgba(231,197,138,0.4)',
              margin: '0 auto 16px',
            }}
          />
          <p
            style={{
              fontSize: '13px',
              fontWeight: 300,
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.08em',
            }}
          >
            Preparing report...
          </p>
        </div>
      </div>
    );
  }

  const signals = report.signals ?? {};
  const isSale = report.listingType === 'sale';

  return (
    <div id="report-content" ref={containerRef}>
      {/* Chapter 1: Hero / Summary */}
      <section style={{ paddingTop: 'var(--space-4xl)', paddingBottom: 'var(--space-3xl)' }}>
        <VibeSummaryCard report={report} />
      </section>

      {/* Chapter 2: Environmental Signals */}
      <section
        className="stagger-children"
        style={{ paddingBottom: 'var(--space-3xl)' }}
      >
        <ChapterDivider overline="Chapter 02" title="Environmental Scan" />
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <AeroSonicCard noise={signals.noise} aqi={signals.aqi} />
        </div>
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <SolarPathCard solar={signals.solar} />
        </div>
        <div>
          <LocalNewsCard localNews={signals.localNews} />
        </div>
      </section>

      {/* Chapter 3: Personal Match */}
      <section
        className="stagger-children"
        style={{ paddingBottom: 'var(--space-3xl)' }}
      >
        <ChapterDivider overline="Chapter 03" title="Personal Matrix" />
        <div style={{ marginBottom: 'var(--space-lg)' }}>
          <HyperPersonalCard
            commute={signals.commute}
            preferences={preferences ?? report._preferences}
          />
        </div>
        <div>
          <CommunityPulseCard />
        </div>
      </section>

      {/* Chapter 4: Financial / Rental */}
      <section style={{ paddingBottom: 'var(--space-3xl)' }}>
        <ChapterDivider
          overline="Chapter 04"
          title={isSale ? 'Financial Analysis' : 'Rental Analysis'}
        />
        {isSale ? (
          <FinancialCard
            budget={signals.budget}
            financial={report.financial}
            financialNote={report.financialNote}
          />
        ) : (
          <RentalFitCard
            budget={signals.budget}
            financial={report.financial}
            financialNote={report.financialNote}
            preferences={preferences ?? report._preferences}
          />
        )}
      </section>

      {/* Share bar */}
      <section style={{ paddingBottom: 'var(--space-2xl)' }}>
        <SharePDFBar
          sessionId={report.sessionId}
          shareToken={shareToken}
          readonly={readonly}
        />
      </section>
    </div>
  );
}
