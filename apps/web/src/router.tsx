import { createBrowserRouter, Navigate } from 'react-router';
import { GuestRoute, ProtectedRoute } from './auth/RouteGuards.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { RegisterPage } from './pages/auth/RegisterPage.tsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.tsx';

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
    // Logged-in only. The app layout (sidebar) wraps these in Step 1.18.
    element: <ProtectedRoute />,
    children: [{ path: '/dashboard', element: <DashboardPage /> }],
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
