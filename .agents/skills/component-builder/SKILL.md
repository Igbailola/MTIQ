# Skill: Component Builder

**Purpose**: Scaffold a new React/Shadcn component following MeetIQ conventions.

**When to Use**: When a developer says “Create a new component `X`” or similar.

**Steps**:
1. Determine component location: shared (`src/components/ui/`) or feature‑specific (`src/features/[feature]/components/`).
2. Create the file `ComponentName.tsx` with PascalCase.
3. Imports: React, any Shadcn primitives needed, Tailwind classes **using the design tokens from the project’s `tokens.css`** (mapped in Tailwind config).
4. Interface: Define `ComponentNameProps` with proper types.
5. Component code: Use `'use client'` only if interactive (state, effects, event handlers). Otherwise use server component.
6. Apply design tokens: colors, spacing, radius, shadows per `tokens.css`. Refer to `design-system.md` for usage patterns.
7. Add loading, empty, error states as described in design‑system.md if applicable.
8. Ensure accessibility: aria labels, focus rings, semantic HTML.
9. Include a brief comment explaining the component’s role.

**Output**: The component file content.