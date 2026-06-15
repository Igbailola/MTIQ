'use client';

import React from 'react';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useActivityFeed } from '@/hooks/use-dashboard';
import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';

export default function ActivityPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: activities, isLoading } = useActivityFeed(currentWorkspace?.id);

  if (!currentWorkspace) return null;

  return (
    <div className="space-y-6 font-body max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
          Workspace Activity
        </h1>
        <p className="text-base text-muted-foreground mt-1">
          See a running log of everything that happens in your workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : (
        <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
          <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-heading font-semibold text-primary">
              All Activity
            </CardTitle>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Real-time Active" />
          </CardHeader>
          <CardContent className="pt-6">
            <ActivityFeed
              initialActivities={activities || []}
              workspaceId={currentWorkspace.id}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
