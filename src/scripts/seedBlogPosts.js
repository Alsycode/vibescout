// Run: node --env-file=.env src/scripts/seedBlogPosts.js
import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost.js';

const POSTS = [
  {
    slug: 'aqi-property-filter-india',
    title: 'AQI as a Property Filter: Why Air Quality Comes Before Location',
    excerpt: `Bengaluru's Outer Ring Road commands premium prices yet posts AQI readings that rival industrial zones. Before your broker shows you the view, here is what the air data says.`,
    date: '2026-06-15',
    readTime: 7,
    category: 'Signal Deep Dive',
    tags: ['AQI', 'Air Quality', 'Bengaluru', 'Mumbai', 'Property Research'],
    published: true,
    coverImage: '',
    content: `
<p>When buyers say they want a property in a "good location," they almost always mean proximity to work, reputed schools, and main roads. Air quality is rarely part of the checklist — until after they move in.</p>
<p>That is a structural blind spot, and it is expensive.</p>
<h2>The Data Gap Nobody Talks About</h2>
<p>India operates <strong>over 800 CAAQMS (Continuous Ambient Air Quality Monitoring Stations)</strong> across major cities. The OpenAQ database — the same live feed VibeScout pulls — updates hourly. A PM2.5 reading above 60 µg/m³ is "Poor" under CPCB's National Air Quality Index. Above 90 is "Very Poor." Above 120 is "Severe."</p>
<ul>
  <li><strong>Hebbal, Bengaluru</strong> — flyover interchange, multiple tech campuses, premium prices. Annual average PM2.5 regularly sits at 65–80 µg/m³.</li>
  <li><strong>Kharghar, Navi Mumbai</strong> — master-planned township, greens, wide roads. PM2.5 averages 45–55 µg/m³ — materially cleaner than the Mumbai mainland.</li>
  <li><strong>Kondapur, Hyderabad</strong> — HITEC-adjacent, high demand. 55–70 µg/m³ depending on season and construction phase.</li>
</ul>
<h2>Why Proximity to Main Roads Is a Double-Edged Signal</h2>
<p>A property "close to the highway" or "on a main arterial road" shortens commute times but also concentrates vehicle exhaust. Diesel vehicles emit PM2.5 and NO₂ in volumes that persist within 200–300 metres of the road corridor.</p>
<h2>How to Use AQI Data Before Signing</h2>
<ol>
  <li><strong>Pull live readings, not annual averages.</strong> AQI spikes during Diwali, crop-burning season, and peak construction windows.</li>
  <li><strong>Cross-reference wind direction.</strong> If a cement plant sits 1.5 km upwind, the property inherits its pollution load.</li>
  <li><strong>Adjust your price anchor.</strong> Poor-to-Very-Poor AQI is a quantifiable negative externality.</li>
</ol>
<h2>What VibeScout Does</h2>
<p>Every VibeScout report fetches live AQI data from the OpenAQ v3 API for the exact coordinates of the property you submit — not a city-wide average. The verdict engine classifies the reading deterministically.</p>
<h2>The Bottom Line</h2>
<p>AQI is not a soft preference. It is a chronic health exposure metric. Run the number before you negotiate. Certainly before you sign.</p>
    `,
  },
  {
    slug: 'noise-pollution-property-values-india',
    title: "Noise Pollution and Property Values: What the Listing Photos Don't Show",
    excerpt: 'A flyover 200 metres away. A metro line under construction one street over. A temple with 5 AM speakers. The listing says "serene." The Overpass data disagrees.',
    date: '2026-06-10',
    readTime: 8,
    category: 'Signal Deep Dive',
    tags: ['Noise', 'Infrastructure', 'Pune', 'Hyderabad', 'Due Diligence'],
    published: true,
    coverImage: '',
    content: `
<p>Noise is the most underrated property risk in Indian cities. Unlike air quality — which has a growing measurement infrastructure — noise is largely invisible in listing data.</p>
<h2>The Sources Nobody Puts in the Listing</h2>
<ul>
  <li><strong>Traffic corridors</strong> — At peak hours, traffic noise 20m from an NH can reach 75–85 dB(A). WHO recommends below 53 dB(A) for residential outdoor areas.</li>
  <li><strong>Metro and rail</strong> — Elevated metro lines generate 70–80 dB(A) at the nearest buildings.</li>
  <li><strong>Religious infrastructure</strong> — Mosques, temples, and churches use public-address systems during prayer or festival times.</li>
  <li><strong>Active construction zones</strong> — Construction noise can persist 5–7 years if a large township is going up adjacent to the property.</li>
</ul>
<h2>How VibeScout Estimates Noise Risk</h2>
<p>VibeScout uses <strong>OpenStreetMap Overpass API data</strong> — assigning weighted scores based on road class, railway proximity, airport zones, industrial land use, and religious site density. The result is a <strong>deterministic noise risk score</strong> — not an AI estimate.</p>
<h2>A Practical Framework</h2>
<p>Visit at 6–8 AM on a weekday, 8–9 PM on a weekend, and Sunday morning to catch religious PA systems. Higher floors near traffic corridors are meaningfully quieter. Double-glazed UPVC windows reduce ambient noise by 30–40 dB — budget ₹80k–₹1.5L if the unit doesn't have them.</p>
<h2>The Resale Implication</h2>
<p>High-noise properties attract a narrower buyer pool at resale, limiting price appreciation relative to comparable units in quieter zones.</p>
    `,
  },
  {
    slug: 'rental-yield-reality-check-india',
    title: 'Rental Yield Reality Check: Why 4% Gross Rarely Means 4% Net',
    excerpt: 'Developers quote gross yield. Brokers quote gross yield. The actual return after vacancy, maintenance, and capital expenditure is a different number entirely.',
    date: '2026-06-05',
    readTime: 9,
    category: 'Financial Intelligence',
    tags: ['Rental Yield', 'Investment', 'Returns', 'Financial Analysis', 'Mumbai', 'Bengaluru'],
    published: true,
    coverImage: '',
    content: `
<p>The phrase "3.5% rental yield" appears in almost every investment-angle property pitch in India's major metros. It sounds precise. It is almost always misleading.</p>
<h2>What Gross Yield Ignores</h2>
<p>Gross yield = <code>(Annual Rent / Purchase Price) × 100</code>. Example: ₹80L apartment at ₹23,000/month = <strong>3.45% gross yield</strong>. This ignores:</p>
<ul>
  <li><strong>Vacancy</strong> — 1–2 months/year = ₹23,000–₹46,000 lost</li>
  <li><strong>Society maintenance charges</strong> — ₹3–6/sqft/month in mid-segment</li>
  <li><strong>Property tax</strong> — ₹5,000–₹30,000/year</li>
  <li><strong>Capital expenditure</strong> — budget 0.5–0.8% of property value/year</li>
  <li><strong>Income tax</strong> — 21% effective tax on gross rent for 30% bracket taxpayers</li>
</ul>
<h2>The Real Numbers</h2>
<table>
  <thead><tr><th>Item</th><th>Amount (₹/yr)</th></tr></thead>
  <tbody>
    <tr><td>Gross rental income</td><td>2,76,000</td></tr>
    <tr><td>Less: Vacancy, maintenance, tax, capex, broker</td><td>−1,52,500</td></tr>
    <tr><td><strong>Net pre-tax income</strong></td><td><strong>1,23,500</strong></td></tr>
    <tr><td>Less: Income tax (30% bracket)</td><td>−25,935</td></tr>
    <tr><td><strong>Net post-tax yield on ₹80L</strong></td><td><strong>1.22%</strong></td></tr>
  </tbody>
</table>
<p>From 3.45% gross to 1.22% net. Know the real number. Then decide.</p>
    `,
  },
  {
    slug: 'pre-purchase-intelligence-vs-post-purchase-regret',
    title: 'Pre-Purchase Intelligence vs. Post-Purchase Regret: The 5 Things You Cannot Undo',
    excerpt: 'You can renovate an apartment. You cannot renovate a flight path, a sewage treatment plant upwind, or a zoning decision made two years before your purchase.',
    date: '2026-05-28',
    readTime: 6,
    category: 'Buying Guide',
    tags: ['Due Diligence', 'Property Buying', 'India Real Estate', 'Checklist'],
    published: true,
    coverImage: '',
    content: `
<p>Most property regret in India falls into one of two categories: things you could have known before buying and things you genuinely could not have predicted. The first category is far larger than buyers realize.</p>
<h2>1. The Road That Is Coming</h2>
<p>Infrastructure announcements often precede construction by 3–5 years. Search the city's <em>Draft Development Plan</em> for the survey number of your property. Check for road widening reservations and transport nodes.</p>
<h2>2. The Industrial Use Next Door</h2>
<p>Zoning in Indian cities is frequently violated. Pull the land use classification from the municipal authority and look for mixed-use or industrial zone markers within 500m.</p>
<h2>3. The Water Table and the STP</h2>
<p>Sewage Treatment Plants near residential buildings cause periodic odour. Properties near nalas carry real inundation risk. Check BBMP's GIS nala maps and ask about flood history.</p>
<h2>4. The Builder's Approval and the OC</h2>
<p>Without an Occupancy Certificate: banks may not sanction a loan, utilities may be on temporary connections, and the property is technically illegal. Demand the OC as a non-negotiable.</p>
<h2>5. The AQI, Noise, and Solar Exposure Profile</h2>
<p>These signals are publicly available (OpenAQ, OpenStreetMap, PVGIS for solar), but assembling them for a specific property requires technical infrastructure that most buyers lack. VibeScout fetches live environmental data for the exact coordinates you submit and runs deterministic verdicts.</p>
<h2>The Cost of Not Knowing</h2>
<p>Moving costs — stamp duty, registration, broker fee, movers — run 6–9% of the transaction value. On a ₹1.2 Cr apartment, that is ₹7–11L to exit and re-enter the market. Spend the time before.</p>
    `,
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  let created = 0;
  let skipped = 0;

  for (const post of POSTS) {
    const exists = await BlogPost.findOne({ slug: post.slug });
    if (exists) {
      console.log(`  skip  ${post.slug} (already exists)`);
      skipped++;
    } else {
      await BlogPost.create(post);
      console.log(`  seed  ${post.slug}`);
      created++;
    }
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
