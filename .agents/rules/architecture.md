---
trigger: always_on
---

# Architecture Rules (MeetIQ)

## System Overview
- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript + Tailwind CSS + Shadcn UI.
- **State Management**: TanStack Query for server state; React Hook Form + Zod for forms.
- **Backend**: Next.js API routes (Edge) + Supabase Edge Functions for heavy/long‑running AI tasks.
- **Database**: PostgreSQL (Supabase). Row Level Security enforced on all tables.
- **Auth**: Supabase Auth (email/password, session management).
- **Storage**: Supabase Storage for uploaded meeting files.
- **Realtime**: Supabase Realtime for dashboard activity feeds (commitment changes).
- **AI**: OpenAI GPT‑4 (or GPT‑3.5) via Supabase Edge Functions (secure API key handling).

## Project Structure
src/
app/ # App router pages & layouts
components/ # Shared UI components (Shadcn + custom)
features/ # Feature‑specific logic (meetings, commitments, workspaces)
hooks/ # Custom hooks
lib/ # Utility functions, API clients, Supabase client, Zod schemas
styles/ # Global styles, Tailwind config
types/ # TypeScript types & interfaces
supabase/
migrations/ # Database migrations
functions/ # Edge Functions (e.g., ai-processor)

text

## Routing
- Public: `/login`, `/register`, `/forgot-password`
- App (protected): `/dashboard`, `/meetings/[id]`, `/commitments/[id]`, `/workspace/settings`
- Use middleware for auth checks on `/app/*` routes.

## Data Flow
1. User uploads meeting text → API route validates & stores file in Storage → calls Edge Function.
2. Edge Function sends text to OpenAI, receives structured JSON (summary, decisions, commitments, owners, deadlines, confidence).
3. Edge Function writes results to PostgreSQL (meetings, commitments, decisions tables) and returns to frontend.
4. Frontend displays AI output with confidence badges. User confirms/publishes → owners get notification (DB change + Realtime broadcast).
5. Commitment confirmations/status changes update DB → Realtime pushes to dashboard activity feed.

## Important Constraints
- All AI calls must go through Edge Functions (never expose API key in client).
- Every DB operation must pass RLS checks; use server‑side API routes or Edge Functions with service‑role only where necessary.
- Meeting files stored privately; file URLs must be signed or accessed via server‑side logic.
- AI outputs must be editable by users before “publishing”; a `published` boolean flag separates drafts from active commitments.