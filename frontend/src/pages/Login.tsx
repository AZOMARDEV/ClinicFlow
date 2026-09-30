import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { AlertCircleIcon, PlusIcon } from 'lucide-react';
import { Field } from '@/components/common';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApiError } from '@/lib/api';
import { errorMessage } from '@/lib/errors';
import { useAuth } from '@/lib/auth';

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

const DEMO_ACCOUNTS = [
  { email: 'admin@clinicflow.test', password: 'Admin123!', role: 'Admin' },
  { email: 'staff1@clinicflow.test', password: 'Staff123!', role: 'Staff' },
];

const HIGHLIGHTS = [
  ['Rule', '30-min spacing'],
  ['Roles', 'Admin · Staff'],
  ['Timezone', 'Casablanca'],
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.fullName.split(' ')[0]}`);
      navigate(from, { replace: true });
    } catch (err) {
      const message = err instanceof ApiError && err.status === 401 ? err.message : errorMessage(err);
      setFormError(message);
      toast.error(message);
    }
  });

  const fillDemo = (email: string, password: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary px-16 py-14 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-white/15">
            <PlusIcon className="size-5.5" strokeWidth={2.5} aria-hidden />
          </span>
          <span className="text-xl font-semibold">ClinicFlow</span>
        </div>
        <div className="flex max-w-[500px] flex-col gap-4.5">
          <p className="text-[44px] leading-[1.08] font-semibold tracking-[-0.03em]">
            Patients, appointments and today’s schedule in one place.
          </p>
          <p className="text-base leading-relaxed text-white/85">
            Book visits, confirm them without double-booking, and see the day at a glance.
          </p>
        </div>
        <dl className="grid max-w-[520px] grid-cols-3 gap-3">
          {HIGHLIGHTS.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-1 rounded-[10px] bg-white/10 px-4 py-3.5">
              <dt className="text-[13px] text-white/80">{k}</dt>
              <dd className="text-[15px] font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex items-center justify-center px-4 py-12 sm:px-12">
        <form onSubmit={onSubmit} noValidate className="flex w-full max-w-[400px] flex-col gap-5.5">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="inline-flex size-9 items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
              <PlusIcon className="size-5" strokeWidth={2.5} aria-hidden />
            </span>
            <span className="text-lg font-semibold">ClinicFlow</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Sign in</h1>
            <p className="text-sm text-muted-foreground">Use your clinic staff account.</p>
          </div>

          {formError && (
            <div role="alert" className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-900">
              <AlertCircleIcon className="size-4.5 shrink-0 text-destructive" aria-hidden />
              {formError}
            </div>
          )}

          <Field label="Email" htmlFor="l-email" error={errors.email?.message}>
            <Input id="l-email" type="email" autoComplete="username" aria-invalid={errors.email ? true : undefined} {...register('email')} />
          </Field>
          <Field label="Password" htmlFor="l-password" error={errors.password?.message}>
            <Input
              id="l-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
          </Field>
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <div className="flex flex-col gap-1 rounded-[10px] border border-dashed bg-card px-4 py-3.5">
            <span className="mb-1 text-xs font-semibold tracking-[0.04em] text-muted-foreground uppercase">Demo accounts</span>
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                type="button"
                onClick={() => fillDemo(a.email, a.password)}
                className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-accent cursor-pointer"
              >
                <span className="font-mono">{a.email}</span>
                <span className="font-mono text-muted-foreground">{a.password}</span>
              </button>
            ))}
            <span className="mt-1 text-xs text-muted-foreground">Click an account to fill the form.</span>
          </div>
        </form>
      </section>
    </div>
  );
}
