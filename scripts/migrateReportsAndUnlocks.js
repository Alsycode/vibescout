// FILE: scripts/migrateReportsAndUnlocks.js
// PURPOSE: PERF-4 — one-time migration copying pre-existing
// User.reportHistory[] entries into the new Report collection, and
// User.unlockedReports[] entries into Payment docs (status:'paid'), so
// nobody's existing report history or paid-report access disappears when
// the app stops reading/writing those User fields.
//
// Safe to run more than once: a Report whose sessionId already exists is
// skipped (E11000 on the unique index); a Payment that already records that
// (userId, sessionId) as paid is skipped too. Does NOT delete anything from
// User documents — reportHistory[]/unlockedReports[] are left in place as
// inert legacy data (still readable by POST /admin/analytics/backfill,
// which is unrelated to this migration and untouched by it).
//
// Run:  node scripts/migrateReportsAndUnlocks.js
//       node scripts/migrateReportsAndUnlocks.js --dry-run   (report counts, write nothing)

import 'dotenv/config';
import mongoose from 'mongoose';
import Report from '../src/models/Report.js';
import Payment from '../src/models/Payment.js';

const REPORT_PRICE_PAISE = 19900; // ₹199 — mirrors payment.routes.js

async function migrate({ dryRun = false } = {}) {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`[migrate] Connected${dryRun ? ' (dry run — no writes)' : ''}`);

  // Raw find, not the Mongoose model's schema-filtered read — these fields
  // are no longer declared on the User schema, so an explicit projection is
  // required to see them at all.
  const users = await mongoose.connection.db
    .collection('users')
    .find({}, { projection: { reportHistory: 1, unlockedReports: 1 } })
    .toArray();

  let reportsCreated = 0, reportsSkipped = 0, reportsInvalid = 0;
  let paymentsCreated = 0, paymentsSkipped = 0;

  for (const user of users) {
    for (const entry of (user.reportHistory ?? [])) {
      if (!entry.sessionId || !entry.reportSnapshot || !entry.shareToken) {
        reportsInvalid++;
        console.warn(`[migrate] Skipping malformed reportHistory entry for user ${user._id}:`, entry.sessionId ?? '(no sessionId)');
        continue;
      }

      if (dryRun) {
        const exists = await Report.exists({ sessionId: entry.sessionId });
        exists ? reportsSkipped++ : reportsCreated++;
        continue;
      }

      try {
        await Report.create({
          userId: user._id,
          sessionId: entry.sessionId,
          listingType: entry.listingType ?? null,
          propertyName: entry.propertyName ?? null,
          snapshot: entry.reportSnapshot,
          shareToken: entry.shareToken,
          generatedAt: entry.generatedAt ?? new Date(),
        });
        reportsCreated++;
      } catch (err) {
        if (err.code === 11000) { reportsSkipped++; continue; } // already migrated
        throw err;
      }
    }

    for (const sessionId of (user.unlockedReports ?? [])) {
      if (!sessionId) continue;

      const alreadyPaid = await Payment.exists({ userId: user._id, sessionId, status: 'paid' });
      if (alreadyPaid) { paymentsSkipped++; continue; }

      if (dryRun) { paymentsCreated++; continue; }

      await Payment.create({
        userId: user._id,
        sessionId,
        // Deterministic (not Date.now()-based) so re-running this script
        // after a partial failure doesn't create a second Payment for the
        // same unlock — the unique index on razorpayOrderId catches it.
        razorpayOrderId: `migrated_${sessionId}`,
        amount: REPORT_PRICE_PAISE,
        currency: 'INR',
        status: 'paid',
        source: 'migration',
      });
      paymentsCreated++;
    }
  }

  console.log(`[migrate] Users scanned: ${users.length}`);
  console.log(`[migrate] Reports:  ${reportsCreated} ${dryRun ? 'to create' : 'created'}, ${reportsSkipped} already migrated, ${reportsInvalid} malformed/skipped`);
  console.log(`[migrate] Payments: ${paymentsCreated} ${dryRun ? 'to create' : 'created'}, ${paymentsSkipped} already migrated`);

  await mongoose.disconnect();
}

migrate({ dryRun: process.argv.includes('--dry-run') }).catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
