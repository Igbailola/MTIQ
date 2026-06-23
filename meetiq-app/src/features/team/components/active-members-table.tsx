import { Shield, Globe, Calendar, Trash2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { format } from 'date-fns';

interface ActiveMember {
  user_id: string;
  role: string;
  status?: string | null;
  joined_at: string;
  profile?: {
    id?: string;
    display_name?: string | null;
    avatar_url?: string | null;
    timezone?: string | null;
  } | null;
}

interface ActiveMembersTableProps {
  members: ActiveMember[];
  isAdmin: boolean;
  currentUserId?: string;
  onRemoveMember: (memberId: string) => void;
  isRemoving: boolean;
}

export function ActiveMembersTable({ members, isAdmin, currentUserId, onRemoveMember, isRemoving }: ActiveMembersTableProps) {
  return (
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
          {members.length === 0 ? (
            <TableRow>
              <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                No active members yet
              </TableCell>
            </TableRow>
          ) : (
            members.map((member) => (
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
                        {member.profile?.id === currentUserId ? 'You' : ''}
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
                    {member.user_id !== currentUserId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50 focus-visible:outline-none"
                        onClick={() => onRemoveMember(member.user_id)}
                        disabled={isRemoving}
                      >
                        {isRemoving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
