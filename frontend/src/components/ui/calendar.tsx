import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={1}
      className={cn('p-3', className)}
      classNames={{
        months: 'relative flex flex-col gap-4',
        month: 'flex w-full flex-col gap-3',
        nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
        button_previous: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8 text-muted-foreground aria-disabled:opacity-40'),
        button_next: cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8 text-muted-foreground aria-disabled:opacity-40'),
        month_caption: 'flex h-8 items-center justify-center px-10',
        caption_label: 'flex items-center gap-1 text-sm font-semibold select-none',
        dropdowns: 'flex items-center gap-1.5',
        dropdown_root: 'relative inline-flex h-8 items-center rounded-md border border-input bg-card px-2.5 has-focus:ring-[3px] has-focus:ring-ring/20',
        dropdown: 'absolute inset-0 cursor-pointer opacity-0',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'flex-1 pb-1 text-center text-xs font-medium text-muted-foreground',
        week: 'mt-1 flex w-full',
        day: 'relative flex-1 p-0 text-center text-sm',
        day_button: cn(
          'mx-auto inline-flex size-9 items-center justify-center rounded-lg transition-colors outline-none cursor-pointer',
          'hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/40',
        ),
        selected: '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
        today: '[&>button]:font-semibold [&>button]:underline [&>button]:decoration-2 [&>button]:underline-offset-4',
        outside: 'text-muted-foreground/50',
        disabled: 'text-muted-foreground/35 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === 'left' ? (
            <ChevronLeftIcon className={cn('size-4', chevronClass)} />
          ) : orientation === 'right' ? (
            <ChevronRightIcon className={cn('size-4', chevronClass)} />
          ) : (
            <ChevronDownIcon className={cn('size-3.5 text-muted-foreground', chevronClass)} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
