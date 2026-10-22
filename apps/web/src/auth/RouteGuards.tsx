import { Navigate, Outlet, useLocation } from 'react-router';
import type { Location } from 'react-router';
import { useAuth } from './AuthContext.tsx';

// Shown while the session is being restored, so protected pages don't flash /login
function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <div className="size-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'anonymous') {
    // Remember where they were going, so login can send them back
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

// Login/register pages: logged-in users go on to where they were heading
export function GuestRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') {
    const from = (location.state as { from?: Location } | null)?.from;
    return <Navigate to={from ? `${from.pathname}${from.search}` : '/dashboard'} replace />;
  }
  return <Outlet />;
}
