-- Add deleted_at column to meetings for soft-delete / trash functionality
ALTER TABLE public.meetings
  ADD COLUMN deleted_at TIMESTAMPTZ;

-- Allow uploader to delete their own meeting (soft-delete) and admins
DROP POLICY IF EXISTS "Users can delete own meetings" ON public.meetings;
CREATE POLICY "Users can delete own meetings"
  ON public.meetings FOR DELETE
  USING (
    auth.uid() = uploaded_by
    OR
    auth.uid() IN (
      SELECT user_id FROM public.workspace_members
      WHERE workspace_id = meetings.workspace_id AND role = 'admin'
    )
  );

-- Allow uploader to update (restore) their own meeting
DROP POLICY IF EXISTS "Users can update own meetings" ON public.meetings;
CREATE POLICY "Users can update own meetings"
  ON public.meetings FOR UPDATE
  USING (
    auth.uid() = uploaded_by
    OR
    auth.uid() IN (
      SELECT user_id FROM public.workspace_members
      WHERE workspace_id = meetings.workspace_id AND role = 'admin'
    )
  );
