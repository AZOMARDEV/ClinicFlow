import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { pool } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import type { LoginInput, UserRole } from './auth.schema';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

const toUserDto = (row: Omit<UserRow, 'password_hash'>): UserDto => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  role: row.role,
  createdAt: row.created_at,
});

// Compared against when the email is unknown, so both failure paths take the same time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const invalidCredentials = () => new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');

export async function login({ email, password }: LoginInput): Promise<{ token: string; user: UserDto }> {
  const { rows } = await pool.query<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
  const user = rows[0];

  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) throw invalidCredentials();

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
  return { token, user: toUserDto(user) };
}

export async function getMe(userId: string): Promise<UserDto> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, full_name, email, role, created_at FROM users WHERE id = $1',
    [userId],
  );
  // The token may outlive the account
  if (!rows[0]) throw new AppError(401, 'UNAUTHORIZED', 'User no longer exists');
  return toUserDto(rows[0]);
}
