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
      // Map coordinates — property + workplace + route
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
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', paddingTop: '56px' }}>
      {/* Dev banner */}
      <div style={{
        position: 'fixed', top: 56, left: 0, right: 0, zIndex: 999,
        background: 'rgba(232,160,48,0.12)', borderBottom: '1px solid rgba(232,160,48,0.25)',
        padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(232,160,48,0.8)' }}>
          Preview Mode
        </span>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          Mock report — edit components/report/* to see changes live
        </span>
      </div>
      <div style={{ paddingTop: 32 }}>
        <ReportViewer
          report={MOCK_REPORT}
          shareToken={null}
          readonly={false}
          preferences={MOCK_PREFERENCES}
        />
      </div>
    </div>
  );
}
