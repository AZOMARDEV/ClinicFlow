import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { UserPenIcon, UserPlusIcon } from 'lucide-react';
import { DatePicker } from '@/components/DatePicker';
import { Field } from '@/components/common';
import { FormErrorAlert } from '@/components/FormErrorAlert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetSection, SheetTitle } from '@/components/ui/sheet';
import { ageFrom, isoToDate, todayISO } from '@/lib/datetime';
import { errorMessage } from '@/lib/errors';
import { applyServerErrors } from '@/lib/form-errors';
import { useSavePatient } from '@/lib/queries';
import type { Patient } from '@/lib/types';

const PHONE_RE = /^(?:(?:\+212|0)[5-7]\d{8}|\+[1-9]\d{7,14})$/;

const schema = z.object({
  fullName: z.string().trim().min(2, 'At least 2 characters').max(100, 'At most 100 characters'),
  cin: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(z.string().regex(/^[A-Z0-9]{4,20}$/, '4–20 letters or digits, e.g. AB123456')),
  phone: z
    .string()
    .trim()
    .refine((v) => PHONE_RE.test(v.replace(/[\s.-]/g, '')), 'Moroccan (06…, +212…) or international (+…) number'),
  birthDate: z
    .string()
    .min(1, 'Birth date is required')
    .refine((d) => d <= todayISO(), 'Birth date cannot be in the future')
    .refine((d) => d >= '1900-01-01', 'Birth date is too far in the past'),
  address: z.string().trim().max(255, 'At most 255 characters'),
});

type FormValues = z.input<typeof schema>;
const FIELDS = ['fullName', 'cin', 'phone', 'birthDate', 'address'] as const;

const toValues = (p?: Patient): FormValues => ({
  fullName: p?.fullName ?? '',
  cin: p?.cin ?? '',
  phone: p?.phone ?? '',
  birthDate: p?.birthDate ?? '',
  address: p?.address ?? '',
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Edit mode when set */
  patient?: Patient;
  onSaved?: (patient: Patient) => void;
}

export function PatientFormSheet({ open, onOpenChange, patient, onSaved }: Props) {
  const save = useSavePatient();
  const isEdit = Boolean(patient);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: toValues(patient) });

  useEffect(() => {
    if (open) {
      reset(toValues(patient));
      save.reset();
    }
    // `save` is a new object every render; only re-run when the sheet opens or the patient changes
  }, [open, patient, reset]);

  const birthDate = watch('birthDate');

  const onSubmit = handleSubmit((values) => {
    const input = schema.parse(values);
    save.mutate(
      { id: patient?.id, input: { ...input, address: input.address || undefined } },
      {
        onSuccess: (saved) => {
          toast.success(isEdit ? 'Patient updated' : 'Patient added', { description: saved.fullName });
          onOpenChange(false);
          onSaved?.(saved);
        },
        onError: (err) => {
          const mapped = applyServerErrors(err, setError, FIELDS);
          toast.error(errorMessage(err));
          if (mapped) save.reset();
        },
      },
    );
  });

  const describedBy = (name: (typeof FIELDS)[number]) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `p-${name}-error` : undefined,
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader icon={isEdit ? <UserPenIcon /> : <UserPlusIcon />}>
          <SheetTitle>{isEdit ? 'Edit patient' : 'Add patient'}</SheetTitle>
          <SheetDescription>
            {isEdit ? `Update ${patient?.fullName}’s details.` : 'Register a new patient. The CIN must be unique.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <SheetBody>
            {save.isError && <FormErrorAlert error={save.error} />}

            <SheetSection title="Identity">
              <Field label="Full name" htmlFor="p-fullName" error={errors.fullName?.message}>
                <Input id="p-fullName" autoComplete="off" placeholder="e.g. Youssef El Amrani" {...register('fullName')} {...describedBy('fullName')} />
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="CIN" htmlFor="p-cin" error={errors.cin?.message} hint="National ID, letters and digits">
                  <Input id="p-cin" autoComplete="off" placeholder="AB123456" className="font-mono uppercase" {...register('cin')} {...describedBy('cin')} />
                </Field>
                <Field
                  label="Birth date"
                  htmlFor="p-birthDate"
                  error={errors.birthDate?.message}
                  hint={birthDate && !errors.birthDate ? `${ageFrom(birthDate)} years old` : undefined}
                >
                  <Controller
                    control={control}
                    name="birthDate"
                    render={({ field }) => (
                      <DatePicker
                        id="p-birthDate"
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        placeholder="Select date"
                        withYearPicker
                        disabled={{ after: isoToDate(todayISO()) }}
                        invalid={Boolean(errors.birthDate)}
                        aria-describedby={errors.birthDate ? 'p-birthDate-error' : undefined}
                      />
                    )}
                  />
                </Field>
              </div>
            </SheetSection>

            <SheetSection title="Contact">
              <Field label="Phone" htmlFor="p-phone" error={errors.phone?.message} hint="06…, 07…, +212… or international">
                <Input id="p-phone" type="tel" autoComplete="off" placeholder="+212 6 61 23 45 67" className="font-mono" {...register('phone')} {...describedBy('phone')} />
              </Field>
              <Field label="Address" htmlFor="p-address" error={errors.address?.message} hint="Optional">
                <Input id="p-address" autoComplete="off" placeholder="Street, city" {...register('address')} {...describedBy('address')} />
              </Field>
            </SheetSection>
          </SheetBody>

          <SheetFooter className="flex-row justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={save.isPending || (isEdit && !isDirty)}>
              {save.isPending ? 'Saving…' : isEdit ? 'Save changes' : 'Add patient'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
