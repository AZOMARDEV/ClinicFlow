import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { AppError } from '../utils/AppError';

type Schemas = Partial<Record<'params' | 'query' | 'body', ZodTypeAny>>;

/**
 * Validates params/query/body with Zod and stores the parsed values in `req.validated`
 * (Express 5 makes `req.query` read-only, so parsed values are not written back).
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, _res, next) => {
    const validated: NonNullable<typeof req.validated> = {};
    const details: Array<{ location: string; path: string; message: string }> = [];

    for (const location of ['params', 'query', 'body'] as const) {
      const schema = schemas[location];
      if (!schema) continue;
      const result = schema.safeParse(req[location] ?? {});
      if (result.success) {
        validated[location] = result.data;
      } else {
        for (const issue of result.error.issues) {
          details.push({ location, path: issue.path.join('.'), message: issue.message });
        }
      }
    }

    if (details.length) return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed', details));
    req.validated = validated;
    next();
  };
