'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import type { Workspace } from '@/types/database';

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace) => void;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  currentWorkspace: null,
  setCurrentWorkspace: () => {},
  loading: true,
  refreshWorkspaces: async () => {},
});

export function useWorkspaceContext() {
  return useContext(WorkspaceContext);
}

/**
 * WorkspaceProvider — manages workspace list and current selection.
 * Persists the selected workspace ID in localStorage.
 */
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [fetchedForUserId, setFetchedForUserId] = useState<string | null>(null);
  const supabase = createClient();

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setFetchedForUserId(null);
      return;
    }

    setFetchedForUserId(null);

    let memberRows: { workspace_id: string }[] | null = null;
    
    // Attempt to fetch only active memberships
    const activeResult = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (activeResult.error && (activeResult.error.message?.includes('status') || activeResult.error.code === 'PGRST100')) {
      // Fallback: the status column doesn't exist
      const fallbackResult = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', user.id);
      
      const allRows = fallbackResult.data || [];

      // Fetch unread invitations from notifications to exclude them
      const { data: unreadInvites } = await supabase
        .from('notifications')
        .select('workspace_id')
        .eq('user_id', user.id)
        .eq('type', 'member_invited')
        .eq('read', false);

      const invitedWorkspaceIds = new Set((unreadInvites || []).map((n: { workspace_id: string }) => n.workspace_id));
      memberRows = allRows.filter((row: { workspace_id: string }) => !invitedWorkspaceIds.has(row.workspace_id));
    } else {
      memberRows = activeResult.data;
    }

    if (!memberRows || memberRows.length === 0) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setFetchedForUserId(user.id);
      return;
    }

    const workspaceIds = memberRows.map((r: { workspace_id: string }) => r.workspace_id);
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds)
      .order('created_at', { ascending: false });

    const ws = data ?? [];
    setWorkspaces(ws);

    // Restore last selected workspace from localStorage
    const savedId = localStorage.getItem('meetiq_current_workspace');
    const saved = ws.find((w: Workspace) => w.id === savedId);
    setCurrentWorkspaceState(saved ?? ws[0] ?? null);
    setFetchedForUserId(user.id);
  }, [user, supabase]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const acceptedId = params.get('accepted');
    if (acceptedId) {
      localStorage.setItem('meetiq_current_workspace', acceptedId);
      const url = new URL(window.location.href);
      url.searchParams.delete('accepted');
      window.history.replaceState({}, '', url.pathname + url.search);
      fetchWorkspaces();
    }
  }, [fetchWorkspaces]);

  useEffect(() => {
    if (!user) return;

    // Listen to realtime Postgres changes to workspace memberships for the current user
    const channel = supabase
      .channel(`workspace-members-realtime-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workspace_members',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Whenever my workspace memberships are updated (invited, accepted, removed), refresh list
          fetchWorkspaces();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWorkspaces, supabase]);

  const loading = !user ? false : fetchedForUserId === null;

  const setCurrentWorkspace = (workspace: Workspace) => {
    setCurrentWorkspaceState(workspace);
    localStorage.setItem('meetiq_current_workspace', workspace.id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        loading,
        refreshWorkspaces: fetchWorkspaces,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
