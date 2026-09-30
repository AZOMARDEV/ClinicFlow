import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CalendarPlusIcon, CalendarX2Icon, PencilIcon, Trash2Icon } from 'lucide-react';
import { AppointmentFormSheet } from '@/components/AppointmentFormSheet';
import { Avatar, EmptyState, PageHeader, TableSkeleton } from '@/components/common';
import { DeletePatientSheet } from '@/components/DeletePatientSheet';
import { ErrorState } from '@/components/ErrorState';
import { PatientFormSheet } from '@/components/PatientFormSheet';
import { StatusMenu } from '@/components/StatusMenu';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/lib/auth';
import { ageFrom, formatBirthDate, formatCreated, formatDayLong, formatTime } from '@/lib/datetime';
import { useAppointments, usePatient } from '@/lib/queries';
import type { Patient } from '@/lib/types';

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1 border-t border-row-border px-5 py-3.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-sm font-medium' : 'text-sm font-medium'}>{value}</dd>
    </div>
  );
}

const BackLink = () => (
  <Link to="/patients" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground">
    <ArrowLeftIcon className="size-4" aria-hidden /> Patients
  </Link>
);

export default function PatientDetailsPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const patient = usePatient(id);
  const appointments = useAppointments({ patientId: id });
  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Patient | null>(null);

  if (patient.isError) {
    return (
      <>
        <BackLink />
        <Card>
          <ErrorState
            error={patient.error}
            title="This patient could not be shown"
            onRetry={() => patient.refetch()}
            backTo={{ href: '/patients', label: 'Back to patients' }}
          />
        </Card>
      </>
    );
  }

  const p = patient.data;
  const list = appointments.data ?? [];
  const counts = {
    confirmed: list.filter((a) => a.status === 'confirmed').length,
    pending: list.filter((a) => a.status === 'pending').length,
    cancelled: list.filter((a) => a.status === 'cancelled').length,
  };

  return (
    <>
      <PageHeader
        eyebrow={<BackLink />}
        title={
          p ? (
            <span className="flex items-center gap-3.5">
              <Avatar name={p.fullName} className="size-12 text-[17px]" />
              {p.fullName}
            </span>
          ) : (
            <Skeleton className="h-12 w-72" />
          )
        }
        description={
          p ? (
            <>
              <span className="font-mono">{p.cin}</span> · Patient since {formatCreated(p.createdAt)}
            </>
          ) : undefined
        }
        actions={
          <>
            {isAdmin && (
              <Button variant="ghost" className="text-destructive hover:bg-red-50" disabled={!p} onClick={() => p && setToDelete(p)}>
                <Trash2Icon /> Delete
              </Button>
            )}
            <Button variant="outline" disabled={!p} onClick={() => setEditOpen(true)}>
              <PencilIcon /> Edit
            </Button>
            <Button disabled={!p} onClick={() => setBookOpen(true)}>
              <CalendarPlusIcon /> New appointment
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Patient information</CardTitle>
          </CardHeader>
          {p ? (
            <dl>
              <InfoRow label="CIN" value={p.cin} mono />
              <InfoRow label="Phone" value={p.phone} mono />
              <InfoRow label="Birth date" value={`${formatBirthDate(p.birthDate)} · ${ageFrom(p.birthDate)} years`} />
              <InfoRow label="Address" value={p.address ?? '—'} />
              <InfoRow label="Registered" value={formatCreated(p.createdAt)} />
            </dl>
          ) : (
            <TableSkeleton rows={4} />
          )}
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex-wrap">
            <div className="flex flex-col gap-0.5">
              <CardTitle>Appointments</CardTitle>
              <CardDescription>Oldest first · change status from the badge</CardDescription>
            </div>
            {list.length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border px-2.5 py-1 text-muted-foreground">{list.length} total</span>
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-green-800">{counts.confirmed} confirmed</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">{counts.pending} pending</span>
                {counts.cancelled > 0 && <span className="rounded-full bg-stone-200/70 px-2.5 py-1 text-stone-600">{counts.cancelled} cancelled</span>}
              </div>
            )}
          </CardHeader>
          {appointments.isLoading ? (
            <TableSkeleton rows={3} />
          ) : appointments.isError ? (
            <ErrorState error={appointments.error} title="Could not load appointments" onRetry={() => appointments.refetch()} compact />
          ) : list.length === 0 ? (
            <EmptyState
              icon={CalendarX2Icon}
              title="No appointments yet"
              description={p ? `${p.fullName.split(' ')[0]} has never been booked. Schedule the first visit.` : undefined}
              action={
                <Button onClick={() => setBookOpen(true)} disabled={!p}>
                  <CalendarPlusIcon /> Book first appointment
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-44">Date</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="w-36">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium whitespace-nowrap">{formatDayLong(a.appointmentDate)}</span>
                        <span className="font-mono text-xs text-muted-foreground">{formatTime(a.appointmentDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{a.reason}</TableCell>
                    <TableCell className="max-w-64 truncate text-muted-foreground" title={a.notes ?? undefined}>
                      {a.notes ?? '—'}
                    </TableCell>
                    <TableCell>
                      <StatusMenu appointment={a} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {p && (
        <>
          <PatientFormSheet open={editOpen} onOpenChange={setEditOpen} patient={p} />
          <AppointmentFormSheet open={bookOpen} onOpenChange={setBookOpen} patient={p} />
          <DeletePatientSheet patient={toDelete} onOpenChange={(o) => !o && setToDelete(null)} onDeleted={() => navigate('/patients', { replace: true })} />
        </>
      )}
    </>
  );
}
