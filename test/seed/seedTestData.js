// FILE: test/seed/seedTestData.js
// PURPOSE: Populate a disposable test database with a known fixture set:
//          1 admin, 2 normal users, 1 completed ShadowProperty + report (owned +
//          unlocked by user1), and 1 completed-but-locked ShadowProperty.
//
// Run:  npm run seed:test              (uses .env.test if present, else .env)
//       node test/seed/seedTestData.js --fresh    (wipe the 2 collections first)
//       node test/seed/seedTestData.js --force    (allow a non-"_test" DB name)
//
// Also importable: `import { seedTestData } from '.../seedTestData.js'` for use
// inside integration suites after connectTestDb().

import { fileURLToPath } from 'node:url';
import { realpathSync } from 'node:fs';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import User from '../../src/models/User.js';
import ShadowProperty from '../../src/models/ShadowProperty.js';
import Report from '../../src/models/Report.js';
import Payment from '../../src/models/Payment.js';
import {
  SEED_PASSWORD,
  seedUsers,
  seedSessions,
  seedShareToken,
  seedClusterId,
} from '../fixtures/seedData.js';

const BCRYPT_COST = 12; // matches src/routes/auth.routes.js

function isTestDbName(uri) {
  if (!uri) return false;
  const name = uri.split('/').pop().split('?')[0];
  return /_test(\b|$)/.test(name);
}

function buildCompletedIntelligence() {
  return {
    aqi: { value: 78, category: 'Poor', source: 'city_average' },
    noise: { estimatedDb: 62, category: 'Moderate', noiseRiskScore: 48, confidence: 'medium', source: 'osm_cache' },
    solar: { peakSunHours: 5.4, wfhLightScore: 72, viability: 'Good', source: 'computed' },
    weather: { temp: 27, humidity: 64, description: 'Partly cloudy', source: 'seasonal' },
    amenities: {
      schools: [{ name: 'Seed Public School', distanceM: 420 }],
      hospitals: [{ name: 'Seed Multispeciality', distanceM: 900 }],
      parks: [{ name: 'Seed Park', distanceM: 310 }],
      gyms: [{ name: 'Seed Gym', distanceM: 550 }],
      cafes: [{ name: 'Seed Cafe', distanceM: 180 }],
      source: 'seed',
    },
  };
}

function buildReportSnapshot(sessionId) {
  return {
    sessionId,
    summary: { headline: 'Seed report — deterministic fixture', keywords: ['seed', 'fixture'] },
    signals: { aqi: 'caution', noise: 'caution', solar: 'pass', amenity: 'pass', commute: 'pass', budget: 'pass' },
    financial: { emiPercent: 38, rentToIncomeRatio: 0, downPaymentPercent: 20 },
    dataSource: { aqi: 'city_average', amenities: 'seed' },
    generatedAt: new Date('2026-09-01T00:00:00.000Z'),
  };
}

export async function seedTestData({ fresh = false } = {}) {
  if (fresh) {
    await Promise.all([
      User.deleteMany({}),
      ShadowProperty.deleteMany({}),
      Report.deleteMany({}),
      Payment.deleteMany({}),
    ]);
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, BCRYPT_COST);
  const users = {};
  for (const u of Object.values(seedUsers)) {
    const doc = await User.findOneAndUpdate(
      { email: u.email },
      { $set: { name: u.name, phone: u.phone, role: u.role, passwordHash } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    users[u.key] = doc;
  }

  const now = Date.now();
  const expiresAt = new Date(now + 24 * 60 * 60 * 1000);
  const common = {
    userId: users.user1._id, // SEC-01 — both seeded properties belong to user1
    name: 'Seed Property, Koramangala, Bengaluru',
    coordinates: { lat: 12.9352, lng: 77.6245 },
    confirmedByUser: true,
    clusterId: seedClusterId,
    location: { displayName: 'Koramangala, Bengaluru', cityName: 'Bengaluru', locationCascade: ['Bengaluru', 'Koramangala'] },
    userProvidedSpecs: { budgetBracket: '1Cr-1.5Cr', bhk: '2BHK', floor: '4–7', listingType: 'sale' },
    status: 'completed',
    dataSource: { aqi: 'city_average', amenities: 'seed' },
    intelligence: buildCompletedIntelligence(),
    expiresAt,
  };

  const completedSP = await ShadowProperty.findOneAndUpdate(
    { sessionId: seedSessions.completed },
    { $set: { ...common }, $setOnInsert: { sessionId: seedSessions.completed } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  const lockedSP = await ShadowProperty.findOneAndUpdate(
    { sessionId: seedSessions.locked },
    {
      $set: { ...common, name: 'Seed Locked Property, HSR Layout, Bengaluru' },
      $setOnInsert: { sessionId: seedSessions.locked },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

  // user1 owns the completed report and has unlocked (paid for) it.
  // PERF-4 — Report + Payment are their own collections now (were
  // User.reportHistory[]/unlockedReports[]).
  await User.updateOne(
    { _id: users.user1._id },
    { $set: { 'preferences.sessionId': seedSessions.completed, 'preferences.listingTypeContext': 'sale' } },
  );

  await Report.findOneAndUpdate(
    { sessionId: seedSessions.completed },
    {
      $set: {
        userId: users.user1._id,
        listingType: 'sale',
        propertyName: completedSP.name,
        snapshot: buildReportSnapshot(seedSessions.completed),
        shareToken: seedShareToken,
        generatedAt: new Date('2026-09-01T00:00:00.000Z'),
      },
    },
    { upsert: true },
  );

  await Payment.findOneAndUpdate(
    { userId: users.user1._id, sessionId: seedSessions.completed, status: 'paid' },
    {
      $setOnInsert: {
        userId: users.user1._id,
        sessionId: seedSessions.completed,
        razorpayOrderId: `seed_${seedSessions.completed}`,
        amount: 19900,
        currency: 'INR',
        status: 'paid',
        source: 'migration',
      },
    },
    { upsert: true },
  );

  return {
    users,
    shadowProperties: { completed: completedSP, locked: lockedSP },
    credentials: { password: SEED_PASSWORD, emails: Object.values(seedUsers).map((u) => u.email) },
  };
}

async function runCli() {
  const args = new Set(process.argv.slice(2));
  const uri = process.env.MONGODB_URI;

  if (!isTestDbName(uri) && !args.has('--force')) {
    console.error(
      `[seed] Refusing to run: MONGODB_URI database name must contain "_test" ` +
      `(got "${uri ? uri.split('/').pop().split('?')[0] : 'undefined'}"). Pass --force to override.`,
    );
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`[seed] connected → ${uri.split('/').pop().split('?')[0]}`);

  const result = await seedTestData({ fresh: args.has('--fresh') });

  console.log('[seed] users:');
  for (const u of Object.values(result.users)) console.log(`  ${u.role.padEnd(5)} ${u.email}  (_id ${u._id})`);
  console.log(`[seed] password for all: ${result.credentials.password}`);
  console.log(`[seed] completed+unlocked session: ${seedSessions.completed}`);
  console.log(`[seed] locked session:            ${seedSessions.locked}`);
  console.log(`[seed] share token:               ${seedShareToken}`);

  await mongoose.disconnect();
  console.log('[seed] done');
}

function isDirectRun() {
  try {
    return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isDirectRun()) {
  runCli().catch((err) => { console.error(err); process.exit(1); });
}
