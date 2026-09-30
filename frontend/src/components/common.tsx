import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, initials } from '@/lib/utils';

export function PageHeader({ title, description, actions, eyebrow }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && <div className="mb-1">{eyebrow}</div>}
        <h1 className="text-[28px] leading-tight font-semibold tracking-[-0.02em]">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
    </header>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export function PatientCell({ id, name, sub, mono = true }: { id: string; name: string; sub: string; mono?: boolean }) {
  return (
    <Link to={`/patients/${id}`} className="group flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
      <Avatar name={name} />
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate font-medium group-hover:underline underline-offset-2">{name}</span>
        <span className={cn('truncate text-xs text-muted-foreground', mono && 'font-mono')}>{sub}</span>
      </span>
    </Link>
  );
}

interface StateProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  tone?: 'default' | 'danger' | 'warning';
  compact?: boolean;
  className?: string;
}

const TONES = {
  default: { ring: 'bg-secondary/60', tile: 'bg-card text-primary border', dot: 'bg-primary/25' },
  danger: { ring: 'bg-red-50', tile: 'bg-card text-destructive border border-red-200', dot: 'bg-destructive/25' },
  warning: { ring: 'bg-amber-50', tile: 'bg-card text-amber-700 border border-amber-200', dot: 'bg-amber-500/30' },
};

/** Illustrated state used for empty lists and failures. */
export function EmptyState({ icon: Icon, title, description, action, secondaryAction, tone = 'default', compact = false, className }: StateProps) {
  const t = TONES[tone];
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'gap-2 px-6 py-8' : 'gap-2.5 px-6 py-14', className)}>
      <div className={cn('relative mb-2 flex items-center justify-center rounded-full', compact ? 'size-18' : 'size-24', t.ring)} aria-hidden>
        <span className={cn('absolute top-2 right-1 size-2 rounded-full', t.dot)} />
        <span className={cn('absolute bottom-3 left-0 size-1.5 rounded-full', t.dot)} />
        <span className={cn('inline-flex items-center justify-center rounded-2xl shadow-[0_6px_16px_rgba(28,27,25,0.08)]', compact ? 'size-11' : 'size-14', t.tile)}>
          <Icon className={compact ? 'size-5' : 'size-6'} strokeWidth={1.75} />
        </span>
      </div>
      <p className={cn('font-semibold', compact ? 'text-sm' : 'text-base')}>{title}</p>
      {description && <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-row-border px-5 py-3.5 first:border-t-0">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3 w-[46%]" />
            <Skeleton className="h-2.5 w-[28%]" />
          </div>
          <Skeleton className="h-5.5 w-18 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function Field({ label, htmlFor, error, hint, children }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[13px] text-destructive">
          {error}
        </p>
      ) : (
        hint && <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
