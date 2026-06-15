-- MeetIQ Initial Schema Migration
-- Creates all tables, indexes, RLS policies, and triggers.

-- ════════════════════════════════════════════════
-- 1. PROFILES (extends auth.users)
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ════════════════════════════════════════════════
-- 2. WORKSPACES
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  owner_id UUID NOT NULL REFERENCES auth.users(id)
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════
-- 3. WORKSPACE MEMBERS
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace Policies (moved here to ensure workspace_members exists)
CREATE POLICY "Workspace members can view workspaces"
  ON public.workspaces FOR SELECT
  USING (
    id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace admins can update workspaces"
  ON public.workspaces FOR UPDATE
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Workspace admins can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (
    id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert workspace members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR
    -- Allow self-insert when creating a workspace (owner becomes admin)
    user_id = auth.uid()
  );

CREATE POLICY "Admins can delete workspace members"
  ON public.workspace_members FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update member roles"
  ON public.workspace_members FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ════════════════════════════════════════════════
-- 4. MEETINGS
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  file_path TEXT,
  raw_text TEXT,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  summary JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_meetings_workspace_date ON public.meetings(workspace_id, meeting_date DESC);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view meetings"
  ON public.meetings FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Workspace members can create meetings"
  ON public.meetings FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Meeting uploader or admin can update meetings"
  ON public.meetings FOR UPDATE
  USING (
    uploaded_by = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete meetings"
  ON public.meetings FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ════════════════════════════════════════════════
-- 5. DECISIONS
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  ai_confidence TEXT CHECK (ai_confidence IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view decisions via meeting workspace"
  ON public.decisions FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM public.meetings m
      JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert decisions"
  ON public.decisions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update decisions"
  ON public.decisions FOR UPDATE
  USING (true);

-- ════════════════════════════════════════════════
-- 6. COMMITMENTS
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  assigner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation', 'in_progress', 'blocked', 'completed', 'overdue')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  ai_confidence TEXT CHECK (ai_confidence IN ('high', 'medium', 'low')),
  ai_owner_suggestion UUID,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  context_snippet TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_commitments_owner_status ON public.commitments(owner_id, status);
CREATE INDEX idx_commitments_meeting ON public.commitments(meeting_id);

ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view commitments via meeting workspace"
  ON public.commitments FOR SELECT
  USING (
    meeting_id IN (
      SELECT m.id FROM public.meetings m
      JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can insert commitments"
  ON public.commitments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Owner or admin can update commitments"
  ON public.commitments FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR assigner_id = auth.uid()
    OR meeting_id IN (
      SELECT m.id FROM public.meetings m
      JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete commitments"
  ON public.commitments FOR DELETE
  USING (
    meeting_id IN (
      SELECT m.id FROM public.meetings m
      JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid() AND wm.role = 'admin'
    )
  );

-- ════════════════════════════════════════════════
-- 7. COMMITMENT HISTORY
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.commitment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.commitments(id) ON DELETE CASCADE,
  changed_by UUID REFERENCES auth.users(id),
  field_changed TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.commitment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view commitment history"
  ON public.commitment_history FOR SELECT
  USING (
    commitment_id IN (
      SELECT c.id FROM public.commitments c
      JOIN public.meetings m ON m.id = c.meeting_id
      JOIN public.workspace_members wm ON wm.workspace_id = m.workspace_id
      WHERE wm.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert history"
  ON public.commitment_history FOR INSERT
  WITH CHECK (true);

-- ════════════════════════════════════════════════
-- 8. ACTIVITY FEED
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_feed_workspace ON public.activity_feed(workspace_id, created_at DESC);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view activity feed"
  ON public.activity_feed FOR SELECT
  USING (
    workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert activity"
  ON public.activity_feed FOR INSERT
  WITH CHECK (true);

-- ════════════════════════════════════════════════
-- 9. AI FEEDBACK
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  feedback TEXT NOT NULL CHECK (feedback IN ('thumbs_up', 'thumbs_down')),
  categories TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.ai_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert feedback"
  ON public.ai_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ════════════════════════════════════════════════
-- 10. NOTIFICATIONS
-- ════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ════════════════════════════════════════════════
-- TRIGGERS: updated_at
-- ════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_meetings
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at_commitments
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ════════════════════════════════════════════════
-- TRIGGER: Log commitment changes to history
-- ════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.log_commitment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.commitment_history (commitment_id, changed_by, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status', OLD.status, NEW.status);
  END IF;
  IF OLD.owner_id IS DISTINCT FROM NEW.owner_id THEN
    INSERT INTO public.commitment_history (commitment_id, changed_by, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'owner_id', OLD.owner_id::TEXT, NEW.owner_id::TEXT);
  END IF;
  IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
    INSERT INTO public.commitment_history (commitment_id, changed_by, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'due_date', OLD.due_date::TEXT, NEW.due_date::TEXT);
  END IF;
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO public.commitment_history (commitment_id, changed_by, field_changed, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority', OLD.priority, NEW.priority);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_commitment_change
  AFTER UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION public.log_commitment_change();

-- ════════════════════════════════════════════════
-- Enable Realtime for activity_feed and notifications
-- ════════════════════════════════════════════════
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.commitments;
