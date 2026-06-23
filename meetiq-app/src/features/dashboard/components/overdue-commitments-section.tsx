'use client';

import React from 'react';
import type { Commitment, Profile } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import Link from 'next/link';

interface OverdueCommitmentsSectionProps {
  commitments: (Commitment & { owner?: Profile | null })[];
}

export function OverdueCommitmentsSection({ commitments }: OverdueCommitmentsSectionProps) {
  // Filter and sort by days overdue (largest first)
  const overdueItems = commitments
    .filter((c) => c.status === 'overdue' && c.due_date)
    .sort((a, b) => {
      const dateA = new Date(a.due_date!);
      const dateB = new Date(b.due_date!);
      return dateA.getTime() - dateB.getTime(); // Older due date = more overdue = first
    });

  const getDaysOverdue = (dueDateStr: string) => {
    const dueDate = new Date(dueDateStr);
    const today = new Date();
    return Math.max(0, differenceInDays(today, dueDate));
  };

  if (overdueItems.length === 0) {
    return (
      <Card className="border border-emerald-200 bg-emerald-50/25">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
          <h3 className="font-heading font-semibold text-sm text-slate-800">
            No overdue commitments
          </h3>
          <p className="text-xs text-muted-foreground font-body">
            Great job keeping up with execution! 🎉
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-red-200 bg-red-50/10">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <h3 className="font-heading font-semibold text-sm">
            Overdue Commitments ({overdueItems.length})
          </h3>
        </div>

        <div className="divide-y divide-red-100/40">
          {overdueItems.map((c) => {
            const days = getDaysOverdue(c.due_date!);
            return (
              <div key={c.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2.5 truncate">
                  <Avatar className="h-6 w-6 mt-0.5 shrink-0">
                    <AvatarImage src={c.owner?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs bg-red-100 text-red-800 font-bold">
                      {c.owner?.display_name ? getInitials(c.owner.display_name) : 'O'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-0.5 truncate">
                    <Link
                      href={`/commitments/${c.id}`}
                      className="text-xs font-semibold text-slate-800 hover:text-red-700 hover:underline truncate block"
                    >
                      {c.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-body">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span>Due: {format(new Date(c.due_date!), 'MMM d, yyyy')}</span>
                      <span>·</span>
                      <span>Owner: {c.owner?.display_name || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <Badge variant="destructive" className="bg-red-600 hover:bg-red-600 rounded-full shrink-0 h-[30px]">
                  {days} {days === 1 ? 'day' : 'days'} overdue
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
