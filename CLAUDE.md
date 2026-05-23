# CLAUDE.md

You are working on the Datacense Power BI Theme Studio project.

Always read `AGENTS.md` and `REFERENCE_DECISION.md` first.

## Reference priority
1. Claude Design modular static app in `docs/reference/claude-design/` is the primary UI and behavior reference.
2. `docs/reference/original-prompt.md` is the canonical product requirement and Power BI theme JSON spec.
3. `docs/reference/pbi-theme-studio-reference.html` is the older single-file prototype and should only be used as a secondary fallback.

## How to work
- Work in small phases.
- Before editing, briefly explain the phase plan.
- After editing, run the relevant check, especially `npm run build`.
- Do not create placeholder components.
- Do not paste the full HTML or vanilla JS prototype directly into a React component.
- Translate static JS modules into typed React, Zustand, and utility files.
- Extract reusable constants, chart components, and utilities.

## Important reference files
- `REFERENCE_DECISION.md`
- `docs/reference/claude-design/Datacense Power BI Theme Studio.html`
- `docs/reference/claude-design/styles.css`
- `docs/reference/claude-design/src/state.js`
- `docs/reference/claude-design/src/utils.js`
- `docs/reference/claude-design/src/charts.js`
- `docs/reference/claude-design/src/canvas.js`
- `docs/reference/claude-design/src/sidebar.js`
- `docs/reference/claude-design/src/rightpanel.js`
- `docs/reference/claude-design/src/format-pane.js`
- `docs/reference/claude-design/src/exports.js`
- `docs/reference/claude-design/data/presets.js`
- `docs/reference/claude-design/data/fonts.js`
- `docs/reference/original-prompt.md`
- `docs/reference/pbi-theme-studio-reference.html`

## Main risks to avoid
- Invalid Power BI theme JSON.
- Plain string colors inside `visualStyles`.
- Unsupported `textClasses` keys.
- Giant single-file React implementation.
- Breaking color reactivity.
- Recreating the old HTML as unmaintainable code.
- Losing the Datacense brand assets/style from Claude Design.

## Recommended workflow
Use the project skills:
- `/pbi-bootstrap`
- `/pbi-migrate-core`
- `/pbi-build-canvas`
- `/pbi-migrate-charts`
- `/pbi-theme-json`
- `/pbi-qa`
