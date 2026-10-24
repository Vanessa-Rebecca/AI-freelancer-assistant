import { Link } from 'react-router';
import { toneLabels } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { DocumentList } from '../../components/documents/DocumentList.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { useProposals } from '../../features/proposals/api.ts';
import { useListParams } from '../../lib/useListParams.ts';
import { primaryLink } from '../../components/ui/styles.ts';

export function ProposalsPage() {
  const list = useListParams();
  const query = useProposals(list.q, list.page);

  // Shape API rows for the shared list component
  const data = query.data && {
    ...query.data,
    items: query.data.items.map((p) => ({
      id: p.id,
      title: p.projectTitle,
      subtitle: p.clientName,
      badge: toneLabels[p.tone],
      preview: p.preview,
      createdAt: p.createdAt,
    })),
  };

  return (
    <>
      <PageHeader
        title="Proposals"
        description="Win projects with tailored proposals written by AI."
        actions={
          <Link to="/proposals/new" className={primaryLink}>
            <Icon name="sparkles" className="size-4" />
            New proposal
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
        hrefFor={(id) => `/proposals/${id}`}
        searchLabel="Search proposals"
        empty={
          <div className="space-y-3">
            <p className="font-medium">No proposals yet</p>
            <p className="text-muted">Generate your first one in under a minute.</p>
            <Link to="/proposals/new" className={primaryLink}>
              <Icon name="sparkles" className="size-4" />
              New proposal
            </Link>
          </div>
        }
      />
    </>
  );
}
