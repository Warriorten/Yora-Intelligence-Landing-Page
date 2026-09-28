# Yora Health — Landing Page

Enterprise-first single-scroll marketing site for Yora Health.

**Stack:** Plain HTML + Tailwind CSS (CDN) + vanilla JS (no build step)

**Design direction:** Green / nature-inspired aesthetic. This landing page is the **source of truth** for visual language; `Yora-Intelligence-Admin` will be reskinned later to match.

## Preview

Open `index.html` in a browser, or:

```bash
cd ~/Projects/yora-landing-page
python3 -m http.server 8081
```

Then visit http://localhost:8081 (8080 is often used by Yora Intelligence Admin)

## Structure

```
index.html          # Full single-page site
css/styles.css      # Tokens, buttons, reveal, form, phone mockup
js/main.js          # Nav, smooth scroll, reveal, form validation
assets/favicon.svg
docs/               # Build specs & checklists
```

## Sections

1. Hero — Home
2. Differentiators
3. About Yora
4. Yora Intelligence (workflow + sample scores)
5. Enterprise Solutions
6. Yora Health App (Coming soon App Store)
7. Request a Demo (front-end form only)
8. Footer

## Docs

See [docs/07-implementation-order.md](docs/07-implementation-order.md) for the original build checklist.
