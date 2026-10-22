import { useAuth } from '../auth/AuthContext.tsx';
import { PlaceholderPage } from './PlaceholderPage.tsx';

export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <PlaceholderPage title="Dashboard">
      <p>
        Signed in as <strong className="text-foreground">{user?.email}</strong>
      </p>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover"
      >
        Log out
      </button>
    </PlaceholderPage>
  );
}
