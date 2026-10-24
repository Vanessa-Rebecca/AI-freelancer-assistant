import { Link } from 'react-router';
import { experienceLevelLabels } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { DocumentList } from '../../components/documents/DocumentList.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { primaryLink } from '../../components/ui/styles.ts';
import { useGigs } from '../../features/gigs/api.ts';
import { useListParams } from '../../lib/useListParams.ts';
import { deliveryLabel } from './labels.ts';

export function GigsPage() {
  const list = useListParams();
  const query = useGigs(list.q, list.page);

  const data = query.data && {
    ...query.data,
    items: query.data.items.map((g) => ({
      id: g.id,
      title: g.category,
      subtitle: deliveryLabel(g.deliveryDays),
      badge: experienceLevelLabels[g.experienceLevel],
      preview: g.preview,
      createdAt: g.createdAt,
    })),
  };

  return (
    <>
      <PageHeader
        title="Gig descriptions"
        description="Marketplace-ready gigs with SEO keywords and FAQs."
        actions={
          <Link to="/gigs/new" className={primaryLink}>
            <Icon name="sparkles" className="size-4" />
            New gig
          </Link>
        }
      />
      <DocumentList
        data={data}
        isPending={query.isPending}
        isError={query.isError}
        isFetching={query.isFetching}
        onRetry={() => query.refetch()}
        search={list.search}
        onSearch={list.setSearch}
        page={list.page}
        onPage={list.setPage}
        hrefFor={(id) => `/gigs/${id}`}
        searchLabel="Search gigs"
        empty={
          <div className="space-y-3">
            <p className="font-medium">No gigs yet</p>
            <p className="text-muted">Describe your service and get a listing ready to publish.</p>
            <Link to="/gigs/new" className={primaryLink}>
              <Icon name="sparkles" className="size-4" />
              New gig
            </Link>
          </div>
        }
      />
    </>
  );
}
