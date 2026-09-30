import { env } from '../../config/env';
import { pool, withTransaction, type DbClient } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import type { AppointmentStatus, CreateAppointmentInput, ListAppointmentsQuery } from './appointments.schema';

interface AppointmentRow {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_cin: string;
  appointment_date: Date;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  created_by: string;
  created_by_name: string;
  created_at: Date;
}

export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  patientCin: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  reason: string;
  notes: string | null;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
}

const toAppointmentDto = (row: AppointmentRow): AppointmentDto => ({
  id: row.id,
  patientId: row.patient_id,
  patientName: row.patient_name,
  patientCin: row.patient_cin,
  appointmentDate: row.appointment_date,
  status: row.status,
  reason: row.reason,
  notes: row.notes,
  createdBy: row.created_by,
  createdByName: row.created_by_name,
  createdAt: row.created_at,
});

const SELECT_WITH_JOINS = `
  SELECT a.*, p.full_name AS patient_name, p.cin AS patient_cin, u.full_name AS created_by_name
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN users u ON u.id = a.created_by`;

export const CONFLICT_MESSAGE = 'Patient already has a confirmed appointment within 30 minutes';

/**
 * Locks the patient row so concurrent bookings for the same patient run one after the other.
 * Throws 404 when the patient does not exist.
 */
async function lockPatient(client: DbClient, patientId: string) {
  const { rowCount } = await client.query('SELECT id FROM patients WHERE id = $1 FOR UPDATE', [patientId]);
  if (!rowCount) throw new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');
}

/**
 * Business rule: two confirmed appointments of the same patient must be at least 30 minutes apart.
 * Exactly 30 minutes is allowed (bounds are exclusive). Must run after `lockPatient` in the same transaction.
 */
async function assertNoConfirmedConflict(client: DbClient, patientId: string, date: Date | string, excludeId?: string) {
  const { rowCount } = await client.query(
    `SELECT 1 FROM appointments
     WHERE patient_id = $1
       AND status = 'confirmed'
       AND ($3::uuid IS NULL OR id <> $3::uuid)
       AND appointment_date > $2::timestamptz - interval '30 minutes'
       AND appointment_date < $2::timestamptz + interval '30 minutes'
     LIMIT 1`,
    [patientId, date, excludeId ?? null],
  );
  if (rowCount) throw new AppError(409, 'APPOINTMENT_CONFLICT', CONFLICT_MESSAGE);
}

async function findById(client: DbClient | typeof pool, id: string): Promise<AppointmentDto> {
  const { rows } = await client.query<AppointmentRow>(`${SELECT_WITH_JOINS} WHERE a.id = $1`, [id]);
  if (!rows[0]) throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');
  return toAppointmentDto(rows[0]);
}

export async function create(input: CreateAppointmentInput, userId: string): Promise<AppointmentDto> {
  return withTransaction(async (client) => {
    await lockPatient(client, input.patientId);
    if (input.status === 'confirmed') {
      await assertNoConfirmedConflict(client, input.patientId, input.appointmentDate);
    }
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO appointments (patient_id, appointment_date, status, reason, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [input.patientId, input.appointmentDate, input.status, input.reason, input.notes ?? null, userId],
    );
    return findById(client, rows[0].id);
  });
}

export async function updateStatus(id: string, status: AppointmentStatus): Promise<AppointmentDto> {
  return withTransaction(async (client) => {
    const { rows } = await client.query<{ patient_id: string; appointment_date: Date; status: AppointmentStatus }>(
      'SELECT patient_id, appointment_date, status FROM appointments WHERE id = $1',
      [id],
    );
    const current = rows[0];
    if (!current) throw new AppError(404, 'APPOINTMENT_NOT_FOUND', 'Appointment not found');

    if (status === 'confirmed' && current.status !== 'confirmed') {
      await lockPatient(client, current.patient_id);
      await assertNoConfirmedConflict(client, current.patient_id, current.appointment_date, id);
    }

    await client.query('UPDATE appointments SET status = $2 WHERE id = $1', [id, status]);
    return findById(client, id);
  });
}

export async function list(query: ListAppointmentsQuery): Promise<AppointmentDto[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };

  // A day is [00:00, next 00:00) in the clinic's time zone; expressed as a range so the date index is used.
  const from = query.date ?? query.from;
  const to = query.date ?? query.to;
  if (from || to) {
    const tz = add(env.APP_TIMEZONE);
    if (from) conditions.push(`a.appointment_date >= (${add(from)}::date::timestamp AT TIME ZONE ${tz})`);
    if (to) conditions.push(`a.appointment_date < ((${add(to)}::date + 1)::timestamp AT TIME ZONE ${tz})`);
  }
  if (query.status) conditions.push(`a.status = ${add(query.status)}`);
  if (query.patientId) conditions.push(`a.patient_id = ${add(query.patientId)}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query<AppointmentRow>(
    `${SELECT_WITH_JOINS} ${where} ORDER BY a.appointment_date ASC, a.id ASC`,
    params,
  );
  return rows.map(toAppointmentDto);
}
