'use client';

import React, { useState } from 'react';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { useDashboardStats, useActivityFeed } from '@/hooks/use-dashboard';
import { useMeetings } from '@/hooks/use-meetings';
import { useCommitments } from '@/hooks/use-commitments';
import { KPICard } from '@/features/dashboard/components/kpi-card';
import { StatusBreakdownBar } from '@/features/dashboard/components/status-breakdown-bar';
import { RecentMeetingsTable } from '@/features/dashboard/components/recent-meetings-table';
import { TeamAccountabilityTable } from '@/features/dashboard/components/team-accountability-table';
import { OverdueCommitmentsSection } from '@/features/dashboard/components/overdue-commitments-section';
import { ActivityFeed } from '@/features/dashboard/components/activity-feed';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Calendar, CheckSquare, BarChart3, Users, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { currentWorkspace } = useCurrentWorkspace();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentWorkspace?.id);
  const { data: meetings, isLoading: meetingsLoading } = useMeetings(currentWorkspace?.id);
  const { data: commitments, isLoading: commitmentsLoading } = useCommitments(currentWorkspace?.id);
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useActivityFeed(currentWorkspace?.id);
  const [clearTrigger, setClearTrigger] = useState(0);
  const isPageLoading = statsLoading || meetingsLoading || commitmentsLoading || activitiesLoading;

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-xs font-semibold text-muted-foreground mt-2 font-heading">
          Connecting workspace...
        </span>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="h-96 md:col-span-2 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-body">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
            Workspace Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Monitor AI-extracted commitments and team accountability execution metrics.
          </p>
        </div>
      </div>

      {/* KPI Overview Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Meetings This Week"
          value={stats?.totalMeetingsThisWeek || 0}
          label="Uploaded in last 7 days"
          icon={Calendar}
          variant="blue"
        />
        <KPICard
          title="Total Commitments"
          value={stats?.totalCommitments || 0}
          label="Total AI suggested drafts"
          icon={CheckSquare}
          variant="green"
        />
        <KPICard
          title="Confirmation Rate"
          value={`${stats?.confirmationRate || 0}%`}
          label="Commitments owner accepted"
          icon={BarChart3}
          variant="amber"
          trend={{ value: '12%', isPositive: true }}
        />
        <KPICard
          title="Completion Rate"
          value={`${stats?.completionRate || 0}%`}
          label="Confirmed items completed"
          icon={Users}
          variant="green"
          trend={{ value: '4%', isPositive: true }}
        />
      </div>

      {/* Status Breakdown Bar Widget */}
      {stats && (
        <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-sm font-heading font-semibold text-primary">
              Commitment Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <StatusBreakdownBar breakdown={stats.statusBreakdown} />
          </CardContent>
        </Card>
      )}

      {/* Tables and Side Columns Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Meetings */}
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-heading font-semibold text-primary">
                Recent Meetings
              </CardTitle>
              <Link href="/meetings" className="text-xs text-muted-foreground hover:text-accent font-medium transition-colors">
                View all
              </Link>
            </CardHeader>
            <CardContent className="px-5 py-0">
              <RecentMeetingsTable meetings={meetings || []} />
            </CardContent>
          </Card>

          {/* Team Accountability */}
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-heading font-semibold text-primary">
                Team Accountability Matrix
              </CardTitle>
              <Link href="/team" className="text-xs text-muted-foreground hover:text-accent font-medium transition-colors">
                View all
              </Link>
            </CardHeader>
            <CardContent className="px-5 py-0">
              <TeamAccountabilityTable stats={stats?.teamMemberStats || []} />
            </CardContent>
          </Card>
        </div>

        {/* Right column (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Overdue Commitments */}
          <OverdueCommitmentsSection commitments={commitments || []} />

          {/* Real-time Activity Feed */}
          <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-heading font-semibold text-primary">
                Workspace Activity
              </CardTitle>
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
            </CardHeader>
            <CardContent>
              <ActivityFeed
                initialActivities={activities || []}
                workspaceId={currentWorkspace.id}
                clearTrigger={clearTrigger}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
