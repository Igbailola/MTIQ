'use client';

import React, { useState } from 'react';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useActivityFeed } from '@/hooks/use-dashboard';
import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { logger } from '@/lib/logger';

export default function ActivityPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: activities, isLoading, refetch: refetchActivities } = useActivityFeed(currentWorkspace?.id);
  const [clearTrigger, setClearTrigger] = useState(0);

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Activity className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-primary font-heading">No workspace active</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Create or select a workspace to start tracking activity.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
          Workspace Activity
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          See a running log of everything that happens in your workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <Skeleton className="h-16 w-full rounded-lg" />
        </div>
      ) : !activities || activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border border-dashed rounded-xl bg-white shadow-meetiq-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-accent mb-4">
            <Activity className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-primary">No activity yet</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm font-body mx-auto">
            Activity from meetings, commitments, and team changes will appear here.
          </p>
        </div>
      ) : (
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 border-b border-slate-50 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-heading font-semibold text-primary">
                All Activity
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    setClearTrigger((c) => c + 1);
                    try {
                      const res = await fetch(`/api/activity?workspaceId=${currentWorkspace.id}&deleteAll=true`, { method: 'DELETE' });
                      if (!res.ok) throw new Error();
                      refetchActivities();
                      toast.success('All activity cleared');
                    } catch (e) {
                      logger.error("Error occurred", e, e);
                      toast.error('Failed to clear activity');
                    }
                  }}
                  className="text-xs text-destructive hover:text-destructive h-auto px-2 py-1 gap-1 font-medium"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete all
                </Button>
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Real-time Active" />
              </div>
            </CardHeader>
          <CardContent className="pt-6">
            <ActivityFeed
              initialActivities={activities || []}
              workspaceId={currentWorkspace.id}
              clearTrigger={clearTrigger}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
