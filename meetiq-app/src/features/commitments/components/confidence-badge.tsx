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
      <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-full shrink-0 h-9">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
        High confidence
      </span>
    );
  }

  if (confidence === 'medium') {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-full shrink-0 h-9">
        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
        Review suggested
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 px-4 py-2.5 rounded-full shrink-0 h-9">
      <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
      Needs review
    </span>
  );
}
