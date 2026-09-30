import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarIcon, LayoutDashboardIcon, LogOutIcon, PlusIcon, UsersIcon } from 'lucide-react';
import { Avatar } from '@/components/common';
import { ConnectionBanner } from '@/components/ConnectionBanner';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, end: true },
  { to: '/patients', label: 'Patients', icon: UsersIcon, end: false },
  { to: '/appointments', label: 'Appointments', icon: CalendarIcon, end: false },
];

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex size-8.5 items-center justify-center rounded-[9px] bg-primary text-primary-foreground">
        <PlusIcon className="size-5" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="flex flex-col">
        <span className="text-base font-semibold tracking-[-0.01em]">ClinicFlow</span>
        {!compact && <span className="text-xs text-muted-foreground">Patient management</span>}
      </div>
    </div>
  );
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
    isActive ? 'bg-secondary font-semibold text-secondary-foreground' : 'text-[#4a4843] hover:bg-accent',
  );

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-62 shrink-0 flex-col gap-7 border-r bg-card px-3.5 py-5 md:flex">
        <div className="px-2 pt-1">
          <Logo />
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon className="size-4.5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center gap-2.5 border-t border-row-border px-2 pt-3">
          <Avatar name={user?.fullName ?? '?'} className="size-9 text-[13px]" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium">{user?.fullName}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out" title="Log out" className="text-muted-foreground">
            <LogOutIcon />
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <ConnectionBanner />
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 flex flex-col gap-3 border-b bg-card px-4 pt-3 pb-2 md:hidden">
          <div className="flex items-center justify-between">
            <Logo compact />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOutIcon />
              </Button>
            </div>
          </div>
          <nav aria-label="Main" className="-mx-1 flex gap-1 overflow-x-auto">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={(s) => cn(navClass(s), 'h-9 shrink-0')}>
                <Icon className="size-4" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="mx-auto flex w-full max-w-[1680px] flex-1 flex-col gap-6 px-4 py-6 sm:px-8 lg:px-12 lg:py-9">
          <ErrorBoundary resetKey={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
