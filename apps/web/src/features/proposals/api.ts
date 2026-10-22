import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Proposal, ProposalDraft, ProposalInput, ProposalSaveInput } from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { dashboardKeys } from '../dashboard/api.ts';

export const proposalKeys = {
  all: ['proposals'] as const,
};

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proposalKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
