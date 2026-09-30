import bcrypt from 'bcrypt';
import request from 'supertest';
import { createApp } from '../src/app';
import { runMigrations } from '../src/db/migrate';
import { pool } from '../src/db/pool';

export const app = createApp();
export { pool };

export const PASSWORD = 'Password123!';

/** Drops everything and re-applies migrations so each test file starts from an empty schema. */
export async function resetDb() {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  await runMigrations(pool);
}

export async function createUser(role: 'admin' | 'staff', email = `${role}-${Date.now()}-${Math.random()}@test.dev`) {
  const hash = await bcrypt.hash(PASSWORD, 4);
  const { rows } = await pool.query<{ id: string }>(
    'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
    [`Test ${role}`, email, hash, role],
  );
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return { id: rows[0].id, email, token: res.body.token as string };
}

let cinCounter = 1000;
export async function createPatient(fullName = 'Test Patient') {
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO patients (full_name, cin, phone, birth_date) VALUES ($1, $2, '+212661234567', '1990-01-01') RETURNING id`,
    [fullName, `TP${cinCounter++}`],
  );
  return rows[0].id;
}

/** An ISO timestamp `days` days from now at the given UTC hour/minute. */
export function futureIso(days: number, hour: number, minute: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}
