import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';

const SEARCH_DELAY_MS = 300;

/**
 * Search text and page number kept in the URL (?q=…&page=…), so Back returns
 * to the same results and links can be shared. Typing updates the box at once
 * but the URL (and the request) only after a short pause.
 */
export function useListParams() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(q);

  useEffect(() => {
    if (search.trim() === q) return;
    const timer = setTimeout(() => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (search.trim()) next.set('q', search.trim());
          else next.delete('q');
          // A new search starts from the first page
          next.delete('page');
          return next;
        },
        { replace: true },
      );
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, q, setParams]);

  const setPage = (n: number) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (n > 1) next.set('page', String(n));
      else next.delete('page');
      return next;
    });

  return { q, page, search, setSearch, setPage };
}
