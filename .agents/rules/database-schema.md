---
trigger: always_on
---

# Database Schema (MeetIQ)

This is the initial schema for Supabase PostgreSQL. RLS policies are implied; write them in migrations.

## Tables

### workspaces
- `id` uuid PK (default gen_random_uuid())
- `name` text not null
- `created_at` timestamptz default now()
- `owner_id` uuid references auth.users (not null)

### workspace_members
- `workspace_id` uuid FK workspaces ON DELETE CASCADE
- `user_id` uuid FK auth.users
- `role` text not null default 'member' (check: 'admin' or 'member')
- `joined_at` timestamptz default now()
- PK (workspace_id, user_id)

### meetings
- `id` uuid PK
- `workspace_id` uuid FK workspaces ON DELETE CASCADE
- `title` text not null
- `meeting_date` date not null
- `file_path` text (Storage path, nullable if text only)
- `raw_text` text (the uploaded/pasted content)
- `status` text default 'processing' (processing, ready, error)
- `uploaded_by` uuid references auth.users
- `created_at` timestamptz default now()
- `updated_at` timestamptz

### decisions
- `id` uuid PK
- `meeting_id` uuid FK meetings ON DELETE CASCADE
- `content` text not null
- `ai_confidence` text (high/medium/low)
- `created_at` timestamptz default now()

### commitments
- `id` uuid PK
- `meeting_id` uuid FK meetings ON DELETE CASCADE
- `title` text not null
- `description` text
- `owner_id` uuid references auth.users (nullable until confirmed)
- `assigner_id` uuid references auth.users (the person who published the commitment)
- `status` text not null default 'pending_confirmation'
  (values: pending_confirmation, in_progress, blocked, completed, overdue)
- `priority` text default 'medium' (low, medium, high)
- `due_date` timestamptz
- `ai_confidence` text (high/medium/low)
- `ai_owner_suggestion` uuid (the AI‑suggested owner before confirmation)
- `confirmed_at` timestamptz
- `completed_at` timestamptz
- `created_at` timestamptz default now()
- `updated_at` timestamptz

### commitment_history
- `id` uuid PK
- `commitment_id` uuid FK commitments ON DELETE CASCADE
- `changed_by` uuid references auth.users
- `field_changed` text (status, owner, due_date, etc.)
- `old_value` text
- `new_value` text
- `changed_at` timestamptz default now()

### activity_feed
- `id` uuid PK
- `workspace_id` uuid FK workspaces ON DELETE CASCADE
- `actor_id` uuid references auth.users
- `action` text (e.g., 'commitment_created', 'commitment_confirmed', 'commitment_completed')
- `entity_type` text ('meeting', 'commitment')
- `entity_id` uuid (the id of the related entity)
- `details` jsonb (extra info like title, assignee)
- `created_at` timestamptz default now()

## Indexes
- `commitments(owner_id, status)`
- `meetings(workspace_id, meeting_date)`
- `activity_feed(workspace_id, created_at DESC)`

## RLS Guidelines
- `workspaces`: select only where user is in workspace_members; admin can update/delete.
- `meetings`, `decisions`, `commitments`: workspace‑scoped via `workspace_id`.
- `commitment_history`, `activity_feed`: visible to all workspace members.