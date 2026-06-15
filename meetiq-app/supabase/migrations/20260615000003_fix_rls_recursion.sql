-- MeetIQ RLS Fix: Eliminate recursion in Row Level Security policies
-- By using SECURITY DEFINER helper functions, we bypass RLS queries internally and avoid infinite loops.

-- 1. Helper functions
CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id AND user_id = u_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id uuid, u_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.workspace_members 
    WHERE workspace_id = ws_id AND user_id = u_id AND role = 'admin'
  );
$$;

-- 2. Drop old policies
DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can insert workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can delete workspace members" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can update member roles" ON public.workspace_members;

DROP POLICY IF EXISTS "Workspace members can view workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace admins can update workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace admins can delete workspaces" ON public.workspaces;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Workspace members can view member profiles" ON public.profiles;

DROP POLICY IF EXISTS "Workspace members can view meetings" ON public.meetings;
DROP POLICY IF EXISTS "Workspace members can create meetings" ON public.meetings;
DROP POLICY IF EXISTS "Meeting uploader or admin can update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Admins can delete meetings" ON public.meetings;

-- 3. Create new policies
-- profiles
CREATE POLICY "Users can view their own profile or other workspace members' profiles"
  ON public.profiles FOR SELECT
  USING (
    id = auth.uid()
    OR
    EXISTS (
      SELECT 1 
      FROM public.workspace_members wm 
      WHERE wm.user_id = id 
      AND is_workspace_member(wm.workspace_id, auth.uid())
    )
  );

-- workspace_members
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Admins can insert workspace members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    is_workspace_admin(workspace_id, auth.uid())
    OR
    user_id = auth.uid()
  );

CREATE POLICY "Admins can delete workspace members"
  ON public.workspace_members FOR DELETE
  USING (
    is_workspace_admin(workspace_id, auth.uid())
  );

CREATE POLICY "Admins can update member roles"
  ON public.workspace_members FOR UPDATE
  USING (
    is_workspace_admin(workspace_id, auth.uid())
  );

-- workspaces
CREATE POLICY "Workspace members can view workspaces"
  ON public.workspaces FOR SELECT
  USING (
    is_workspace_member(id, auth.uid())
  );

CREATE POLICY "Workspace admins can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (
    is_workspace_admin(id, auth.uid())
  );

CREATE POLICY "Workspace admins can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (
    is_workspace_admin(id, auth.uid())
  );

-- meetings
CREATE POLICY "Workspace members can view meetings"
  ON public.meetings FOR SELECT
  USING (
    is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Workspace members can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    is_workspace_member(workspace_id, auth.uid())
  );

CREATE POLICY "Meeting uploader or admin can update meetings"
  ON public.meetings FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR
    is_workspace_admin(workspace_id, auth.uid())
  );

CREATE POLICY "Admins can delete meetings"
  ON public.meetings FOR DELETE
  USING (
    is_workspace_admin(workspace_id, auth.uid())
  );
