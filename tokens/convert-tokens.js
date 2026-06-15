#!/usr/bin/env node
/**
 * convert-tokens.js
 *
 * Converts MeetIQ design tokens from two JSON source files into a single
 * tokens.css file containing CSS custom properties.
 *
 * Sources (all inside the tokens/ folder alongside this script):
 *   - colour-tokens.json         → colour roles (light & dark) only; primitives
 *                                  are resolved internally but NOT emitted as vars.
 *   - design-tokens.tokens.json  → typography (font styles), grid, and effects.
 *
 * Output:
 *   - tokens/tokens.css
 *
 * Usage (run from project root or from inside tokens/):
 *   node tokens/convert-tokens.js
 */

const fs   = require('fs');
const path = require('path');

// ─── File paths ──────────────────────────────────────────────────────────────

const ROOT        = __dirname;                                        // tokens/
const COLOUR_FILE = path.join(ROOT, 'colour-tokens.json');
const DESIGN_FILE = path.join(ROOT, 'design-tokens.tokens.json');
const OUT_FILE    = path.join(ROOT, 'tokens.css');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert a camelCase or space-separated name to kebab-case CSS var name */
function toKebab(str) {
  return str
    .trim()
    // space-separated → hyphenate
    .replace(/\s+/g, '-')
    // camelCase → kebab-case
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase();
}

/** Parse a hex colour string (#RRGGBBAA or #RRGGBB) → rgba() string */
function hexToRgba(hex) {
  const h = hex.replace('#', '');
  if (h.length === 8) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    const a = (parseInt(h.slice(6, 8), 16) / 255).toFixed(3);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return hex; // passthrough if unrecognised
}

// ─── Section 1: Colour tokens ─────────────────────────────────────────────────

/**
 * Build a lookup map of all primitive palette values so that role references
 * like "{color.palette.primary.95}" can be resolved to their actual HSL value.
 *
 * Also patches missing palette stops that are referenced in dark-mode roles
 * but absent from the JSON (e.g. neutral.4, neutral.6, neutral.12 …).
 * Values are hand-derived by interpolating the surrounding steps.
 */
function buildPrimitiveLookup(colourData) {
  const lookup = {};

  function walk(obj, pathParts) {
    for (const [key, val] of Object.entries(obj)) {
      const currentPath = [...pathParts, key];
      if (typeof val === 'string') {
        lookup[currentPath.join('.')] = val;
      } else if (typeof val === 'object' && val !== null) {
        walk(val, currentPath);
      }
    }
  }

  // Index key colours and palette primitives
  walk(colourData.color.key,     ['color', 'key']);
  walk(colourData.color.palette, ['color', 'palette']);

  // ── Patch missing neutral stops used by dark-mode roles ──────────────────
  // Derived by linear interpolation between adjacent steps in the palette.
  const neutralPatches = {
    '4':  'hsl(231, 100%, 99%)',  // between 0 (black) and 10
    '6':  'hsl(220, 55%, 7%)',   // between 0 and 10
    '12': 'hsl(213, 35%, 13%)',  // between 10 and 20
    '17': 'hsl(213, 27%, 17%)',  // between 10 and 20
    '22': 'hsl(214, 29%, 21%)',  // between 20 and 30
    '24': 'hsl(214, 30%, 23%)',  // between 20 and 30
  };
  for (const [stop, hsl] of Object.entries(neutralPatches)) {
    lookup[`color.palette.neutral.${stop}`] = hsl;
  }

  // ── Alias lowercase 'error' → 'Error' (dark mode uses lowercase ref) ─────
  const errorPrefix = 'color.palette.Error.';
  for (const [k, v] of Object.entries(lookup)) {
    if (k.startsWith(errorPrefix)) {
      lookup[k.replace(errorPrefix, 'color.palette.error.')] = v;
    }
  }

  return lookup;
}

/** Resolve a token reference like "{color.palette.primary.95}" */
function resolveRef(ref, lookup) {
  const inner = ref.replace(/^\{/, '').replace(/\}$/, '');
  return lookup[inner] || ref; // fallback: return as-is
}

/**
 * Convert colour role tokens (light + dark) into CSS variable lines.
 * Only roles are emitted; primitives stay internal.
 */
function processColourRoles(colourData) {
  const lookup = buildPrimitiveLookup(colourData);
  const lines  = { light: [], dark: [] };

  for (const [mode, roles] of Object.entries(colourData.color.role)) {
    for (const [roleName, refOrValue] of Object.entries(roles)) {
      const varName = `--color-${toKebab(roleName)}`;
      let   value   = typeof refOrValue === 'string' && refOrValue.startsWith('{')
                        ? resolveRef(refOrValue, lookup)
                        : refOrValue;

      // Handle edge cases where the palette key doesn't exist (e.g. dark mode
      // references neutral.6, neutral.4 etc. which are not defined)
      if (typeof value === 'string' && value.startsWith('{')) {
        // Still unresolved – strip braces and emit a comment
        value = `/* unresolved: ${value} */`;
      }

      lines[mode].push(`  ${varName}: ${value};`);
    }
  }

  return lines;
}

// ─── Section 2: Typography tokens ────────────────────────────────────────────

/**
 * The font section uses custom-fontStyle objects with a nested `value` key.
 * We emit per-property CSS variables for each text style.
 *
 * Naming convention:
 *   --font-<group>-<style>-<property>
 *   e.g. --font-baseline-display-heading-font-size
 *
 * For compound styles (baseline-text / emphasized-text) we also emit
 * shorthand "composite" custom properties for convenience.
 */
function processTypography(designData) {
  const lines = [];

  const fontSection = designData.font || {};

  for (const [groupName, styles] of Object.entries(fontSection)) {
    const groupSlug = toKebab(groupName); // e.g. "baseline-text"
    lines.push(`  /* ── Typography: ${groupName} ── */`);

    for (const [styleName, tokenObj] of Object.entries(styles)) {
      const styleSlug = toKebab(styleName); // e.g. "display-heading"
      const prefix    = `--font-${groupSlug}-${styleSlug}`;
      const v         = tokenObj.value || {};

      if (v.fontSize   !== undefined) lines.push(`  ${prefix}-font-size: ${v.fontSize}px;`);
      if (v.fontFamily !== undefined) lines.push(`  ${prefix}-font-family: '${v.fontFamily}', sans-serif;`);
      if (v.fontWeight !== undefined) lines.push(`  ${prefix}-font-weight: ${v.fontWeight};`);
      if (v.fontStyle  !== undefined && v.fontStyle !== 'normal') {
        lines.push(`  ${prefix}-font-style: ${v.fontStyle};`);
      }
      if (v.letterSpacing !== undefined) lines.push(`  ${prefix}-letter-spacing: ${v.letterSpacing}px;`);
      if (v.lineHeight    !== undefined) lines.push(`  ${prefix}-line-height: ${v.lineHeight}px;`);
      if (v.textDecoration && v.textDecoration !== 'none') {
        lines.push(`  ${prefix}-text-decoration: ${v.textDecoration};`);
      }
      if (v.textCase && v.textCase !== 'none') {
        lines.push(`  ${prefix}-text-transform: ${v.textCase};`);
      }

      lines.push('');
    }
  }

  return lines;
}

/**
 * The typography section mirrors font but with individual dimension/string
 * typed tokens. We emit a flattened set of CSS variables from this too,
 * named --typography-<group>-<style>-<property>.
 *
 * This gives consumers a clean, predictable API:
 *   font-size: var(--typography-baseline-text-display-heading-font-size);
 */
function processTypographySection(designData) {
  const lines = [];
  const typoSection = designData.typography || {};

  for (const [groupName, styles] of Object.entries(typoSection)) {
    const groupSlug = toKebab(groupName);
    lines.push(`  /* ── Typography Scale: ${groupName} ── */`);

    for (const [styleName, props] of Object.entries(styles)) {
      const styleSlug = toKebab(styleName);
      const prefix    = `--typography-${groupSlug}-${styleSlug}`;

      for (const [propName, tokenObj] of Object.entries(props)) {
        if (!tokenObj || typeof tokenObj !== 'object') continue;
        const propSlug = toKebab(propName);
        let   val      = tokenObj.value;

        if (val === undefined || val === null) continue;

        // Units for dimension types
        if (tokenObj.type === 'dimension' && typeof val === 'number') {
          // font-size, lineHeight → px; letterSpacing → px
          val = `${val}px`;
        }

        // Skip trivial/default values to keep output lean
        if (val === 'normal' || val === 0 || val === '0px' || val === 'none') continue;

        lines.push(`  ${prefix}-${propSlug}: ${val};`);
      }

      lines.push('');
    }
  }

  return lines;
}

// ─── Section 3: Grid tokens ───────────────────────────────────────────────────

function processGrid(designData) {
  const lines = [];
  const grids = designData.grid || {};

  lines.push('  /* ── Grid ── */');

  for (const [gridName, tokenObj] of Object.entries(grids)) {
    const slug   = toKebab(gridName);
    const prefix = `--grid-${slug}`;
    const v      = tokenObj.value || {};

    if (v.count      !== undefined) lines.push(`  ${prefix}-columns: ${v.count};`);
    if (v.gutterSize !== undefined) lines.push(`  ${prefix}-gutter: ${v.gutterSize}px;`);
    if (v.offset     !== undefined) lines.push(`  ${prefix}-margin: ${v.offset}px;`);
    if (v.pattern    !== undefined) lines.push(`  ${prefix}-pattern: ${v.pattern};`);
    if (v.alignment  !== undefined) lines.push(`  ${prefix}-alignment: ${v.alignment};`);

    lines.push('');
  }

  return lines;
}

// ─── Section 4: Effect (Shadow) tokens ───────────────────────────────────────

function processEffects(designData) {
  const lines = [];
  const effects = designData.effect || {};

  lines.push('  /* ── Shadows ── */');

  for (const [effectName, tokenObj] of Object.entries(effects)) {
    const slug   = toKebab(effectName);
    const prefix = `--${slug}`;
    const v      = tokenObj.value || {};

    const color  = v.color ? hexToRgba(v.color) : 'rgba(0,0,0,0.08)';
    const x      = v.offsetX  ?? 0;
    const y      = v.offsetY  ?? 0;
    const blur   = v.radius   ?? 0;
    const spread = v.spread   ?? 0;

    lines.push(`  ${prefix}: ${x}px ${y}px ${blur}px ${spread}px ${color};`);
  }

  lines.push('');
  return lines;
}

// ─── Section 5: AI-specific tokens (MeetIQ-specific additions) ───────────────

function aiTokens() {
  return [
    '  /* ── AI Content Tokens (MeetIQ-specific) ── */',
    '  --color-ai-bg: hsl(214, 100%, 97%);',
    '  --color-ai-border: hsl(217, 91%, 80%);',
    '  --color-ai-label: hsl(222, 47%, 30%);',
    '',
  ];
}

// ─── Section 6: Font family convenience tokens ────────────────────────────────

function fontFamilyTokens() {
  return [
    '  /* ── Font Families ── */',
    "  --font-heading: 'Geist', system-ui, sans-serif;",
    "  --font-body: 'Inter', system-ui, sans-serif;",
    '',
  ];
}

// ─── Section 7: Spacing scale (8px grid) ────────────────────────────────────

function spacingTokens() {
  const lines = ['  /* ── Spacing (8px grid) ── */'];
  const scale = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32];
  for (const step of scale) {
    const px      = step * 8;
    const varName = `--space-${String(step).replace('.', '_')}`;
    lines.push(`  ${varName}: ${px}px;`);
  }
  lines.push('');
  return lines;
}

// ─── Section 8: Border radius tokens ────────────────────────────────────────

function radiusTokens() {
  return [
    '  /* ── Border Radius ── */',
    '  --radius-none: 0px;',
    '  --radius-sm: 4px;',
    '  --radius-md: 8px;',
    '  --radius-lg: 12px;',
    '  --radius-xl: 16px;',
    '  --radius-2xl: 24px;',
    '  --radius-full: 9999px;',
    '',
  ];
}

// ─── Build & write CSS ────────────────────────────────────────────────────────

function build() {
  console.log('🔄  Reading token source files…');

  const colourData  = JSON.parse(fs.readFileSync(COLOUR_FILE,  'utf-8'));
  const designData  = JSON.parse(fs.readFileSync(DESIGN_FILE,  'utf-8'));

  console.log('✅  Parsed both JSON files successfully.');

  const colourRoles = processColourRoles(colourData);
  const typoLines   = processTypography(designData);
  const typoScale   = processTypographySection(designData);
  const gridLines   = processGrid(designData);
  const effectLines = processEffects(designData);

  // ── Assemble CSS output ───────────────────────────────────────────────────

  const banner = `/*
 * tokens.css — MeetIQ Design System Tokens
 *
 * AUTO-GENERATED by convert-tokens.js
 * Do NOT edit by hand. Re-run \`node convert-tokens.js\` to regenerate.
 *
 * Sources:
 *   - colour-tokens.json         (colour roles & palette)
 *   - design-tokens.tokens.json  (typography, grid, effects)
 *
 * Colour strategy:
 *   Only colour ROLES are exposed as CSS variables. Primitives are resolved
 *   internally and their values are embedded in the role variables.
 *   Light-mode roles live on :root; dark-mode roles override them on
 *   [data-theme="dark"] or via the @media prefers-color-scheme: dark block.
 */

`;

  const lightVars  = colourRoles.light;
  const darkVars   = colourRoles.dark;

  const cssChunks = [
    banner,

    ':root {',
    '  /* ── Colour Roles: Light Mode ── */',
    ...lightVars,
    '',
    ...fontFamilyTokens(),
    ...aiTokens(),
    ...spacingTokens(),
    ...radiusTokens(),
    ...gridLines,
    ...effectLines,
    ...typoLines,
    ...typoScale,
    '}',
    '',

    '/* Dark-mode colour role overrides */',
    '[data-theme="dark"],',
    '.dark {',
    '  /* ── Colour Roles: Dark Mode ── */',
    ...darkVars,
    '}',
    '',

    '@media (prefers-color-scheme: dark) {',
    '  :root:not([data-theme="light"]) {',
    '    /* ── Colour Roles: Dark Mode (system preference) ── */',
    ...darkVars.map(l => '  ' + l),
    '  }',
    '}',
    '',
  ];

  const cssOutput = cssChunks.join('\n');

  // tokens/ folder already exists (this script lives there)
  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, cssOutput, 'utf-8');

  const lineCount = cssOutput.split('\n').length;
  console.log(`\n🎨  tokens.css generated at: ${OUT_FILE}`);
  console.log(`    ${lineCount} lines written.`);
  console.log('\nSummary of sections emitted:');
  console.log(`  ✓  Colour roles (light) — ${colourRoles.light.length} variables`);
  console.log(`  ✓  Colour roles (dark)  — ${colourRoles.dark.length} variables`);
  console.log(`  ✓  Font families         — 2 variables`);
  console.log(`  ✓  AI content tokens     — 3 variables`);
  console.log(`  ✓  Spacing scale         — 23 variables`);
  console.log(`  ✓  Border radius         — 7 variables`);
  console.log(`  ✓  Grid tokens           — from ${Object.keys(designData.grid || {}).length} grid definitions`);
  console.log(`  ✓  Shadow effects        — from ${Object.keys(designData.effect || {}).length} effect definitions`);
  console.log(`  ✓  Font styles (font.*)     — ${Object.values(designData.font || {}).reduce((a, g) => a + Object.keys(g).length, 0)} text styles`);
  console.log(`  ✓  Typography scale (typography.*) — included`);
}

build();
