'use client';

import React from 'react';
import type { CommitmentStatus } from '@/types/database';
import { cn } from '@/lib/utils';

interface CommitmentStatusChipProps {
  status: CommitmentStatus;
  className?: string;
}

export function CommitmentStatusChip({ status, className }: CommitmentStatusChipProps) {
  const styles = {
    pending_confirmation: 'bg-slate-100 text-slate-700 border-slate-200/50',
    in_progress: 'bg-blue-50 text-accent border-blue-200/50',
    blocked: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    overdue: 'bg-red-50 text-red-700 border-red-200',
  };

  const labels = {
    pending_confirmation: 'Pending Confirmation',
    in_progress: 'In Progress',
    blocked: 'Blocked',
    completed: 'Completed',
    overdue: 'Overdue',
  };

  return (
    <span
      className={cn(
        'status-chip border px-4 py-2.5 rounded-full text-sm font-medium shrink-0 h-[30px]',
        styles[status],
        className
      )}
      role="status"
    >
      {labels[status]}
    </span>
  );
}
