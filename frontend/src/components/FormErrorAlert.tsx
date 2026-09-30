import { AlertCircleIcon } from 'lucide-react';
import { describeError } from '@/lib/errors';

/** Banner at the top of a form for errors that are not tied to a single field. */
export function FormErrorAlert({ error, title }: { error: unknown; title?: string }) {
  const d = describeError(error);
  return (
    <div role="alert" className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-red-900">
      <AlertCircleIcon className="mt-0.5 size-4.5 shrink-0 text-destructive" aria-hidden />
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold">{title ?? d.title}</span>
        <span className="text-[13px]">{d.message}</span>
      </div>
    </div>
  );
}
