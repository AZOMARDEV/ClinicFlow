import { env } from '../../config/env';
import { pool } from '../../db/pool';

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  /** Across all dates */
  pending: number;
  /** Across all dates */
  confirmed: number;
}

export async function getStats(): Promise<DashboardStats> {
  // "Today" is the current calendar day in APP_TIMEZONE, as a [start, end) range on appointment_date.
  const { rows } = await pool.query<DashboardStats>(
    `WITH today AS (
       SELECT (now() AT TIME ZONE $1)::date AS d
     )
     SELECT
       (SELECT count(*) FROM patients)::int AS "totalPatients",
       (SELECT count(*) FROM appointments, today
         WHERE appointment_date >= (today.d::timestamp AT TIME ZONE $1)
           AND appointment_date <  ((today.d + 1)::timestamp AT TIME ZONE $1))::int AS "todayAppointments",
       (SELECT count(*) FROM appointments WHERE status = 'pending')::int AS "pending",
       (SELECT count(*) FROM appointments WHERE status = 'confirmed')::int AS "confirmed"`,
    [env.APP_TIMEZONE],
  );
  return rows[0];
}
