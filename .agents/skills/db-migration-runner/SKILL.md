# Skill: DB Migration Runner

**Purpose**: Create and apply a Supabase database migration.

**When to Use**: When schema changes are needed (new table, column, index, RLS policy).

**Steps**:
1. In `supabase/migrations/`, create a new file with timestamp prefix: `YYYYMMDDHHMMSS_description.sql`.
2. Write the migration using SQL (PostgreSQL dialect).
3. Include:
   - Table creation with proper constraints (PK, FK, checks).
   - Indexes on foreign keys and frequently queried columns.
   - Enable RLS on the new table.
   - Create RLS policies: `CREATE POLICY ... FOR SELECT USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()))`.
   - Apply similar policies for INSERT, UPDATE, DELETE based on role checks.
4. For functions/triggers, place them in the same migration or a separate one if complex.
5. After writing, instruct developer to run `npx supabase migration up` or through Supabase CLI.
6. Ensure the migration is reversible (add `DROP TABLE IF EXISTS` comment for down migration in development).

**Output**: The SQL migration content and instructions to apply.