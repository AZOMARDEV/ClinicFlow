import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';
import type { UserRole } from '../modules/auth/auth.schema';

/** Allows the request only for the given roles. Must run after `authMiddleware`. */
export const requireRole =
  (...roles: UserRole[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(new AppError(401, 'UNAUTHORIZED', 'Missing authentication token'));
    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action'));
    }
    next();
  };
