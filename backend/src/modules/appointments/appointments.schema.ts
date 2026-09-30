import { z } from 'zod';

export const appointmentStatuses = ['pending', 'confirmed', 'cancelled'] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

const statusSchema = z.enum(appointmentStatuses, {
  errorMap: () => ({ message: 'Status must be pending, confirmed or cancelled' }),
});

const emptyToUndefined = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid patient id'),
  appointmentDate: z
    .string()
    .datetime({ offset: true, message: 'Appointment date must be an ISO 8601 date-time with timezone' })
    .refine((d) => new Date(d).getTime() > Date.now(), 'Appointment date must be in the future'),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters').max(200),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000).optional()),
  status: statusSchema.default('pending'),
});

const isoDate = z.string().date('Use the YYYY-MM-DD format');

export const listAppointmentsQuery = z
  .object({
    date: isoDate.optional(),
    from: isoDate.optional(),
    to: isoDate.optional(),
    status: z.preprocess(emptyToUndefined, statusSchema.optional()),
    patientId: z.preprocess(emptyToUndefined, z.string().uuid('Invalid patient id').optional()),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: '"from" must be before "to"', path: ['from'] });

export const appointmentIdParams = z.object({ id: z.string().uuid('Invalid appointment id') });

export const updateStatusSchema = z.object({ status: statusSchema });

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type ListAppointmentsQuery = z.infer<typeof listAppointmentsQuery>;
