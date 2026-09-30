import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDaysIcon, CalendarX2Icon, ChevronLeftIcon, ChevronRightIcon, FilterXIcon, PlusIcon } from 'lucide-react';
import { AppointmentFormSheet } from '@/components/AppointmentFormSheet';
import { EmptyState, PageHeader, PatientCell, TableSkeleton } from '@/components/common';
import { DatePicker } from '@/components/DatePicker';
import { ErrorState } from '@/components/ErrorState';
import { StatusDot, STATUS_META } from '@/components/StatusBadge';
import { StatusMenu } from '@/components/StatusMenu';
import { WeekStrip } from '@/components/WeekStrip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { addDaysISO, formatDateLabel, formatDayShort, formatIso, formatTime, todayISO } from '@/lib/datetime';
import { useAppointments } from '@/lib/queries';
import { APPOINTMENT_STATUSES, type AppointmentStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

const ALL = 'all';
const isStatus = (v: string | null): v is AppointmentStatus => APPOINTMENT_STATUSES.includes(v as AppointmentStatus);

export default function AppointmentsPage() {
  // Filters live in the URL: shareable, and the back button restores them. `date=` (empty) means all dates.
  const [params, setParams] = useSearchParams();
  const date = params.has('date') ? (params.get('date') ?? '') : todayISO();
  const statusParam = params.get('status');
  const status: AppointmentStatus | typeof ALL = isStatus(statusParam) ? statusParam : ALL;
  const [sheetOpen, setSheetOpen] = useState(false);

  const setFilters = (next: { date?: string; status?: AppointmentStatus | typeof ALL }) => {
    const d = next.date ?? date;
    const s = next.status ?? status;
    const p = new URLSearchParams();
    if (d !== todayISO()) p.set('date', d);
    if (s !== ALL) p.set('status', s);
    setParams(p, { replace: true });
  };

  const query = useAppointments({ date: date || undefined, status: status === ALL ? undefined : status });
  const rows = query.data ?? [];

  const summary = [
    rows.length === 1 ? '1 appointment' : `${rows.length} appointments`,
    date ? `on ${formatDateLabel(date)}` : 'across all dates',
    status !== ALL ? `· ${STATUS_META[status].label.toLowerCase()} only` : '',
  ].join(' ');

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Browse by day, filter by status, and update status inline"
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <PlusIcon /> New appointment
          </Button>
        }
      />

      <WeekStrip value={date} onChange={(d) => setFilters({ date: d })} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-r-none border-r-0"
              aria-label="Previous day"
              disabled={!date}
              onClick={() => setFilters({ date: addDaysISO(date, -1) })}
            >
              <ChevronLeftIcon />
            </Button>
            <DatePicker
              value={date}
              onChange={(d) => setFilters({ date: d })}
              placeholder="All dates"
              clearable
              aria-label="Filter by date"
              className="w-52 [&_button:first-child]:rounded-none"
            />
            <Button
              variant="outline"
              size="icon"
              className="size-10 rounded-l-none border-l-0"
              aria-label="Next day"
              disabled={!date}
              onClick={() => setFilters({ date: addDaysISO(date, 1) })}
            >
              <ChevronRightIcon />
            </Button>
          </div>
          <Select value={status} onValueChange={(v) => setFilters({ status: v as AppointmentStatus | typeof ALL })}>
            <SelectTrigger aria-label="Filter by status" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {APPOINTMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <StatusDot status={s} className="size-2" />
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" className="text-muted-foreground" onClick={() => setFilters({ date: todayISO() })} disabled={date === todayISO()}>
            Today
          </Button>
          <Button variant="ghost" className="text-muted-foreground" onClick={() => setFilters({ date: '' })} disabled={!date}>
            <CalendarDaysIcon /> All dates
          </Button>
        </div>
        {!query.isLoading && !query.isError && <span className="text-[13px] text-muted-foreground" aria-live="polite">{summary}</span>}
      </div>

      <Card className="overflow-hidden">
        {query.isLoading ? (
          <TableSkeleton rows={4} />
        ) : query.isError && !query.data ? (
          <ErrorState error={query.error} title="Could not load appointments" onRetry={() => query.refetch()} />
        ) : rows.length === 0 ? (
          status !== ALL ? (
            <EmptyState
              icon={FilterXIcon}
              title={`No ${STATUS_META[status].label.toLowerCase()} appointments ${date ? `on ${formatIso(date, 'EEE d MMM')}` : 'yet'}`}
              description="Nothing matches this status filter. Show every status or look at another day."
              action={
                <Button variant="outline" onClick={() => setFilters({ status: ALL })}>
                  <FilterXIcon /> Show all statuses
                </Button>
              }
              secondaryAction={
                date ? (
                  <Button variant="ghost" onClick={() => setFilters({ date: '' })}>
                    Search all dates
                  </Button>
                ) : undefined
              }
            />
          ) : date ? (
            <EmptyState
              icon={CalendarX2Icon}
              title={date === todayISO() ? 'No appointments today' : `Nothing booked on ${formatDateLabel(date)}`}
              description={date < todayISO() ? 'This day is in the past and had no appointments.' : 'The day is completely free. Book a patient in or browse another day in the week above.'}
              action={
                date >= todayISO() ? (
                  <Button onClick={() => setSheetOpen(true)}>
                    <PlusIcon /> Book this day
                  </Button>
                ) : undefined
              }
              secondaryAction={
                <Button variant="ghost" onClick={() => setFilters({ date: '' })}>
                  <CalendarDaysIcon /> Show all dates
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={CalendarX2Icon}
              title="No appointments yet"
              description="Once you book appointments they will appear here, ordered by time."
              action={
                <Button onClick={() => setSheetOpen(true)}>
                  <PlusIcon /> Book the first appointment
                </Button>
              }
            />
          )
        ) : (
          <Table className={query.isFetching ? 'opacity-70 transition-opacity' : undefined}>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">{date ? 'Time' : 'Date'}</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="hidden xl:table-cell">Notes</TableHead>
                <TableHead className="hidden md:table-cell w-36">Booked by</TableHead>
                <TableHead className="w-40">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id} className={cn(a.status === 'cancelled' && 'text-muted-foreground')}>
                  <TableCell>
                    {date ? (
                      <span className={cn('font-mono font-medium', a.status === 'cancelled' && 'line-through')}>{formatTime(a.appointmentDate)}</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium whitespace-nowrap">{formatDayShort(a.appointmentDate)}</span>
                        <span className="font-mono text-xs text-muted-foreground">{formatTime(a.appointmentDate)}</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <PatientCell id={a.patientId} name={a.patientName} sub={a.patientCin} />
                  </TableCell>
                  <TableCell>{a.reason}</TableCell>
                  <TableCell className="hidden max-w-56 truncate text-muted-foreground xl:table-cell" title={a.notes ?? undefined}>
                    {a.notes ?? '—'}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{a.createdByName}</TableCell>
                  <TableCell>
                    <StatusMenu appointment={a} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <AppointmentFormSheet open={sheetOpen} onOpenChange={setSheetOpen} defaultDate={date || undefined} />
    </>
  );
}
