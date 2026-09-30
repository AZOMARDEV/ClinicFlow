import fs from 'node:fs/promises';
import path from 'node:path';
import type { Pool } from 'pg';

const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

/** Applies every pending .sql file in migrations/ in name order, each inside its own transaction. */
export async function runMigrations(db: Pool): Promise<string[]> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

  const { rows } = await db.query<{ filename: string }>('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((r) => r.filename));
  const files = (await fs.readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql')).sort();

  const newlyApplied: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), 'utf8');
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      await client.query('COMMIT');
      newlyApplied.push(file);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${(err as Error).message}`);
    } finally {
      client.release();
    }
  }
  return newlyApplied;
}

if (require.main === module) {
  // Imported lazily so the module can be used by tests without starting a second pool.
  import('./pool').then(async ({ pool }) => {
    try {
      const applied = await runMigrations(pool);
      console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database is up to date');
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });
}
