import { useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addDaysISO, clinicDayOf, formatIso, todayISO, weekStartIso } from '@/lib/datetime';
import { useAppointments } from '@/lib/queries';
import { cn } from '@/lib/utils';

interface Props {
  /** Selected day (YYYY-MM-DD) or '' when showing all dates */
  value: string;
  onChange: (day: string) => void;
}

/** Monday–Sunday strip with the number of active (not cancelled) appointments per day. */
export function WeekStrip({ value, onChange }: Props) {
  const anchor = value || todayISO();
  const start = weekStartIso(anchor);
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysISO(start, i)), [start]);
  const week = useAppointments({ from: days[0], to: days[6] });
  const today = todayISO();

  const counts = useMemo(() => {
    const map = new Map<string, { total: number; confirmed: number; pending: number }>();
    for (const a of week.data ?? []) {
      if (a.status === 'cancelled') continue;
      const key = clinicDayOf(a.appointmentDate);
      const c = map.get(key) ?? { total: 0, confirmed: 0, pending: 0 };
      c.total += 1;
      c[a.status] += 1;
      map.set(key, c);
    }
    return map;
  }, [week.data]);

  return (
    <div className="flex items-stretch gap-2">
      <Button variant="outline" size="icon" className="h-auto w-9 shrink-0" aria-label="Previous week" onClick={() => onChange(addDaysISO(anchor, -7))}>
        <ChevronLeftIcon />
      </Button>
      <div className="grid flex-1 grid-cols-7 gap-1.5" role="group" aria-label={`Week of ${formatIso(start, 'd MMMM yyyy')}`}>
        {days.map((d) => {
          const c = counts.get(d);
          const selected = d === value;
          const isToday = d === today;
          return (
            <button
              key={d}
              type="button"
              aria-pressed={selected}
              aria-label={`${formatIso(d, 'EEEE d MMMM')}: ${c?.total ?? 0} appointments`}
              onClick={() => onChange(d)}
              className={cn(
                'group flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2.5 transition-colors cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                selected ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:border-primary/40 hover:bg-secondary/60',
              )}
            >
              <span className={cn('text-[11px] font-medium tracking-wide uppercase', selected ? 'text-primary-foreground/80' : 'text-muted-foreground')}>
                {formatIso(d, 'EEE')}
              </span>
              <span className={cn('text-lg leading-none font-semibold', isToday && !selected && 'text-primary')}>{formatIso(d, 'd')}</span>
              <span className="flex h-4 items-center gap-0.5" aria-hidden>
                {week.isLoading ? (
                  <span className="h-1.5 w-6 animate-pulse rounded-full bg-skeleton" />
                ) : c ? (
                  <span className={cn('rounded-full px-1.5 text-[11px] font-semibold tabular-nums', selected ? 'bg-white/20' : 'bg-secondary text-secondary-foreground')}>
                    {c.total}
                  </span>
                ) : (
                  <span className={cn('text-[11px]', selected ? 'text-primary-foreground/60' : 'text-muted-foreground/60')}>–</span>
                )}
              </span>
              {isToday && <span className={cn('text-[10px] font-semibold', selected ? 'text-primary-foreground' : 'text-primary')}>Today</span>}
            </button>
          );
        })}
      </div>
      <Button variant="outline" size="icon" className="h-auto w-9 shrink-0" aria-label="Next week" onClick={() => onChange(addDaysISO(anchor, 7))}>
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
