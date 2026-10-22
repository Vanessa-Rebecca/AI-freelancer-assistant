import { createBrowserRouter, Navigate } from 'react-router';
import { GuestRoute, ProtectedRoute } from './auth/RouteGuards.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.tsx';
import { AppLayout } from './components/layout/AppLayout.tsx';
import { ComingSoonPage } from './pages/ComingSoonPage.tsx';

// Modules built later in the plan: [path, title, day]
const comingSoon: [string, string, number][] = [
  ['/proposals', 'Proposals', 2],
  ['/cover-letters', 'Cover letters', 2],
  ['/gigs', 'Gig descriptions', 3],
  ['/pricing', 'Pricing', 3],
  ['/replies', 'Client replies', 4],
  ['/invoices', 'Invoices', 4],
  ['/contracts', 'Contracts', 4],
  ['/clients', 'Clients', 4],
  ['/history', 'History', 5],
  ['/profile', 'Profile', 5],
  ['/settings', 'Settings', 5],
];

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  {
    // Logged-out only
    element: <GuestRoute />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },
  // Opened from an email link, so it works whether or not someone is logged in
  { path: '/reset-password', element: <ResetPasswordPage /> },
  {
    // Logged-in only, inside the sidebar + top bar layout
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <DashboardPage /> },
          ...comingSoon.map(([path, title, day]) => ({
            path,
            element: <ComingSoonPage title={title} day={day} />,
          })),
        ],
      },
    ],
  },
  // Component gallery for development; the dynamic import is dropped from production builds
  ...(import.meta.env.DEV
    ? [
        {
          path: '/dev/ui',
          lazy: () =>
            import('./pages/dev/UiPreviewPage.tsx').then((m) => ({ Component: m.UiPreviewPage })),
        },
      ]
    : []),
  { path: '*', element: <NotFoundPage /> },
]);
