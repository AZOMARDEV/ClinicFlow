import { z } from 'zod';

export const userRoles = ['admin', 'staff'] as const;
export type UserRole = (typeof userRoles)[number];

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
