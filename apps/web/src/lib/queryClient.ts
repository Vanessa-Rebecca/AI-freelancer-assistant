import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api.ts';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Moving between pages doesn't refetch data younger than this
      staleTime: 30_000,
      // Retry once for network/server errors; a 4xx would just repeat the same answer
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status < 500),
    },
  },
});
