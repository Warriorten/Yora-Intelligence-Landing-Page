# 07 — Implementation Order

Work top-to-bottom. Check off as you go. Do **not** edit the Cursor plan file; use this checklist instead.

## Phase 1 — Scaffold

- [ ] Ensure `~/Projects/yora-landing-page` exists with `css/`, `js/`, `assets/`
- [ ] Init git if needed
- [ ] Move Cursor workspace root into the project when MCP works
- [ ] Add `README.md` (done if docs package present)

## Phase 2 — Base shell

- [ ] `index.html` doctype, meta, Tailwind CDN + brand config, fonts, `styles.css`
- [ ] `css/styles.css`: CSS variables, `.btn-*`, `.reveal`, focus, scroll-margin
- [ ] `js/main.js` empty IIFE / DOMContentLoaded skeleton
- [ ] Favicon placeholder

## Phase 3 — Chrome

- [ ] Sticky header + desktop nav + Request a Demo CTA
- [ ] Mobile hamburger + panel
- [ ] Footer (can stub early, finish late)

## Phase 4 — Content sections (in order)

- [ ] Hero `#home`
- [ ] Differentiator cards
- [ ] About `#about` (approved copy + score callout)
- [ ] Intelligence `#intelligence` (4 stages + product card + V4.0 note)
- [ ] Solutions `#solutions` (4 cards)
- [ ] App `#app` (mockup + Coming soon store badge)
- [ ] Demo `#demo` (full form + privacy + marketing consent)

## Phase 5 — Behavior

- [ ] Mobile nav JS
- [ ] Smooth scroll + header offset
- [ ] Scroll reveal
- [ ] Form validation + honeypot + submit UX

## Phase 6 — Polish

- [ ] Run through [06-polish-checklist.md](06-polish-checklist.md)
- [ ] Visual pass against green/nature example (not NutriMind branding)
- [ ] Confirm every enterprise section links to `#demo`

## Done when

All Phase 1–6 boxes checked, site opens from `index.html` without a build step, and docs match the shipped HTML.

---

## Note on tooling hangs

If `create_project` / `move_agent_to_root` / shell hang in Cursor:

1. Create folders manually or via Terminal.app
2. Open the folder as the Cursor workspace
3. Implement HTML/CSS/JS from these docs

These markdown files are the complete build spec so work can continue without the hanging MCP step.
