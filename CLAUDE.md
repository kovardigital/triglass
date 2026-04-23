# Triglass Productions — Site

## Local Development

- **Live Server** serves from `site/` (configured in `.vscode/settings.json`)
- Preview at `http://localhost:5503`
- `triglass.pages.dev` deploys manually via wrangler (see Deployment section)

## Version Switcher

The site uses an iframe-based version system for testing layout variations.

- `site/index.html` — shell page with a version dropdown (bottom-right corner)
- `site/v1/`, `site/v2/`, etc. — each version is a self-contained site with its own `index.html`, `css/`, `js/`, and `data/`
- `site/assets/` — shared images/videos across all versions (root-relative paths like `/assets/images/...`)

### Adding a new version

1. Copy an existing version folder: `cp -r site/v1 site/v3`
2. Update paths inside the new folder's files:
   - `index.html`: change `/v1/css/main.css` → `/v3/css/main.css`, same for JS
   - `js/main.js`: change `fetch('/v1/data/content.json')` → `fetch('/v3/data/content.json')`
3. Add an `<option>` to the `<select>` in `site/index.html`

### Dev tools (remove before production)

- **Font toggle** (`js/font-toggle.js`) — "Aa" button in nav, lets Ryan test fonts. Persists choice in localStorage.
- **Version switcher** — the iframe shell and dropdown. For production, serve one version's `index.html` directly.

## Deployment

- **Main site**: `wrangler pages deploy site --project-name=triglass --commit-dirty=true` → `triglass.pages.dev`
- **Liftoff site**: manual deploy via `wrangler pages deploy liftoff --project-name=triglass-liftoff --commit-dirty=true`

## Stack

- Static HTML/CSS/JS (no build step)
- Content driven by `data/content.json`
- Cloudflare Pages + R2 (video hosting) + Workers
- Videos hosted at `https://pub-aded304bac634530b24355595a6c406b.r2.dev/`
