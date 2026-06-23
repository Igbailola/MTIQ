import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceContext } from '@/components/providers/workspace-provider';
import type { Workspace, WorkspaceMember, Profile } from '@/types/database';
import type { WorkspaceCreateInput, WorkspaceUpdateInput, InviteMemberInput } from '@/lib/schemas';
import { toast } from 'sonner';

/**
 * Hook to consume the current workspace context.
 */
export function useCurrentWorkspace() {
  return useWorkspaceContext();
}

/**
 * Mutation to create a workspace.
 */
export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  const { refreshWorkspaces } = useCurrentWorkspace();

  return useMutation<Workspace, Error, WorkspaceCreateInput>({
    mutationFn: async (data) => {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create workspace');
      }
      return res.json();
    },
    onSuccess: (newWorkspace) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      refreshWorkspaces();
      toast.success(`Workspace "${newWorkspace.name}" created!`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Mutation to update a workspace.
 */
export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();
  const { refreshWorkspaces } = useCurrentWorkspace();

  return useMutation<Workspace, Error, WorkspaceUpdateInput>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to update workspace');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] });
      refreshWorkspaces();
      toast.success('Workspace updated successfully!');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Mutation to delete a workspace.
 */
export function useDeleteWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();
  const { refreshWorkspaces } = useCurrentWorkspace();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to delete workspace');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      refreshWorkspaces();
      toast.success('Workspace deleted successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Query workspace members.
 */
export function useWorkspaceMembers(workspaceId?: string) {
  return useQuery<(WorkspaceMember & { profile: Profile })[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`);
      if (!res.ok) {
        throw new Error('Failed to fetch workspace members');
      }
      return res.json();
    },
    enabled: !!workspaceId,
  });
}

/**
 * Mutation to invite a member.
 */
export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceMember, Error, InviteMemberInput>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to invite member');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Member invited successfully!');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Mutation to remove a member.
 */
export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userId: string }>({
    mutationFn: async ({ userId }) => {
      const res = await fetch(`/api/workspaces/${workspaceId}/members?userId=${userId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to remove member');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
      toast.success('Member removed successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
