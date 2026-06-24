'use client';

import React, { useState } from 'react';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useMeetings, useDeleteMeeting } from '@/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { MeetingCard } from '@/features/meetings/components/meeting-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Upload, Trash2, Undo2, ArrowLeft, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function MeetingsPage() {
  const router = useRouter();
  const { currentWorkspace } = useCurrentWorkspace();
  const [showTrash, setShowTrash] = useState(false);
  const { data: meetings, isLoading } = useMeetings(currentWorkspace?.id);
  const { data: trashedMeetings, isLoading: trashLoading } = useMeetings(
    currentWorkspace?.id,
    { includeDeleted: true, enabled: showTrash && !!currentWorkspace?.id }
  );
  const deleteMeeting = useDeleteMeeting(currentWorkspace?.id ?? '');

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Calendar className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-primary font-heading">No workspace active</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Create or select a workspace to start uploading and analyzing meetings.
        </p>
      </div>
    );
  }

  const handleRestore = async (meetingId: string) => {
    try {
      const res = await fetch(`/api/meetings/${meetingId}/restore`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to restore meeting');
      }
      toast.success('Meeting restored');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to restore meeting');
    }
  };

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showTrash ? (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowTrash(false)} className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">Trash</h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                Deleted meetings can be restored within 30 days.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
              Meeting Transcripts
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5">
              Upload and view archives of your team meetings.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={() => router.push('/meetings/upload')} className="h-12 gap-2 px-6">
            <Upload className="h-4 w-4" />
            <span className="text-base">Upload Meeting</span>
          </Button>
          {!showTrash && (
            <Button variant="outline" onClick={() => setShowTrash(true)} className="h-12 gap-2 px-4 text-slate-600">
              <Trash2 className="h-4 w-4" />
              <span className="text-base">Trash</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {showTrash ? (
        trashLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : !trashedMeetings || trashedMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border border-dashed rounded-xl bg-white shadow-meetiq-xs">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-heading font-semibold text-base text-primary">Trash is empty</h3>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-sm font-body mx-auto">
              Deleted meetings will appear here. You can restore them at any time.
            </p>
            <Button variant="outline" onClick={() => setShowTrash(false)} className="mt-5 h-10 gap-2 px-4">
              <ArrowLeft className="h-4 w-4" />
              Back to meetings
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {trashedMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-meetiq-xs">
                <div className="truncate min-w-0">
                  <h3 className="font-heading font-semibold text-sm text-slate-800 truncate">{meeting.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 font-body">
                    {format(new Date(meeting.meeting_date), 'MMM d, yyyy')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRestore(meeting.id)}
                  className="shrink-0 gap-1.5 h-9 text-xs"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  Restore
                </Button>
              </div>
            ))}
          </div>
        )
      ) : isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : !meetings || meetings.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border border-dashed rounded-xl bg-white shadow-meetiq-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-accent mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-primary">No meetings yet</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm font-body mx-auto">
            Upload your first meeting transcript or raw notes to extract summary, decisions, and track commitments.
          </p>
          <Button onClick={() => router.push('/meetings/upload')} className="mt-5 h-12 gap-2 px-6">
            <Upload className="h-4 w-4" />
            <span className="text-base">Upload First Meeting</span>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
