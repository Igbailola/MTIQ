---
trigger: always_on
---

# Security Rules (MeetIQ)

## Authentication
- All auth via Supabase Auth. Never roll your own.
- Server‑side middleware checks session on protected routes; redirect to `/login` if not authenticated.
- API routes must validate the user session (using Supabase server client with `getUser()`).

## Authorization
- Row Level Security (RLS) on **every** table. Users can only access rows belonging to their workspace.
- Workspace roles (admin/member) enforced via RLS policies and server‑side checks.
- Admin‑only actions (invite, delete workspace) must check `workspace_members.role = 'admin'`.

## AI Processing
- OpenAI API key stored **only** in Supabase Edge Functions (secrets management).
- Never send the key to the frontend.
- User‑uploaded content sent to OpenAI must not contain personally identifiable information (PII) beyond what’s necessary; consider a scrub function if needed in the future.

## Data Handling
- Meeting files stored in Supabase Storage buckets (private). Generate signed URLs for access (or use server‑side download).
- Database encryption at rest provided by Supabase.
- Sanitize all user inputs (file content, text pastes) before processing or storing. Use Zod schemas with `.trim()` and `.max()`.
- Rate‑limiting on API routes (e.g., max 10 uploads per minute per user) using `@upstash/ratelimit` or similar.

## Environment Variables
- All secrets (API keys, DB URLs) in `.env.local` for local dev; Vercel environment variables for production.
- Frontend only exposed to `NEXT_PUBLIC_*` variables; Supabase anon key is fine.