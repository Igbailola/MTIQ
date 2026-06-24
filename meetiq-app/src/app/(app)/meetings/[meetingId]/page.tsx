'use client';

import React, { use } from 'react';
import { useMeeting, useProcessMeeting, usePublishMeeting } from '@/hooks/use-meetings';
import { useCreateCommitment } from '@/hooks/use-commitments';
import { useCurrentWorkspace, useWorkspaceMembers } from '@/hooks/use-workspace';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { AISummaryCard } from '@/features/meetings/components/ai-summary-card';
import { DecisionCard } from '@/features/meetings/components/decision-card';
import { CommitmentCard } from '@/features/commitments/components/commitment-card';
import { ProcessingSkeleton } from '@/features/meetings/components/processing-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Share2,
  Sparkles,
  CheckCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useState } from 'react';

import { logger } from '@/lib/logger';

interface MeetingDetailPageProps {
  params: Promise<{
    meetingId: string;
  }>;
}

export default function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { meetingId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id);
  const { data: meeting, isLoading, error } = useMeeting(meetingId);

  const processMutation = useProcessMeeting(meetingId, currentWorkspace?.id || '');
  const publishMutation = usePublishMeeting(meetingId, currentWorkspace?.id || '');
  const createCommitmentMutation = useCreateCommitment(currentWorkspace?.id || '');

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Manual Creation States
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newOwnerId, setNewOwnerId] = useState<string>('');
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [creatingCommitment, setCreatingCommitment] = useState(false);

  const isAdmin = members?.find((m) => m.user_id === user?.id)?.role === 'admin';
  const hasUnpublished = meeting?.commitments?.some((c) => !c.published) ?? false;
  const hasCommitments = (meeting?.commitments?.length ?? 0) > 0;

  const handleCreateCommitment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setCreatingCommitment(true);
    try {
      await createCommitmentMutation.mutateAsync({
        meeting_id: meetingId,
        title: newTitle.trim(),
        description: newDescription.trim() || undefined,
        owner_id: newOwnerId ? newOwnerId : null,
        due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
        priority: newPriority,
      });
      // Reset form
      setNewTitle('');
      setNewDescription('');
      setNewOwnerId('');
      setNewDueDate('');
      setNewPriority('medium');
      setCreateFormOpen(false);
    } catch (err) {
      logger.error("Error occurred", err);
    } finally {
      setCreatingCommitment(false);
    }
  };

  // Auto-trigger processing if page is loaded while in processing state
  React.useEffect(() => {
    if (meeting && meeting.status === 'processing' && !processMutation.isPending && !processMutation.isSuccess) {
      processMutation.mutate();
    }
  }, [meeting?.status, processMutation]);

  const handleRetryProcessing = async () => {
    try {
      await processMutation.mutateAsync();
    } catch (err) {
      logger.error("Error occurred", err);
    }
  };

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync();
    } catch (err) {
      logger.error("Error occurred", err);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/meetings/${meetingId}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Failed to delete meeting');
      }
      toast.success('Meeting deleted');
      router.push('/meetings');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete meeting');
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (isLoading || !meeting) {
    return <ProcessingSkeleton />;
  }

  if (error || meeting.status === 'error') {
    return (
      <div className="space-y-6 max-w-3xl mx-auto font-body pt-8">
        <Card className="border border-red-200 bg-red-50/10">
          <CardContent className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive animate-bounce" />
            <div>
              <h2 className="text-xl font-heading font-semibold text-primary">AI Extraction Failed</h2>
              <p className="text-xs text-muted-foreground mt-2 max-w-md font-body">
                We encountered an error while analyzing this meeting notes transcript. Please check your OpenAI credentials or formatting, and try again.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => router.push('/meetings')}>
                Go to meetings
              </Button>
              <Button onClick={handleRetryProcessing} disabled={processMutation.isPending}>
                {processMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Retry AI Analysis'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (meeting.status === 'processing') {
    return <ProcessingSkeleton />;
  }

  const formattedDate = format(new Date(meeting.meeting_date), 'PPP');

  return (
    <div className="space-y-10 font-body">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-meetiq-border/5 pb-8">
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/meetings')}
            className="border border-meetiq-border/5 bg-white hover:bg-slate-50 shrink-0 focus-visible:outline-none"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-primary font-heading leading-tight">
              {meeting.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-body">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-slate-400" />
                {formattedDate}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <User className="h-4 w-4 text-slate-400" />
                Uploaded by {meeting.uploader?.display_name || 'Team member'}
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(true)}
              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-9 sm:h-auto px-2.5 sm:px-3 text-xs sm:text-sm"
            >
              <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {isAdmin && hasCommitments && (
            hasUnpublished ? (
              <Button onClick={handlePublish} disabled={publishMutation.isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 sm:py-2.5 sm:px-4 h-auto text-xs sm:text-sm">
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>Publish</span>
                  </>
                )}
              </Button>
            ) : (
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3">
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Published
              </Badge>
            )
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="space-y-10 max-w-6xl">
        {/* AI Summary block */}
        {meeting.summary && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-primary font-heading">Structured Summary</h2>
            <AISummaryCard summary={meeting.summary} meetingId={meeting.id} />
          </div>
        )}

        <div className="grid gap-10 md:grid-cols-2">
          {/* Decisions */}
          <div className="space-y-5">
            <h2 className="text-base font-semibold text-primary font-heading">Key Decisions</h2>
            {meeting.decisions?.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-white border border-dashed rounded-xl font-body">
                No decisions were extracted from this meeting notes transcript.
              </div>
            ) : (
              <div className="space-y-4">
                {meeting.decisions?.map((decision) => (
                  <DecisionCard key={decision.id} decision={decision} />
                ))}
              </div>
            )}
          </div>

          {/* Commitments */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-primary font-heading">Action Commitments</h2>
                {hasUnpublished && (
                  <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0 animate-pulse">
                    Drafts
                  </span>
                )}
              </div>
              {isAdmin && (
                <Dialog open={createFormOpen} onOpenChange={setCreateFormOpen}>
                  <Button
                    onClick={() => setCreateFormOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-8 text-sm border-dashed gap-1 px-2.5 hover:bg-slate-50 hover:text-accent focus-visible:outline-none"
                  >
                    <Plus className="h-4 w-4" />
                    Add Manually
                  </Button>
                  <DialogContent className="sm:max-w-md p-[26px]">
                    <DialogHeader className="p-0">
                      <DialogTitle className="font-heading text-lg">Add Manual Commitment</DialogTitle>
                      <DialogDescription className="font-body text-xs text-muted-foreground">
                        Create a new action item based on the meeting details.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCommitment} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-xs font-semibold">Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Set up deployment pipeline"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          disabled={creatingCommitment}
                          required
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-xs font-semibold">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Provide additional details or context for the action item."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          disabled={creatingCommitment}
                          rows={3}
                          className="text-sm min-h-[40px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label htmlFor="newOwner" className="text-xs font-semibold">Owner Suggestion</Label>
                          <select
                            id="newOwner"
                            value={newOwnerId}
                            onChange={(e) => setNewOwnerId(e.target.value)}
                            className="w-full h-10 rounded-md border border-input px-3 bg-white text-slate-800 text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            disabled={creatingCommitment}
                          >
                            <option value="">No owner suggested</option>
                            {members?.map((m) => (
                              <option key={m.user_id} value={m.user_id}>
                                {m.profile?.display_name || 'Anonymous User'}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="dueDate" className="text-xs font-semibold">Due Date</Label>
                          <input
                            id="dueDate"
                            type="date"
                            value={newDueDate}
                            onChange={(e) => setNewDueDate(e.target.value)}
                            className="w-full h-10 rounded-md border border-input px-3 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            disabled={creatingCommitment}
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label htmlFor="priority" className="text-xs font-semibold">Priority</Label>
                          <select
                            id="priority"
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                            className="w-full h-10 rounded-md border border-input px-3 bg-white text-slate-800 text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            disabled={creatingCommitment}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCreateFormOpen(false)}
                          disabled={creatingCommitment}
                          className="h-10 text-sm"
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={creatingCommitment} className="h-10 text-sm bg-slate-800 text-white hover:bg-slate-700">
                          {creatingCommitment ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            'Add Commitment'
                          )}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            {meeting.commitments?.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground bg-white border border-dashed rounded-xl font-body">
                No action commitments were extracted from this meeting notes transcript.
              </div>
            ) : (
              <div className="space-y-4">
                {meeting.commitments?.map((commitment) => (
                  <CommitmentCard
                    key={commitment.id}
                    commitment={commitment}
                    workspaceId={currentWorkspace?.id || ''}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm p-[26px]">
          <DialogHeader className="p-0">
            <DialogTitle className="font-heading text-lg">Delete Meeting</DialogTitle>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Are you sure you want to delete this meeting? This will permanently remove all associated decisions and commitments. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
              className="h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="h-10 text-sm gap-2"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
