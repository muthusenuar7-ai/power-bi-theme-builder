# Reference Decision — Datacense Power BI Theme Studio

## Decision
Use the **Claude Design modular ZIP** as the primary UI/UX and code-behavior reference.
Use the **original long prompt** as the canonical product requirements and Power BI JSON rules.
Use the **older single HTML prototype** only as secondary fallback for extra chart/theme/export ideas.

## Reference priority
1. `docs/reference/claude-design/` — primary visual design and modular static implementation reference.
2. `docs/reference/original-prompt.md` — product requirements, target architecture, Power BI JSON rules, chart behavior rules.
3. `docs/reference/pbi-theme-studio-reference.html` — older single-file prototype; use only if a concept is missing in the Claude Design version.

## Why
The Claude Design ZIP is cleaner because it is already split into logical files:
- `src/state.js`
- `src/utils.js`
- `src/charts.js`
- `src/canvas.js`
- `src/sidebar.js`
- `src/rightpanel.js`
- `src/format-pane.js`
- `src/exports.js`
- `data/presets.js`
- `data/fonts.js`
- `styles.css`

It also includes Datacense branding assets, so it should drive the final look and feel.

## Important migration rule
Do **not** copy the vanilla JavaScript app directly into Next.js. Translate it into clean React + TypeScript modules.

