import { useAuth } from '../auth/AuthContext.tsx';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';

// Widgets and quick actions arrive in Step 1.21
export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.profile?.fullName.split(' ')[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
        description="Here's an overview of your freelance work."
      />
      <Card>
        <p className="text-sm text-muted">Your stats and recent activity will appear here.</p>
      </Card>
    </>
  );
}
