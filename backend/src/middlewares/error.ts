import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

// PostgreSQL errors a service did not translate itself, mapped to safe client responses
const PG_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  '23505': { status: 409, code: 'CONFLICT', message: 'Resource already exists' },
  '23503': { status: 409, code: 'REFERENCE_CONFLICT', message: 'This action conflicts with related records' },
  '23514': { status: 400, code: 'CONSTRAINT_VIOLATION', message: 'A value is outside the allowed range' },
  '23502': { status: 400, code: 'MISSING_VALUE', message: 'A required value is missing' },
  '22P02': { status: 400, code: 'INVALID_INPUT', message: 'A value has an invalid format' },
  '22007': { status: 400, code: 'INVALID_DATE', message: 'A date has an invalid format' },
  '22008': { status: 400, code: 'INVALID_DATE', message: 'A date is out of range' },
};

// Errors thrown by express.json / body-parser
const BODY_ERRORS: Record<string, { status: number; code: string; message: string }> = {
  'entity.parse.failed': { status: 400, code: 'INVALID_JSON', message: 'Request body is not valid JSON' },
  'entity.too.large': { status: 413, code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large' },
  'encoding.unsupported': { status: 415, code: 'UNSUPPORTED_ENCODING', message: 'Unsupported request encoding' },
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details !== undefined && { details: err.details }) },
    });
    return;
  }

  const known = BODY_ERRORS[err?.type] ?? PG_ERRORS[err?.code];
  if (known) {
    res.status(known.status).json({ error: { code: known.code, message: known.message } });
    return;
  }

  // Database unreachable: tell the client it is temporary
  if (['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', '57P01', '57P03'].includes(err?.code)) {
    console.error(`[${req.method} ${req.path}] database unavailable:`, err.code);
    res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'The service is temporarily unavailable, please retry shortly' } });
    return;
  }

  console.error(`[${req.method} ${req.path}] unhandled error:`, err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
};
