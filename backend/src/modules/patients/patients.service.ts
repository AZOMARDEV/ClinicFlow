import { pool } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import { escapeLike, paginate, type Paginated } from '../../utils/pagination';
import type { ListPatientsQuery, PatientInput } from './patients.schema';

interface PatientRow {
  id: string;
  full_name: string;
  cin: string;
  phone: string;
  birth_date: string;
  address: string | null;
  created_at: Date;
}

export interface PatientDto {
  id: string;
  fullName: string;
  cin: string;
  phone: string;
  birthDate: string;
  address: string | null;
  createdAt: Date;
}

const toPatientDto = (row: PatientRow): PatientDto => ({
  id: row.id,
  fullName: row.full_name,
  cin: row.cin,
  phone: row.phone,
  birthDate: row.birth_date,
  address: row.address,
  createdAt: row.created_at,
});

const notFound = () => new AppError(404, 'PATIENT_NOT_FOUND', 'Patient not found');

/** Turns a unique violation on `cin` into a 409 the client can show on the CIN field. */
function rethrowCinConflict(err: unknown): never {
  const pgErr = err as { code?: string; constraint?: string };
  if (pgErr.code === '23505' && pgErr.constraint === 'patients_cin_key') {
    throw new AppError(409, 'CIN_ALREADY_EXISTS', 'A patient with this CIN already exists', [
      { location: 'body', path: 'cin', message: 'This CIN is already registered' },
    ]);
  }
  throw err;
}

export async function list({ search, page, limit }: ListPatientsQuery): Promise<Paginated<PatientDto>> {
  const params: unknown[] = [];
  let where = '';
  if (search) {
    params.push(`%${escapeLike(search)}%`);
    where = 'WHERE full_name ILIKE $1 OR cin ILIKE $1';
  }

  const countRes = await pool.query<{ total: number }>(`SELECT count(*)::int AS total FROM patients ${where}`, params);
  const dataRes = await pool.query<PatientRow>(
    `SELECT * FROM patients ${where}
     ORDER BY full_name ASC, id ASC
     LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, (page - 1) * limit],
  );

  return paginate(dataRes.rows.map(toPatientDto), countRes.rows[0].total, page, limit);
}

export async function getById(id: string): Promise<PatientDto> {
  const { rows } = await pool.query<PatientRow>('SELECT * FROM patients WHERE id = $1', [id]);
  if (!rows[0]) throw notFound();
  return toPatientDto(rows[0]);
}

export async function create(input: PatientInput): Promise<PatientDto> {
  try {
    const { rows } = await pool.query<PatientRow>(
      `INSERT INTO patients (full_name, cin, phone, birth_date, address)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [input.fullName, input.cin, input.phone, input.birthDate, input.address ?? null],
    );
    return toPatientDto(rows[0]);
  } catch (err) {
    rethrowCinConflict(err);
  }
}

export async function update(id: string, input: PatientInput): Promise<PatientDto> {
  let rows: PatientRow[];
  try {
    ({ rows } = await pool.query<PatientRow>(
      `UPDATE patients
       SET full_name = $2, cin = $3, phone = $4, birth_date = $5, address = $6
       WHERE id = $1 RETURNING *`,
      [id, input.fullName, input.cin, input.phone, input.birthDate, input.address ?? null],
    ));
  } catch (err) {
    rethrowCinConflict(err);
  }
  if (!rows[0]) throw notFound();
  return toPatientDto(rows[0]);
}

export async function remove(id: string): Promise<void> {
  // Appointments are removed by ON DELETE CASCADE
  const { rowCount } = await pool.query('DELETE FROM patients WHERE id = $1', [id]);
  if (!rowCount) throw notFound();
}
