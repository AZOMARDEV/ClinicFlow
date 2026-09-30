import { z } from 'zod';
import { env } from '../../config/env';
import { paginationQuery } from '../../utils/pagination';
import { todayIn } from '../../utils/time';

// Moroccan (+212 / 0 followed by 5, 6 or 7 and 8 digits) or international E.164; separators are ignored.
const PHONE_RE = /^(?:(?:\+212|0)[5-7]\d{8}|\+[1-9]\d{7,14})$/;

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const patientBodySchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  cin: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(/^[A-Z0-9]{4,20}$/, 'CIN must be 4–20 letters or digits')),
  phone: z
    .string()
    .trim()
    .refine((v) => PHONE_RE.test(v.replace(/[\s.-]/g, '')), 'Enter a Moroccan (06…, +212…) or international (+…) number'),
  birthDate: z
    .string()
    .date('Birth date must be a valid date (YYYY-MM-DD)')
    .refine((d) => d >= '1900-01-01', 'Birth date is too far in the past')
    .refine((d) => d <= todayIn(env.APP_TIMEZONE), 'Birth date cannot be in the future'),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional()),
});

export const listPatientsQuery = paginationQuery.extend({
  search: z.preprocess(emptyToUndefined, z.string().trim().max(100).optional()),
});

export const patientIdParams = z.object({ id: z.string().uuid('Invalid patient id') });

export type PatientInput = z.infer<typeof patientBodySchema>;
export type ListPatientsQuery = z.infer<typeof listPatientsQuery>;
