'use client';

import Link from 'next/link';
import ReportViewer from '../../../../components/report/ReportViewer';

// Whitefield, Bengaluru — Prestige Lakeside Habitat area
const PROPERTY_LAT = 12.9698;
const PROPERTY_LNG = 77.7500;

const MOCK_REPORT = {
  sessionId: 'preview-session',
  propertyName: 'Prestige Lakeside Habitat',
  headline: 'Well-balanced property with strong environmental scores',
  listingType: 'rent',
  bhk: '3 BHK',
  floor: '7',
  generatedAt: '2026-06-25T10:00:00.000Z',
  summary: {
    totalRedFlags: 1,
    totalCautions: 2,
    totalPasses: 4,
  },
  signals: {
    aqi: {
      value: 48,
      category: 'Good',
      verdict: 'pass',
      label: 'Air quality is well within safe limits. Suitable for daily outdoor activity.',
    },
    noise: {
      estimatedDb: 52,
      rawEstimatedDb: 62,
      category: 'Moderate · Floor 7 band',
      verdict: 'caution',
      label: 'Moderate road noise detected at street level. Upper floor provides ~10dB reduction.',
    },
    solar: {
      peakSunHours: 5.4,
      verdict: 'pass',
      label: 'Excellent solar exposure. South-facing windows will receive sunlight most of the day.',
    },
    commute: {
      estimatedMins: 38,
      verdict: 'red_flag',
      label: 'Commute exceeds your 30-minute threshold. Peak-hour traffic may add 10–15 mins.',
      propertyLat: PROPERTY_LAT,
      propertyLng: PROPERTY_LNG,
      workplaceLat: 12.9352,
      workplaceLng: 77.6245,
      polylinePoints: [
        { lat: 12.9698, lng: 77.7500 },
        { lat: 12.9680, lng: 77.7420 },
        { lat: 12.9650, lng: 77.7300 },
        { lat: 12.9620, lng: 77.7150 },
        { lat: 12.9580, lng: 77.7000 },
        { lat: 12.9540, lng: 77.6850 },
        { lat: 12.9500, lng: 77.6700 },
        { lat: 12.9460, lng: 77.6550 },
        { lat: 12.9420, lng: 77.6420 },
        { lat: 12.9390, lng: 77.6330 },
        { lat: 12.9352, lng: 77.6245 },
      ],
    },
    vastu: {
      facingDirection: 'North-East',
      vastuPreference: 'Yes',
      verdict: 'pass',
      label: 'North-East facing entry is considered highly auspicious per Vastu Shastra principles.',
    },
    community: {
      derivedCharacter: 'Family',
      userPreference: 'Family-friendly',
      verdict: 'pass',
      label: 'Strong family infrastructure. Schools and parks within walkable distance.',
      counts: {
        schoolsNear: 3,
        parksNear: 2,
        cafesNear: 5,
        gymsNear: 1,
      },
    },
    budget: {
      bracket: '₹35,000 – ₹45,000 / mo',
      verdict: 'caution',
      label: 'Rental price is near the upper edge of your stated budget.',
    },
    amenities: {
      hospitals: [
        { name: 'Manipal Hospital',  distanceM: 820,  lat: 12.9762, lng: 77.7558 },
        { name: 'Columbia Asia',     distanceM: 1400, lat: 12.9601, lng: 77.7392 },
      ],
      schools: [
        { name: 'Delhi Public School',         distanceM: 450,  lat: 12.9738, lng: 77.7455 },
        { name: 'Ryan International',          distanceM: 980,  lat: 12.9780, lng: 77.7588 },
        { name: 'Orchids The International',   distanceM: 1200, lat: 12.9810, lng: 77.7612 },
      ],
      parks: [
        { name: 'Lakeside Promenade',   distanceM: 310, lat: 12.9670, lng: 77.7472 },
        { name: 'Cubbon Annex Garden',  distanceM: 870, lat: 12.9725, lng: 77.7580 },
      ],
      cafes: [
        { name: 'Third Wave Coffee', distanceM: 180, lat: 12.9682, lng: 77.7518 },
        { name: 'Starbucks',         distanceM: 420, lat: 12.9720, lng: 77.7540 },
        { name: 'Blue Tokai',        distanceM: 650, lat: 12.9660, lng: 77.7440 },
      ],
      gyms: [
        { name: 'Cult Fit', distanceM: 560, lat: 12.9655, lng: 77.7462 },
      ],
      restaurants: [
        { name: 'Truffles',       distanceM: 290, lat: 12.9688, lng: 77.7527 },
        { name: 'Meghana Foods',  distanceM: 720, lat: 12.9730, lng: 77.7556 },
      ],
      worship: [
        { name: 'ISKCON Temple', distanceM: 1100, lat: 12.9795, lng: 77.7606 },
      ],
    },
    localNews: {
      headlines: [
        {
          title: 'Whitefield Metro Phase 3 to be operational by March 2027',
          snippet: 'Bengaluru Metro Rail Corporation confirms timeline for the eastern corridor extension.',
          source: 'The Hindu',
          publishedAt: '2026-06-20T08:00:00.000Z',
          url: '#',
          imageUrl: null,
        },
        {
          title: 'New flyover near Marathahalli to ease peak-hour traffic',
          snippet: 'BBMP-approved flyover project to cut average commute by 12 minutes, work begins Q3 2026.',
          source: 'Deccan Herald',
          publishedAt: '2026-06-18T12:00:00.000Z',
          url: '#',
          imageUrl: null,
        },
        {
          title: 'Varthur Lake restoration project wins national award',
          snippet: 'The 390-acre lake revival is now home to 47 migratory bird species.',
          source: 'Times of India',
          publishedAt: '2026-06-15T09:00:00.000Z',
          url: '#',
          imageUrl: null,
        },
        {
          title: 'Whitefield sees 18% rise in residential rentals year-on-year',
          snippet: 'IT corridor demand drives rental appreciation across premium housing societies.',
          source: 'Economic Times',
          publishedAt: '2026-06-10T07:30:00.000Z',
          url: '#',
          imageUrl: null,
        },
      ],
    },
    // Values below are real output from the live services for PROPERTY_LAT/LNG, so the
    // preview reflects what an actual Whitefield report renders.
    derivedSignals: {
      livabilityIndex: {
        score: 78,
        grade: 'B+',
        breakdown: {
          aqi:   { score: 88 },
          noise: { score: 68 },
          parks: { score: 70 },
          solar: { score: 82 },
        },
      },
      maturityScore: {
        score: 72,
        band: 'Established',
        counts: {
          schools: 3, hospitals: 2, cafes: 3,
          parks: 2, gyms: 1, restaurants: 2, worship: 1,
        },
      },
      solarSavings: {
        annualSavingsRs: 46800,
        annualKwh: 5850,
        dailyKwh: 16,
        panelKw: 3,
        displayText: '₹46,800/yr',
      },
      infrastructureMomentum: {
        hasSignals: true,
        count: 2,
        signals: [
          { title: 'Whitefield Metro Phase 3 to be operational by March 2027', matchedKeywords: ['metro', 'corridor'] },
          { title: 'New flyover near Marathahalli to ease peak-hour traffic',  matchedKeywords: ['flyover'] },
        ],
      },
      landHistory: {
        floodRisk: 'Low-Moderate',
        floodRiskScore: 25,
        waterOccurrence: null,
        nearestWaterBodyM: 420,
        reason: 'Nearest water body is 420m away',
        hasHistoricalWater: null,
        source: 'osm',
      },
      terrain: {
        elevationM: 887,
        surroundingMedianM: 879,
        relativeM: 8,
        localReliefM: 51,
        terrainPosition: 'Elevated',
        drainageRisk: 'Low',
        drainageScore: 12,
        reason: 'Property sits about 8m above the surrounding area — runoff drains away from this location.',
        isCoastal: false,
        confidence: 'moderate',
        samplesUsed: 37,
        source: 'open-meteo',
      },
    },
  },
  financial: {
    rentToIncomeRatio: 34,
    annualRentBurden: '₹4.8 L / year',
  },
};

const MOCK_PREFERENCES = {
  step5: {
    amenityPriorities: ['schools', 'parks'],
  },
};

export default function ReportPreviewPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>

      {/* ── Preview mode banner ─────────────────────────────────────── */}
      <div style={{
        position:   'fixed',
        top:        0,
        left:       0,
        right:      0,
        zIndex:     999,
        background: 'rgba(8,8,18,0.96)',
        borderBottom: '1px solid rgba(232,160,48,0.18)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>
        <div style={{
          maxWidth:       '1100px',
          margin:         '0 auto',
          padding:        '0 24px',
          height:         '52px',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          gap:            '16px',
        }}>
          {/* Left: brand + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.75)' }}>
                VIBESCOUT
              </span>
            </Link>
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.10)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontFamily:    "'Geist Mono', monospace",
                fontSize:      '9px',
                fontWeight:    600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color:         'rgba(232,160,48,0.80)',
                padding:       '3px 8px',
                background:    'rgba(232,160,48,0.08)',
                border:        '1px solid rgba(232,160,48,0.20)',
                borderRadius:  '4px',
              }}>
                Sample Report
              </span>
              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(255,255,255,0.28)', fontWeight: 300 }}>
                Prestige Lakeside Habitat · Whitefield, Bengaluru
              </span>
            </div>
          </div>

          {/* Right: CTA */}
          <Link
            href="/analyze"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '8px',
              padding:        '8px 18px',
              background:     '#E8A030',
              borderRadius:   '8px',
              textDecoration: 'none',
              fontFamily:     "'Inter', sans-serif",
              fontSize:       '12px',
              fontWeight:     600,
              color:          '#080812',
              letterSpacing:  '-0.01em',
              transition:     'all 200ms ease',
              boxShadow:      '0 4px 16px rgba(232,160,48,0.22)',
              whiteSpace:     'nowrap',
              flexShrink:     0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#D4911F'; e.currentTarget.style.boxShadow = '0 0 0 1px #E8A030, 0 4px 20px rgba(232,160,48,0.30)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#E8A030'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(232,160,48,0.22)'; }}
          >
            Run on your property →
          </Link>
        </div>
      </div>

      {/* ── Intro hero — positioned below banner ────────────────────── */}
      <div style={{
        paddingTop:     '52px',
        background:     '#080812',
        backgroundImage: 'var(--grid-bg-image)',
        backgroundSize:  '64px 64px',
        position:       'relative',
        overflow:       'hidden',
        borderBottom:   '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Ambient amber glow */}
        <div aria-hidden style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(232,160,48,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px 36px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ width: '16px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(232,160,48,0.7))' }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#E8A030', margin: 0 }}>
              SAMPLE INTELLIGENCE REPORT
            </p>
            <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, rgba(232,160,48,0.55), transparent)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px' }}>
                <span style={{ display: 'block', fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.12, color: 'rgba(255,255,255,0.92)' }}>
                  This is what a real report looks like.
                </span>
              </h1>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 400, lineHeight: 1.65, color: 'rgba(255,255,255,0.38)', margin: 0 }}>
                Six live signals. One honest verdict. Run yours in under 5 minutes.
              </p>
            </div>

            {/* Signal pill summary */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
              {[
                { label: '4 PASS', color: '#34D399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.20)' },
                { label: '2 CAUTION', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.20)' },
                { label: '1 FLAG', color: '#E63946', bg: 'rgba(230,57,70,0.08)', border: 'rgba(230,57,70,0.20)' },
              ].map(({ label, color, bg, border }) => (
                <span key={label} style={{ fontFamily: "'Geist Mono', monospace", fontSize: '9px', fontWeight: 600, letterSpacing: '0.10em', color, padding: '5px 10px', background: bg, border: `1px solid ${border}`, borderRadius: '5px' }}>
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Report viewer ────────────────────────────────────────────── */}
      <div style={{ paddingTop: '8px' }}>
        <ReportViewer
          report={MOCK_REPORT}
          shareToken={null}
          readonly={false}
          preferences={MOCK_PREFERENCES}
        />
      </div>

      {/* ── Bottom CTA bar ───────────────────────────────────────────── */}
      <div style={{
        background:   '#0A0A16',
        borderTop:    '1px solid rgba(232,160,48,0.12)',
        padding:      '36px 24px',
      }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(18px, 2.5vw, 26px)', fontWeight: 400, color: 'rgba(255,255,255,0.88)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Ready to audit your property?
            </p>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.35)', margin: 0 }}>
              One-time · ₹199 · Report ready in under 5 minutes
            </p>
          </div>
          <Link
            href="/analyze"
            style={{
              display:        'inline-flex',
              alignItems:     'center',
              gap:            '10px',
              padding:        '14px 28px',
              background:     '#E8A030',
              borderRadius:   '12px',
              textDecoration: 'none',
              fontFamily:     "'Inter', sans-serif",
              fontSize:       '14px',
              fontWeight:     600,
              color:          '#080812',
              letterSpacing:  '-0.01em',
              transition:     'all 200ms ease',
              boxShadow:      '0 8px 24px rgba(232,160,48,0.25)',
              flexShrink:     0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#D4911F'; e.currentTarget.style.boxShadow = '0 0 0 1px #E8A030, 0 8px 32px rgba(232,160,48,0.30)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#E8A030'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(232,160,48,0.25)'; }}
          >
            Run Intelligence on a Property →
          </Link>
        </div>
      </div>
    </div>
  );
}
