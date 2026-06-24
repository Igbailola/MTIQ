'use client';

import React from 'react';
import type { TeamMemberStats } from '@/types/database';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { Users, AlertTriangle } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface TeamAccountabilityTableProps {
  stats: TeamMemberStats[];
}

export function TeamAccountabilityTable({ stats }: TeamAccountabilityTableProps) {
  const router = useRouter();

  const handleRowClick = (userId: string) => {
    // Navigate to commitments page with owner filter
    router.push(`/commitments?ownerId=${userId}`);
  };

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-slate-50/50">
        <Users className="h-8 w-8 mb-2 opacity-30" />
        <span>No team members in workspace yet.</span>
      </div>
    );
  }

  return (
    <div className="border border-meetiq-border/5 rounded-xl bg-white shadow-meetiq-xs">
      <Table className="border-separate border-spacing-y-2 w-full">
        <TableHeader className="bg-slate-50/75">
          <TableRow>
            <TableHead className="font-semibold text-[10px] sm:text-xs text-primary font-heading">Member</TableHead>
            <TableHead className="font-semibold text-[10px] sm:text-xs text-primary font-heading text-center">All</TableHead>
            <TableHead className="font-semibold text-[10px] sm:text-xs text-primary font-heading text-center hidden sm:table-cell">Conf.</TableHead>
            <TableHead className="font-semibold text-[10px] sm:text-xs text-primary font-heading text-center hidden sm:table-cell">Done</TableHead>
            <TableHead className="font-semibold text-[10px] sm:text-xs text-primary font-heading text-center">Late</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stats.map((member) => (
            <TableRow
              key={member.user_id}
              onClick={() => handleRowClick(member.user_id)}
              className={cn(
                'cursor-pointer hover:bg-slate-50 font-body h-12 sm:h-14 border-b-0',
                member.overdue > 0 ? 'bg-red-50/10 hover:bg-red-50/20' : ''
              )}
            >
              <TableCell className="font-semibold text-slate-800 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                    <AvatarImage src={member.avatar_url || undefined} />
                    <AvatarFallback className="text-[9px] sm:text-xs bg-slate-100 font-bold">
                      {getInitials(member.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{member.display_name}</span>
                </div>
              </TableCell>
              
              <TableCell className="text-center font-medium text-slate-700 text-[10px] sm:text-xs">
                {member.total_commitments}
              </TableCell>
              
              <TableCell className="text-center text-slate-600 text-[10px] sm:text-xs hidden sm:table-cell">
                {member.confirmed}
              </TableCell>
              
              <TableCell className="text-center text-slate-600 text-[10px] sm:text-xs hidden sm:table-cell">
                <span className={cn(member.completed > 0 ? 'text-emerald-600 font-semibold' : '')}>
                  {member.completed}
                </span>
              </TableCell>
              
              <TableCell className="text-center text-[10px] sm:text-xs">
                {member.overdue > 0 ? (
                  <span className="inline-flex items-center gap-0.5 sm:gap-1 text-red-600 font-bold bg-red-50 px-1 sm:px-2 py-0.5 rounded border border-red-100 text-[10px] sm:text-xs">
                    <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                    {member.overdue}
                  </span>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
