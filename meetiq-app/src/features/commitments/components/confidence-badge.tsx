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
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full shrink-0">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        High confidence
      </span>
    );
  }

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        Review suggested
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full shrink-0">
      <AlertOctagon className="h-4 w-4 text-red-600" />
      Needs review
    </span>
  );
}
