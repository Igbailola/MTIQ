'use client';

import React, { useState } from 'react';
import { useCurrentWorkspace, useWorkspaceMembers } from '@/hooks/use-workspace';
import { useCommitments } from '@/hooks/use-commitments';
import { CommitmentCard } from '@/features/commitments/components/commitment-card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckSquare, ListTodo, Search, Users } from 'lucide-react';

export default function CommitmentsPage() {
  const { currentWorkspace } = useCurrentWorkspace();
  const { data: members } = useWorkspaceMembers(currentWorkspace?.id);

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedOwner, setSelectedOwner] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: commitments, isLoading } = useCommitments(currentWorkspace?.id, {
    status: activeTab,
    ownerId: selectedOwner,
  });

  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-6">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
          <ListTodo className="h-8 w-8 text-slate-500" />
        </div>
        <h2 className="text-xl font-semibold text-primary font-heading">No workspace active</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Create or select a workspace to start tracking commitments.
        </p>
      </div>
    );
  }

  // Client-side search filtering
  const filteredCommitments = (commitments || []).filter((c) => {
    if (!searchQuery.trim()) return true;
    return c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 font-body">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary font-heading">
          Action Commitments
        </h1>
        <p className="text-sm text-muted-foreground mt-1.5">
          Track individual execution action items, ownership accountability, and deadlines.
        </p>
      </div>

      {/* Tabs / Filters Block */}
      <div className="space-y-4">
        {/* Status Tabs */}
        <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex overflow-x-auto flex-nowrap w-full md:w-auto bg-slate-100 p-1 rounded-lg gap-1 items-center scrollbar-none">
            <TabsTrigger value="all" className="rounded-md px-3 text-xs font-semibold">
              All
            </TabsTrigger>
            <TabsTrigger value="pending_confirmation" className="rounded-md px-3 text-xs font-semibold">
              Pending
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="rounded-md px-3 text-xs font-semibold">
              In Progress
            </TabsTrigger>
            <TabsTrigger value="blocked" className="rounded-md px-3 text-xs font-semibold">
              Blocked
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-md px-3 text-xs font-semibold">
              Completed
            </TabsTrigger>
            <TabsTrigger value="overdue" className="rounded-md px-3 text-xs font-semibold">
              Overdue
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Assignee filter grid */}
        <div className="flex flex-row flex-wrap gap-4 items-end sm:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-[320px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search commitments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Owner filter dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <Label htmlFor="owner-filter" className="text-sm font-semibold text-slate-500 whitespace-nowrap">
              Assignee:
            </Label>
            <Select value={selectedOwner} onValueChange={(val) => setSelectedOwner(val || 'all')} disabled={isLoading}>
              <SelectTrigger id="owner-filter" className="w-[160px] sm:w-[180px] text-sm h-9 bg-white">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                {members?.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.profile?.display_name || 'Anonymous User'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* List / Empty State */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredCommitments.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[320px] p-8 text-center border border-dashed rounded-xl bg-white shadow-meetiq-xs">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-accent mb-4">
            <CheckSquare className="h-6 w-6" />
          </div>
          <h3 className="font-heading font-semibold text-base text-primary">All caught up!</h3>
          <p className="text-sm text-muted-foreground mt-1.5 max-w-sm font-body mx-auto">
            No commitments match these active status and assignee filter selections.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCommitments.map((commitment) => (
            <CommitmentCard
              key={commitment.id}
              commitment={commitment}
              workspaceId={currentWorkspace.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
