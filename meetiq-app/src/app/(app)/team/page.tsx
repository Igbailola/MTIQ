'use client';

import React, { useEffect } from 'react';
import { useCurrentWorkspace, useWorkspaceMembers, useRemoveMember } from '@/hooks/use-workspace';
import { InviteMemberDialog } from '@/features/workspace/components/invite-member-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { TeamEmptyState } from '@/features/team/components/team-empty-state';
import { TimezonePlannerCard } from '@/features/team/components/timezone-planner-card';
import { PendingMembersTable } from '@/features/team/components/pending-members-table';
import { ActiveMembersTable } from '@/features/team/components/active-members-table';
import { useTimezoneInsights } from '@/features/team/hooks/use-timezone-insights';
import { logger } from '@/lib/logger';

export default function TeamPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members, isLoading } = useWorkspaceMembers(currentWorkspace?.id);
  const removeMutation = useRemoveMember(currentWorkspace?.id || '');
  const supabase = createClient();
  const queryClient = useQueryClient();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === 'admin';
  const activeMembers = members?.filter((m) => !m.status || m.status === 'active') ?? [];
  const pendingMembers = members?.filter((m) => m.status === 'pending') ?? [];

  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const channel = supabase
      .channel(`workspace-members-realtime-${currentWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workspace-members', currentWorkspace.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspace?.id, queryClient, supabase]);

  const timezoneInsights = useTimezoneInsights(activeMembers, user?.id);

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return;
    }
    try {
      await removeMutation.mutateAsync({ userId: memberId });
    } catch (err) {
      logger.error('Error occurred', err);
    }
  };

  if (!currentWorkspace) {
    return <TeamEmptyState type="no-workspace" />;
  }

  return (
    <div className="space-y-6 font-body">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
            Team Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage members, roles, and timezone availability in the active workspace.
          </p>
        </div>
        {isAdmin && <InviteMemberDialog workspaceId={currentWorkspace.id} />}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : !members || members.length === 0 ? (
        <TeamEmptyState type="no-members" workspaceId={currentWorkspace.id} isAdmin={isAdmin} />
      ) : (
        <div className="space-y-6">
          {timezoneInsights && (
            <TimezonePlannerCard insights={timezoneInsights} activeMembersCount={activeMembers.length} />
          )}

          <PendingMembersTable
            members={pendingMembers}
            isAdmin={isAdmin}
            onRemoveMember={handleRemoveMember}
            isRemoving={removeMutation.isPending}
          />

          <ActiveMembersTable
            members={activeMembers}
            isAdmin={isAdmin}
            currentUserId={user?.id}
            onRemoveMember={handleRemoveMember}
            isRemoving={removeMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}
