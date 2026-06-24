'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Calendar, CheckSquare, BarChart3, Users, Loader2, Sparkles, Trash2, Building2, Upload, Mail, Check, X, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';

import { logger } from '@/lib/logger';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currentWorkspace, refreshWorkspaces } = useCurrentWorkspace();
  const supabase = createClient();

  const { data: stats, isLoading: statsLoading } = useDashboardStats(currentWorkspace?.id);
  const { data: meetings, isLoading: meetingsLoading } = useMeetings(currentWorkspace?.id);
  const { data: commitments, isLoading: commitmentsLoading } = useCommitments(currentWorkspace?.id);
  const { data: activities, isLoading: activitiesLoading, refetch: refetchActivities } = useActivityFeed(currentWorkspace?.id);
  
  const [clearTrigger, setClearTrigger] = useState(0);
  const [pendingInvites, setPendingInvites] = useState<{ workspace_id: string; role: string; status: string; workspaces: { name: string } | null }[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const isPageLoading = statsLoading || meetingsLoading || commitmentsLoading || activitiesLoading;

  // Fetch Pending Invites
  const fetchPendingInvites = useCallback(async () => {
    if (!user) return;
    setInvitesLoading(true);
    try {
      let { data, error } = await supabase
        .from('workspace_members')
        .select('workspace_id, role, status, workspaces(name)')
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        if (error.message?.includes('status') || error.code === 'PGRST100') {
          // Fallback: status column does not exist. Fetch active invitations from notifications
          const { data: notifs, error: notifError } = await supabase
            .from('notifications')
            .select('workspace_id, workspaces(name)')
            .eq('user_id', user.id)
            .eq('type', 'member_invited')
            .eq('read', false);

          if (!notifError && notifs) {
            data = notifs.map((n: { workspace_id: string; workspaces: { name: string } | null }) => ({
              workspace_id: n.workspace_id,
              role: 'member',
              status: 'pending',
              workspaces: n.workspaces,
            }));
            setPendingInvites(data);
          } else {
            setPendingInvites([]);
          }
        } else {
          logger.error('Error fetching invites:', error);
        }
      } else if (data) {
        setPendingInvites(data);
      }
    } catch (e) {
      logger.error('Error fetching invites:', e);
    } finally {
      setInvitesLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchPendingInvites();
  }, [fetchPendingInvites]);

  // Handle Accept Invitation
  const handleAcceptInvite = async (workspaceId: string) => {
    if (!user) return;
    setActionLoadingId(`${workspaceId}-accept`);
    try {
      // Delete old pending membership and re-insert as active member.
      // Using delete+insert (not update) because anon key RLS typically
      // allows users to delete/insert their own rows but not update.
      await supabase
        .from('workspace_members')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      await supabase.from('workspace_members').insert({
        user_id: user.id,
        workspace_id: workspaceId,
        role: 'member',
      });

      // Mark the invite notification as read (best effort)
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', user.id)
          .eq('workspace_id', workspaceId)
          .eq('type', 'member_invited');
      } catch {
        // silently ignore
      }

      // Log accepted activity (best effort)
      try {
        await supabase.from('notifications').insert({
          user_id: user.id,
          workspace_id: workspaceId,
          type: 'member_accepted',
          title: 'Workspace Joined',
          message: 'You have joined the workspace.',
        });
      } catch {
        // silently ignore
      }

      // Save to localStorage so WorkspaceProvider selects it on refresh
      localStorage.setItem('meetiq_current_workspace', workspaceId);
      toast.success('Joined workspace successfully!');
      await refreshWorkspaces();
      await fetchPendingInvites();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to join workspace');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Decline Invitation
  const handleDeclineInvite = async (workspaceId: string) => {
    if (!user) return;
    setActionLoadingId(`${workspaceId}-decline`);
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      // Mark the invite notification as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('workspace_id', workspaceId)
        .eq('type', 'member_invited');

      toast.success('Invitation declined.');
      await refreshWorkspaces();
      await fetchPendingInvites();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to decline invitation');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Render 1: NO WORKSPACE EMPTY STATE
  if (!currentWorkspace && !isPageLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 py-4 sm:py-8 font-body">
        <div className="flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] text-center px-4 sm:px-6 bg-white border border-meetiq-border/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-meetiq-xs sm:shadow-meetiq-sm">
          <div className="mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-50 text-accent">
            <Building2 className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-heading">Set up your workspace</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5 sm:mt-2 max-w-sm leading-relaxed">
            Workspaces organize meetings, commitments, and team members. Create one to begin or accept a pending invitation below.
          </p>
          <Link href="/workspace/create" className="w-full sm:w-auto">
            <Button className="mt-4 sm:mt-6 h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base gap-2 w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold">
              <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Create Workspace
            </Button>
          </Link>
        </div>

        {/* Pending Invites inside empty state */}
        {pendingInvites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
              Pending Invitations ({pendingInvites.length})
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.workspace_id}
                  className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-meetiq-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-accent">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-heading">
                        {invite.workspaces?.name || 'Workspace Invite'}
                      </h4>
                      <p className="text-xs text-slate-400">Role: {invite.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeclineInvite(invite.workspace_id)}
                      disabled={actionLoadingId !== null}
                      className="w-full sm:w-auto h-9 px-3 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold"
                    >
                      {actionLoadingId === `${invite.workspace_id}-decline` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.workspace_id)}
                      disabled={actionLoadingId !== null}
                      className="w-full sm:w-auto h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    >
                      {actionLoadingId === `${invite.workspace_id}-accept` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render 2: PAGE LOADING STATE
  if (isPageLoading) {
    return (
      <div className="space-y-6 font-body">
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

  // Check if workspace exists but has no data
  const hasNoData = (!meetings || meetings.length === 0) && (!commitments || commitments.length === 0);

  return (
    <div className="space-y-4 sm:space-y-8 font-body">
      
      {/* PENDING INVITES PERSISTENT DASHBOARD BANNER */}
      {pendingInvites.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 shadow-meetiq-xs animate-fade-in">
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-widest block font-body">
                Pending Invitations
              </span>
              <p className="text-xs sm:text-sm text-blue-900 mt-0.5 leading-relaxed font-semibold truncate">
                You have {pendingInvites.length} pending invite{pendingInvites.length > 1 ? 's' : ''} to join other team workspaces.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {pendingInvites.map((invite) => (
              <div
                key={invite.workspace_id}
                className="bg-white border border-blue-100 rounded-lg py-1.5 pl-3 pr-2 flex items-center justify-between gap-3 text-xs shadow-sm"
              >
                <span className="font-bold text-slate-800 truncate max-w-[120px]">
                  {invite.workspaces?.name}
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleDeclineInvite(invite.workspace_id)}
                    disabled={actionLoadingId !== null}
                    className="p-1 hover:bg-red-50 text-red-500 rounded border border-transparent hover:border-red-100 transition-colors"
                    title="Decline"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleAcceptInvite(invite.workspace_id)}
                    disabled={actionLoadingId !== null}
                    className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded border border-emerald-100 hover:border-emerald-200 transition-colors"
                    title="Accept"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary font-heading">
            Workspace Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1.5">
            Monitor AI-extracted commitments and team accountability execution metrics.
          </p>
        </div>
        <Button onClick={() => router.push('/meetings/upload')} className="w-full sm:w-auto h-10 sm:h-12 gap-2 px-4 sm:px-6 shrink-0 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm sm:text-base">
          <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span>Upload Meeting</span>
        </Button>
      </div>

      {/* Render 3: EMPTY WORKSPACE DATA STATE */}
      {hasNoData ? (
        <div className="flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] text-center px-4 sm:px-6 bg-white border border-meetiq-border/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-meetiq-xs sm:shadow-meetiq-sm">
          <div className="mx-auto mb-4 sm:mb-6 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl bg-indigo-50 text-accent">
            <Sparkles className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-primary font-heading">Upload your first meeting notes</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
            There are no meetings or commitments in this workspace yet. Paste a transcript or paste meeting notes to trigger AI accountability extraction.
          </p>
          <Button onClick={() => router.push('/meetings/upload')} className="mt-4 sm:mt-6 h-10 sm:h-12 px-6 sm:px-8 text-sm sm:text-base gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm font-semibold">
            <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Upload Transcript</span>
          </Button>
        </div>
      ) : (
        <>
          {/* KPI Overview Section */}
          <div className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
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
              <CardHeader className="pb-2 sm:pb-3 border-b border-slate-50 px-4 sm:px-5">
                <CardTitle className="text-xs sm:text-sm font-heading font-semibold text-primary">
                  Commitment Status Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 sm:pt-4 px-3 sm:px-5">
                <StatusBreakdownBar breakdown={stats.statusBreakdown} />
              </CardContent>
            </Card>
          )}

          {/* Tables and Side Columns Grid */}
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
            {/* Left column (2/3 width on large screens) */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Recent Meetings */}
              <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
                <CardHeader className="pb-2 sm:pb-3 flex flex-row items-center justify-between px-4 sm:px-5">
                  <CardTitle className="text-xs sm:text-sm font-heading font-semibold text-primary">
                    Recent Meetings
                  </CardTitle>
                  <Link href="/meetings" className="text-xs text-muted-foreground hover:text-accent font-medium transition-colors">
                    View all
                  </Link>
                </CardHeader>
                <CardContent className="px-3 sm:px-5 py-0">
                  <RecentMeetingsTable meetings={meetings || []} />
                </CardContent>
              </Card>

              {/* Team Accountability */}
              <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
                <CardHeader className="pb-2 sm:pb-3 flex flex-row items-center justify-between px-4 sm:px-5">
                  <CardTitle className="text-xs sm:text-sm font-heading font-semibold text-primary">
                    Team Accountability
                  </CardTitle>
                  <Link href="/team" className="text-xs text-muted-foreground hover:text-accent font-medium transition-colors">
                    View all
                  </Link>
                </CardHeader>
                <CardContent className="px-3 sm:px-5 py-0">
                  <TeamAccountabilityTable stats={stats?.teamMemberStats || []} />
                </CardContent>
              </Card>
            </div>

            {/* Right column (1/3 width on large screens) */}
            <div className="space-y-4 sm:space-y-6">
              {/* Overdue Commitments */}
              <OverdueCommitmentsSection commitments={commitments || []} />

              {/* Real-time Activity Feed */}
              <Card className="border border-meetiq-border/5 bg-white shadow-meetiq-xs">
                <CardHeader className="pb-2 sm:pb-3 flex flex-row items-center justify-between px-4 sm:px-5">
                  <CardTitle className="text-xs sm:text-sm font-heading font-semibold text-primary">
                    Workspace Activity
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!currentWorkspace) return;
                      setClearTrigger((c) => c + 1);
                      try {
                        const res = await fetch(`/api/activity?workspaceId=${currentWorkspace.id}&deleteAll=true`, { method: 'DELETE' });
                        if (!res.ok) throw new Error();
                        refetchActivities();
                        toast.success('All activity cleared');
                      } catch (e) {
                        logger.error("Error occurred", e);
                        toast.error('Failed to clear activity');
                      }
                    }}
                    className="text-xs text-destructive hover:text-destructive h-auto px-2 py-1 gap-1 font-medium"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete all
                  </Button>
                </CardHeader>
                <CardContent className="px-3 sm:px-5">
                  <ActivityFeed
                    initialActivities={activities || []}
                    workspaceId={currentWorkspace?.id || ''}
                    clearTrigger={clearTrigger}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
