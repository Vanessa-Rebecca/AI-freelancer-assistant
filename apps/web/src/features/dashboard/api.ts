import { useQuery } from '@tanstack/react-query';
import type { ActivityItem, DashboardStats } from '@afa/shared';
import { api } from '../../lib/api.ts';

// Every dashboard query starts with ['dashboard'], so one invalidate refreshes them all
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  activity: (limit: number) => [...dashboardKeys.all, 'activity', limit] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: ({ signal }) =>
      api<{ stats: DashboardStats }>('/dashboard/stats', { signal }).then((d) => d.stats),
  });
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: dashboardKeys.activity(limit),
    queryFn: ({ signal }) =>
      api<{ items: ActivityItem[] }>(`/dashboard/activity?limit=${limit}`, { signal }).then(
        (d) => d.items,
      ),
  });
}
