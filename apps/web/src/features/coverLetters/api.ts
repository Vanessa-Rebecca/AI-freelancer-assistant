import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CoverLetter,
  CoverLetterInput,
  CoverLetterSaveInput,
  CoverLetterSummary,
  CoverLetterUpdateInput,
  GeneratedDraft,
  Paginated,
} from '@afa/shared';
import { useAuth } from '../../auth/AuthContext.tsx';
import { api } from '../../lib/api.ts';
import { dashboardKeys } from '../dashboard/api.ts';

export const coverLetterKeys = {
  all: ['coverLetters'] as const,
  list: (q: string, page: number) => [...coverLetterKeys.all, 'list', { q, page }] as const,
  detail: (id: string) => [...coverLetterKeys.all, 'detail', id] as const,
};

const path = (id: string) => `/cover-letters/${encodeURIComponent(id)}`;

export function useCoverLetters(q: string, page: number) {
  return useQuery({
    queryKey: coverLetterKeys.list(q, page),
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page) });
      if (q) params.set('q', q);
      return api<Paginated<CoverLetterSummary>>(`/cover-letters?${params}`, { signal });
    },
    placeholderData: keepPreviousData,
  });
}

export function useCoverLetter(id: string) {
  return useQuery({
    queryKey: coverLetterKeys.detail(id),
    queryFn: ({ signal }) =>
      api<{ coverLetter: CoverLetter }>(path(id), { signal }).then((d) => d.coverLetter),
  });
}

export function useGenerateCoverLetter() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuth();

  return useMutation({
    mutationFn: (input: CoverLetterInput) =>
      api<{ draft: GeneratedDraft }>('/cover-letters/generate', {
        method: 'POST',
        body: input,
      }).then((d) => d.draft),
    onSuccess: (draft) => {
      if (user) setUser({ ...user, aiCredits: draft.creditsRemaining });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useSaveCoverLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CoverLetterSaveInput) =>
      api<{ coverLetter: CoverLetter }>('/cover-letters', { method: 'POST', body: input }).then(
        (d) => d.coverLetter,
      ),
    onSuccess: (coverLetter) => {
      queryClient.setQueryData(coverLetterKeys.detail(coverLetter.id), coverLetter);
      queryClient.invalidateQueries({ queryKey: [...coverLetterKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useUpdateCoverLetter(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CoverLetterUpdateInput) =>
      api<{ coverLetter: CoverLetter }>(path(id), { method: 'PATCH', body: input }).then(
        (d) => d.coverLetter,
      ),
    onSuccess: (coverLetter) => {
      queryClient.setQueryData(coverLetterKeys.detail(id), coverLetter);
      queryClient.invalidateQueries({ queryKey: [...coverLetterKeys.all, 'list'] });
      // The edit appears in Recent activity
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}

export function useDeleteCoverLetter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api<void>(path(id), { method: 'DELETE' }),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: coverLetterKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: [...coverLetterKeys.all, 'list'] });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
