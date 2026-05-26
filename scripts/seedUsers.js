// FILE: scripts/seedUsers.js
// PURPOSE: Seed three user accounts — user1, user2 (role: user), admin (role: admin)

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../src/models/User.js';

const ACCOUNTS = [
  { name: 'User One',    email: 'user1@vibescout.com', password: 'user1pass', role: 'user' },
  { name: 'User Two',    email: 'user2@vibescout.com', password: 'user2pass', role: 'user' },
  { name: 'Admin',       email: 'admin@vibescout.com', password: 'adminpass', role: 'admin' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[seedUsers] Connected to MongoDB');

  for (const account of ACCOUNTS) {
    const existing = await User.findOne({ email: account.email });
    if (existing) {
      console.log(`[seedUsers] Skipping ${account.email} — already exists`);
      continue;
    }
    const passwordHash = await bcrypt.hash(account.password, 12);
    await User.create({
      name: account.name,
      email: account.email,
      passwordHash,
      role: account.role,
      preferences: {},
      reportHistory: [],
    });
    console.log(`[seedUsers] Created ${account.email} (role: ${account.role})`);
  }

  console.log('[seedUsers] Done.');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seedUsers] Fatal error:', err);
  process.exit(1);
});
