# 03 — File Structure

```
yora-landing-page/
├── README.md
├── index.html              # Entire single-page site
├── css/
│   └── styles.css          # Tokens extras, buttons, reveal, focus
├── js/
│   └── main.js             # Nav, smooth scroll, reveal, form
├── assets/
│   ├── favicon.svg         # Simple YORA mark
│   ├── hero.jpg            # Nature / wellness hero (or CSS gradient fallback)
│   ├── product-sample.jpg  # Optional illustrative product image
│   ├── phone-mockup.png    # Consumer app presentation
│   └── app-store-badge.svg # Badge graphic (disabled state in HTML)
└── docs/
    ├── 00-overview.md
    ├── 01-setup.md
    ├── 02-design-system.md
    ├── 03-file-structure.md
    ├── 04-sections.md
    ├── 05-javascript.md
    ├── 06-polish-checklist.md
    └── 07-implementation-order.md
```

## `index.html` outline

```html
<!DOCTYPE html>
<html lang="en">
<head> … meta, Tailwind, fonts, styles … </head>
<body class="bg-yora-surface text-yora-ink font-sans antialiased">
  <a href="#main" class="sr-only focus:not-sr-only">Skip to content</a>
  <header>… sticky nav …</header>
  <main id="main">
    <section id="home">…</section>
    <section>… differentiators …</section>
    <section id="about">…</section>
    <section id="intelligence">…</section>
    <section id="solutions">…</section>
    <section id="app">…</section>
    <section id="demo">…</section>
  </main>
  <footer>…</footer>
  <script src="js/main.js"></script>
</body>
</html>
```

## Asset notes

- If photos are unavailable, use CSS gradients + abstract leaf SVG shapes so the page still looks intentional.
- Do not ship NutriMind logos or branded copy from the example image.
- Prefer SVG for icons (inline or sprite).
