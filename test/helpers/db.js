// FILE: test/helpers/db.js
// PURPOSE: Connect/disconnect a disposable Mongo test DB for integration tests.
//          Refuses to run unless MONGODB_URI points at a "*_test" database, so a
//          misconfigured env can never touch dev/prod data. Not used by pure
//          unit tests — imported by Stage 3 route/integration suites.

import mongoose from 'mongoose';

function assertTestDb(uri) {
  if (!uri) {
    throw new Error('[test/db] MONGODB_URI is not set — point it at a disposable *_test database.');
  }
  // Database name is the last path segment before any query string.
  const name = uri.split('/').pop().split('?')[0];
  if (!/_test(\b|$)/.test(name)) {
    throw new Error(
      `[test/db] Refusing to connect: database "${name}" does not look like a test DB ` +
      `(name must contain "_test"). Set MONGODB_URI to e.g. mongodb://localhost:27017/haum_test`,
    );
  }
}

export async function connectTestDb() {
  const uri = process.env.MONGODB_URI;
  assertTestDb(uri);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
  return mongoose.connection;
}

export async function clearTestDb() {
  assertTestDb(process.env.MONGODB_URI);
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

export { assertTestDb };
