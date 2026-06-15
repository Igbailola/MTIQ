'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

export function ProcessingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Processing Banner */}
      <Card className="border border-blue-100 bg-blue-50/20">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <div>
            <h2 className="text-lg font-heading font-semibold text-primary">Analyzing meeting notes...</h2>
            <p className="text-sm text-muted-foreground mt-1 font-body">
              MeetIQ AI is extracting summary bullet points, key decisions, and accountability commitments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Structured Summary Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
        </div>
        <Card className="border border-meetiq-border/50">
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>

      {/* Decisions & Commitments Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Decisions Column */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-24" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-meetiq-border/50">
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Commitments Column */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="border border-meetiq-border/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-4 pt-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
