---
trigger: always_on
---

# Code Style Rules (MeetIQ)

## TypeScript
- Strict mode enabled. Prefer interfaces for objects, types for unions/primitives.
- No `any` unless absolutely necessary (and commented).
- Use `zod` for runtime validation of API inputs and AI outputs.

## React / Next.js
- Use functional components with React 19 hooks. Server Components by default, client components only when needed (`'use client'`).
- File naming: `kebab-case.tsx` for components, `camelCase.ts` for utilities.
- One component per file (except small sub‑components).
- Use `shadcn/ui` primitives; custom components in `src/components/ui/`.

## Styling
- Tailwind CSS only. **Design tokens come from the token folder** – use the CSS variables defined in `tokens.css` (mapped in Tailwind config). Never hardcode color hex or spacing values.
- Follow the spacing scale derived from `var(--space-unit)` (8px grid).
- Examples: `bg-primary`, `text-accent`, `border-border`, `text-neutral`, `p-4`, `m-8`.
- If a token is missing, add it to the token source files, regenerate `tokens.css`, then use it.

## API Routes
- Located in `app/api/` with clear naming (e.g., `/api/meetings/upload`).
- Validate all inputs with Zod; return standardised errors `{ error: string, details? }`.
- Use Supabase server client (with service_role only where necessary, otherwise use user‑scoped client).

## Naming Conventions
- Components: PascalCase (`CommitmentCard.tsx`)
- Hooks: `use{Feature}` (`useCommitments`)
- Database tables: `snake_case` (`workspace_members`, `commitments`)
- Zod schemas: `{Entity}Schema` (`MeetingUploadSchema`)
- API routes: RESTful, nouns (e.g., `POST /api/meetings`, `PATCH /api/commitments/[id]`)

## Linting & Formatting
- Prettier default config, ESLint with Next.js & TypeScript recommended rules.
- Run `pnpm lint` before committing.