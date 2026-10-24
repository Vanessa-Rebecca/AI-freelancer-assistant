import { Link } from 'react-router';
import { toneLabels } from '@afa/shared';
import { PageHeader } from '../../components/layout/PageHeader.tsx';
import { DocumentList } from '../../components/documents/DocumentList.tsx';
import { Icon } from '../../components/ui/Icon.tsx';
import { primaryLink } from '../../components/ui/styles.ts';
import { useCoverLetters } from '../../features/coverLetters/api.ts';
import { useListParams } from '../../lib/useListParams.ts';

export function CoverLettersPage() {
  const list = useListParams();
  const query = useCoverLetters(list.q, list.page);

  const data = query.data && {
    ...query.data,
    items: query.data.items.map((c) => ({
      id: c.id,
      title: c.jobTitle,
      subtitle: c.companyName,
      badge: toneLabels[c.tone],
      preview: c.preview,
      createdAt: c.createdAt,
    })),
  };

  return (
    <>
      <PageHeader
        title="Cover letters"
        description="Tailored cover letters for every job you apply to."
        actions={
          <Link to="/cover-letters/new" className={primaryLink}>
            <Icon name="sparkles" className="size-4" />
            New cover letter
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
        hrefFor={(id) => `/cover-letters/${id}`}
        searchLabel="Search cover letters"
        empty={
          <div className="space-y-3">
            <p className="font-medium">No cover letters yet</p>
            <p className="text-muted">Write a tailored one for your next application.</p>
            <Link to="/cover-letters/new" className={primaryLink}>
              <Icon name="sparkles" className="size-4" />
              New cover letter
            </Link>
          </div>
        }
      />
    </>
  );
}
