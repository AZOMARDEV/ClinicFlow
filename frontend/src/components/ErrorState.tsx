import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CloudOffIcon, FileQuestionIcon, LockIcon, RefreshCwIcon, ServerCrashIcon, TimerOffIcon, TriangleAlertIcon, WifiOffIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EmptyState } from '@/components/common';
import { Button } from '@/components/ui/button';
import { describeError, type ErrorKind } from '@/lib/errors';

const ICONS: Record<ErrorKind, LucideIcon> = {
  offline: WifiOffIcon,
  network: CloudOffIcon,
  timeout: TimerOffIcon,
  unauthorized: LockIcon,
  forbidden: LockIcon,
  notFound: FileQuestionIcon,
  conflict: TriangleAlertIcon,
  validation: TriangleAlertIcon,
  server: ServerCrashIcon,
  unknown: TriangleAlertIcon,
};

interface Props {
  error: unknown;
  /** Called by the Retry button (usually a query's refetch) */
  onRetry?: () => unknown;
  /** Overrides the default title, e.g. "Could not load patients" */
  title?: string;
  compact?: boolean;
  backTo?: { href: string; label: string };
}

/** Inline failure state with a friendly explanation and a Retry button when retrying can help. */
export function ErrorState({ error, onRetry, title, compact, backTo }: Props) {
  const d = describeError(error);
  const [retrying, setRetrying] = useState(false);

  const retry = async () => {
    if (!onRetry) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div role="alert">
      <EmptyState
        compact={compact}
        tone={d.kind === 'notFound' || d.kind === 'forbidden' ? 'warning' : 'danger'}
        icon={ICONS[d.kind]}
        title={title ?? d.title}
        description={title ? `${d.title}. ${d.message}` : d.message}
        action={
          onRetry && d.retryable ? (
            <Button variant="outline" onClick={retry} disabled={retrying}>
              <RefreshCwIcon className={retrying ? 'animate-spin' : undefined} /> {retrying ? 'Retrying…' : 'Try again'}
            </Button>
          ) : undefined
        }
        secondaryAction={
          backTo ? (
            <Button variant="ghost" asChild>
              <Link to={backTo.href}>{backTo.label}</Link>
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
