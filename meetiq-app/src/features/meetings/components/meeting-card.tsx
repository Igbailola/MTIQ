'use client';

import React from 'react';
import Link from 'next/link';
import type { Meeting } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckSquare, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface MeetingCardProps {
  meeting: Meeting;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const formattedDate = format(new Date(meeting.meeting_date), 'PPP');

  return (
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

          <div className="flex items-center gap-3 shrink-0">
            {meeting.status === 'processing' && (
              <Badge variant="outline" className="gap-1 bg-blue-50 text-accent border-blue-200/50 animate-pulse text-sm h-[30px]">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI Analyzing
              </Badge>
            )}
            {meeting.status === 'error' && (
              <Badge variant="outline" className="gap-1 bg-red-50 text-destructive border-red-200 text-sm h-[30px]">
                <AlertCircle className="h-4 w-4" />
                Failed
              </Badge>
            )}
            {meeting.status === 'ready' && (
              <Badge variant="outline" className="gap-1 bg-emerald-50 text-emerald-700 border-emerald-200 text-sm h-[30px]">
                Processed
              </Badge>
            )}
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
