import { useState } from 'react';
import type { Matcher } from 'react-day-picker';
import { CalendarIcon, XIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { dateToIso, formatIso, isoToDate, todayISO } from '@/lib/datetime';
import { cn } from '@/lib/utils';

interface Props {
  id?: string;
  /** YYYY-MM-DD or '' */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: Matcher | Matcher[];
  /** Month/year dropdowns, handy for birth dates */
  withYearPicker?: boolean;
  startYear?: number;
  endYear?: number;
  clearable?: boolean;
  invalid?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/** Button + popover calendar that reads and writes YYYY-MM-DD strings. */
export function DatePicker({
  id,
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled,
  withYearPicker,
  startYear = 1900,
  endYear = new Date().getFullYear(),
  clearable,
  invalid,
  className,
  ...aria
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? isoToDate(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn('relative', className)}>
        <PopoverTrigger
          id={id}
          aria-invalid={invalid || undefined}
          {...aria}
          className={cn(
            'flex h-10 w-full items-center gap-2.5 rounded-md border border-input bg-card px-3 text-left text-sm transition-[color,box-shadow] outline-none cursor-pointer',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:border-destructive data-[state=open]:border-ring',
            !value && 'text-muted-foreground',
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="flex-1 truncate">{value ? formatIso(value, 'EEE d MMM yyyy') : placeholder}</span>
        </PopoverTrigger>
        {clearable && value && (
          <button
            type="button"
            aria-label="Clear date"
            onClick={() => onChange('')}
            className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-accent cursor-pointer"
          >
            <XIcon className="size-3.5" />
          </button>
        )}
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          // Birth dates: open around 30 years ago instead of the current month
          defaultMonth={selected ?? (withYearPicker ? new Date(new Date().getFullYear() - 30, 0) : undefined)}
          today={isoToDate(todayISO())}
          disabled={disabled}
          captionLayout={withYearPicker ? 'dropdown' : 'label'}
          startMonth={withYearPicker ? new Date(startYear, 0) : undefined}
          endMonth={withYearPicker ? new Date(endYear, 11) : undefined}
          onSelect={(d) => {
            if (!d) return;
            onChange(dateToIso(d));
            setOpen(false);
          }}
          autoFocus
        />
        {!withYearPicker && (
          <div className="flex justify-end border-t border-row-border px-3 py-2">
            <button
              type="button"
              className="rounded-md px-2 py-1 text-[13px] font-medium text-primary hover:bg-accent cursor-pointer"
              onClick={() => {
                onChange(todayISO());
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
