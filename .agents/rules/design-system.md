---
trigger: always_on
---

# Design System Rules (MeetIQ)

These rules ensure visual consistency. **The source of truth for design tokens is the token folder**:  
- `colour-tokens` / `design-tokens.tokens` (raw token definitions)  
- `convert-tokens.js` (generates CSS custom properties)  
- `tokens.css` (CSS variables available globally)  

**Always use the CSS variables defined in `tokens.css` for colors, spacing, typography, etc.**  
The MeetIQ Design Direction document provides the conceptual palette, but implementation must reference the token files.

## Core Visual Tokens (derived from the token folder)
- **Colors**: Use `var(--color-primary)`, `var(--color-accent)`, `var(--color-secondary)`, `var(--color-neutral)`, `var(--color-border)`, `var(--color-success)`, `var(--color-warning)`, `var(--color-error)`, `var(--color-info)`.  
  AI‑specific tokens: `var(--color-ai-bg)`, `var(--color-ai-border)`, `var(--color-ai-label)`.
- **Typography**: Font families `var(--font-heading)` (Geist) and `var(--font-body)` (Inter).  
  Sizes: `var(--text-h1)`, `var(--text-h2)`, etc., or Tailwind classes configured to use these variables.
- **Spacing**: Based on `var(--space-unit)` (8px). Use Tailwind’s spacing scale that maps to these variables (e.g., `p-4` = 16px).
- **Border Radius**: `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`, `var(--radius-xl)`, `var(--radius-full)`.
- **Shadows**: `var(--shadow-xs)`, `var(--shadow-sm)`, `var(--shadow-md)`, `var(--shadow-lg)`.

## UI Patterns
- **Cards**: White background, border `var(--color-border)`, `border-radius: var(--radius-md)`, padding `var(--space-6)` (24px).
- **AI Content**: Background `var(--color-ai-bg)`, border `var(--color-ai-border)`. Include “AI Generated” label (uppercase, Inter 500, 11px, `var(--color-ai-label)`) and confidence badge (colored chip).
- **Commitment Cards**: Full width; display owner avatar, due date, status chip, AI confidence badge when applicable.
- **Status Chips**: Pill shape (`rounded-full`), `font-xs`, font-medium. Colors: Pending (neutral), In Progress (accent), Blocked (warning), Completed (success), Overdue (error).
- **Loading**: Skeleton components using `bg-secondary animate-pulse`.
- **Empty States**: Simple illustration + heading + description + CTA button.
- **Error States**: Inline error text + red border on inputs; toasts for transient errors.

## Accessibility
- Focus ring: `ring-2 ring-accent ring-offset-2` (ensure these ring colors use token variables).
- AI sections: `aria-label` attributes describing content type and confidence level.
- All color combinations must meet WCAG 2.1 AA contrast minimums.

## Usage
In Tailwind, configure the theme to use these CSS variables. For example:
```js
// tailwind.config.js
theme: {
  colors: {
    primary: 'var(--color-primary)',
    accent: 'var(--color-accent)',
    // ... map all tokens
  }
}