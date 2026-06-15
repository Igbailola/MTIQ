'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBreakdownBarProps {
  breakdown: {
    pending_confirmation: number;
    in_progress: number;
    blocked: number;
    completed: number;
    overdue: number;
  };
  onSegmentClick?: (status: string) => void;
  selectedStatus?: string;
}

export function StatusBreakdownBar({ breakdown, onSegmentClick, selectedStatus }: StatusBreakdownBarProps) {
  const total =
    breakdown.pending_confirmation +
    breakdown.in_progress +
    breakdown.blocked +
    breakdown.completed +
    breakdown.overdue;

  const getPercentage = (count: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  const segments = [
    { key: 'completed', label: 'Completed', count: breakdown.completed, bg: 'bg-emerald-500', text: 'text-emerald-700' },
    { key: 'in_progress', label: 'In Progress', count: breakdown.in_progress, bg: 'bg-blue-500', text: 'text-blue-700' },
    { key: 'blocked', label: 'Blocked', count: breakdown.blocked, bg: 'bg-amber-500', text: 'text-amber-700' },
    { key: 'overdue', label: 'Overdue', count: breakdown.overdue, bg: 'bg-red-500', text: 'text-red-700' },
    { key: 'pending_confirmation', label: 'Pending Confirmation', count: breakdown.pending_confirmation, bg: 'bg-slate-400', text: 'text-slate-600' },
  ];

  if (total === 0) {
    return (
      <div className="text-xs text-muted-foreground text-center py-4 bg-slate-50 border border-dashed rounded-lg">
        No commitments to display breakdown.
      </div>
    );
  }

  return (
    <div className="space-y-4 font-body">
      {/* Segmented Bar */}
      <div className="flex h-5 w-full rounded-full overflow-hidden bg-slate-100 border border-slate-200/5">
        {segments.map((seg) => {
          const pct = getPercentage(seg.count);
          if (pct === 0) return null;
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onSegmentClick?.(seg.key)}
              style={{ width: `${pct}%` }}
              className={cn(
                seg.bg,
                'h-full transition-all hover:opacity-90 relative group focus-visible:outline-none',
                selectedStatus === seg.key ? 'ring-2 ring-white ring-offset-1 z-10' : ''
              )}
              title={`${seg.label}: ${seg.count} (${pct.toFixed(0)}%)`}
            />
          );
        })}
      </div>

      {/* Legend / Counters */}
      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
        {segments.map((seg) => {
          const pct = getPercentage(seg.count);
          const isSelected = selectedStatus === seg.key;
          return (
            <button
              key={seg.key}
              onClick={() => onSegmentClick?.(seg.key)}
              className={cn(
                'flex items-center gap-2 text-xs font-semibold hover:opacity-80 transition-opacity focus-visible:outline-none',
                isSelected ? 'underline decoration-2 underline-offset-4' : ''
              )}
            >
              <span className={cn('h-3 w-3 rounded-full shrink-0', seg.bg)} />
              <span className="text-slate-700">{seg.label}</span>
              <span className="text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                {seg.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
