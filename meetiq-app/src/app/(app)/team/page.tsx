'use client';

import React, { useEffect, useMemo } from 'react';
import { useCurrentWorkspace, useWorkspaceMembers, useRemoveMember } from '@/hooks/use-workspace';
import { InviteMemberDialog } from '@/features/workspace/components/invite-member-dialog';
import { useAuth } from '@/hooks/use-auth';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Shield, Trash2, Calendar, Globe, Loader2, Users, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

export default function TeamPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members, isLoading } = useWorkspaceMembers(currentWorkspace?.id);
  const removeMutation = useRemoveMember(currentWorkspace?.id || '');
  const supabase = createClient();
  const queryClient = useQueryClient();

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === 'admin';
  const activeMembers = members?.filter((m) => !m.status || m.status === 'active') ?? [];
  const pendingMembers = members?.filter((m) => m.status === 'pending') ?? [];

  // Realtime subscription to reload members list when any workspace member changes
  useEffect(() => {
    if (!currentWorkspace?.id) return;

    const channel = supabase
      .channel(`workspace-members-realtime-${currentWorkspace.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `workspace_id=eq.${currentWorkspace.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['workspace-members', currentWorkspace.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentWorkspace?.id, queryClient, supabase]);

  // Calculate live availability overlap insights
  const timezoneInsights = useMemo(() => {
    if (!activeMembers || activeMembers.length === 0) return null;

    const currentUserTimezone = members?.find(m => m.user_id === user?.id)?.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    // 1. Group active members by timezone
    const tzMap: Record<string, typeof activeMembers> = {};
    activeMembers.forEach(m => {
      const tz = m.profile?.timezone || 'UTC';
      if (!tzMap[tz]) tzMap[tz] = [];
      tzMap[tz].push(m);
    });

    const uniqueTzList = Object.entries(tzMap).map(([tz, tzMembers]) => {
      let localTimeStr = '';
      let offsetStr = '';
      try {
        const now = new Date();
        localTimeStr = now.toLocaleTimeString('en-US', {
          timeZone: tz,
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        
        // Calculate offset difference
        const utcDate = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'longOffset' });
        const parts = formatter.formatToParts(utcDate);
        const tzOffsetName = parts.find(p => p.type === 'timeZoneName')?.value || '';

        const userFormatter = new Intl.DateTimeFormat('en-US', { timeZone: currentUserTimezone, timeZoneName: 'longOffset' });
        const userParts = userFormatter.formatToParts(utcDate);
        const userOffsetName = userParts.find(p => p.type === 'timeZoneName')?.value || '';

        const parseOffset = (name: string) => {
          if (name === 'GMT' || !name.includes('GMT')) return 0;
          const sign = name.includes('-') ? -1 : 1;
          const timePart = name.replace(/GMT[+-]/, '');
          const [h, m] = timePart.split(':').map(Number);
          return sign * (h + (m || 0) / 60);
        };

        const offsetDiff = parseOffset(tzOffsetName) - parseOffset(userOffsetName);
        offsetStr = offsetDiff === 0 ? 'Same time' : offsetDiff > 0 ? `+${offsetDiff}h` : `${offsetDiff}h`;
      } catch (e) {
        localTimeStr = 'Unknown';
        offsetStr = '';
      }

      return {
        timezone: tz,
        members: tzMembers,
        localTime: localTimeStr,
        offset: offsetStr
      };
    });

    // 2. Overlap timeline in current user's local timezone hours (0..23)
    const userLocalHoursData = new Array(24).fill(0).map((_, i) => ({
      hour: i,
      availableCount: 0,
      percentage: 0
    }));

    for (let userHour = 0; userHour < 24; userHour++) {
      try {
        activeMembers.forEach(member => {
          const mTimezone = member.profile?.timezone || 'UTC';
          try {
            const utcDate = new Date();
            const parseOffset = (name: string) => {
              if (name === 'GMT' || !name.includes('GMT')) return 0;
              const sign = name.includes('-') ? -1 : 1;
              const timePart = name.replace(/GMT[+-]/, '');
              const [h, m] = timePart.split(':').map(Number);
              return sign * (h + (m || 0) / 60);
            };
            const mOffset = parseOffset(new Intl.DateTimeFormat('en-US', { timeZone: mTimezone, timeZoneName: 'longOffset' }).formatToParts(utcDate).find(p => p.type === 'timeZoneName')?.value || '');
            const uOffset = parseOffset(new Intl.DateTimeFormat('en-US', { timeZone: currentUserTimezone, timeZoneName: 'longOffset' }).formatToParts(utcDate).find(p => p.type === 'timeZoneName')?.value || '');
            
            const localHour = (userHour + Math.round(mOffset - uOffset) + 24) % 24;
            if (localHour >= 9 && localHour < 17) {
              userLocalHoursData[userHour].availableCount++;
            }
          } catch (err) {
            if (userHour >= 9 && userHour < 17) {
              userLocalHoursData[userHour].availableCount++;
            }
          }
        });
        
        userLocalHoursData[userHour].percentage = Math.round((userLocalHoursData[userHour].availableCount / activeMembers.length) * 100);
      } catch (e) {}
    }

    // 3. Find optimal meeting slots
    const maxAvailability = Math.max(...userLocalHoursData.map(h => h.availableCount));
    const optimalHours = userLocalHoursData.filter(h => h.availableCount === maxAvailability && maxAvailability > 0);
    
    let optimalSlotText = 'No overlap slots found';
    if (optimalHours.length > 0) {
      const ranges: string[] = [];
      let start = optimalHours[0].hour;
      let prev = start;
      
      const formatHourStr = (h: number) => {
        const ampm = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        return `${displayHour} ${ampm}`;
      };

      for (let i = 1; i <= optimalHours.length; i++) {
        const curr = optimalHours[i]?.hour;
        if (curr !== prev + 1 || i === optimalHours.length) {
          const endHour = (prev + 1) % 24;
          ranges.push(`${formatHourStr(start)} - ${formatHourStr(endHour)}`);
          if (curr !== undefined) {
            start = curr;
            prev = curr;
          }
        } else {
          prev = curr;
        }
      }
      optimalSlotText = `${ranges.join(', ')} (${maxAvailability} of ${activeMembers.length} available)`;
    }

    return {
      uniqueTzList,
      userLocalHoursData,
      optimalSlotText,
      currentUserTimezone
    };
  }, [activeMembers, members, user]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) {
      return;
    }
    try {
      await removeMutation.mutateAsync({ userId: memberId });
    } catch (err) {
      console.error(err);
    }
  };

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <Users className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-primary font-heading">No workspace active</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Create or select a workspace to start managing team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
            Team Members
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Manage members, roles, and timezone availability in the active workspace.
          </p>
        </div>

        {isAdmin && <InviteMemberDialog workspaceId={currentWorkspace.id} />}
      </div>

      {/* Members Table */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      ) : !members || members.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border border-dashed rounded-xl bg-white shadow-meetiq-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-accent mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-primary">No members yet</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm font-body mx-auto">
            Invite members to collaborate on meeting transcripts, commitments, and action items.
          </p>
          {isAdmin && <InviteMemberDialog workspaceId={currentWorkspace.id} />}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Timezone Planner Card */}
          {timezoneInsights && (
            <Card className="border border-slate-200 shadow-meetiq-xs overflow-hidden">
              <CardContent className="p-6 space-y-6 bg-white">
                <div className="flex items-start justify-between border-b pb-4 border-slate-100">
                  <div className="space-y-1">
                    <h3 className="font-heading font-bold text-lg text-primary flex items-center gap-2">
                      <Globe className="h-5 w-5 text-accent" />
                      Timezone & Meeting Planner
                    </h3>
                    <p className="text-xs text-muted-foreground font-body">
                      Find optimal hours for team meetings and see represented timezones. Working hours are set to 9:00 AM - 5:00 PM local time.
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-50 text-accent font-semibold text-xs border border-blue-200 shrink-0">
                    <Sparkles className="h-3.5 w-3.5 mr-1 text-accent animate-pulse" />
                    Best Slot: {timezoneInsights.optimalSlotText.split(' (')[0]}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  {/* Timeline section */}
                  <div className="md:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block font-heading">
                        24-Hour Working Overlap (Your Local Time)
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {timezoneInsights.currentUserTimezone}
                      </span>
                    </div>

                    <div 
                      className="bg-slate-50 p-3 rounded-lg border border-slate-200/50"
                      style={{ display: 'grid', gridTemplateColumns: 'repeat(24, minmax(0, 1fr))', gap: '4px' }}
                    >
                      {timezoneInsights.userLocalHoursData.map((h) => (
                        <div key={h.hour} className="group relative flex flex-col items-center">
                          {/* The bar */}
                          <div 
                            className={`w-full rounded-sm transition-colors duration-200 ${
                              h.percentage === 100 
                                ? 'bg-accent' 
                                : h.percentage >= 75 
                                ? 'bg-accent/80' 
                                : h.percentage >= 50 
                                ? 'bg-accent/60' 
                                : h.percentage >= 25 
                                ? 'bg-accent/40' 
                                : h.availableCount > 0 
                                ? 'bg-accent/20' 
                                : 'bg-slate-200'
                            }`}
                            style={{ height: '36px' }}
                          />
                          {/* Label for key hours */}
                          {h.hour % 4 === 0 && (
                            <span className="text-[9px] text-muted-foreground font-mono mt-1.5 select-none">
                              {h.hour === 0 ? '12a' : h.hour === 12 ? '12p' : h.hour > 12 ? `${h.hour-12}p` : `${h.hour}a`}
                            </span>
                          )}
                          {/* Tooltip */}
                          <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-10 transition-all pointer-events-none">
                            <div className="bg-slate-900 text-white text-[10px] p-2 rounded-md shadow-lg whitespace-nowrap text-center font-mono">
                              {h.hour === 0 ? '12:00 AM' : h.hour === 12 ? '12:00 PM' : h.hour > 12 ? `${h.hour-12}:00 PM` : `${h.hour}:00 AM`}
                              <div className="font-semibold text-accent mt-0.5">
                                {h.availableCount} of {activeMembers.length} available
                              </div>
                            </div>
                            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 -mt-0.75" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-muted-foreground font-body">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent" />
                        <span>100% Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent/60" />
                        <span>50% Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-accent/20" />
                        <span>&gt;0% Available</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                        <span>0% Available</span>
                      </div>
                    </div>
                  </div>

                  {/* Represented Timezones section */}
                  <div className="md:col-span-2 space-y-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-slate-100 font-heading">
                      Represented Timezones
                    </span>

                    <div className="max-h-[140px] overflow-y-auto divide-y divide-slate-100 pr-1 space-y-2">
                      {timezoneInsights.uniqueTzList.map(({ timezone, members: tzMembers, localTime, offset }) => (
                        <div key={timezone} className="flex items-center justify-between py-1.5 text-xs first:pt-0">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800 truncate max-w-[120px] sm:max-w-none">
                                {timezone.split('/').pop()?.replace('_', ' ')}
                              </span>
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-slate-50 text-slate-400 font-normal border-slate-100">
                                {offset}
                              </Badge>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-body block font-mono">
                              Current Time: {localTime}
                            </span>
                          </div>
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {tzMembers.map((m) => (
                              <Avatar key={m.user_id} className="h-6 w-6 ring-2 ring-white">
                                <AvatarImage src={m.profile?.avatar_url || undefined} />
                                <AvatarFallback className="text-[8px] bg-slate-100 font-bold text-slate-700">
                                  {m.profile?.display_name ? getInitials(m.profile.display_name) : 'U'}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Members */}
          {pendingMembers.length > 0 && (
            <div className="border border-meetiq-border/5 rounded-xl bg-white overflow-x-auto shadow-meetiq-xs">
              <Table className="border-separate border-spacing-y-2 min-w-[600px]">
                <TableHeader className="bg-amber-50/75">
                  <TableRow>
                    <TableHead className="font-semibold text-xs text-primary font-heading">Pending Invitations</TableHead>
                    <TableHead className="font-semibold text-xs text-primary font-heading">Workspace Role</TableHead>
                    <TableHead className="font-semibold text-xs text-primary font-heading">Status</TableHead>
                    <TableHead className="font-semibold text-xs text-primary font-heading">Invited Date</TableHead>
                    {isAdmin && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingMembers.map((member) => (
                    <TableRow key={member.user_id} className="bg-amber-50/30 font-body h-14 border-b-0">
                      <TableCell className="font-semibold text-slate-800 text-sm">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profile?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs bg-amber-100 font-bold text-amber-700">
                              {member.profile?.display_name ? getInitials(member.profile.display_name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm">{member.profile?.display_name || 'Invited User'}</span>
                            <span className="text-xs text-muted-foreground font-body">Pending</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200/30 h-[30px]">
                          {member.role === 'admin' ? 'Admin' : 'Member'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-medium">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                          Pending
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                          {format(new Date(member.joined_at), 'PPP')}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50 focus-visible:outline-none"
                            onClick={() => handleRemoveMember(member.user_id)}
                            disabled={removeMutation.isPending}
                          >
                            {removeMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Active Members */}
          <div className="border border-meetiq-border/5 rounded-xl bg-white overflow-x-auto shadow-meetiq-xs">
            <Table className="border-separate border-spacing-y-2 min-w-[600px]">
              <TableHeader className="bg-slate-50/75">
                <TableRow>
                  <TableHead className="font-semibold text-xs text-primary font-heading">Name</TableHead>
                  <TableHead className="font-semibold text-xs text-primary font-heading">Workspace Role</TableHead>
                  <TableHead className="font-semibold text-xs text-primary font-heading">Availability / Timezone</TableHead>
                  <TableHead className="font-semibold text-xs text-primary font-heading">Joined Date</TableHead>
                  {isAdmin && <TableHead className="w-10"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                      No active members yet
                    </TableCell>
                  </TableRow>
                ) : (
                  activeMembers.map((member) => (
                <TableRow key={member.user_id} className="hover:bg-slate-50 font-body h-14 border-b-0">
                  <TableCell className="font-semibold text-slate-800 text-sm">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs bg-slate-100 font-bold text-slate-700">
                          {member.profile?.display_name ? getInitials(member.profile.display_name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm">{member.profile?.display_name || 'Anonymous User'}</span>
                        <span className="text-xs text-muted-foreground font-body">
                          {member.profile?.id === user?.id ? 'You' : ''}
                        </span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    {member.role === 'admin' ? (
                      <Badge variant="outline" className="bg-blue-50 text-accent border-blue-200/30 h-9">
                        <Shield className="h-3.5 w-3.5" />
                        Admin
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200/30 h-[30px]">
                        Member
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-slate-600 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                            <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                      {member.profile?.timezone || 'UTC'}
                    </span>
                  </TableCell>

                  <TableCell className="text-slate-600 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      {format(new Date(member.joined_at), 'PPP')}
                    </span>
                  </TableCell>

                  {isAdmin && (
                    <TableCell>
                      {member.user_id !== user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50 focus-visible:outline-none"
                          onClick={() => handleRemoveMember(member.user_id)}
                          disabled={removeMutation.isPending}
                        >
                          {removeMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )))}
            </TableBody>
          </Table>
        </div>
      </div>
      )}
    </div>
  );
}
