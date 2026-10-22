import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card } from '../components/ui/Card.tsx';

// Stand-in for modules that are built later in the plan
export function ComingSoonPage({ title, day }: { title: string; day: number }) {
  return (
    <>
      <PageHeader title={title} />
      <Card>
        <p className="text-sm text-muted">This module is coming on Day {day}.</p>
      </Card>
    </>
  );
}
