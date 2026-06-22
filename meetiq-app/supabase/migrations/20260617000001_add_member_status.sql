-- Add status column to workspace_members for pending/accept flow
ALTER TABLE public.workspace_members
  ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active'));

-- Existing rows keep 'active' via the default
-- New invites will set status = 'pending' until the user accepts

-- Update RLS: allow the invited user to update their own member row (to accept the invite)
DROP POLICY IF EXISTS "Members can view own memberships" ON public.workspace_members;
CREATE POLICY "Members can view own memberships"
  ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Invited users can accept their invite"
  ON public.workspace_members FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid() AND status = 'active');
