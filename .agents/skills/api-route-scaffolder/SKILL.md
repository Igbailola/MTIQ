# Skill: API Route Scaffolder

**Purpose**: Create a new Next.js API route with proper validation, auth, and error handling.

**When to Use**: When a developer requests “Create an API route for …”.

**Steps**:
1. Determine route path: `app/api/.../route.ts` (RESTful naming).
2. If the route is protected, start with Supabase server client validation:
   - Import `createRouteHandlerClient` from `@supabase/auth-helpers-nextjs`, cookies.
   - Get user session; if missing, return 401.
3. Define Zod schema for request body/params.
4. In the handler (GET/POST/PATCH/DELETE):
   - Parse request.
   - Validate with Zod. If error, return 400 `{ error: "Validation failed", details }`.
   - Execute database operations using Supabase (service_role only if necessary, otherwise user‑scoped client).
   - Wrap in try/catch; return 500 with generic error if unexpected.
   - Return 200/201 with relevant data.
5. Apply RLS‑friendly queries: always scope to `workspace_id` from user context.
6. Rate‑limiting: consider adding a simple in‑memory or Upstash rate limit for sensitive operations (upload, AI trigger).

**Output**: The full `route.ts` file content.