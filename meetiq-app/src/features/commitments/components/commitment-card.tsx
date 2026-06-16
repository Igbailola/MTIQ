'use client';

import React, { useState } from 'react';
import type { Commitment, Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CommitmentStatusChip } from './commitment-status-chip';
import { ConfidenceBadge } from './confidence-badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useConfirmCommitment, useUpdateCommitment, useDeleteCommitment } from '@/hooks/use-commitments';
import { useWorkspaceMembers } from '@/hooks/use-workspace';
import { toast } from 'sonner';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Link as LinkIcon,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  User,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';

interface CommitmentCardProps {
  commitment: Commitment & {
    owner?: Profile | null;
    assigner?: Profile | null;
  };
  workspaceId: string;
}

export function CommitmentCard({ commitment, workspaceId }: CommitmentCardProps) {
  const { user } = useAuth();
  const confirmMutation = useConfirmCommitment(commitment.id, workspaceId);
  const updateMutation = useUpdateCommitment(commitment.id, workspaceId);
  const deleteMutation = useDeleteCommitment(commitment.id, workspaceId);

  const { data: members } = useWorkspaceMembers(workspaceId);
  const isAdmin = members?.find((m) => m.user_id === user?.id)?.role === 'admin';

  // Edit Mode States
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(commitment.title);
  const [editDescription, setEditDescription] = useState(commitment.description || '');
  const [editOwnerId, setEditOwnerId] = useState<string | null>(commitment.owner_id);
  const [editDueDate, setEditDueDate] = useState<string>(
    commitment.due_date ? format(new Date(commitment.due_date), 'yyyy-MM-dd') : ''
  );
  const [editPriority, setEditPriority] = useState<string>(commitment.priority || 'medium');
  const [editStatus, setEditStatus] = useState<string>(commitment.status || 'pending_confirmation');
  const [savingEdit, setSavingEdit] = useState(false);

  const [expandedContext, setExpandedContext] = useState(false);
  const [rejectFormOpen, setRejectFormOpen] = useState(false);
  const [changesFormOpen, setChangesFormOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // local confirmation click animation state
  const [animatingAction, setAnimatingAction] = useState<string | null>(null);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error('Title is required');
      return;
    }
    setSavingEdit(true);
    try {
      await updateMutation.mutateAsync({
        title: editTitle,
        description: editDescription,
        owner_id: editOwnerId || null,
        due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
        priority: editPriority as any,
        status: editStatus as any,
      });
      setEditMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this commitment?')) {
      try {
        await deleteMutation.mutateAsync();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const isPending = commitment.status === 'pending_confirmation';
  const isOwner = commitment.owner_id === user?.id;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleAccept = async () => {
    setAnimatingAction('accept');
    try {
      await confirmMutation.mutateAsync({ action: 'accept' });
    } catch (err) {
      console.error(err);
    } finally {
      setAnimatingAction(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 10) {
      toast.error('Rejection reason must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setAnimatingAction('reject');
    try {
      await confirmMutation.mutateAsync({ action: 'reject', reason: reason.trim() });
      setRejectFormOpen(false);
      setReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setAnimatingAction(null);
    }
  };

  const handleChangesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify what changes are required.');
      return;
    }

    setSubmitting(true);
    setAnimatingAction('changes');
    try {
      await confirmMutation.mutateAsync({ action: 'request_changes', reason: reason.trim() });
      setChangesFormOpen(false);
      setReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setAnimatingAction(null);
    }
  };

  if (editMode) {
    return (
      <Card className="border border-meetiq-border/50 bg-white shadow-meetiq-xs">
        <form onSubmit={handleSaveEdit}>
      <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Edit Commitment
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="editTitle" className="text-xs">Title</Label>
                <input
                  id="editTitle"
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-sm h-10 rounded border border-slate-200/50 px-3 focus:outline-accent bg-white text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="editDescription" className="text-xs">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label htmlFor="editOwner" className="text-xs">Owner</Label>
                  <select
                    id="editOwner"
                    value={editOwnerId || ''}
                    onChange={(e) => setEditOwnerId(e.target.value || null)}
                    className="w-full h-10 text-sm rounded border border-slate-200/50 px-2 bg-white text-slate-800"
                  >
                    <option value="">Needs Owner</option>
                    {members?.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.profile?.display_name || 'Anonymous User'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editDueDate" className="text-xs">Due Date</Label>
                  <input
                    id="editDueDate"
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full h-10 text-sm rounded border border-slate-200/50 px-2 bg-white text-slate-800"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editPriority" className="text-xs">Priority</Label>
                  <select
                    id="editPriority"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full h-10 text-sm rounded border border-slate-200/50 px-2 bg-white text-slate-800"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="editStatus" className="text-xs">Status</Label>
                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full h-10 text-sm rounded border border-slate-200/50 px-2 bg-white text-slate-800"
                  >
                    <option value="pending_confirmation">Pending Confirmation</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(false)}
                className="h-8 text-xs"
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 gap-2 px-6"
                disabled={savingEdit}
              >
                {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span className="text-base">Save Changes</span>
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'border border-meetiq-border/50 bg-white shadow-meetiq-xs transition-all duration-200 overflow-hidden',
        commitment.status === 'overdue' ? 'border-red-200 ring-1 ring-red-100' : '',
        animatingAction ? 'confirm-animation' : ''
      )}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header Block: AI Indicator and Confidence Badge */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 tracking-wider uppercase">
              AI Suggested Commitment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceBadge confidence={commitment.ai_confidence} />
            {isAdmin && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setEditMode(true)}
                className="h-6 w-6 text-slate-400 hover:text-accent focus-visible:outline-none"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Commitment Title */}
        <div className="space-y-1">
          <h3 className="font-heading font-semibold text-base text-primary leading-tight">
            {commitment.title}
          </h3>
          {commitment.description && (
            <p className="text-xs text-muted-foreground font-body leading-normal">
              {commitment.description}
            </p>
          )}
        </div>

        {/* Metadata Details (Owner, Due Date, Status, Link) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-4 text-xs font-body">
          {/* Owner details */}
          <div className="space-y-1.5">
            <span className="text-muted-foreground block text-xs uppercase font-semibold mb-2.5">Owner</span>
            {commitment.owner ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={commitment.owner.avatar_url || ''} />
                  <AvatarFallback className="text-xs bg-slate-100 font-bold">
                    {getInitials(commitment.owner.display_name || 'User')}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium text-slate-700 truncate">
                  {commitment.owner.display_name}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Needs Owner</span>
              </div>
            )}
          </div>

          {/* Due date details */}
          <div className="space-y-1.5">
            <span className="text-muted-foreground block text-xs uppercase font-semibold mb-2.5">Due Date</span>
            {commitment.due_date ? (
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{format(new Date(commitment.due_date), 'MMM d, yyyy')}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Needs Deadline</span>
              </div>
            )}
          </div>

          {/* Status details */}
          <div className="space-y-1.5">
            <span className="text-muted-foreground block text-xs uppercase font-semibold mb-2.5">Status</span>
            <CommitmentStatusChip status={commitment.status} />
          </div>

          {/* Source meeting */}
          <div className="space-y-1.5">
            <span className="text-muted-foreground block text-xs uppercase font-semibold mb-2.5">Source</span>
            {commitment.meeting_id ? (
              <Link
                href={`/meetings/${commitment.meeting_id}`}
                className="flex items-center gap-1.5 text-accent hover:underline font-medium truncate"
              >
                <LinkIcon className="h-4 w-4 shrink-0" />
                <span className="truncate">View Source</span>
              </Link>
            ) : (
              <span className="text-slate-400 font-medium">Vague</span>
            )}
          </div>
        </div>

        {/* Context snippet section */}
        {commitment.context_snippet && (
          <div className="bg-slate-50 border border-slate-100/50 rounded-lg p-3 space-y-1">
            <button
              type="button"
              onClick={() => setExpandedContext(!expandedContext)}
              className="flex w-full items-center justify-between text-xs font-semibold text-slate-500 hover:text-slate-700 focus-visible:outline-none"
            >
              <span className="uppercase tracking-wider">Context Snippet</span>
              {expandedContext ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <p
              className={cn(
                'text-xs text-slate-600 font-body leading-relaxed transition-all mt-1',
                expandedContext ? '' : 'line-clamp-2'
              )}
            >
              &ldquo;{commitment.context_snippet}&rdquo;
            </p>
          </div>
        )}

        {/* Accountability confirmation actions */}
        {isPending && isOwner && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100/50">
            <span className="text-xs text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-100">
              Please confirm if you accept this accountability
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => {
                  setRejectFormOpen(true);
                  setChangesFormOpen(false);
                }}
                disabled={animatingAction !== null}
              >
                Reject
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs text-slate-600 border-slate-300/50 hover:bg-slate-50"
                onClick={() => {
                  setChangesFormOpen(true);
                  setRejectFormOpen(false);
                }}
                disabled={animatingAction !== null}
              >
                Request Changes
              </Button>
              <Button
                className="h-12 gap-2 px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={handleAccept}
                disabled={animatingAction !== null}
              >
                {animatingAction === 'accept' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-base">Accept</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Reject Modal / Form inline */}
        {rejectFormOpen && (
          <form onSubmit={handleRejectSubmit} className="border-t border-dashed pt-3 mt-2 space-y-3 bg-slate-50 p-3.5 rounded-lg border">
            <div className="space-y-1.5">
              <Label htmlFor="rejectReason" className="text-xs font-semibold text-primary">
                Why are you rejecting this?
              </Label>
              <Textarea
                id="rejectReason"
                placeholder="Must be at least 10 characters (e.g. This was assigned to David during sync, not me)."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={submitting}
                className="text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRejectFormOpen(false)}
                className="h-8 text-xs"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                className="h-8 text-xs"
                disabled={submitting}
              >
                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </form>
        )}

        {/* Request Changes Form inline */}
        {changesFormOpen && (
          <form onSubmit={handleChangesSubmit} className="border-t border-dashed pt-3 mt-2 space-y-3 bg-slate-50 p-3.5 rounded-lg border">
            <div className="space-y-1.5">
              <Label htmlFor="changesComment" className="text-xs font-semibold text-primary">
                What changes are required?
              </Label>
              <Textarea
                id="changesComment"
                placeholder="e.g. Due date should be June 18th, not June 13th."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={submitting}
                className="text-sm"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setChangesFormOpen(false)}
                className="h-8 text-xs"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 gap-2 px-6"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-base">Submitting...</span>
                  </>
                ) : (
                  <span className="text-base">Submit Request</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
