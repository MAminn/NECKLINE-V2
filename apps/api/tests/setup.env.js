// Runs before any test module is imported (jest `setupFiles`).
// Provides the minimal env required by src/config/env.js so the schema validates
// without a real .env file (e.g. on CI). These are non-secret test placeholders —
// no test connects to this URI; unit tests only need env.js to parse successfully.
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/neckline-test';
