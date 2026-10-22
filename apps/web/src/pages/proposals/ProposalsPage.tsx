import { Link } from 'react-router';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { Card } from '../../components/ui/Card.tsx';
import { Icon } from '../../components/ui/Icon.tsx';

const newButton =
  'inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// History list arrives in Step 2.10
export function ProposalsPage() {
  return (
    <>
      <PageHeader
        title="Proposals"
        description="Win projects with tailored proposals written by AI."
        actions={
          <Link to="/proposals/new" className={newButton}>
            <Icon name="sparkles" className="size-4" />
            New proposal
          </Link>
        }
      />
      <Card>
        <p className="text-sm text-muted">Your saved proposals will be listed here.</p>
      </Card>
    </>
  );
}
