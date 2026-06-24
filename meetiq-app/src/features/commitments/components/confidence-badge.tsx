'use client';

import React from 'react';
import type { AIConfidence } from '@/types/database';
import { ShieldCheck, AlertTriangle, AlertOctagon } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: AIConfidence | null;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (!confidence) return null;

  if (confidence === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 sm:px-2.5 h-[26px] sm:h-[30px] rounded-full shrink-0 w-[100px] sm:w-fit justify-center">
        <ShieldCheck className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-600" />
        <span className="truncate">High confidence</span>
      </span>
    );
  }

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 sm:px-2.5 h-[26px] sm:h-[30px] rounded-full shrink-0 w-[100px] sm:w-fit justify-center">
        <AlertTriangle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-600" />
        <span className="truncate">Review suggested</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 sm:px-2.5 h-[26px] sm:h-[30px] rounded-full shrink-0 w-[100px] sm:w-fit justify-center">
      <AlertOctagon className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-600" />
      <span className="truncate">Needs review</span>
    </span>
  );
}
