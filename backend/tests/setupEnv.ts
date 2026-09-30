import dotenv from 'dotenv';

// Tests run against a separate database: TEST_DATABASE_URL, or DATABASE_URL with the name swapped to clinicflow_test.
dotenv.config({ path: ['.env', '../.env'] });

const base = process.env.DATABASE_URL ?? 'postgres://clinic:clinic@localhost:5432/clinicflow';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? base.replace(/\/[^/?]+(\?.*)?$/, '/clinicflow_test$1');
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET ??= 'test-secret-that-is-at-least-32-characters-long';
process.env.APP_TIMEZONE ??= 'Africa/Casablanca';
