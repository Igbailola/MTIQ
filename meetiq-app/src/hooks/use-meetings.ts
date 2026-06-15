import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meeting, Decision, Commitment } from '@/types/database';
import type { MeetingUploadInput } from '@/lib/schemas';
import { toast } from 'sonner';

interface MeetingDetail extends Meeting {
  decisions: Decision[];
  commitments: Commitment[];
}

/**
 * Hook to query meetings in a workspace.
 */
export function useMeetings(workspaceId?: string) {
  return useQuery<Meeting[]>({
    queryKey: ['meetings', workspaceId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings?workspaceId=${workspaceId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch meetings');
      }
      return res.json();
    },
    enabled: !!workspaceId,
  });
}

/**
 * Hook to query a single meeting details.
 */
export function useMeeting(meetingId?: string) {
  return useQuery<MeetingDetail>({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch meeting');
      }
      return res.json();
    },
    enabled: !!meetingId,
  });
}

/**
 * Hook to upload a new meeting (text paste or parsed transcript).
 */
export function useUploadMeeting() {
  const queryClient = useQueryClient();

  return useMutation<Meeting, Error, MeetingUploadInput>({
    mutationFn: async (data) => {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to upload meeting');
      }
      return res.json();
    },
    onSuccess: (newMeeting) => {
      queryClient.invalidateQueries({ queryKey: ['meetings', newMeeting.workspace_id] });
      toast.success('Meeting notes uploaded successfully!');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Hook to trigger/retry AI processing for a meeting.
 */
export function useProcessMeeting(meetingId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/process`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to trigger AI processing');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', workspaceId] });
      toast.success('AI Analysis started!');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Hook to publish commitments from a meeting.
 */
export function usePublishMeeting(meetingId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to publish commitments');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['meetings', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['commitments', workspaceId] });
      toast.success('All commitments published to owners!');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}

/**
 * Hook to delete a meeting.
 */
export function useDeleteMeeting(meetingId: string, workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch(`/api/meetings/${meetingId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Failed to delete meeting');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings', workspaceId] });
      toast.success('Meeting deleted successfully');
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
}
