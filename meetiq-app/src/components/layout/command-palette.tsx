'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useCurrentWorkspace } from '@/hooks/use-workspace';
import { createClient } from '@/lib/supabase/client';
import type { Meeting, Commitment } from '@/types/database';
import { Calendar, CheckSquare, Search, User } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { currentWorkspace } = useCurrentWorkspace();
  const supabase = createClient();

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSearch = async (query: string) => {
    if (!currentWorkspace || query.trim().length < 2) {
      setMeetings([]);
      setCommitments([]);
      return;
    }

    setLoading(true);
    try {
      // Fetch matching meetings
      const { data: matchedMeetings } = await supabase
        .from('meetings')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .ilike('title', `%${query}%`)
        .limit(5);

      // Fetch matching commitments
      const { data: matchedCommitments } = await supabase
        .from('commitments')
        .select('*, meeting:meetings(workspace_id)')
        .ilike('title', `%${query}%`)
        .limit(5);

      // Filter commitments by workspace
      const wsCommitments = (matchedCommitments || []).filter(
        (c: any) => c.meeting?.workspace_id === currentWorkspace.id
      ) as Commitment[];

      setMeetings(matchedMeetings || []);
      setCommitments(wsCommitments);
    } catch (err) {
      console.error('Failed to search command palette:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (url: string) => {
    setOpen(false);
    router.push(url);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-10 w-full max-w-[240px] items-center justify-between rounded-lg border border-meetiq-border/50 bg-white px-3 text-xs text-muted-foreground hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 md:max-w-[320px]"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span>Search meetings, commitments...</span>
        </div>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-meetiq-border/50 bg-slate-50 px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Type to search..."
          onValueChange={handleSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => navigateTo('/dashboard')}>
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/meetings')}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Meetings</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/commitments')}>
              <CheckSquare className="mr-2 h-4 w-4" />
              <span>Commitments</span>
            </CommandItem>
            <CommandItem onSelect={() => navigateTo('/team')}>
              <User className="mr-2 h-4 w-4" />
              <span>Team</span>
            </CommandItem>
          </CommandGroup>

          {meetings.length > 0 && (
            <CommandGroup heading="Meetings">
              {meetings.map((m) => (
                <CommandItem key={m.id} onSelect={() => navigateTo(`/meetings/${m.id}`)}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>{m.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {commitments.length > 0 && (
            <CommandGroup heading="Commitments">
              {commitments.map((c) => (
                <CommandItem key={c.id} onSelect={() => navigateTo(`/commitments/${c.id}`)}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  <span>{c.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
