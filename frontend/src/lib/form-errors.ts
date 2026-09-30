import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { ApiError } from '@/lib/api';

/**
 * Copies field errors returned by the API (400 details, 409 CIN) onto the form.
 * Returns true when at least one field error was applied.
 */
export function applyServerErrors<T extends FieldValues>(err: unknown, setError: UseFormSetError<T>, fields: readonly Path<T>[]) {
  if (!(err instanceof ApiError) || !err.details) return false;
  let applied = false;
  for (const d of err.details) {
    if ((fields as readonly string[]).includes(d.path)) {
      setError(d.path as Path<T>, { type: 'server', message: d.message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
