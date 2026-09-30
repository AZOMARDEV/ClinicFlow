import { ChevronDownIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AppointmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export const STATUS_META: Record<AppointmentStatus, { label: string; dot: string }> = {
  pending: { label: 'Pending', dot: 'bg-amber-600' },
  confirmed: { label: 'Confirmed', dot: 'bg-green-600' },
  cancelled: { label: 'Cancelled', dot: 'bg-stone-400' },
};

export function StatusDot({ status, className }: { status: AppointmentStatus; className?: string }) {
  return <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', STATUS_META[status].dot, className)} />;
}

export function StatusBadge({ status, withCaret = false, className }: { status: AppointmentStatus; withCaret?: boolean; className?: string }) {
  return (
    <Badge variant={status} className={cn(withCaret && 'pr-2', className)}>
      <StatusDot status={status} />
      {STATUS_META[status].label}
      {withCaret && <ChevronDownIcon className="size-3.5" aria-hidden />}
    </Badge>
  );
}
