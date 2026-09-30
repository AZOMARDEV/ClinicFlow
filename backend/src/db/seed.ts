import bcrypt from 'bcrypt';
import type { Pool } from 'pg';
import { env } from '../config/env';

const users = [
  { key: 'admin', fullName: 'Nadia Chraibi', email: 'admin@clinicflow.test', password: 'Admin123!', role: 'admin' },
  { key: 'staff1', fullName: 'Hamza Ouazzani', email: 'staff1@clinicflow.test', password: 'Staff123!', role: 'staff' },
  { key: 'staff2', fullName: 'Imane Kettani', email: 'staff2@clinicflow.test', password: 'Staff123!', role: 'staff' },
] as const;

const patients = [
  { key: 'YE', fullName: 'Youssef El Amrani', cin: 'AB123456', phone: '+212 6 61 23 45 67', birthDate: '1984-03-12', address: 'Bd Zerktouni, Casablanca' },
  { key: 'FB', fullName: 'Fatima Zahra Bennani', cin: 'BE784512', phone: '+212 6 70 88 12 04', birthDate: '1991-08-27', address: 'Rue Tarik Ibn Ziyad, Rabat' },
  { key: 'OT', fullName: 'Omar Tazi', cin: 'BK302198', phone: '+212 6 52 40 19 83', birthDate: '1976-11-05', address: 'Hay Riad, Rabat' },
  { key: 'SI', fullName: 'Salma Idrissi', cin: 'CD556710', phone: '+212 7 01 55 66 20', birthDate: '2000-01-19', address: 'Maarif, Casablanca' },
  { key: 'KA', fullName: 'Karim Alaoui', cin: 'EE910233', phone: '+212 6 63 72 90 11', birthDate: '1968-06-30', address: 'Gueliz, Marrakech' },
] as const;

type PatientKey = (typeof patients)[number]['key'];
type UserKey = (typeof users)[number]['key'];

// Dates are relative to "today" in APP_TIMEZONE so the dashboard always has data for the current day.
// Confirmed appointments of the same patient are always >= 30 minutes apart.
const appointments: Array<{
  day: number; time: string; patient: PatientKey; reason: string; notes: string | null;
  status: 'pending' | 'confirmed' | 'cancelled'; by: UserKey;
}> = [
  { day: 0, time: '09:00', patient: 'YE', reason: 'Blood pressure follow-up', notes: 'Bring home BP log', status: 'confirmed', by: 'staff1' },
  { day: 0, time: '10:30', patient: 'YE', reason: 'Lab results review', notes: null, status: 'pending', by: 'staff1' },
  { day: 0, time: '11:15', patient: 'SI', reason: 'General check-up', notes: 'First visit', status: 'confirmed', by: 'staff2' },
  { day: 0, time: '14:00', patient: 'OT', reason: 'Persistent cough', notes: null, status: 'pending', by: 'admin' },
  { day: 1, time: '09:30', patient: 'FB', reason: 'Prenatal consultation', notes: null, status: 'confirmed', by: 'staff2' },
  { day: 2, time: '16:00', patient: 'KA', reason: 'Knee pain', notes: 'Bring previous X-rays', status: 'pending', by: 'staff1' },
  { day: 3, time: '10:00', patient: 'FB', reason: 'Blood test', notes: 'Fasting required', status: 'pending', by: 'staff2' },
  { day: 7, time: '09:00', patient: 'YE', reason: 'Cardiology follow-up', notes: 'Referral from Dr. Lahlou', status: 'confirmed', by: 'admin' },
  { day: -2, time: '15:00', patient: 'OT', reason: 'Flu vaccination', notes: null, status: 'cancelled', by: 'staff1' },
  { day: -1, time: '11:00', patient: 'KA', reason: 'Physiotherapy session', notes: 'Patient called to cancel', status: 'cancelled', by: 'staff2' },
];

/** Inserts demo data. Idempotent: does nothing when the users table already has rows. */
export async function seed(db: Pool): Promise<boolean> {
  const { rows } = await db.query<{ count: number }>('SELECT count(*)::int AS count FROM users');
  if (rows[0].count > 0) return false;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const userIds = {} as Record<UserKey, string>;
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      const res = await client.query<{ id: string }>(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [u.fullName, u.email, hash, u.role],
      );
      userIds[u.key] = res.rows[0].id;
    }

    const patientIds = {} as Record<PatientKey, string>;
    for (const p of patients) {
      const res = await client.query<{ id: string }>(
        'INSERT INTO patients (full_name, cin, phone, birth_date, address) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [p.fullName, p.cin, p.phone, p.birthDate, p.address],
      );
      patientIds[p.key] = res.rows[0].id;
    }

    for (const a of appointments) {
      await client.query(
        `INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by)
         VALUES ($1, (((now() AT TIME ZONE $2)::date + $3::int) + $4::time) AT TIME ZONE $2, $5, $6, $7, $8)`,
        [patientIds[a.patient], env.APP_TIMEZONE, a.day, a.time, a.status, a.reason, a.notes, userIds[a.by]],
      );
    }

    await client.query('COMMIT');
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  import('./pool').then(async ({ pool }) => {
    try {
      const inserted = await seed(pool);
      console.log(inserted ? 'Seed data inserted' : 'Seed skipped: users table is not empty');
    } catch (err) {
      console.error(err);
      process.exitCode = 1;
    } finally {
      await pool.end();
    }
  });
}
