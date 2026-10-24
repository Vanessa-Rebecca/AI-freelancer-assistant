import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GigDescription,
  GigInput,
  GigSaveInput,
  GigSummary,
  GigUpdateInput,
  GeneratedGig,
  Paginated,
} from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { dashboardKeys } from '../dashboard/api.ts';

export const gigKeys = {
  all: ['gigs'] as const,
  list: (q: string, page: number) => [...gigKeys.all, 'list', { q, page }] as const,
  detail: (id: string) => [...gigKeys.all, 'detail', id] as const,
};

const path = (id: string) => `/gigs/${encodeURIComponent(id)}`;

export function useGigs(q: string, page: number) {
  return useQuery({
    queryKey: gigKeys.list(q, page),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set('q', q);
      return api<Paginated<GigSummary>>(`/gigs?${params}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}

export function useGig(id: string) {
  return useQuery({
    queryKey: gigKeys.detail(id),
    queryFn: ({ signal }) => api<{ gig: GigDescription }>(path(id), { signal }).then((d) => d.gig),
  });
}

export function useGenerateGig() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  return useMutation({
    mutationFn: (input: GigInput) =>
      api<{ draft: GeneratedGig }>('/gigs/generate', {
        method: 'POST',
        body: input,
      }).then((d) => d.draft),
    onSuccess: (draft) => {
      if (user) setUser({ ...user, aiCredits: draft.creditsRemaining });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useSaveGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GigSaveInput) =>
      api<{ gig: GigDescription }>('/gigs', { method: 'POST', body: input }).then((d) => d.gig),
    onSuccess: (gig) => {
      queryClient.setQueryData(gigKeys.detail(gig.id), gig);
      queryClient.invalidateQueries({ queryKey: [...gigKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateGig(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GigUpdateInput) =>
      api<{ gig: GigDescription }>(path(id), { method: 'PATCH', body: input }).then((d) => d.gig),
    onSuccess: (gig) => {
      queryClient.setQueryData(gigKeys.detail(id), gig);
      queryClient.invalidateQueries({ queryKey: [...gigKeys.all, 'list'] });
      // The edit appears in Recent activity
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteGig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api<void>(path(id), { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: gigKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...gigKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
