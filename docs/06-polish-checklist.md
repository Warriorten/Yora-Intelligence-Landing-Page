# 06 — Polish Checklist

## Responsive

- [ ] Mobile-first breakpoints; nav collapses cleanly
- [ ] Hero readable on small screens; CTAs stack
- [ ] Workflow steps stack vertically on mobile
- [ ] Form fields full-width on mobile
- [ ] No horizontal scroll at 320–1440px

## Accessibility

- [ ] Semantic landmarks: `header`, `nav`, `main`, `footer`, section headings
- [ ] Skip link to `#main`
- [ ] Alt text on meaningful images; decorative images `alt=""`
- [ ] Color contrast AA for text on green / yellow
- [ ] Visible `:focus-visible` rings
- [ ] Keyboard: tab through nav, form, CTAs; Escape closes menu
- [ ] Form errors announced (aria-live or linked `aria-describedby`)
- [ ] `prefers-reduced-motion` respected

## SEO / meta

- [ ] `<title>` e.g. `Yora Health — Supplement Intelligence`
- [ ] Meta description with overriding message
- [ ] Open Graph title/description/image placeholders
- [ ] Favicon (`assets/favicon.svg`)
- [ ] Canonical optional for single page

## Performance

- [ ] Optimize hero images (or CSS fallback)
- [ ] Defer `main.js` or place at end of body
- [ ] Fonts with `display=swap`

## Content accuracy

- [ ] No implied enterprise clients
- [ ] V4.0 vs planned note present
- [ ] Evidence-unavailable wording correct
- [ ] App Store Coming soon
- [ ] Demo form honesty about backend

## Browser

- [ ] Smoke-test latest Chrome, Safari, Firefox
- [ ] iOS Safari mobile nav

## Analytics (later)

Document only: measure traffic sources, demo-section visits, form attempts, conversions when backend exists.
