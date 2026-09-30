import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function paginate<T>(data: T[], total: number, page: number, limit: number): Paginated<T> {
  return { data, page, limit, total, totalPages: Math.ceil(total / limit) };
}

/** Escapes LIKE wildcards so user input is matched literally. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);
