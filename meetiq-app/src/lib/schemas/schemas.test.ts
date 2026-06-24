import { describe, it, expect } from 'vitest';
import {
  LoginSchema,
  RegisterSchema,
  WorkspaceCreateSchema,
  MeetingUploadSchema,
  MeetingUpdateSchema,
  CommitmentCreateSchema,
  CommitmentUpdateSchema,
  CommitmentConfirmWithValidation,
  InviteMemberSchema,
  EmailWelcomeSchema,
  AIFeedbackSchema,
} from './index';

describe('LoginSchema', () => {
  it('validates correct input', () => {
    const result = LoginSchema.safeParse({ email: 'test@example.com', password: '123456' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = LoginSchema.safeParse({ email: 'not-an-email', password: '123456' });
    expect(result.success).toBe(false);
  });

  it('rejects short password', () => {
    const result = LoginSchema.safeParse({ email: 'test@example.com', password: '123' });
    expect(result.success).toBe(false);
  });
});

describe('RegisterSchema', () => {
  it('validates matching passwords', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = RegisterSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
  });
});

describe('WorkspaceCreateSchema', () => {
  it('validates workspace name', () => {
    expect(WorkspaceCreateSchema.safeParse({ name: 'My Team' }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(WorkspaceCreateSchema.safeParse({ name: '' }).success).toBe(false);
  });

  it('trims whitespace', () => {
    const result = WorkspaceCreateSchema.safeParse({ name: '  My Team  ' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe('My Team');
  });
});

describe('MeetingUploadSchema', () => {
  it('validates with required fields', () => {
    const result = MeetingUploadSchema.safeParse({
      title: 'Sprint Planning',
      meeting_date: '2026-06-24',
      workspace_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing workspace_id', () => {
    const result = MeetingUploadSchema.safeParse({
      title: 'Sprint Planning',
      meeting_date: '2026-06-24',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid UUID', () => {
    const result = MeetingUploadSchema.safeParse({
      title: 'Sprint Planning',
      meeting_date: '2026-06-24',
      workspace_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('MeetingUpdateSchema', () => {
  it('accepts partial update', () => {
    const result = MeetingUpdateSchema.safeParse({ title: 'Updated Title' });
    expect(result.success).toBe(true);
  });

  it('accepts summary object', () => {
    const result = MeetingUpdateSchema.safeParse({
      summary: { bullets: ['Point 1', 'Point 2'], ai_confidence: 'high' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid confidence value', () => {
    const result = MeetingUpdateSchema.safeParse({
      summary: { bullets: [], ai_confidence: 'ultra' },
    });
    expect(result.success).toBe(false);
  });
});

describe('CommitmentCreateSchema', () => {
  it('validates with required fields', () => {
    const result = CommitmentCreateSchema.safeParse({
      meeting_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Review PR',
    });
    expect(result.success).toBe(true);
  });

  it('defaults priority to medium', () => {
    const result = CommitmentCreateSchema.safeParse({
      meeting_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Review PR',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe('medium');
  });
});

describe('CommitmentConfirmWithValidation', () => {
  it('accepts accept action without reason', () => {
    const result = CommitmentConfirmWithValidation.safeParse({ action: 'accept' });
    expect(result.success).toBe(true);
  });

  it('rejects reject without reason', () => {
    const result = CommitmentConfirmWithValidation.safeParse({ action: 'reject' });
    expect(result.success).toBe(false);
  });

  it('rejects reject with short reason', () => {
    const result = CommitmentConfirmWithValidation.safeParse({
      action: 'reject',
      reason: 'Nope',
    });
    expect(result.success).toBe(false);
  });

  it('accepts reject with valid reason', () => {
    const result = CommitmentConfirmWithValidation.safeParse({
      action: 'reject',
      reason: 'This is not my responsibility',
    });
    expect(result.success).toBe(true);
  });
});

describe('InviteMemberSchema', () => {
  it('validates email with default role', () => {
    const result = InviteMemberSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.role).toBe('member');
  });

  it('accepts admin role', () => {
    const result = InviteMemberSchema.safeParse({ email: 'admin@example.com', role: 'admin' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid role', () => {
    const result = InviteMemberSchema.safeParse({ email: 'user@example.com', role: 'superadmin' });
    expect(result.success).toBe(false);
  });
});

describe('EmailWelcomeSchema', () => {
  it('validates email only', () => {
    const result = EmailWelcomeSchema.safeParse({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('validates with displayName', () => {
    const result = EmailWelcomeSchema.safeParse({ email: 'user@example.com', displayName: 'John' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = EmailWelcomeSchema.safeParse({ email: 'bad' });
    expect(result.success).toBe(false);
  });
});

describe('AIFeedbackSchema', () => {
  it('validates thumbs up feedback', () => {
    const result = AIFeedbackSchema.safeParse({
      entity_type: 'commitment',
      entity_id: '550e8400-e29b-41d4-a716-446655440000',
      feedback: 'thumbs_up',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid feedback value', () => {
    const result = AIFeedbackSchema.safeParse({
      entity_type: 'commitment',
      entity_id: '550e8400-e29b-41d4-a716-446655440000',
      feedback: 'maybe',
    });
    expect(result.success).toBe(false);
  });
});
