import { RouterProvider } from 'react-router';
import { AuthProvider } from './auth/AuthContext.tsx';
import { router } from './router.tsx';

export function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
