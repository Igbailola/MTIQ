'use client';

import React from 'react';
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
import { Shield, Trash2, Calendar, Globe, Loader2, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function TeamPage() {
  const { user } = useAuth();
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members, isLoading } = useWorkspaceMembers(currentWorkspace?.id);
  const removeMutation = useRemoveMember(currentWorkspace?.id || '');

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const isAdmin = currentUserRole === 'admin';

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

  if (!currentWorkspace) return null;

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
        <Card className="border border-dashed p-8 text-center bg-white">
          <CardContent className="space-y-2">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" />
            <h3 className="font-heading font-semibold">No members in workspace</h3>
          </CardContent>
        </Card>
      ) : (
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
              {members.map((member) => (
                <TableRow key={member.user_id} className="hover:bg-slate-50 font-body h-14 border-b-0">
                  <TableCell className="font-semibold text-slate-800 text-sm">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profile?.avatar_url || ''} />
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
