import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext.tsx';
import { ToastProvider } from './components/ui/Toast.tsx';
import { queryClient } from './lib/queryClient.ts';
import { router } from './router.tsx';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
