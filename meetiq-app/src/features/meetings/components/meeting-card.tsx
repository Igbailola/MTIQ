'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Meeting } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Calendar, CheckSquare, ChevronRight, Loader2, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useDeleteMeeting } from '@/hooks/use-meetings';

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteMeeting = useDeleteMeeting(meeting.workspace_id);
  const formattedDate = format(new Date(meeting.meeting_date), 'PPP');

  return (
    <>
      <Link href={`/meetings/${meeting.id}`} className="block group">
        <Card className="border border-meetiq-border/5 hover:border-accent/40 bg-white transition-all duration-200 shadow-meetiq-xs hover:shadow-meetiq-sm">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="space-y-1 truncate">
              <h3 className="font-heading font-semibold text-base text-primary group-hover:text-accent transition-colors truncate">
                {meeting.title}
              </h3>
              <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
                
                {meeting.status === 'ready' && (
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/5">
                    <CheckSquare className="h-4 w-4 text-slate-400" />
                    Ready
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {meeting.status === 'processing' && (
                <Badge variant="outline" className="bg-blue-50 text-accent border-blue-200/50 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  AI Analyzing
                </Badge>
              )}
              {meeting.status === 'error' && (
                <Badge variant="outline" className="bg-red-50 text-destructive border-red-200">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Failed
                </Badge>
              )}
              {meeting.status === 'ready' && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Processed
                </Badge>
              )}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDeleteOpen(true);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50"
                title="Delete meeting"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </CardContent>
        </Card>
      </Link>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm p-[26px]">
          <DialogHeader className="p-0">
            <DialogTitle className="font-heading text-lg">Delete Meeting</DialogTitle>
            <DialogDescription className="font-body text-xs text-muted-foreground">
              Move <strong>{meeting.title}</strong> to trash? You can restore it later from the trash view.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}
              disabled={deleteMeeting.isPending} className="h-10 text-sm">Cancel</Button>
            <Button type="button" variant="destructive" onClick={() => deleteMeeting.mutate(meeting.id, { onSuccess: () => setDeleteOpen(false) })}
              disabled={deleteMeeting.isPending} className="h-10 text-sm gap-2">
              {deleteMeeting.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              {deleteMeeting.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
