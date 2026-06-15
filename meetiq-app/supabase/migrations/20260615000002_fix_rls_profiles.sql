-- MeetIQ RLS Fix: Allow workspace members to view each other's profiles
-- This is needed for the dashboard team accountability table, activity feed actor names,
-- commitment owner/assigner display, and team page member list.

-- Add policy: workspace members can view profiles of other members in the same workspace
CREATE POLICY "Workspace members can view member profiles"
  ON public.profiles FOR SELECT
  USING (
    id IN (
      SELECT wm.user_id FROM public.workspace_members wm
      WHERE wm.workspace_id IN (
        SELECT wm2.workspace_id FROM public.workspace_members wm2 WHERE wm2.user_id = auth.uid()
      )
    )
  );
