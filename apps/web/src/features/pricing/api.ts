import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  GeneratedPricingSuggestion,
  Paginated,
  PricingEstimate,
  PricingEstimateSummary,
  PricingProjectInput,
  PricingSaveInput,
} from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { dashboardKeys } from '../dashboard/api.ts';

export const pricingKeys = {
  all: ['pricing'] as const,
  list: (q: string, page: number) => [...pricingKeys.all, 'list', { q, page }] as const,
  detail: (id: string) => [...pricingKeys.all, 'detail', id] as const,
};

const path = (id: string) => `/pricing/${encodeURIComponent(id)}`;

export function usePricingHistory(q: string, page: number) {
  return useQuery({
    queryKey: pricingKeys.list(q, page),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set('q', q);
      return api<Paginated<PricingEstimateSummary>>(`/pricing/history?${params}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}

export function useEstimate(id: string) {
  return useQuery({
    queryKey: pricingKeys.detail(id),
    queryFn: ({ signal }) =>
      api<{ estimate: PricingEstimate }>(path(id), { signal }).then((d) => d.estimate),
  });
}

export function useSuggestPricing() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  return useMutation({
    mutationFn: (input: PricingProjectInput) =>
      api<GeneratedPricingSuggestion>('/pricing/suggest', { method: 'POST', body: input }),
    onSuccess: (result) => {
      if (user) setUser({ ...user, aiCredits: result.creditsRemaining });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useSaveEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PricingSaveInput) =>
      api<{ estimate: PricingEstimate }>('/pricing', { method: 'POST', body: input }).then(
        (d) => d.estimate,
      ),
    onSuccess: (estimate) => {
      queryClient.setQueryData(pricingKeys.detail(estimate.id), estimate);
      queryClient.invalidateQueries({ queryKey: [...pricingKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteEstimate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api<void>(path(id), { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: pricingKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...pricingKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
