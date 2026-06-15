import { useQuery } from '@tanstack/react-query';
import type { DashboardStats, TeamMemberStats, ActivityFeedItem, Profile } from '@/types/database';

interface CombinedStats extends DashboardStats {
  teamMemberStats: TeamMemberStats[];
}

/**
 * Hook to fetch combined dashboard summary statistics.
 */
export function useDashboardStats(workspaceId?: string) {
  return useQuery<CombinedStats>({
    queryKey: ['dashboard-stats', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?workspaceId=${workspaceId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return res.json();
    },
    enabled: !!workspaceId,
  });
}

/**
 * Hook to fetch workspace activity feed.
 */
export function useActivityFeed(workspaceId?: string) {
  return useQuery<(ActivityFeedItem & { actor: Profile | null })[]>({
    queryKey: ['activity-feed', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/activity?workspaceId=${workspaceId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch activity feed');
      }
      return res.json();
    },
    enabled: !!workspaceId,
  });
}

