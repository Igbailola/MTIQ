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

export default function ActivityPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: activities, isLoading, refetch: refetchActivities } = useActivityFeed(currentWorkspace?.id);
  const [clearTrigger, setClearTrigger] = useState(0);

  if (!currentWorkspace) return null;

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
                    } catch {
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
