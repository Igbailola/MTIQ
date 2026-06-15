-- MeetIQ RLS & Profile Fixes
-- 1. Allow owners to select workspaces (crucial for inserting workspaces with returning select statement)
DROP POLICY IF EXISTS "Workspace members can view workspaces" ON public.workspaces;
CREATE POLICY "Workspace members can view workspaces"
  ON public.workspaces FOR SELECT
  USING (
    owner_id = auth.uid()
    OR
    is_workspace_member(id, auth.uid())
  );

-- 2. Backfill profiles for existing users who registered before database trigger was created
INSERT INTO public.profiles (id, display_name, avatar_url, onboarding_completed)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1)), 
  raw_user_meta_data->>'avatar_url',
  false
FROM auth.users
ON CONFLICT (id) DO NOTHING;
