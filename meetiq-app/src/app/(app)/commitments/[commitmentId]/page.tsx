'use client';

import React, { use, useState, useEffect } from 'react';
import { useCommitment, useUpdateCommitment, useDeleteCommitment } from '@/hooks/use-commitments';
import { useCurrentWorkspace, useWorkspaceMembers } from '@/hooks/use-workspace';
import { CommitmentHistoryTimeline } from '@/features/commitments/components/commitment-history-timeline';
import { CommitmentStatusChip } from '@/features/commitments/components/commitment-status-chip';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, Calendar, ShieldAlert, Trash2 } from 'lucide-react';
import type { CommitmentStatus, CommitmentPriority } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

import { logger } from '@/lib/logger';

interface CommitmentDetailPageProps {
  params: Promise<{
    commitmentId: string;
  }>;
}

export default function CommitmentDetailPage({ params }: CommitmentDetailPageProps) {
  const { commitmentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id);
  const { data: commitment, isLoading, error } = useCommitment(commitmentId);

  const updateMutation = useUpdateCommitment(commitmentId, currentWorkspace?.id || '');
  const deleteMutation = useDeleteCommitment(commitmentId, currentWorkspace?.id || '');

  // Form states
  const [ownerId, setOwnerId] = useState<string>('unassigned');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<string>('pending_confirmation');
  const [updating, setUpdating] = useState(false);

  const isAdmin = members?.find((m) => m.user_id === user?.id)?.role === 'admin';
  const isOwner = commitment?.owner_id === user?.id;
  const canEdit = isAdmin || isOwner;

  useEffect(() => {
    if (commitment) {
      setOwnerId(commitment.owner_id || 'unassigned');
      setDueDate(commitment.due_date ? commitment.due_date.split('T')[0] : '');
      setPriority(commitment.priority || 'medium');
      setStatus(commitment.status || 'pending_confirmation');
    }
  }, [commitment]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('You do not have permission to edit this commitment.');
      return;
    }

    setUpdating(true);
    try {
      await updateMutation.mutateAsync({
        owner_id: ownerId === 'unassigned' ? null : ownerId,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        status: status as CommitmentStatus,
      });
    } catch (err) {
      logger.error("Error occurred", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this commitment? This action is irreversible.')) {
      return;
    }
    try {
      await deleteMutation.mutateAsync();
      router.push('/commitments');
    } catch (err) {
      logger.error("Error occurred", err);
    }
  };

  if (isLoading || !commitment) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-xs font-semibold text-muted-foreground mt-2 font-heading">
          Loading commitment details...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center max-w-md mx-auto space-y-4">
        <ShieldAlert className="h-10 w-10 text-destructive mx-auto" />
        <h2 className="text-lg font-heading font-semibold">This commitment is no longer available</h2>
        <p className="text-xs text-muted-foreground">
          It may have been deleted, or you may lack permissions to view it.
        </p>
        <Button onClick={() => router.push('/commitments')}>Go to commitments</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-meetiq-border/5 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/commitments')}
            className="border border-meetiq-border/5 bg-white hover:bg-slate-50 focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-primary font-heading leading-tight truncate max-w-[300px] sm:max-w-md">
              {commitment.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">Status:</span>
              <CommitmentStatusChip status={commitment.status} />
            </div>
          </div>
        </div>

        {isAdmin && (
          <Button variant="outline" className="text-destructive hover:bg-red-50 border-red-200 text-xs py-1.5 h-auto" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Commitment
          </Button>
        )}
      </div>

      {/* Panels Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Side: Update Form / Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-sm font-heading font-semibold text-primary">
                Commitment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Assignee / Owner */}
                  <div className="space-y-2">
                    <Label htmlFor="commOwner">Assignee / Owner</Label>
                    <Select value={ownerId} onValueChange={(val) => setOwnerId(val || 'unassigned')} disabled={!canEdit || updating}>
                      <SelectTrigger id="commOwner" className="bg-white h-10 text-sm mt-1">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent className="w-full sm:min-w-[260px]">
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {members?.map((m) => (
                          <SelectItem key={m.user_id} value={m.user_id}>
                            {m.profile?.display_name || 'Anonymous User'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="commDueDate">Due Date / Deadline</Label>
                    <Input
                      id="commDueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      disabled={!canEdit || updating}
                      className="h-10 mt-1"
                    />
                  </div>

                  {/* Priority */}
                  <div className="space-y-2">
                    <Label htmlFor="commPriority">Priority</Label>
                    <Select
                      value={priority}
                      onValueChange={(val) => setPriority(val as CommitmentPriority)}
                      disabled={!canEdit || updating}
                    >
                      <SelectTrigger id="commPriority" className="bg-white h-10 text-sm mt-1">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent className="w-full sm:min-w-[260px]" sideOffset={8}>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="commStatus">Execution Status</Label>
                    <Select value={status} onValueChange={(val) => setStatus(val || 'pending_confirmation')} disabled={!canEdit || updating}>
                      <SelectTrigger id="commStatus" className="bg-white h-10 text-sm mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="w-full sm:min-w-[260px]">
                        <SelectItem value="pending_confirmation">Pending Confirmation</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex justify-end pt-4 border-t border-slate-50">
                    <Button type="submit" disabled={updating} className="h-12 gap-2 px-6">
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-base">Saving changes...</span>
                        </>
                      ) : (
                        <span className="text-base">Save Details</span>
                      )}
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Timeline history */}
        <div>
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 border-b border-slate-50">
              <CardTitle className="text-sm font-heading font-semibold text-primary">
                Activity & History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <CommitmentHistoryTimeline history={commitment.history || []} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
