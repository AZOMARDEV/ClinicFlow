import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircleIcon, CalendarPlusIcon, CheckCircle2Icon, Clock3Icon, UserPlusIcon, UsersIcon } from 'lucide-react';
import { Avatar, EmptyState, Field } from '@/components/common';
import { ErrorState } from '@/components/ErrorState';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import { PatientFormSheet } from '@/components/PatientFormSheet';
import { StatusBadge, StatusDot } from '@/components/StatusBadge';
import { TimeSlots, type BookedSlot } from '@/components/TimeSlots';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api';
import { CLINIC_TZ, clinicLocalToISO, clinicTimeOf, dateToIso, formatIso, isoToDate, nowClinicLocal, todayISO, toMinutes } from '@/lib/datetime';
import { errorMessage } from '@/lib/errors';
import { applyServerErrors } from '@/lib/form-errors';
import { useAppointments, useCreateAppointment, usePatients } from '@/lib/queries';
import { cn } from '@/lib/utils';

const schema = z
  .object({
    patientId: z.string().min(1, 'Select a patient'),
    date: z.string().min(1, 'Pick a day'),
    time: z.string().min(1, 'Pick a time slot'),
    status: z.enum(['pending', 'confirmed']),
    reason: z.string().trim().min(3, 'At least 3 characters').max(200, 'At most 200 characters'),
    notes: z.string().trim().max(1000, 'At most 1000 characters'),
  })
  .refine((v) => !v.date || !v.time || new Date(clinicLocalToISO(`${v.date}T${v.time}`)).getTime() > Date.now(), {
    message: 'This time is already in the past',
    path: ['time'],
  });

type FormValues = z.infer<typeof schema>;
const FIELDS = ['patientId', 'status', 'reason', 'notes'] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selects and locks the patient (used from the patient details page) */
  patient?: { id: string; fullName: string; cin: string };
  /** Pre-selects a day (e.g. the day shown on the Appointments page) */
  defaultDate?: string;
}

const emptyValues = (patientId = '', date = ''): FormValues => ({
  patientId,
  date: date && date >= todayISO() ? date : todayISO(),
  time: '',
  status: 'pending',
  reason: '',
  notes: '',
});

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', hint: 'Hold the slot, confirm later', icon: Clock3Icon },
  { value: 'confirmed', label: 'Confirmed', hint: 'Checked against the 30-minute rule', icon: CheckCircle2Icon },
] as const;

export function AppointmentFormSheet({ open, onOpenChange, patient, defaultDate }: Props) {
  const create = useCreateAppointment();
  const [conflict, setConflict] = useState<string | null>(null);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const patients = usePatients({ limit: 50 });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: emptyValues(patient?.id, defaultDate) });

  useEffect(() => {
    if (open) {
      reset(emptyValues(patient?.id, defaultDate));
      setConflict(null);
      create.reset();
    }
    // `create` is a new object every render; only re-run when the sheet opens or its inputs change
  }, [open, patient?.id, defaultDate, reset]);

  const [patientId, date, time, status] = watch(['patientId', 'date', 'time', 'status']);
  const selectedPatient = patient ?? patients.data?.data.find((p) => p.id === patientId);

  // The patient's existing appointments that day drive the slot picker
  const day = useAppointments({ patientId, date }, { enabled: open && Boolean(patientId && date) });
  const booked: BookedSlot[] = useMemo(
    () => (day.data ?? []).map((a) => ({ time: clinicTimeOf(a.appointmentDate), status: a.status, reason: a.reason })),
    [day.data],
  );
  const minTime = date === todayISO() ? nowClinicLocal().slice(11) : undefined;

  // Warn before submitting when the chosen slot already breaks the rule
  const localConflict = useMemo(() => {
    if (status !== 'confirmed' || !time) return null;
    const hit = booked.find((b) => b.status === 'confirmed' && Math.abs(toMinutes(b.time) - toMinutes(time)) < 30);
    return hit ? `Patient already has a confirmed appointment at ${hit.time} (${hit.reason}). Pick a slot at least 30 minutes away or book it as pending.` : null;
  }, [booked, status, time]);

  const onSubmit = handleSubmit((values) => {
    setConflict(null);
    create.mutate(
      {
        patientId: values.patientId,
        appointmentDate: clinicLocalToISO(`${values.date}T${values.time}`),
        status: values.status,
        reason: values.reason,
        notes: values.notes || undefined,
      },
      {
        onSuccess: (a) => {
          toast.success('Appointment created', {
            description: `${a.patientName} · ${formatIso(values.date, 'EEE d MMM')} at ${values.time} · ${a.status}`,
          });
          onOpenChange(false);
        },
        onError: (err) => {
          if (err instanceof ApiError && err.code === 'APPOINTMENT_CONFLICT') {
            setConflict(err.message);
            create.reset();
          } else if (err instanceof ApiError && err.details?.some((d) => d.path === 'appointmentDate')) {
            setError('time', { message: err.details.find((d) => d.path === 'appointmentDate')!.message });
            create.reset();
          } else if (applyServerErrors(err, setError, FIELDS)) {
            create.reset();
          }
          toast.error(errorMessage(err));
        },
      },
    );
  });

  const noPatients = !patient && patients.isSuccess && patients.data.total === 0;
  const blockedMessage = conflict ?? localConflict;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent size="lg">
        <SheetHeader icon={<CalendarPlusIcon />}>
          <SheetTitle>New appointment</SheetTitle>
          <SheetDescription>Pick a patient, a day and a time. Times are in clinic time ({CLINIC_TZ}).</SheetDescription>
        </SheetHeader>

        {noPatients ? (
          <SheetBody className="justify-center">
            <EmptyState
              icon={UsersIcon}
              title="No patients yet"
              description="Appointments are booked for a patient. Register the patient first, then come back to pick a time."
              action={
                <Button onClick={() => setAddPatientOpen(true)}>
                  <UserPlusIcon /> Add a patient
                </Button>
              }
            />
          </SheetBody>
        ) : patients.isError && !patient ? (
          <SheetBody className="justify-center">
            <ErrorState error={patients.error} title="Could not load patients" onRetry={() => patients.refetch()} />
          </SheetBody>
        ) : (
          <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
            <SheetBody>
              {create.isError && <FormErrorAlert error={create.error} title="Could not create the appointment" />}

              <SheetSection title="Booking for">
                {patient ? (
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 px-3.5 py-3">
                    <Avatar name={patient.fullName} className="size-9 text-[13px]" />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-sm font-medium">{patient.fullName}</span>
                      <span className="font-mono text-xs text-muted-foreground">{patient.cin}</span>
                    </div>
                  </div>
                ) : (
                  <Field label="Patient" htmlFor="a-patient" error={errors.patientId?.message}>
                    {patients.isLoading ? (
                      <Skeleton className="h-10 w-full" />
                    ) : (
                      <div className="flex gap-2">
                        <Controller
                          control={control}
                          name="patientId"
                          render={({ field }) => (
                            <Select
                              value={field.value}
                              onValueChange={(v) => {
                                field.onChange(v);
                                setValue('time', '');
                                setConflict(null);
                              }}
                            >
                              <SelectTrigger id="a-patient" className="flex-1" aria-invalid={errors.patientId ? true : undefined}>
                                <SelectValue placeholder="Select a patient" />
                              </SelectTrigger>
                              <SelectContent>
                                {patients.data?.data.map((p) => (
                                  <SelectItem key={p.id} value={p.id}>
                                    {p.fullName}
                                    <span className="ml-2 font-mono text-xs text-muted-foreground">{p.cin}</span>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        <Button type="button" variant="outline" size="icon" className="size-10" aria-label="Add a new patient" title="Add a new patient" onClick={() => setAddPatientOpen(true)}>
                          <UserPlusIcon />
                        </Button>
                      </div>
                    )}
                  </Field>
                )}
              </SheetSection>

              <SheetSection title="Status">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <div role="radiogroup" aria-label="Status" className="grid grid-cols-2 gap-2">
                      {STATUS_OPTIONS.map((o) => {
                        const active = field.value === o.value;
                        return (
                          <button
                            key={o.value}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => {
                              field.onChange(o.value);
                              setConflict(null);
                            }}
                            className={cn(
                              'flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-left transition-colors cursor-pointer outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
                              active ? 'border-primary bg-secondary ring-1 ring-primary' : 'bg-card hover:bg-accent',
                            )}
                          >
                            <StatusDot status={o.value} className="mt-1.5 size-2" />
                            <span className="flex flex-col gap-0.5">
                              <span className="text-sm font-medium">{o.label}</span>
                              <span className="text-xs text-muted-foreground">{o.hint}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </SheetSection>

              <SheetSection title="Day & time">
                <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <div className={cn('self-start rounded-xl border', errors.date && 'border-destructive')}>
                        <Calendar
                          mode="single"
                          required
                          selected={field.value ? isoToDate(field.value) : undefined}
                          defaultMonth={field.value ? isoToDate(field.value) : undefined}
                          today={isoToDate(todayISO())}
                          disabled={{ before: isoToDate(todayISO()) }}
                          onSelect={(d) => {
                            if (!d) return;
                            field.onChange(dateToIso(d));
                            setValue('time', '');
                            setConflict(null);
                          }}
                        />
                      </div>
                    )}
                  />
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{date ? formatIso(date, 'EEEE d MMMM') : 'Pick a day'}</span>
                      {patientId ? (
                        day.isLoading ? (
                          <Skeleton className="h-4 w-40" />
                        ) : booked.length ? (
                          <>
                            <span className="text-xs text-muted-foreground">Already booked that day:</span>
                            <ul className="mt-1 flex flex-col gap-1.5" aria-label="Patient's appointments that day">
                              {day.data!.map((a) => (
                                <li key={a.id} className="flex flex-col gap-1 rounded-lg border bg-muted/40 px-2.5 py-2 text-xs">
                                  <span className="flex items-center justify-between gap-2">
                                    <span className="font-mono font-medium">{clinicTimeOf(a.appointmentDate)}</span>
                                    <StatusBadge status={a.status} className="h-5 px-2 text-[11px]" />
                                  </span>
                                  <span className="text-muted-foreground">{a.reason}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">No other appointments for this patient that day.</span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Select a patient to see their day.</span>
                      )}
                    </div>
                  </div>
                </div>
                <Controller
                  control={control}
                  name="time"
                  render={({ field }) => (
                    <TimeSlots
                      value={field.value}
                      onChange={(t) => {
                        field.onChange(t);
                        setConflict(null);
                      }}
                      booked={booked}
                      minTime={minTime}
                      enforceRule={status === 'confirmed'}
                      invalid={Boolean(errors.time)}
                    />
                  )}
                />
                {errors.time && (
                  <p role="alert" className="-mt-1 text-[13px] text-destructive">
                    {errors.time.message}
                  </p>
                )}
                {blockedMessage && (
                  <div role="alert" className="flex gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-red-900">
                    <AlertCircleIcon className="mt-0.5 size-4.5 shrink-0 text-destructive" aria-hidden />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold">Scheduling conflict</span>
                      <span className="text-[13px]">{blockedMessage}</span>
                    </div>
                  </div>
                )}
              </SheetSection>

              <SheetSection title="Details">
                <Field label="Reason" htmlFor="a-reason" error={errors.reason?.message}>
                  <Input id="a-reason" autoComplete="off" placeholder="e.g. Blood pressure follow-up" aria-invalid={errors.reason ? true : undefined} {...register('reason')} />
                </Field>
                <Field label="Notes" htmlFor="a-notes" error={errors.notes?.message} hint="Optional · up to 1000 characters">
                  <Textarea id="a-notes" rows={3} aria-invalid={errors.notes ? true : undefined} {...register('notes')} />
                </Field>
              </SheetSection>
            </SheetBody>

            <SheetFooter className="sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 text-[13px] text-muted-foreground" aria-live="polite">
                {selectedPatient && date && time ? (
                  <span>
                    <span className="font-medium text-foreground">{selectedPatient.fullName}</span> · {formatIso(date, 'EEE d MMM')} at{' '}
                    <span className="font-mono text-foreground">{time}</span> · {status}
                  </span>
                ) : (
                  'Choose a patient, day and time'
                )}
              </div>
              <div className="flex shrink-0 justify-end gap-2.5">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending || Boolean(localConflict)}>
                  {create.isPending ? 'Creating…' : 'Create appointment'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        )}
      </SheetContent>

      <PatientFormSheet
        open={addPatientOpen}
        onOpenChange={setAddPatientOpen}
        onSaved={(p) => {
          setValue('patientId', p.id, { shouldValidate: true });
          setValue('time', '');
        }}
      />
    </Sheet>
  );
}
