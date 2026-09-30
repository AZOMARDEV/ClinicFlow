// Database tasks run inside the running containers.
// Usage: node scripts/db.mjs <migrate|seed|reset>
//   migrate  apply pending SQL migrations
//   seed     insert demo data (skipped when users already exist)
//   reset    wipe the database, then migrate and seed again (the test database is not touched)
import { c, compose, env, fail, ok, requireDocker, requireService, step } from './lib.mjs';

const task = process.argv[2];
const TASKS = ['migrate', 'seed', 'reset'];
if (!TASKS.includes(task)) fail(`Unknown task "${task ?? ''}". Use one of: ${TASKS.join(', ')}`);

// The API image ships the compiled scripts in dist/
const migrate = () => compose('exec', '-T', 'api', 'node', 'dist/db/migrate.js');
const seed = () => compose('exec', '-T', 'api', 'node', 'dist/db/seed.js');

try {
  requireDocker();
  requireService('db');
  requireService('api');

  if (task === 'reset') {
    const user = env('POSTGRES_USER', 'clinic');
    const db = env('POSTGRES_DB', 'clinicflow');
    step(`Dropping every table in "${db}"`);
    await compose('exec', '-T', 'db', 'psql', '-q', '-v', 'ON_ERROR_STOP=1', '-U', user, '-d', db, '-c', 'SET client_min_messages = warning; DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    ok('Database emptied');
  }

  if (task === 'migrate' || task === 'reset') {
    step('Running migrations');
    await migrate();
  }

  if (task === 'seed' || task === 'reset') {
    step('Running the seeder');
    await seed();
  }

  ok(`db:${task} done`);
  if (task === 'reset') console.log(c.dim('  Sign in again in the browser: old sessions point to users that no longer exist.'));
} catch (err) {
  fail(err.message);
}
