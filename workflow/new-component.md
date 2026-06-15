# Workflow: New Component

Follow this checklist when creating a new UI component.

1. **Understand the requirement** – Review Figma/spec, confirm the component’s purpose, states (default, loading, empty, error, edge cases).
2. **Choose location**: `src/components/ui/` for generic, `src/features/[feature]/components/` for feature‑specific.
3. **Invoke skill**: Use `component-builder` skill to scaffold the file.
4. **Implement**:
   - Use Tailwind classes mapped to design tokens from the project’s `tokens.css`. Do **not** hardcode colors or spacings.
   - Add `className` prop to allow external styling.
   - If it receives data, define Zod schema for props validation (optional, but prefer TypeScript interfaces).
   - Implement all defined states (loading skeleton, empty state, error message).
   - Add `data-testid` for testing (optional but encouraged).
5. **Accessibility**:
   - Check contrast, focus rings.
   - Add `aria-` attributes for AI‑generated content as per design‑system.
6. **Review** against code‑style rules.
7. **Write a Storybook story** (if applicable) to document variations.