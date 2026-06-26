export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: number;
  category: string;
  tags: string[];
  content: string; // HTML string
  coverImage?: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'aqi-property-filter-india',
    title: 'AQI as a Property Filter: Why Air Quality Comes Before Location',
    excerpt:
      `Bengaluru's Outer Ring Road commands premium prices yet posts AQI readings that rival industrial zones. Before your broker shows you the view, here is what the air data says.`,
    date: '2026-06-15',
    readTime: 7,
    category: 'Signal Deep Dive',
    tags: ['AQI', 'Air Quality', 'Bengaluru', 'Mumbai', 'Property Research'],
    content: `
<p>When buyers say they want a property in a "good location," they almost always mean proximity to work, reputed schools, and main roads. Air quality is rarely part of the checklist — until after they move in.</p>

<p>That is a structural blind spot, and it is expensive.</p>

<h2>The Data Gap Nobody Talks About</h2>
<p>India operates <strong>over 800 CAAQMS (Continuous Ambient Air Quality Monitoring Stations)</strong> across major cities. The OpenAQ database — the same live feed VibeScout pulls — updates hourly. A PM2.5 reading above 60 µg/m³ is "Poor" under CPCB's National Air Quality Index. Above 90 is "Very Poor." Above 120 is "Severe."</p>

<p>Here is what that looks like in practice:</p>

<ul>
  <li><strong>Hebbal, Bengaluru</strong> — flyover interchange, multiple tech campuses, premium prices. Annual average PM2.5 regularly sits at 65–80 µg/m³.</li>
  <li><strong>Kharghar, Navi Mumbai</strong> — master-planned township, greens, wide roads. PM2.5 averages 45–55 µg/m³ — materially cleaner than the Mumbai mainland.</li>
  <li><strong>Kondapur, Hyderabad</strong> — HITEC-adjacent, high demand. 55–70 µg/m³ depending on season and construction phase.</li>
</ul>

<p>The gap between 45 and 80 µg/m³ is not aesthetic — it is the difference between "Satisfactory" and "Poor" air quality every day you live there.</p>

<h2>Why Proximity to Main Roads Is a Double-Edged Signal</h2>
<p>A property "close to the highway" or "on a main arterial road" shortens commute times but also concentrates vehicle exhaust. Diesel vehicles — trucks, buses, auto-rickshaws — emit PM2.5 and NO₂ in volumes that persist within 200–300 metres of the road corridor.</p>

<p>What the listing says: <em>"Well-connected, 5-min walk to main road."</em><br>
What the AQI data says: annual average PM2.5 8–15 µg/m³ higher than comparable units 400 metres set back from the same road.</p>

<h2>How to Use AQI Data Before Signing</h2>
<ol>
  <li><strong>Pull live readings, not annual averages.</strong> AQI spikes during Diwali, crop-burning season (Oct–Nov), and peak construction windows. Check the property's nearest CAAQMS station across at least three months.</li>
  <li><strong>Cross-reference wind direction.</strong> If a cement plant or industrial estate sits 1.5 km upwind, the property inherits its pollution load even if it is not in an "industrial area."</li>
  <li><strong>Adjust your price anchor.</strong> Poor-to-Very-Poor AQI is a quantifiable negative externality. A 10–12% discount relative to a comparable address with Satisfactory AQI is not unreasonable to demand.</li>
</ol>

<h2>What VibeScout Does</h2>
<p>Every VibeScout report fetches live AQI data from the OpenAQ v3 API for the exact coordinates of the property you submit — not a city-wide average. The verdict engine classifies the reading deterministically: green (Good/Satisfactory), amber (Moderate), or red (Poor/Very Poor/Severe), and the Groq layer adds a plain-language label.</p>

<p>No model "estimates" the air quality. No broker opinion. The number is live. The verdict is rules-based.</p>

<p>If the AQI card on your report shows a red flag, treat it as structural — the same way you would treat a foundation crack. Air quality at an address does not change because the interior is renovated.</p>

<h2>The Bottom Line</h2>
<p>AQI is not a soft preference. It is a chronic health exposure metric that you will live with every day. Properties with materially worse air quality carry a real cost — in health outcomes, in HVAC requirements, in long-run resale discount. Run the number before you negotiate. Certainly before you sign.</p>
    `,
  },
  {
    slug: 'noise-pollution-property-values-india',
    title: "Noise Pollution and Property Values: What the Listing Photos Don't Show",
    excerpt:
      'A flyover 200 metres away. A metro line under construction one street over. A temple with 5 AM speakers. The listing says "serene." The Overpass data disagrees.',
    date: '2026-06-10',
    readTime: 8,
    category: 'Signal Deep Dive',
    tags: ['Noise', 'Infrastructure', 'Pune', 'Hyderabad', 'Due Diligence'],
    content: `
<p>Noise is the most underrated property risk in Indian cities. Unlike air quality — which has a growing measurement infrastructure — noise is largely invisible in listing data. Sellers have no legal obligation to disclose it. Brokers rarely bring it up. And yet chronic high noise exposure directly correlates with health impacts, sleep quality, and — ultimately — resale liquidity.</p>

<h2>The Sources Nobody Puts in the Listing</h2>
<p>Indian urban noise comes in predictable patterns:</p>

<ul>
  <li><strong>Traffic corridors</strong> — National highways, state highways, ring roads. A property listed as "highway-facing" with a "great view" is also highway-noise-facing. At peak hours, traffic noise 20m from an NH can reach 75–85 dB(A). WHO recommends below 53 dB(A) for residential outdoor areas.</li>
  <li><strong>Metro and rail</strong> — Elevated metro lines generate 70–80 dB(A) at the nearest buildings. This matters especially in cities aggressively expanding metro networks: Bengaluru, Pune, Hyderabad, Navi Mumbai.</li>
  <li><strong>Religious infrastructure</strong> — Mosques, temples, and churches near residential buildings use public-address systems during prayer or festival times. The permitted dB limits under India's Noise Pollution Rules 2000 are routinely exceeded.</li>
  <li><strong>Active construction zones</strong> — Particularly relevant in high-growth corridors (Sarjapur Road, Wakad, Gachibowli). Construction noise can persist 5–7 years if a large township is going up adjacent to the property.</li>
</ul>

<h2>How VibeScout Estimates Noise Risk Without Sensors</h2>
<p>VibeScout doesn't use sound-level meters (that's physically impossible at scale). Instead, the noise signal is computed from <strong>OpenStreetMap Overpass API data</strong> — a community-maintained geospatial dataset that maps roads by classification, railways, airports, industrial zones, and place-of-worship locations to precise coordinates.</p>

<p>The risk engine assigns weighted scores based on:</p>
<ul>
  <li>Road class (motorway, primary, secondary, residential) and distance from property centroid</li>
  <li>Railway and metro line proximity (within 200m, 200–500m, 500m–1km)</li>
  <li>Airport traffic zone overlay</li>
  <li>Industrial land use within 1km radius</li>
  <li>Religious site density within 300m</li>
</ul>

<p>The result is a <strong>deterministic noise risk score</strong> — not an AI estimate, not a broker opinion. The same coordinates always produce the same output.</p>

<h2>A Practical Framework for Evaluating Noise</h2>

<h3>Visit at the right times</h3>
<p>Most site visits happen on weekday afternoons when school-run traffic and morning construction noise have passed. If you're seriously interested, visit:</p>
<ul>
  <li>6–8 AM on a weekday (construction start, morning traffic peak)</li>
  <li>8–9 PM on a weekend (ambient noise baseline, bar/restaurant activity nearby)</li>
  <li>Sunday morning (religious PA system exposure)</li>
</ul>

<h3>Floor matters</h3>
<p>Road and ground-source noise attenuates with height. Floors 1–5 in a high-rise adjacent to a primary road are substantially louder than floors 15–20. This is not linear — wind-borne noise behaviour at height is complex — but as a heuristic, higher floors near traffic corridors are meaningfully quieter.</p>

<h3>Glazing spec</h3>
<p>Double-glazed UPVC windows reduce ambient noise by 30–40 dB. In high-noise-risk properties, budget ₹80k–₹1.5L for window upgrades if the unit does not have them. This is a real cost that should be factored into negotiation.</p>

<h2>The Resale Implication</h2>
<p>High-noise properties tend to attract a narrower buyer pool at resale — investors looking for yield, rather than owner-occupiers who will live with the noise. This structurally limits price appreciation relative to comparable units in quieter zones. In luxury segments (₹1.5 Cr+), noise exposure is a hard filter for a growing share of buyers.</p>

<p>Check the signal before you sign. The listing photos are always taken from the angle that does not show the highway.</p>
    `,
  },
  {
    slug: 'rental-yield-reality-check-india',
    title: 'Rental Yield Reality Check: Why 4% Gross Rarely Means 4% Net',
    excerpt:
      'Developers quote gross yield. Brokers quote gross yield. The actual return after vacancy, maintenance, and capital expenditure is a different number entirely.',
    date: '2026-06-05',
    readTime: 9,
    category: 'Financial Intelligence',
    tags: ['Rental Yield', 'Investment', 'Returns', 'Financial Analysis', 'Mumbai', 'Bengaluru'],
    content: `
<p>The phrase "3.5% rental yield" appears in almost every investment-angle property pitch in India's major metros. It sounds precise. It is almost always misleading.</p>

<p>Here is why, and what the actual yield calculation looks like.</p>

<h2>What Gross Yield Ignores</h2>
<p>Gross yield is computed as: <code>(Annual Rent / Purchase Price) × 100</code>.</p>
<p>Example: A ₹80L apartment renting for ₹23,000/month = ₹2.76L annual rent = <strong>3.45% gross yield</strong>.</p>

<p>This number ignores everything that reduces what you actually receive:</p>

<ul>
  <li><strong>Vacancy</strong> — Most apartments sit empty 1–2 months per year between tenancies. At ₹23,000/month, that is ₹23,000–₹46,000 of lost rent, reducing effective yield to 3.16%–2.87%.</li>
  <li><strong>Society maintenance charges</strong> — Typically ₹3–6/sqft/month in mid-segment, ₹8–15/sqft in luxury. On a 1,000 sqft unit at ₹4/sqft: ₹48,000/year. Many landlords absorb this. That brings effective yield down to 2.56%.</li>
  <li><strong>Property tax</strong> — BBMP, BMC, GHMC — depends on city and built-up area. Rough range: ₹5,000–₹30,000/year for mid-segment residential.</li>
  <li><strong>Capital expenditure</strong> — Paint every 3–4 years (₹40,000–₹1L), appliance replacement, plumbing/electrical repairs. Budget 0.5–0.8% of property value per year as a maintenance reserve.</li>
  <li><strong>Broker fee on re-letting</strong> — Typically one month's rent = ₹23,000, amortised over a 1–2 year tenancy cycle.</li>
  <li><strong>Income tax on rental income</strong> — Rental income is added to total income and taxed at slab rate (minus 30% standard deduction on net rental income). For taxpayers in the 30% bracket, tax on the remaining 70% of rent = 21% effective tax on gross rent.</li>
</ul>

<h2>Running the Real Numbers</h2>
<table>
  <thead>
    <tr><th>Item</th><th>Amount (₹/yr)</th></tr>
  </thead>
  <tbody>
    <tr><td>Gross rental income</td><td>2,76,000</td></tr>
    <tr><td>Less: Vacancy (6 weeks)</td><td>−33,000</td></tr>
    <tr><td>Less: Maintenance charges</td><td>−48,000</td></tr>
    <tr><td>Less: Property tax</td><td>−12,000</td></tr>
    <tr><td>Less: Capex reserve (0.6%)</td><td>−48,000</td></tr>
    <tr><td>Less: Broker fee (amortised)</td><td>−11,500</td></tr>
    <tr><td><strong>Net pre-tax income</strong></td><td><strong>1,23,500</strong></td></tr>
    <tr><td>Less: Income tax (30% bracket, 30% std deduction)</td><td>−25,935</td></tr>
    <tr><td><strong>Net post-tax income</strong></td><td><strong>97,565</strong></td></tr>
    <tr><td><strong>Net post-tax yield on ₹80L</strong></td><td><strong>1.22%</strong></td></tr>
  </tbody>
</table>

<p>From 3.45% gross to 1.22% net. That is the reality of mid-segment residential rental in India's metros for a taxpayer in the top bracket.</p>

<h2>When Does Residential Rental Make Sense?</h2>
<p>Residential rental in India makes financial sense under a narrow set of conditions:</p>

<ul>
  <li><strong>Price appreciation thesis is strong.</strong> If you believe the locality will appreciate 8–12% CAGR over 7–10 years, the rental yield is supplemental. Total return (yield + appreciation) may justify the investment even at 1–2% net rental yield.</li>
  <li><strong>Rent escalation is built in.</strong> Mid-luxury and luxury rentals in Bengaluru's tech corridors (HSR, Sarjapur, Whitefield) have seen 6–10% annual rent escalation post-2021. If you can grow rent at 8%, a currently modest yield improves meaningfully over time.</li>
  <li><strong>You are in a lower tax bracket.</strong> For taxpayers below 20% slab, the post-tax hit is softer. Self-employed professionals with business income often have more tax-efficient structures for rental income.</li>
</ul>

<h2>What VibeScout Computes</h2>
<p>VibeScout's financial card for rental properties shows:</p>
<ul>
  <li><strong>Gross yield</strong> — benchmark against your location</li>
  <li><strong>Monthly rent-to-income ratio</strong> — is the rent sustainable relative to median incomes in the area?</li>
  <li><strong>Rent stress-free score</strong> — signal of how easily the unit should let at the listed rent</li>
</ul>

<p>We do not claim to predict your actual net yield — too many variables (your tax bracket, specific society charges, tenant quality) are outside the model. But we do surface the gross yield anchor and flag when listed prices imply yields that are structurally weak for the locality, so you enter negotiations with the right reference point.</p>

<p>Know the real number. Then decide.</p>
    `,
  },
  {
    slug: 'pre-purchase-intelligence-vs-post-purchase-regret',
    title: 'Pre-Purchase Intelligence vs. Post-Purchase Regret: The 5 Things You Cannot Undo',
    excerpt:
      'You can renovate an apartment. You cannot renovate a flight path, a sewage treatment plant upwind, or a zoning decision made two years before your purchase.',
    date: '2026-05-28',
    readTime: 6,
    category: 'Buying Guide',
    tags: ['Due Diligence', 'Property Buying', 'India Real Estate', 'Checklist'],
    content: `
<p>Most property regret in India falls into one of two categories: things you could have known before buying and things you genuinely could not have predicted. The first category is far larger than buyers realize, and the second is far smaller than sellers claim.</p>

<p>Here are five things that cannot be undone after the sale deed is registered — and what to check before you get there.</p>

<h2>1. The Road That Is Coming</h2>
<p>Infrastructure announcements often precede construction by 3–5 years. A metro corridor, a ring road widening, or a flyover extension can change the noise and pollution profile of an address permanently. The information is usually public — buried in city master plans, DCDP/DPDP documents, and metro authority websites — but requires deliberate research to surface.</p>

<p><strong>What to do:</strong> Search the city's <em>Draft Development Plan</em> for the survey number of your property. Check for road widening reservations, transport nodes, and designated commercial zoning adjacent to the plot. A DP reservation on your boundary can mean future compulsory acquisition — sometimes at rates below market.</p>

<h2>2. The Industrial Use Next Door</h2>
<p>Zoning in Indian cities is frequently violated and unevenly enforced. A residential apartment complex may legitimately sit in a zone where light industrial use is also permitted. As enforcement or commercial pressure changes over years, the building that opened as a warehouse during your site visit may become a chemical godown or a noisy manufacturing unit post-possession.</p>

<p><strong>What to do:</strong> Pull the land use classification from the municipal authority (BBMP for Bengaluru, BMC for Mumbai, GHMC for Hyderabad). Look for mixed-use, industrial, or transitional zone markers within 500m. If present, physically walk those plots and ask neighbouring residents what they have observed over the past three years.</p>

<h2>3. The Water Table and the STP</h2>
<p>Sewage Treatment Plants and water treatment facilities are a reality in any dense urban development. Proximity typically means periodic odour during treatment cycles — especially in humidity. Similarly, properties near nalas (urban stormwater channels) are flood-adjacent by definition, particularly as climate patterns shift and Indian cities face increasingly intense rainfall events.</p>

<p>Nala encroachments are common in Bengaluru, Hyderabad, and Mumbai's inner suburbs. Basement parking and lower floors of buildings on reclaimed nala land carry real inundation risk that does not appear in the listing.</p>

<p><strong>What to do:</strong> Check BBMP's GIS nala maps (or equivalent in your city). Ask about the basement's flood history from the building's maintenance team. Check if the property is in a floodplain overlay zone.</p>

<h2>4. The Builder's Approval and the OC</h2>
<p>Occupancy Certificates are the document that certifies a building has been constructed in accordance with its approved plan and is fit for occupancy. A substantial number of residential buildings in Indian cities — including premium ones — do not have OCs, are built beyond their approved FAR, or have unauthorized construction on upper floors.</p>

<p>Without an OC:</p>
<ul>
  <li>Some banks will not sanction a home loan</li>
  <li>Utilities (water, electricity) may be on a temporary or commercial connection</li>
  <li>The property is technically illegal and subject to demolition orders or regularisation demands</li>
  <li>Resale is complicated — you will face the same disclosure burden with your buyer</li>
</ul>

<p><strong>What to do:</strong> Demand the OC as a non-negotiable. If the builder says it is "in process" or "applied for," price that risk into your offer or walk away.</p>

<h2>5. The AQI, Noise, and Solar Exposure Profile</h2>
<p>This is where intelligence tools matter. Unlike zoning documents or OC status, environmental signals — air quality, noise risk, solar access — are dynamic and hyperlocal. A building that faces east on a major road in Whitefield has a fundamentally different daily exposure profile than one that faces west on a residential lane 400 metres away.</p>

<p>These signals are publicly available (OpenAQ, OpenStreetMap, PVGIS for solar), but assembling and interpreting them for a specific property requires technical infrastructure that most buyers do not have.</p>

<p><strong>What VibeScout does:</strong> Fetches live environmental data for the exact coordinates you submit, runs deterministic verdicts against quantitative thresholds, and flags where the property's profile diverges from what a reasonable buyer would expect at the listed price. No AI hallucination. No broker framing. Numbers and thresholds, documented and consistent.</p>

<h2>The Cost of Not Knowing</h2>
<p>Renovation costs ₹800–₹2,500/sqft. A new kitchen is ₹3–8L. A new bathroom is ₹2–5L. These are recoverable.</p>

<p>Moving costs — stamp duty, registration, broker fee, movers, temporary housing — run 6–9% of the transaction value. On a ₹1.2 Cr apartment, that is ₹7–11L to exit and re-enter the market.</p>

<p>The intelligence you needed before the first payment was, in most cases, available. The VibeScout report takes under five minutes to generate. The site visit checklist above takes three hours across two visits. The document review — RERA registration, OC, encumbrance certificate, DP extract — takes a weekend.</p>

<p>Spend the time before. The alternative is spending the money after.</p>
    `,
  },
];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts`, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error(`${res.status}`);
    const data = await res.json();
    return data.posts ?? [];
  } catch {
    return [];
  }
}

export async function fetchPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_BASE}/posts/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post ?? null;
  } catch {
    return null;
  }
}
