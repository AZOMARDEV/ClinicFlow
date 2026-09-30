import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  CalendarCheck2Icon,
  CalendarIcon,
  CalendarPlusIcon,
  CalendarRangeIcon,
  HourglassIcon,
  PlusIcon,
  SunIcon,
  UserPlusIcon,
  UsersIcon,
} from 'lucide-react';
import { AppointmentFormSheet } from '@/components/AppointmentFormSheet';
import { EmptyState, PageHeader, PatientCell, TableSkeleton } from '@/components/common';
import { ErrorState } from '@/components/ErrorState';
import { PatientFormSheet } from '@/components/PatientFormSheet';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { addDaysISO, formatDateLabel, formatDayShort, formatTime, greeting, todayISO } from '@/lib/datetime';
import { useAppointments, useDashboardStats } from '@/lib/queries';
import { cn } from '@/lib/utils';

function StatCard({ label, value, sub, icon: Icon, tone, href }: { label: string; value?: number; sub: string; icon: LucideIcon; tone: string; href: string }) {
  return (
    <Link
      to={href}
      className="group flex flex-col gap-3.5 rounded-xl border bg-card p-5 transition-[border-color,box-shadow] outline-none hover:border-primary/30 hover:shadow-[0_4px_16px_rgba(28,27,25,0.06)] focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#4a4843]">{label}</span>
        <span className={cn('inline-flex size-8 items-center justify-center rounded-lg', tone)}>
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {value === undefined ? <Skeleton className="h-8.5 w-12" /> : <span className="text-[34px] leading-none font-semibold tracking-[-0.02em]">{value}</span>}
        <span className="flex items-center justify-between text-[13px] text-muted-foreground">
          {sub}
          <ArrowRightIcon className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

/** Shown instead of the dashboard when the clinic has no patients yet. */
function Welcome({ onAddPatient }: { onAddPatient: () => void }) {
  const steps = [
    { n: 1, icon: UserPlusIcon, title: 'Register your first patient', body: 'Name, CIN, phone and birth date. The CIN must be unique.', action: <Button onClick={onAddPatient}><PlusIcon /> Add patient</Button> },
    { n: 2, icon: CalendarPlusIcon, title: 'Book an appointment', body: 'Pick a day and a free slot. Confirmed visits keep 30 minutes apart.', action: <Button variant="outline" disabled>Available after step 1</Button> },
    { n: 3, icon: CalendarCheck2Icon, title: 'Run the day from here', body: 'Today’s schedule, what is coming up and pending confirmations.', action: null },
  ];
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-1.5 border-b border-row-border bg-secondary/40 px-6 py-6">
        <h2 className="text-lg font-semibold">Welcome to ClinicFlow</h2>
        <p className="text-sm text-muted-foreground">There is no data yet. Three steps to get the clinic running:</p>
      </div>
      <ol className="grid gap-px bg-row-border md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="flex flex-col gap-3 bg-card px-6 py-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl border bg-card text-primary shadow-[0_4px_12px_rgba(28,27,25,0.06)]">
                <s.icon className="size-5" aria-hidden />
              </span>
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Step {s.n}</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
            {s.action && <div className="mt-auto pt-1">{s.action}</div>}
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [bookOpen, setBookOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const today = todayISO();
  const stats = useDashboardStats();
  const todays = useAppointments({ date: today });
  const upcoming = useAppointments({ from: addDaysISO(today, 1), to: addDaysISO(today, 7) });
  const upcomingItems = (upcoming.data ?? []).filter((a) => a.status !== 'cancelled').slice(0, 6);
  const s = stats.data;
  const isEmptyClinic = s?.totalPatients === 0;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.fullName.split(' ')[0] ?? ''}`}
        description={`${formatDateLabel(today)} · Africa/Casablanca`}
        actions={
          isEmptyClinic ? (
            <Button onClick={() => setAddPatientOpen(true)}>
              <UserPlusIcon /> Add patient
            </Button>
          ) : (
            <Button onClick={() => setBookOpen(true)}>
              <PlusIcon /> New appointment
            </Button>
          )
        }
      />

      {stats.isError ? (
        <Card>
          <ErrorState error={stats.error} title="Could not load the dashboard" onRetry={() => stats.refetch()} compact />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total patients" value={s?.totalPatients} sub="Registered in ClinicFlow" icon={UsersIcon} tone="bg-secondary text-secondary-foreground" href="/patients" />
          <StatCard label="Today's appointments" value={s?.todayAppointments} sub={`${formatDayShort(new Date().toISOString())} · all statuses`} icon={CalendarIcon} tone="bg-blue-100 text-blue-700" href="/appointments" />
          <StatCard label="Pending" value={s?.pending} sub="All dates · awaiting confirmation" icon={HourglassIcon} tone="bg-amber-100 text-amber-800" href="/appointments?status=pending&date=" />
          <StatCard label="Confirmed" value={s?.confirmed} sub="All dates" icon={BadgeCheckIcon} tone="bg-green-100 text-green-800" href="/appointments?status=confirmed&date=" />
        </div>
      )}

      {isEmptyClinic ? (
        <Welcome onAddPatient={() => setAddPatientOpen(true)} />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Today's appointments</CardTitle>
                <CardDescription>{formatDateLabel(today)}</CardDescription>
              </div>
              <Link to="/appointments" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline">
                View all <ArrowRightIcon className="size-4" aria-hidden />
              </Link>
            </CardHeader>
            {todays.isLoading ? (
              <TableSkeleton />
            ) : todays.isError ? (
              <ErrorState error={todays.error} title="Could not load today's appointments" onRetry={() => todays.refetch()} compact />
            ) : !todays.data?.length ? (
              <EmptyState
                icon={SunIcon}
                title="A free day"
                description="No appointments are booked for today. New bookings for today will appear here."
                action={
                  <Button variant="outline" onClick={() => setBookOpen(true)}>
                    <PlusIcon /> Book for today
                  </Button>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-22">Time</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead className="hidden sm:table-cell">Reason</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todays.data.map((a) => (
                    <TableRow key={a.id} className={a.status === 'cancelled' ? 'text-muted-foreground' : undefined}>
                      <TableCell className={cn('font-mono font-medium', a.status === 'cancelled' && 'line-through')}>{formatTime(a.appointmentDate)}</TableCell>
                      <TableCell>
                        <PatientCell id={a.patientId} name={a.patientName} sub={a.patientCin} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{a.reason}</TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-col gap-0.5">
                <CardTitle>Coming up</CardTitle>
                <CardDescription>Next 7 days</CardDescription>
              </div>
            </CardHeader>
            {upcoming.isLoading ? (
              <TableSkeleton rows={3} />
            ) : upcoming.isError ? (
              <ErrorState error={upcoming.error} title="Could not load upcoming appointments" onRetry={() => upcoming.refetch()} compact />
            ) : !upcomingItems.length ? (
              <EmptyState compact icon={CalendarRangeIcon} title="Nothing scheduled" description="No pending or confirmed appointments in the next 7 days." />
            ) : (
              <ul>
                {upcomingItems.map((a) => (
                  <li key={a.id} className="flex items-center gap-3.5 border-t border-row-border px-5 py-3">
                    <div className="flex w-18 shrink-0 flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{formatDayShort(a.appointmentDate)}</span>
                      <span className="font-mono text-sm font-medium">{formatTime(a.appointmentDate)}</span>
                    </div>
                    <Link to={`/patients/${a.patientId}`} className="flex min-w-0 flex-1 flex-col gap-0.5 underline-offset-2 hover:underline">
                      <span className="truncate text-sm font-medium">{a.patientName}</span>
                      <span className="truncate text-xs text-muted-foreground">{a.reason}</span>
                    </Link>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <AppointmentFormSheet open={bookOpen} onOpenChange={setBookOpen} />
      <PatientFormSheet open={addPatientOpen} onOpenChange={setAddPatientOpen} />
    </>
  );
}
