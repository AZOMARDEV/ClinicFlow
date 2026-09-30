import { useMemo } from 'react';
import { BanIcon } from 'lucide-react';
import { StatusDot } from '@/components/StatusBadge';
import { toMinutes } from '@/lib/datetime';
import type { AppointmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export interface BookedSlot {
  time: string; // HH:mm
  status: AppointmentStatus;
  reason: string;
}

interface Props {
  value: string;
  onChange: (time: string) => void;
  /** The patient's existing appointments that day */
  booked: BookedSlot[];
  /** Slots before this time are disabled (today) */
  minTime?: string;
  /** When booking as confirmed, slots < 30 min from a confirmed appointment are blocked */
  enforceRule: boolean;
  invalid?: boolean;
}

const START = 8 * 60;
const END = 19 * 60 + 45;
const STEP = 15;
const RULE_MINUTES = 30;

const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const GROUPS = [
  { label: 'Morning', from: START, to: 12 * 60 },
  { label: 'Afternoon', from: 12 * 60, to: 17 * 60 },
  { label: 'Evening', from: 17 * 60, to: END + 1 },
];

/** 15-minute slot picker that shows the patient's day and blocks slots breaking the 30-minute rule. */
export function TimeSlots({ value, onChange, booked, minTime, enforceRule, invalid }: Props) {
  const slots = useMemo(() => {
    const confirmed = booked.filter((b) => b.status === 'confirmed').map((b) => ({ ...b, min: toMinutes(b.time) }));
    const min = minTime ? toMinutes(minTime) : -1;
    const list = [];
    for (let m = START; m <= END; m += STEP) {
      const time = toHHMM(m);
      const conflict = enforceRule ? confirmed.find((c) => Math.abs(c.min - m) < RULE_MINUTES) : undefined;
      const existing = booked.find((b) => b.time === time && b.status !== 'cancelled');
      list.push({ m, time, past: m <= min, conflict, existing });
    }
    return list;
  }, [booked, minTime, enforceRule]);

  const available = slots.filter((s) => !s.past && !s.conflict).length;

  return (
    <div className={cn('flex flex-col gap-3.5 rounded-xl border p-3.5', invalid && 'border-destructive')}>
      {GROUPS.map((g) => {
        const groupSlots = slots.filter((s) => s.m >= g.from && s.m < g.to);
        return (
          <div key={g.label} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-muted-foreground">{g.label}</span>
            <div role="radiogroup" aria-label={`${g.label} time slots`} className="grid grid-cols-4 gap-1.5">
              {groupSlots.map((s) => {
                const disabled = s.past || Boolean(s.conflict);
                const selected = value === s.time;
                const title = s.conflict
                  ? `Blocked: confirmed appointment at ${s.conflict.time} (${s.conflict.reason})`
                  : s.existing
                    ? `Already booked: ${s.existing.reason} (${s.existing.status})`
                    : s.past
                      ? 'In the past'
                      : undefined;
                return (
                  <button
                    key={s.time}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    title={title}
                    onClick={() => onChange(s.time)}
                    className={cn(
                      'relative flex h-9 items-center justify-center gap-1 rounded-md border font-mono text-[13px] transition-colors cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                      selected
                        ? 'border-primary bg-primary font-semibold text-primary-foreground'
                        : 'border-input bg-card hover:border-primary/50 hover:bg-secondary',
                      s.conflict && 'cursor-not-allowed border-dashed border-red-200 bg-red-50/60 text-red-400 line-through hover:border-red-200 hover:bg-red-50/60',
                      s.past && !s.conflict && 'cursor-not-allowed text-muted-foreground/40 hover:border-input hover:bg-card',
                    )}
                  >
                    {s.conflict && <BanIcon className="size-3" aria-hidden />}
                    {s.time}
                    {s.existing && !selected && (
                      <span className="absolute top-1 right-1">
                        <StatusDot status={s.existing.status} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-row-border pt-3 text-xs text-muted-foreground">
        <span>{available} slots available</span>
        {enforceRule && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-sm border border-dashed border-red-300 bg-red-50" aria-hidden /> Within 30 min of a confirmed visit
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <StatusDot status="pending" /> Existing booking
        </span>
      </div>
    </div>
  );
}
