import { Link } from 'react-router';
import type { ReactNode } from 'react';
import type { Paginated } from '@afa/shared';
import { timeAgo } from '../../lib/time.ts';
import { Button } from '../ui/Button.tsx';
import { Card } from '../ui/Card.tsx';
import { QueryError } from '../ui/QueryError.tsx';
import { Skeleton } from '../ui/Skeleton.tsx';

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  preview?: string;
  createdAt: string;
  badge?: string;
};

type DocumentListProps = {
  // What the query hook returns
  data: Paginated<ListItem> | undefined;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  // From useListParams()
  search: string;
  onSearch: (value: string) => void;
  page: number;
  onPage: (page: number) => void;
  hrefFor: (id: string) => string;
  searchLabel?: string;
  // Shown when there are no documents at all (not just no search results)
  empty: ReactNode;
};

export function DocumentList({
  data,
  isPending,
  isError,
  isFetching,
  onRetry,
  search,
  onSearch,
  page,
  onPage,
  hrefFor,
  searchLabel = 'Search',
  empty,
}: DocumentListProps) {
  const searching = search.trim().length > 0;

  return (
    <Card className="min-w-0">
      <div className="mb-4">
        <label htmlFor="document-search" className="sr-only">
          {searchLabel}
        </label>
        <input
          id="document-search"
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={`${searchLabel}…`}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:outline-2 focus:outline-primary sm:max-w-xs"
        />
      </div>

      {!data && isError ? (
        <QueryError
          message="Couldn't load your documents."
          onRetry={onRetry}
          retrying={isFetching}
        />
      ) : !data || isPending ? (
        <ul aria-label="Loading" className="divide-y divide-border">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="space-y-2 py-4">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </li>
          ))}
        </ul>
      ) : data.items.length === 0 ? (
        <div className="py-10 text-center text-sm">
          {searching ? <p className="text-muted">No results for “{search.trim()}”.</p> : empty}
        </div>
      ) : (
        <>
          <ul
            className={`divide-y divide-border ${isFetching ? 'opacity-60' : ''}`}
            aria-busy={isFetching || undefined}
          >
            {data.items.map((item) => (
              <li key={item.id}>
                <Link
                  to={hrefFor(item.id)}
                  className="-mx-2 block rounded-lg px-2 py-3.5 hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate font-medium">{item.title}</p>
                    <time
                      dateTime={item.createdAt}
                      title={new Date(item.createdAt).toLocaleString()}
                      className="shrink-0 text-xs text-muted"
                    >
                      {timeAgo(item.createdAt)}
                    </time>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                    {item.subtitle && <span className="truncate">{item.subtitle}</span>}
                    {item.badge && (
                      <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  {item.preview && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted">{item.preview}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <nav
              aria-label="Pages"
              className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-4"
            >
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => onPage(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted">
                Page {data.page} of {data.totalPages} · {data.total} total
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => onPage(page + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </Card>
  );
}
