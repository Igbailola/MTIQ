import { Users } from 'lucide-react';
import { InviteMemberDialog } from '@/features/workspace/components/invite-member-dialog';

interface TeamEmptyStateProps {
  type: 'no-workspace' | 'no-members';
  workspaceId?: string;
  isAdmin?: boolean;
}

export function TeamEmptyState({ type, workspaceId, isAdmin }: TeamEmptyStateProps) {
  if (type === 'no-workspace') {
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
    <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border border-dashed rounded-xl bg-white shadow-meetiq-xs">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-accent mb-4">
        <Users className="h-6 w-6" />
      </div>
      <h3 className="font-heading font-semibold text-base text-primary">No members yet</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm font-body mx-auto">
        Invite members to collaborate on meeting transcripts, commitments, and action items.
      </p>
      {isAdmin && workspaceId ? <InviteMemberDialog workspaceId={workspaceId} /> : null}
    </div>
  );
}
