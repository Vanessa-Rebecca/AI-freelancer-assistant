import { createBrowserRouter, Navigate } from 'react-router';
import { GuestRoute, ProtectedRoute } from './auth/RouteGuards.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { PlaceholderPage } from './pages/PlaceholderPage.tsx';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    // Logged-out only. Real forms arrive in Step 1.17.
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <PlaceholderPage title="Log in" /> },
      { path: '/register', element: <PlaceholderPage title="Create account" /> },
      { path: '/forgot-password', element: <PlaceholderPage title="Forgot password" /> },
      { path: '/reset-password', element: <PlaceholderPage title="Reset password" /> },
    ],
  },
  {
    // Logged-in only. The app layout (sidebar) wraps these in Step 1.18.
    element: <ProtectedRoute />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
]);
