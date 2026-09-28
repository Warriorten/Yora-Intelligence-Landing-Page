# 02 — Design System

Source of truth for the landing page **and** the future Admin reskin. Capture tokens in Tailwind config + `css/styles.css`.

## Color palette (derived from example)

| Token | Suggested hex | Usage |
|-------|---------------|--------|
| `yora-forest` | `#1B4332` | Primary CTAs, headings accents, active chart |
| `yora-green` | `#2D6A4F` | Secondary green, links, score accents |
| `yora-mint` | `#D8F3DC` | Soft highlights, active nav pills, tags |
| `yora-yellow` | `#F4C430` | Accent buttons (Search-style), decorative accents |
| `yora-yellow-dark` | `#D4A017` | Hover on yellow buttons |
| `yora-surface` | `#F7F8F6` | Page background (off-white / soft grey-green) |
| `yora-card` | `#FFFFFF` | Cards |
| `yora-ink` | `#1A1F1C` | Primary text |
| `yora-muted` | `#5C6B63` | Secondary body text |
| `yora-border` | `#E4E9E5` | Borders, dividers |
| `yora-coral` | `#E07A5F` | Negative / caution only (sentiment legend) |

### Tailwind extend example

```js
colors: {
  yora: {
    forest: '#1B4332',
    green: '#2D6A4F',
    mint: '#D8F3DC',
    yellow: '#F4C430',
    'yellow-dark': '#D4A017',
    surface: '#F7F8F6',
    card: '#FFFFFF',
    ink: '#1A1F1C',
    muted: '#5C6B63',
    border: '#E4E9E5',
    coral: '#E07A5F',
  },
}
```

## Typography

| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / H1–H2 | Sora | 600–700 | Strong, modern enterprise |
| Body / UI | Inter | 400–600 | Clean, readable |
| Eyebrow / labels | Inter | 600 | Uppercase, tracking-wide, small size |

Hierarchy:
- H1: ~40–56px desktop, ~32px mobile
- H2: ~32–40px
- Body: 16–18px, `text-yora-muted` for secondary
- Do **not** default to Inter-only for display if Sora is available (plan allows Sora + Inter)

## Layout primitives

- Max content width: `max-w-6xl` or `max-w-7xl` centered with `px-4 sm:px-6 lg:px-8`
- Section vertical rhythm: `py-16 md:py-24`
- Card radius: `rounded-2xl` (~16px)
- Soft shadow: `shadow-card`
- Generous whitespace; avoid dense retail layouts

## Components to define in CSS / utility patterns

### Buttons

| Class / pattern | Look |
|-----------------|------|
| `.btn-primary` | `bg-yora-forest text-white`, rounded-full or rounded-xl, hover darken |
| `.btn-accent` | `bg-yora-yellow text-yora-ink`, bold (Search-style) |
| `.btn-ghost` | Text + arrow, green underline on hover |

### Cards

- White background, `rounded-2xl`, `shadow-card`, optional `border border-yora-border`
- Hover: slight lift (`translate-y`) + stronger shadow (subtle)

### Score visualization (illustrative)

- Product Score ring / bar: forest green
- Verification Score: mint / green secondary
- Labels: “Product Score — Formulation quality”, “Verification Score — Supporting evidence”

### Tags

- Small green pill: `bg-yora-mint text-yora-forest text-xs font-semibold uppercase tracking-wide`

## Motion

In `css/styles.css`:

- `.reveal` — opacity 0 + translateY(16px); `.reveal.is-visible` — animate in
- Prefer `prefers-reduced-motion: reduce` to disable
- 2–3 intentional motions only (nav sticky feel, scroll-reveal, button hover) — not noisy

## Logo placeholder

- SVG or text wordmark: **YORA**
- Optional small leaf/tree mark in yellow/green (inspired by example, not NutriMind branding)
- Tagline optional under logo in sidebar-style contexts only; on marketing site use compact wordmark in header

## Shared with Admin (later)

Document these for reuse when reskinning Admin:

- Brand colors + typography
- Product analysis card layout (preview here / full there)
- Score visualization styling
- Input→output workflow graphic vocabulary
