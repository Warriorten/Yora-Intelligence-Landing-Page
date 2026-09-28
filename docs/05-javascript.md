# 05 — JavaScript (`js/main.js`)

## Responsibilities

1. Mobile navigation toggle
2. Smooth scroll for in-page anchors (respect reduced motion)
3. Sticky header scrolled state (optional class)
4. Scroll-reveal for `.reveal` elements
5. Demo form validation + honeypot + non-backend submit UX
6. Close mobile menu on link click / Escape

## Mobile nav

```js
// Pseudocode
const btn = document.querySelector('[data-nav-toggle]');
const panel = document.querySelector('[data-nav-panel]');
btn.addEventListener('click', () => {
  const open = panel.classList.toggle('is-open');
  btn.setAttribute('aria-expanded', String(open));
});
```

- Trap focus lightly or at least return focus on close
- Lock body scroll while open (optional)

## Smooth scroll

- Intercept clicks on `a[href^="#"]`
- `element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' })`
- Offset for sticky header height (`scroll-margin-top` on sections is often enough via CSS)

## Scroll reveal

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) e.target.classList.add('is-visible');
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
```

Skip if `prefers-reduced-motion: reduce` — add `is-visible` immediately.

## Form validation

Required: name, business email, company.

Checks:
- Non-empty trimmed strings
- Email regex reasonable for UX (not RFC-perfect)
- If honeypot filled → silently ignore / fake success (spam)

On valid submit without backend:
- `event.preventDefault()`
- Show inline success: e.g. “Thanks — this demo form is not connected yet. We’ll wire a secure backend before launch.”
- Or: “Thanks for your interest. A team member will follow up.” + note that live capture is pending — pick one consistent message and keep it honest.

Marketing consent: optional; must not block submit.

Industry select: optional.

## Accessibility helpers

- Escape closes mobile nav
- Visible focus styles live in CSS; don’t remove outlines in JS

## What not to add

- Analytics libraries (document in polish checklist for later)
- Real email APIs / Formspree unless explicitly requested later
- Heavy animation libraries
