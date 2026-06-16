'use client';

import React from 'react';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useMeetings } from '@/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { MeetingCard } from '@/features/meetings/components/meeting-card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MeetingsPage() {
  const router = useRouter();
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: meetings, isLoading } = useMeetings(currentWorkspace?.id);

  if (!currentWorkspace) {
    return null;
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
            Meeting Transcripts
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Upload and view archives of your team meetings.
          </p>
        </div>
        
        <Button onClick={() => router.push('/meetings/upload')} className="h-12 gap-2 px-6">
          <Upload className="h-4 w-4" />
          <span className="text-base">Upload Meeting</span>
        </Button>
      </div>

      {/* Grid or Empty state */}
      {isLoading ? (
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
          <Button onClick={() => router.push('/meetings/upload')} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            <span>Upload First Meeting</span>
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
