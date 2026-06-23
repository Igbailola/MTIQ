'use client';

import React from 'react';
import type { CommitmentHistory, Profile } from '@/types/database';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { Activity } from 'lucide-react';

interface CommitmentHistoryTimelineProps {
  history: (CommitmentHistory & { changer: Profile | null })[];
}

export function CommitmentHistoryTimeline({ history }: CommitmentHistoryTimelineProps) {
  const getFriendlyChangeText = (h: CommitmentHistory) => {
    const field = h.field_changed;
    const oldVal = h.old_value || 'None';
    const newVal = h.new_value || 'None';

    if (field === 'status') {
      return `updated status from "${oldVal}" to "${newVal}"`;
    }
    if (field === 'due_date') {
      return `changed deadline from "${oldVal}" to "${newVal}"`;
    }
    if (field === 'owner_id') {
      return `changed owner assignment`;
    }
    if (field === 'priority') {
      return `changed priority from "${oldVal}" to "${newVal}"`;
    }
    if (field === 'confirmation_action') {
      return `confirmed: ${newVal}`;
    }
    return `edited ${field}`;
  };

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
        <Activity className="h-7 w-7 mb-2 opacity-30" />
        <span>No edits or actions logged on this commitment yet.</span>
      </div>
    );
  }

  return (
    <div className="relative border-l border-slate-100/50 pl-4 space-y-6 py-2 ml-3.5 font-body">
      {history.map((h) => (
        <div key={h.id} className="relative">
          {/* Timeline Node dot/avatar */}
          <div className="absolute -left-[29px] top-0.5">
            <Avatar className="h-6 w-6 ring-2 ring-white">
              <AvatarImage src={h.changer?.avatar_url || undefined} />
              <AvatarFallback className="text-xs bg-slate-100 text-slate-700 font-bold">
                {h.changer?.display_name ? getInitials(h.changer.display_name) : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-0.5">
            <div className="text-xs text-slate-600 leading-normal">
              <span className="font-semibold text-primary">
                {h.changer?.display_name || 'System'}
              </span>{' '}
              {getFriendlyChangeText(h)}
            </div>
            <span className="text-xs text-muted-foreground block">
              {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
