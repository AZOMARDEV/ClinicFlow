import { toast } from 'sonner';
import { StatusBadge, StatusDot, STATUS_META } from '@/components/StatusBadge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { errorMessage } from '@/lib/errors';
import { useUpdateAppointmentStatus } from '@/lib/queries';
import { APPOINTMENT_STATUSES, type Appointment, type AppointmentStatus } from '@/lib/types';

/** Status badge that opens a menu to change the appointment's status. */
export function StatusMenu({ appointment }: { appointment: Appointment }) {
  const mutation = useUpdateAppointmentStatus();

  const change = (value: string) => {
    const status = value as AppointmentStatus;
    if (status === appointment.status) return;
    mutation.mutate(
      { id: appointment.id, status },
      {
        onSuccess: () => toast.success(`Appointment ${STATUS_META[status].label.toLowerCase()}`, {
          description: appointment.patientName,
        }),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={mutation.isPending}
        aria-label={`Status: ${STATUS_META[appointment.status].label}. Change status`}
        className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 cursor-pointer disabled:opacity-60"
      >
        <StatusBadge status={appointment.status} withCaret />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Change status</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={appointment.status} onValueChange={change}>
          {APPOINTMENT_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <StatusDot status={s} className="size-2" />
              {STATUS_META[s].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
