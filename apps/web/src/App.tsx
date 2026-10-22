import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { router } from './router.tsx';

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ToastProvider>
  );
}
