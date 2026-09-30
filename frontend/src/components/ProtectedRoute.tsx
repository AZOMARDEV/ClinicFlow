import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2Icon } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground" role="status">
        <Loader2Icon className="size-5 animate-spin" aria-hidden />
        <span className="sr-only">Loading session</span>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
