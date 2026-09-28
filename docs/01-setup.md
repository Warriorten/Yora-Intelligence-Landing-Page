# 01 — Setup

## Goal

Bootstrap `~/Projects/yora-landing-page` as a plain static site with git.

## Steps

1. Create directory:
   ```bash
   mkdir -p ~/Projects/yora-landing-page/{css,js,assets}
   cd ~/Projects/yora-landing-page
   ```

2. Initialize git (if not already):
   ```bash
   git init
   ```

3. In Cursor: move the agent workspace root to this folder (`move_agent_to_root`) **before** substantive coding, if that MCP step works in your session.

4. Create empty placeholders:
   - `index.html`
   - `css/styles.css`
   - `js/main.js`
   - `assets/.gitkeep`

5. Optional local preview:
   ```bash
   # Python
   python3 -m http.server 8080
   # or npx
   npx serve .
   ```

## Stack choices (locked)

| Choice | Value |
|--------|-------|
| Markup | Single `index.html` |
| CSS | Tailwind via CDN + `css/styles.css` |
| JS | Vanilla `js/main.js` |
| Build | None |
| Package manager | None |

## Tailwind CDN setup (in `index.html` `<head>`)

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = {
    theme: {
      extend: {
        colors: {
          /* see docs/02-design-system.md */
        },
        fontFamily: {
          display: ['Sora', 'system-ui', 'sans-serif'],
          sans: ['Inter', 'system-ui', 'sans-serif'],
        },
        borderRadius: {
          card: '1rem', /* ~16px */
        },
        boxShadow: {
          card: '0 4px 24px rgba(15, 40, 30, 0.06)',
        },
      },
    },
  };
</script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Sora:wght@500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="css/styles.css" />
```

## Acceptance

- [ ] Folder exists at `~/Projects/yora-landing-page`
- [ ] Git repo initialized
- [ ] `css/`, `js/`, `assets/` present
- [ ] Opening `index.html` loads Tailwind + fonts without console errors
