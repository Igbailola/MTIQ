import { Calendar, Trash2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface PendingMember {
  user_id: string;
  role: string;
  status?: string | null;
  joined_at: string;
  profile?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface PendingMembersTableProps {
  members: PendingMember[];
  isAdmin: boolean;
  onRemoveMember: (memberId: string) => void;
  isRemoving: boolean;
}

export function PendingMembersTable({ members, isAdmin, onRemoveMember, isRemoving }: PendingMembersTableProps) {
  if (members.length === 0) return null;

  return (
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
          {members.map((member) => (
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
                    onClick={() => onRemoveMember(member.user_id)}
                    disabled={isRemoving}
                  >
                    {isRemoving ? (
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
  );
}
