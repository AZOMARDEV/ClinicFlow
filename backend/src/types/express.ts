import type { UserRole } from '../modules/auth/auth.schema';

export interface AuthUser {
  id: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
      validated?: { body?: unknown; query?: unknown; params?: unknown };
    }
  }
}

export {};
