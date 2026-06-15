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
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    const { data: memberRows } = await supabase
      .from('workspace_members')
      .select('workspace_id')
      .eq('user_id', user.id);

    if (!memberRows || memberRows.length === 0) {
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      setLoading(false);
      return;
    }

    const workspaceIds = memberRows.map((r: any) => r.workspace_id);
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .in('id', workspaceIds)
      .order('created_at', { ascending: false });

    const ws = data ?? [];
    setWorkspaces(ws);

    // Restore last selected workspace from localStorage
    const savedId = localStorage.getItem('meetiq_current_workspace');
    const saved = ws.find((w: any) => w.id === savedId);
    setCurrentWorkspaceState(saved ?? ws[0] ?? null);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

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
