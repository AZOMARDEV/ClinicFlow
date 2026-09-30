import { toast } from 'sonner';
import { Trash2Icon, TriangleAlertIcon } from 'lucide-react';
import { Avatar } from '@/components/common';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/lib/datetime';
import { errorMessage } from '@/lib/errors';
import { useAppointments, useDeletePatient } from '@/lib/queries';
import type { Patient } from '@/lib/types';

interface Props {
  patient: Patient | null;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}

/** Confirmation panel that shows exactly what will be removed (the patient and, by cascade, their appointments). */
export function DeletePatientSheet({ patient, onOpenChange, onDeleted }: Props) {
  const del = useDeletePatient();
  const appts = useAppointments({ patientId: patient?.id }, { enabled: Boolean(patient) });
  const list = appts.data ?? [];

  const confirm = () => {
    if (!patient) return;
    del.mutate(patient.id, {
      onSuccess: () => {
        toast.success('Patient deleted', { description: patient.fullName });
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <Sheet
      open={Boolean(patient)}
      onOpenChange={(open) => {
        if (!open) del.reset();
        onOpenChange(open);
      }}
    >
      <SheetContent>
        <SheetHeader icon={<Trash2Icon />} tone="destructive">
          <SheetTitle>Delete patient?</SheetTitle>
          <SheetDescription>This permanently removes the patient and all of their appointments.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {del.isError && <FormErrorAlert error={del.error} title="Could not delete the patient" />}

          {patient && (
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3.5">
              <Avatar name={patient.fullName} className="size-10 text-sm" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-medium">{patient.fullName}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  {patient.cin} · {patient.phone}
                </span>
              </div>
            </div>
          )}

          <SheetSection title="Also deleted">
            {appts.isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : list.length === 0 ? (
              <p className="text-sm text-muted-foreground">No appointments. Only the patient record will be removed.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-row-border rounded-xl border">
                {list.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{a.reason}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(a.appointmentDate)}</span>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </SheetSection>

          <div className="flex gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-[13px] text-amber-900">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            This cannot be undone.
          </div>
        </SheetBody>
        <SheetFooter className="flex-row justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={del.isPending}>
            <Trash2Icon />
            {del.isPending ? 'Deleting…' : list.length ? `Delete patient and ${list.length} appointment${list.length === 1 ? '' : 's'}` : 'Delete patient'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
