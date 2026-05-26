// FILE: scripts/seedShadowProperties.js
// PURPOSE: Seed 10 completed ShadowProperty documents — 5 sale + 5 rent — with realistic intelligence data

import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'crypto';
import ShadowProperty from '../src/models/ShadowProperty.js';

function sessionId() {
  return crypto.randomBytes(12).toString('hex');
}

// expiresAt 365 days out so seed documents persist through development
function expiresAt() {
  return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
}

const PROPERTIES = [
  // ── SALE (5) ────────────────────────────────────────────────────────────────
  {
    name: 'Prestige Lakeside Habitat, Whitefield',
    coordinates: { lat: 12.97, lng: 77.75 },
    clusterId: '12.97_77.75',
    listingType: 'sale',
    budgetBracket: '1Cr–1.5Cr',
    bhk: '3BHK',
    floor: '4–7',
    intelligence: {
      aqi: { value: 78, category: 'Satisfactory', source: 'live' },
      noise: { estimatedDb: 58, category: 'Moderate', source: 'live' },
      solar: { peakSunHours: 5.8, viability: 'Good', morningScore: 7, wfhLightScore: 8, acSavingsEstimate: 4200, source: 'live' },
      weather: { temp: 24, humidity: 62, source: 'live' },
      amenities: {
        schools:   [{ name: 'Delhi Public School Whitefield', distanceM: 520 }],
        hospitals: [{ name: 'Columbia Asia Hospital', distanceM: 1200 }],
        parks:     [{ name: 'Whitefield Lake Park', distanceM: 680 }],
        gyms:      [{ name: 'Gold's Gym Whitefield', distanceM: 750 }],
        cafes:     [{ name: 'Café Coffee Day', distanceM: 310 }],
        source: 'live',
      },
      localNews: {
        headlines: [
          { title: 'Whitefield metro extension gets green signal', url: 'https://example.com/1', source: 'The Hindu', publishedAt: new Date('2026-05-10'), snippet: 'Phase 3 of Namma Metro to cover Whitefield outer ring.' },
          { title: 'IT corridor property prices rise 12% in Q1 2026', url: 'https://example.com/2', source: 'Economic Times', publishedAt: new Date('2026-05-08'), snippet: 'Whitefield and Marathahalli see sustained demand.' },
        ],
        source: 'gnews',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'live', noise: 'live', solar: 'live', weather: 'live', amenities: 'live', localNews: 'gnews' },
  },
  {
    name: 'Hiranandani Estate, Powai',
    coordinates: { lat: 19.12, lng: 72.90 },
    clusterId: '19.12_72.90',
    listingType: 'sale',
    budgetBracket: '2Cr–3Cr',
    bhk: '2BHK',
    floor: '8–15',
    intelligence: {
      aqi: { value: 142, category: 'Poor', source: 'cache' },
      noise: { estimatedDb: 72, category: 'Loud', source: 'estimated' },
      solar: { peakSunHours: 5.1, viability: 'Good', morningScore: 6, wfhLightScore: 7, acSavingsEstimate: 3600, source: 'live' },
      weather: { temp: 31, humidity: 80, source: 'live' },
      amenities: {
        schools:   [{ name: 'Bombay Scottish School', distanceM: 900 }],
        hospitals: [{ name: 'Hiranandani Hospital', distanceM: 450 }],
        parks:     [{ name: 'Powai Lake Promenade', distanceM: 600 }],
        gyms:      [{ name: 'Cult.fit Powai', distanceM: 380 }],
        cafes:     [{ name: 'Starbucks Powai', distanceM: 220 }],
        source: 'live',
      },
      localNews: {
        headlines: [
          { title: 'Powai lake water levels at decade high after monsoon', url: 'https://example.com/3', source: 'Mumbai Mirror', publishedAt: new Date('2026-05-12'), snippet: 'Residents relieved as lake rejuvenation project shows results.' },
        ],
        source: 'newsapi',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'cache', noise: 'estimated', solar: 'live', weather: 'live', amenities: 'live', localNews: 'newsapi' },
  },
  {
    name: 'VGN Stafford, Anna Nagar',
    coordinates: { lat: 13.08, lng: 80.27 },
    clusterId: '13.08_80.27',
    listingType: 'sale',
    budgetBracket: '60L–1Cr',
    bhk: '2BHK',
    floor: '1–3',
    intelligence: {
      aqi: { value: 95, category: 'Satisfactory', source: 'live' },
      noise: { estimatedDb: 62, category: 'Moderate', source: 'cache' },
      solar: { peakSunHours: 6.2, viability: 'Good', morningScore: 8, wfhLightScore: 9, acSavingsEstimate: 5100, source: 'live' },
      weather: { temp: 33, humidity: 72, source: 'live' },
      amenities: {
        schools:   [{ name: 'Anna Nagar Government School', distanceM: 400 }, { name: 'Chinmaya Vidyalaya', distanceM: 780 }],
        hospitals: [{ name: 'Apollo Speciality Hospital', distanceM: 1100 }],
        parks:     [{ name: 'Anna Nagar Tower Park', distanceM: 550 }],
        gyms:      [{ name: 'Snap Fitness Anna Nagar', distanceM: 620 }],
        cafes:     [{ name: 'Saravana Bhavan Café', distanceM: 180 }],
        source: 'cache',
      },
      localNews: {
        headlines: [],
        source: 'fallback',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'live', noise: 'cache', solar: 'live', weather: 'live', amenities: 'cache', localNews: 'fallback' },
  },
  {
    name: 'Sobha City, Kondhwa, Pune',
    coordinates: { lat: 18.52, lng: 73.87 },
    clusterId: '18.52_73.87',
    listingType: 'sale',
    budgetBracket: '1.5Cr–2Cr',
    bhk: '3BHK',
    floor: '4–7',
    intelligence: {
      aqi: { value: 68, category: 'Satisfactory', source: 'live' },
      noise: { estimatedDb: 52, category: 'Moderate', source: 'live' },
      solar: { peakSunHours: 6.0, viability: 'Good', morningScore: 8, wfhLightScore: 8, acSavingsEstimate: 4800, source: 'computed' },
      weather: { temp: 27, humidity: 55, source: 'seasonal' },
      amenities: {
        schools:   [{ name: 'St. Joseph's School', distanceM: 650 }],
        hospitals: [{ name: 'Jehangir Hospital', distanceM: 2100 }],
        parks:     [{ name: 'Kothrud Central Park', distanceM: 430 }],
        gyms:      [{ name: 'Fitness First Kothrud', distanceM: 520 }],
        cafes:     [{ name: 'The Coffee House', distanceM: 290 }],
        source: 'seed',
      },
      localNews: {
        headlines: [
          { title: 'Pune ring road final alignment approved', url: 'https://example.com/4', source: 'Pune Mirror', publishedAt: new Date('2026-05-09'), snippet: 'Connectivity boost expected for Kothrud and surrounding suburbs.' },
        ],
        source: 'google-rss',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'live', noise: 'live', solar: 'computed', weather: 'seasonal', amenities: 'seed', localNews: 'google-rss' },
  },
  {
    name: 'DLF Camellias, Gurugram',
    coordinates: { lat: 28.47, lng: 77.03 },
    clusterId: '28.47_77.03',
    listingType: 'sale',
    budgetBracket: 'Above 5Cr',
    bhk: '4BHK+',
    floor: '16+',
    intelligence: {
      aqi: { value: 198, category: 'Moderate', source: 'city_average' },
      noise: { estimatedDb: 78, category: 'Very Loud', source: 'estimated' },
      solar: { peakSunHours: 5.5, viability: 'Good', morningScore: 7, wfhLightScore: 7, acSavingsEstimate: 4500, source: 'live' },
      weather: { temp: 38, humidity: 28, source: 'live' },
      amenities: {
        schools:   [{ name: 'DPS Gurugram', distanceM: 1800 }],
        hospitals: [{ name: 'Medanta Hospital', distanceM: 3200 }],
        parks:     [{ name: 'Leisure Valley Park', distanceM: 2100 }],
        gyms:      [{ name: 'Gold's Gym Golf Course Road', distanceM: 1400 }],
        cafes:     [{ name: 'Starbucks Cyber Hub', distanceM: 950 }],
        source: 'live',
      },
      localNews: {
        headlines: [
          { title: 'Gurugram air quality hits seasonal low amid construction surge', url: 'https://example.com/5', source: 'Hindustan Times', publishedAt: new Date('2026-05-11'), snippet: 'AQI in many sectors crosses 200 mark in May.' },
          { title: 'New expressway to cut Gurugram–Delhi travel time by 30%', url: 'https://example.com/6', source: 'Times of India', publishedAt: new Date('2026-05-07'), snippet: 'NHAI approves 6-lane elevated corridor project.' },
        ],
        source: 'gnews',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'city_average', noise: 'estimated', solar: 'live', weather: 'live', amenities: 'live', localNews: 'gnews' },
  },

  // ── RENT (5) ─────────────────────────────────────────────────────────────────
  {
    name: 'Brigade Meadows, Koramangala',
    coordinates: { lat: 12.97, lng: 77.59 },
    clusterId: '12.97_77.59',
    listingType: 'rent',
    budgetBracket: '35K–50K',
    bhk: '2BHK',
    floor: '1–3',
    intelligence: {
      aqi: { value: 82, category: 'Satisfactory', source: 'live' },
      noise: { estimatedDb: 65, category: 'Moderate', source: 'live' },
      solar: { peakSunHours: 5.6, viability: 'Good', morningScore: 7, wfhLightScore: 8, acSavingsEstimate: 4100, source: 'live' },
      weather: { temp: 23, humidity: 60, source: 'live' },
      amenities: {
        schools:   [{ name: 'National Public School', distanceM: 720 }],
        hospitals: [{ name: 'Apollo Koramangala', distanceM: 850 }],
        parks:     [{ name: 'Koramangala 5th Block Park', distanceM: 380 }],
        gyms:      [{ name: 'Cult.fit Koramangala', distanceM: 440 }],
        cafes:     [{ name: 'Third Wave Coffee', distanceM: 260 }],
        source: 'live',
      },
      localNews: {
        headlines: [
          { title: 'Koramangala startup ecosystem ranks top 3 in Asia', url: 'https://example.com/7', source: 'YourStory', publishedAt: new Date('2026-05-13'), snippet: 'Over 400 active startups in the 1-sq-km corridor.' },
        ],
        source: 'gnews',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'live', noise: 'live', solar: 'live', weather: 'live', amenities: 'live', localNews: 'gnews' },
  },
  {
    name: 'Edappally Metro Residences, Kochi',
    coordinates: { lat: 9.97, lng: 76.28 },
    clusterId: '9.97_76.28',
    listingType: 'rent',
    budgetBracket: '20K–35K',
    bhk: '2BHK',
    floor: 'Ground',
    intelligence: {
      aqi: { value: 38, category: 'Good', source: 'live' },
      noise: { estimatedDb: 55, category: 'Moderate', source: 'cache' },
      solar: { peakSunHours: 4.8, viability: 'Moderate', morningScore: 6, wfhLightScore: 7, acSavingsEstimate: 3200, source: 'live' },
      weather: { temp: 30, humidity: 82, source: 'live' },
      amenities: {
        schools:   [{ name: 'St. George's School Edappally', distanceM: 560 }],
        hospitals: [{ name: 'Lakeshore Hospital', distanceM: 1300 }],
        parks:     [{ name: 'Edappally Waterfront', distanceM: 820 }],
        gyms:      [{ name: 'Talrop Fitness', distanceM: 700 }],
        cafes:     [{ name: 'Indian Coffee House', distanceM: 200 }],
        source: 'live',
      },
      localNews: {
        headlines: [
          { title: 'Kochi Metro phase 2 reaches Edappally interchange', url: 'https://example.com/8', source: 'The Hindu', publishedAt: new Date('2026-05-06'), snippet: 'Direct connectivity to MG Road now operational.' },
        ],
        source: 'gnews',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'live', noise: 'cache', solar: 'live', weather: 'live', amenities: 'live', localNews: 'gnews' },
  },
  {
    name: 'Indiabulls Greens, Panvel, Mumbai',
    coordinates: { lat: 19.01, lng: 72.85 },
    clusterId: '19.01_72.85',
    listingType: 'rent',
    budgetBracket: '50K–75K',
    bhk: '3BHK',
    floor: '8–15',
    intelligence: {
      aqi: { value: 118, category: 'Moderate', source: 'cache' },
      noise: { estimatedDb: 70, category: 'Loud', source: 'estimated' },
      solar: { peakSunHours: 5.0, viability: 'Good', morningScore: 6, wfhLightScore: 7, acSavingsEstimate: 3500, source: 'computed' },
      weather: { temp: 32, humidity: 78, source: 'seasonal' },
      amenities: {
        schools:   [{ name: 'Ryan International School BKC', distanceM: 1600 }],
        hospitals: [{ name: 'Lilavati Hospital', distanceM: 2200 }],
        parks:     [{ name: 'Bandra Reclamation Garden', distanceM: 900 }],
        gyms:      [{ name: 'F45 Training BKC', distanceM: 1100 }],
        cafes:     [{ name: 'Blue Tokai Coffee', distanceM: 680 }],
        source: 'seed',
      },
      localNews: {
        headlines: [],
        source: 'fallback',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'cache', noise: 'estimated', solar: 'computed', weather: 'seasonal', amenities: 'seed', localNews: 'fallback' },
  },
  {
    name: 'Aparna Sarovar, Kondapur, Hyderabad',
    coordinates: { lat: 17.49, lng: 78.39 },
    clusterId: '17.49_78.39',
    listingType: 'rent',
    budgetBracket: '20K–35K',
    bhk: '2BHK',
    floor: '4–7',
    intelligence: {
      aqi: { value: 88, category: 'Satisfactory', source: 'live' },
      noise: { estimatedDb: 60, category: 'Moderate', source: 'live' },
      solar: { peakSunHours: 6.4, viability: 'Good', morningScore: 8, wfhLightScore: 9, acSavingsEstimate: 5400, source: 'live' },
      weather: { temp: 35, humidity: 45, source: 'live' },
      amenities: {
        schools:   [{ name: 'Glendale Academy', distanceM: 830 }],
        hospitals: [{ name: 'Continental Hospital', distanceM: 1500 }],
        parks:     [{ name: 'Kondapur Central Park', distanceM: 470 }],
        gyms:      [{ name: 'Anytime Fitness Kondapur', distanceM: 550 }],
        cafes:     [{ name: 'Starbucks Kondapur', distanceM: 320 }],
        source: 'live',
      },
      localNews: {
        headlines: [
          { title: 'Hyderabad ranked best city for IT professionals 2026', url: 'https://example.com/9', source: 'Deccan Chronicle', publishedAt: new Date('2026-05-14'), snippet: 'Kondapur and Gachibowli remain top choices for tech workers.' },
        ],
        source: 'newsapi',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'live', noise: 'live', solar: 'live', weather: 'live', amenities: 'live', localNews: 'newsapi' },
  },
  {
    name: 'Unitech Cascades, Sector 50, Noida',
    coordinates: { lat: 28.53, lng: 77.39 },
    clusterId: '28.53_77.39',
    listingType: 'rent',
    budgetBracket: '35K–50K',
    bhk: '3BHK',
    floor: '4–7',
    intelligence: {
      aqi: { value: 215, category: 'Poor', source: 'city_average' },
      noise: { estimatedDb: 74, category: 'Loud', source: 'estimated' },
      solar: { peakSunHours: 5.3, viability: 'Good', morningScore: 7, wfhLightScore: 7, acSavingsEstimate: 4300, source: 'live' },
      weather: { temp: 40, humidity: 30, source: 'live' },
      amenities: {
        schools:   [{ name: 'Delhi Public School Sector 45', distanceM: 1200 }],
        hospitals: [{ name: 'Fortis Hospital Sector 62', distanceM: 2800 }],
        parks:     [{ name: 'Sector 50 Community Park', distanceM: 350 }],
        gyms:      [{ name: 'Snap Fitness Noida', distanceM: 760 }],
        cafes:     [{ name: 'Barista Sector 18', distanceM: 1400 }],
        source: 'cache',
      },
      localNews: {
        headlines: [
          { title: 'Noida-Greater Noida expressway speed limit raised to 120 kmph', url: 'https://example.com/10', source: 'Times of India', publishedAt: new Date('2026-05-10'), snippet: 'NHAI confirms upgrade after infrastructure audit.' },
        ],
        source: 'google-rss',
        updatedAt: new Date(),
      },
    },
    dataSource: { aqi: 'city_average', noise: 'estimated', solar: 'live', weather: 'live', amenities: 'cache', localNews: 'google-rss' },
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seedShadowProperties] Connected to MongoDB');

  let created = 0;
  const insertedIds = [];

  for (const p of PROPERTIES) {
    const sid = sessionId();
    const doc = await ShadowProperty.create({
      sessionId: sid,
      placeId: null,
      name: p.name,
      coordinates: p.coordinates,
      confirmedByUser: true,
      clusterId: p.clusterId,
      userProvidedSpecs: {
        budgetBracket: p.budgetBracket,
        bhk: p.bhk,
        floor: p.floor,
        listingType: p.listingType,
      },
      intelligence: p.intelligence,
      dataSource: p.dataSource,
      status: 'completed',
      expiresAt: expiresAt(),
    });
    insertedIds.push({ id: doc._id, sessionId: sid, name: p.name, listingType: p.listingType });
    console.log(`[seedShadowProperties] Created: ${p.name} (${p.listingType}) — ${sid}`);
    created++;
  }

  console.log(`[seedShadowProperties] Done. Created ${created} documents.`);
  console.log('[seedShadowProperties] IDs for seedLeads.js:');
  insertedIds.slice(0, 2).forEach((d) => console.log(`  ${d.id} | ${d.sessionId} | ${d.name}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seedShadowProperties] Fatal error:', err);
  process.exit(1);
});
