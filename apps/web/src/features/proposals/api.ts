import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Paginated,
  Proposal,
  ProposalDraft,
  ProposalInput,
  ProposalSaveInput,
  ProposalSummary,
  ProposalUpdateInput,
} from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { dashboardKeys } from '../dashboard/api.ts';

// Lists and details share the ['proposals'] prefix, so one invalidate refreshes both
export const proposalKeys = {
  all: ['proposals'] as const,
  list: (q: string, page: number) => [...proposalKeys.all, 'list', { q, page }] as const,
  detail: (id: string) => [...proposalKeys.all, 'detail', id] as const,
};

export function useProposals(q: string, page: number) {
  return useQuery({
    queryKey: proposalKeys.list(q, page),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set('q', q);
      return api<Paginated<ProposalSummary>>(`/proposals?${params}`, { signal });
    },
    // Keep showing the current page while the next one loads
    placeholderData: keepPreviousData,
  });
}

export function useProposal(id: string) {
  return useQuery({
    queryKey: proposalKeys.detail(id),
    queryFn: ({ signal }) =>
      api<{ proposal: Proposal }>(`/proposals/${encodeURIComponent(id)}`, { signal }).then(
        (d) => d.proposal,
      ),
  });
}

export function useGenerateProposal() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  return useMutation({
    mutationFn: (input: ProposalInput) =>
      api<{ draft: ProposalDraft }>('/proposals/generate', { method: 'POST', body: input }).then(
        (d) => d.draft,
      ),
    onSuccess: (draft) => {
      // Update the credits badge straight away from the server's figure
      if (user) setUser({ ...user, aiCredits: draft.creditsRemaining });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useSaveProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProposalSaveInput) =>
      api<{ proposal: Proposal }>('/proposals', { method: 'POST', body: input }).then(
        (d) => d.proposal,
      ),
    onSuccess: (proposal) => {
      queryClient.setQueryData(proposalKeys.detail(proposal.id), proposal);
      queryClient.invalidateQueries({ queryKey: [...proposalKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateProposal(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProposalUpdateInput) =>
      api<{ proposal: Proposal }>(`/proposals/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: input,
      }).then((d) => d.proposal),
    onSuccess: (proposal) => {
      // Use the server's copy directly: no refetch, no flicker
      queryClient.setQueryData(proposalKeys.detail(id), proposal);
      queryClient.invalidateQueries({ queryKey: [...proposalKeys.all, 'list'] });
    },
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api<void>(`/proposals/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: proposalKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...proposalKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
