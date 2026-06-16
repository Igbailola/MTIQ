'use client';

import React from 'react';
import type { Meeting } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

interface RecentMeetingsTableProps {
  meetings: Meeting[];
}

export function RecentMeetingsTable({ meetings }: RecentMeetingsTableProps) {
  const router = useRouter();
  const slicedMeetings = meetings.slice(0, 5);

  if (slicedMeetings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-slate-50/50">
        <Calendar className="h-8 w-8 mb-2 opacity-30" />
        <span>No meetings uploaded yet.</span>
      </div>
    );
  }

  return (
    <div className="border border-meetiq-border/5 rounded-xl bg-white overflow-x-auto shadow-meetiq-xs">
      <Table className="border-separate border-spacing-y-2 min-w-[400px]">
        <TableHeader className="bg-slate-50/75">
          <TableRow>
            <TableHead className="font-semibold text-xs text-primary font-heading">Meeting Title</TableHead>
            <TableHead className="font-semibold text-xs text-primary font-heading">Date</TableHead>
            <TableHead className="font-semibold text-xs text-primary font-heading">Status</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slicedMeetings.map((m) => (
            <TableRow
              key={m.id}
              onClick={() => router.push(`/meetings/${m.id}`)}
              className="cursor-pointer hover:bg-slate-50 group font-body h-14 border-b-0"
            >
              <TableCell className="font-semibold text-slate-800 text-sm truncate max-w-[200px]">
                {m.title}
              </TableCell>
              <TableCell className="text-slate-600 text-xs">
                {format(new Date(m.meeting_date), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                {m.status === 'processing' ? (
                  <Badge variant="outline" className="bg-blue-50 text-accent border-blue-100 animate-pulse h-[30px]">
                    Analyzing
                  </Badge>
                ) : m.status === 'error' ? (
                  <Badge variant="outline" className="bg-red-50 text-destructive border-red-100 h-[30px]">
                    Failed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 h-[30px]">
                    Ready
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
