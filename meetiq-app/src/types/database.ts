/**
 * MeetIQ Database Types
 * TypeScript types matching the Supabase PostgreSQL schema.
 */

// ── Enums ──

export type CommitmentStatus =
  | 'pending_confirmation'
  | 'in_progress'
  | 'blocked'
  | 'completed'
  | 'overdue';

export type CommitmentPriority = 'low' | 'medium' | 'high';

export type AIConfidence = 'high' | 'medium' | 'low';

export type MeetingStatus = 'processing' | 'ready' | 'error';

export type WorkspaceRole = 'admin' | 'member';

export type ActivityAction =
  | 'commitment_created'
  | 'commitment_confirmed'
  | 'commitment_rejected'
  | 'commitment_changes_requested'
  | 'commitment_completed'
  | 'commitment_status_changed'
  | 'commitment_blocked'
  | 'meeting_uploaded'
  | 'meeting_processed'
  | 'member_invited'
  | 'member_joined';

export type NotificationType =
  | 'commitment_assigned'
  | 'commitment_confirmed'
  | 'commitment_rejected'
  | 'commitment_changes_requested'
  | 'commitment_overdue'
  | 'escalation'
  | 'meeting_processed'
  | 'member_invited'
  | 'member_accepted';

// ── Table Row Types ──

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface Workspace {
  id: string;
  name: string;
  created_at: string;
  owner_id: string;
}

export interface WorkspaceMember {
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  status: 'pending' | 'active';
  joined_at: string;
  // Joined fields
  profile?: Profile;
}

export interface Meeting {
  id: string;
  workspace_id: string;
  title: string;
  meeting_date: string;
  file_path: string | null;
  raw_text: string | null;
  status: MeetingStatus;
  uploaded_by: string;
  summary: MeetingSummary | null;
  created_at: string;
  updated_at: string | null;
  // Joined fields
  uploader?: Profile;
  decisions?: Decision[];
  commitments?: Commitment[];
}

export interface MeetingSummary {
  bullets: string[];
  ai_confidence: AIConfidence;
}

export interface Decision {
  id: string;
  meeting_id: string;
  content: string;
  ai_confidence: AIConfidence | null;
  created_at: string;
}

export interface Commitment {
  id: string;
  meeting_id: string;
  title: string;
  description: string | null;
  owner_id: string | null;
  assigner_id: string | null;
  status: CommitmentStatus;
  priority: CommitmentPriority;
  due_date: string | null;
  ai_confidence: AIConfidence | null;
  ai_owner_suggestion: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  context_snippet: string | null;
  published: boolean;
  created_at: string;
  updated_at: string | null;
  // Joined fields
  owner?: Profile | null;
  assigner?: Profile | null;
  meeting?: Pick<Meeting, 'id' | 'title' | 'meeting_date'>;
}

export interface CommitmentHistory {
  id: string;
  commitment_id: string;
  changed_by: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  changed_at: string;
  // Joined
  changer?: Profile;
}

export interface ActivityFeedItem {
  id: string;
  workspace_id: string;
  actor_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
  // Joined
  actor?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  workspace_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  entity_type: string | null;
  entity_id: string | null;
  read: boolean;
  created_at: string;
}

// ── Dashboard Types ──

export interface DashboardStats {
  totalMeetingsThisWeek: number;
  totalCommitments: number;
  confirmationRate: number;
  completionRate: number;
  statusBreakdown: {
    pending_confirmation: number;
    in_progress: number;
    blocked: number;
    completed: number;
    overdue: number;
  };
}

export interface TeamMemberStats {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_commitments: number;
  confirmed: number;
  completed: number;
  overdue: number;
}
