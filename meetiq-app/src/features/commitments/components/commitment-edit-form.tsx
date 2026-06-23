'use client';

import React from 'react';
import type { Commitment, Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trash2 } from 'lucide-react';

interface CommitmentEditFormProps {
  editTitle: string;
  editDescription: string;
  editOwnerId: string | null;
  editDueDate: string;
  editPriority: string;
  editStatus: string;
  savingEdit: boolean;
  members: { user_id: string; profile: Profile | null }[] | undefined;
  onTitleChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onOwnerChange: (val: string | null) => void;
  onDueDateChange: (val: string) => void;
  onPriorityChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
  onCancel: () => void;
}

export function CommitmentEditForm({
  editTitle,
  editDescription,
  editOwnerId,
  editDueDate,
  editPriority,
  editStatus,
  savingEdit,
  members,
  onTitleChange,
  onDescriptionChange,
  onOwnerChange,
  onDueDateChange,
  onPriorityChange,
  onStatusChange,
  onSave,
  onDelete,
  onCancel,
}: CommitmentEditFormProps) {
  return (
    <Card className="border border-meetiq-border/50 bg-white shadow-meetiq-xs">
      <form onSubmit={onSave}>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">
              Edit Commitment
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDelete}
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
                onChange={(e) => onTitleChange(e.target.value)}
                className="w-full text-sm h-10 rounded border border-slate-200/50 px-3 focus:outline-accent bg-white text-slate-800"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editDescription" className="text-xs">Description</Label>
              <Textarea
                id="editDescription"
                value={editDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={2}
                className="text-sm min-h-[40px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <Label htmlFor="editOwner" className="text-xs">Owner</Label>
                <Select value={editOwnerId || ''} onValueChange={(val) => onOwnerChange(val || null)}>
                  <SelectTrigger id="editOwner" className="w-full !h-10 text-sm border-slate-200/50 bg-white text-slate-800 px-4">
                    <SelectValue placeholder="Needs Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Needs Owner</SelectItem>
                    {members?.map((m) => (
                      <SelectItem key={m.user_id} value={m.user_id}>
                        {m.profile?.display_name || 'Anonymous User'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editDueDate" className="text-xs">Due Date</Label>
                <input
                  id="editDueDate"
                  type="date"
                  value={editDueDate}
                  onChange={(e) => onDueDateChange(e.target.value)}
                  className="w-full h-10 text-sm rounded border border-slate-200/50 px-2 bg-white text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="editPriority" className="text-xs">Priority</Label>
                <Select value={editPriority} onValueChange={(val) => onPriorityChange(val ?? 'medium')}>
                  <SelectTrigger id="editPriority" className="w-full !h-10 text-sm border-slate-200/50 bg-white text-slate-800 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editStatus" className="text-xs">Status</Label>
                <Select value={editStatus} onValueChange={(val) => onStatusChange(val ?? 'pending_confirmation')}>
                  <SelectTrigger id="editStatus" className="w-full !h-10 text-sm border-slate-200/50 bg-white text-slate-800 px-4">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_confirmation">Pending Confirmation</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="h-12 text-xs"
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-12 gap-2 px-6" disabled={savingEdit}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              <span className="text-base">Save Changes</span>
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
