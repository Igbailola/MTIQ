import { WORKSPACE_NAME_MAX, TITLE_MAX, DESCRIPTION_MAX, REASON_MAX, RAW_TEXT_MAX, MEETING_TITLE_MAX } from '@/lib/constants';
import { z } from 'zod';

/**
 * MeetIQ Zod Validation Schemas
 * Used for API input validation and form validation.
 */

// ── Auth Schemas ──

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterSchema = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

// ── Workspace Schemas ──

export const WorkspaceCreateSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(WORKSPACE_NAME_MAX).trim(),
});
export type WorkspaceCreateInput = z.infer<typeof WorkspaceCreateSchema>;

export const WorkspaceUpdateSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(WORKSPACE_NAME_MAX).trim(),
});
export type WorkspaceUpdateInput = z.infer<typeof WorkspaceUpdateSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member']).default('member'),
  sendEmail: z.boolean().optional(),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

// ── Meeting Schemas ──

export const MeetingUploadSchema = z.object({
  title: z.string().min(1, 'Meeting title is required').max(MEETING_TITLE_MAX).trim(),
  meeting_date: z.string().min(1, 'Meeting date is required'),
  raw_text: z.string().max(RAW_TEXT_MAX, 'Text content is too large').optional(),
  workspace_id: z.string().uuid('Invalid workspace ID'),
});
export type MeetingUploadInput = z.infer<typeof MeetingUploadSchema>;

export const MeetingUpdateSchema = z.object({
  title: z.string().min(1).max(MEETING_TITLE_MAX).trim().optional(),
  meeting_date: z.string().min(1).optional(),
  raw_text: z.string().max(RAW_TEXT_MAX).optional(),
  summary: z
    .object({
      bullets: z.array(z.string()),
      ai_confidence: z.enum(['high', 'medium', 'low']),
    })
    .optional(),
});
export type MeetingUpdateInput = z.infer<typeof MeetingUpdateSchema>;

// ── Commitment Schemas ──

export const CommitmentCreateSchema = z.object({
  meeting_id: z.string().uuid('Invalid meeting ID'),
  title: z.string().min(1, 'Title is required').max(TITLE_MAX).trim(),
  description: z.string().max(DESCRIPTION_MAX).trim().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  due_date: z.string().nullable().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});
export type CommitmentCreateInput = z.infer<typeof CommitmentCreateSchema>;

export const CommitmentUpdateSchema = z.object({
  title: z.string().min(1).max(TITLE_MAX).trim().optional(),
  description: z.string().max(DESCRIPTION_MAX).trim().optional(),
  owner_id: z.string().uuid().nullable().optional(),
  status: z
    .enum(['pending_confirmation', 'in_progress', 'blocked', 'completed', 'overdue'])
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().nullable().optional(),
});
export type CommitmentUpdateInput = z.infer<typeof CommitmentUpdateSchema>;

export const CommitmentConfirmSchema = z.object({
  action: z.enum(['accept', 'reject', 'request_changes']),
  reason: z.string().max(REASON_MAX).trim().optional(),
});
export type CommitmentConfirmInput = z.infer<typeof CommitmentConfirmSchema>;

// Validation: reject requires reason ≥ 10 chars
export const CommitmentConfirmWithValidation = CommitmentConfirmSchema.refine(
  (data) => {
    if (data.action === 'reject' && (!data.reason || data.reason.length < 10)) {
      return false;
    }
    if (data.action === 'request_changes' && (!data.reason || data.reason.length < 1)) {
      return false;
    }
    return true;
  },
  {
    message: 'A reason is required (at least 10 characters for rejection)',
    path: ['reason'],
  }
);

// ── Email Schemas ──

export const EmailWelcomeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  displayName: z.string().max(100).trim().optional(),
});
export type EmailWelcomeInput = z.infer<typeof EmailWelcomeSchema>;

// ── AI Feedback Schema ──

export const AIFeedbackSchema = z.object({
  entity_type: z.enum(['summary', 'decision', 'commitment']),
  entity_id: z.string().uuid(),
  feedback: z.enum(['thumbs_up', 'thumbs_down']),
  categories: z.array(z.string()).optional(),
});
export type AIFeedbackInput = z.infer<typeof AIFeedbackSchema>;
