import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Commitment, CommitmentHistory, Profile } from '@/types/database';
import type { CommitmentUpdateInput, CommitmentConfirmInput, CommitmentCreateInput } from '@/lib/schemas';
import { toast } from 'sonner';

interface CommitmentDetail extends Omit<Commitment, 'owner' | 'assigner'> {
  owner: Profile | null;
  assigner: Profile | null;
  history: (CommitmentHistory & { changer: Profile })[];
}


/**
 * Fetch commitments with filters.
 */
export function useCommitments(workspaceId?: string, filters?: { status?: string; ownerId?: string }) {
  const statusFilter = filters?.status ? `&status=${filters.status}` : '';
  const ownerFilter = filters?.ownerId ? `&ownerId=${filters.ownerId}` : '';

  return useQuery<Commitment[]>({
    queryKey: ['commitments', workspaceId, filters],
    queryFn: async () => {
      const res = await fetch(`/api/commitments?workspaceId=${workspaceId}${statusFilter}${ownerFilter}`);
      if (!res.ok) {
        throw new Error('Failed to fetch commitments');
      }
      return res.json();
    },
    enabled: !!workspaceId,
  });
}

/**
 * Fetch a single commitment details with history.
 */
export function useCommitment(commitmentId?: string) {
  return useQuery<CommitmentDetail>({
    queryKey: ['commitment', commitmentId],
    queryFn: async () => {
      const res = await fetch(`/api/commitments/${commitmentId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch commitment details');
      }
      return res.json();
    },
    enabled: !!commitmentId,
  });
}

/**
 * Confirm commitment (Accept / Reject / Request Changes).
 */
export function useConfirmCommitment(commitmentId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Commitment, Error, CommitmentConfirmInput>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/commitments/${commitmentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to confirm commitment');
      }
      return res.json();
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['commitment', commitmentId] });
      queryClient.invalidateQueries({ queryKey: ['commitments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspaceId] });
      
      if (updated.status === 'in_progress') {
        toast.success('Commitment accepted!');
      } else {
        toast.success(`Commitment status updated to ${updated.status}`);
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Update commitment fields (due date, owner, status, priority).
 */
export function useUpdateCommitment(commitmentId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Commitment, Error, CommitmentUpdateInput>({
    mutationFn: async (data) => {
      const res = await fetch(`/api/commitments/${commitmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to update commitment');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitment', commitmentId] });
      queryClient.invalidateQueries({ queryKey: ['commitments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspaceId] });
      toast.success('Commitment updated successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Create commitment.
 */
export function useCreateCommitment(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<Commitment, Error, CommitmentCreateInput>({
    mutationFn: async (data) => {
      const res = await fetch('/api/commitments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to create commitment');
      }
      return res.json();
    },
    onSuccess: (newCommitment) => {
      queryClient.invalidateQueries({ queryKey: ['commitment', newCommitment.id] });
      queryClient.invalidateQueries({ queryKey: ['commitments', workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ['meeting', newCommitment.meeting_id],
      });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspaceId] });
      toast.success('Commitment created successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**

 * Delete commitment.
 */
export function useDeleteCommitment(commitmentId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/commitments/${commitmentId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to delete commitment');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commitments', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', workspaceId] });
      toast.success('Commitment deleted');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
