import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { userRoles, type UserRole } from '../modules/auth/auth.schema';

interface TokenPayload extends jwt.JwtPayload {
  sub: string;
  role: UserRole;
}

/** Verifies the Bearer token and attaches `req.user`. */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing authentication token'));
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
    if (!payload.sub || !userRoles.includes(payload.role)) throw new Error('Malformed token payload');
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (err) {
    const expired = err instanceof jwt.TokenExpiredError;
    next(new AppError(401, expired ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED', expired ? 'Session expired, please sign in again' : 'Invalid authentication token'));
  }
};
