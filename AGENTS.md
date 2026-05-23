# AGENTS.md

## Project
Datacense Power BI Theme Studio is a Next.js + TypeScript web application for designing, previewing, validating, importing, and exporting Microsoft Power BI-compatible JSON theme files.

## Reference decision
Use these references in this priority order:
1. `docs/reference/claude-design/` — primary UI/UX, styling, branding assets, and modular behavior reference.
2. `docs/reference/original-prompt.md` — canonical product requirements, architecture, and Power BI theme JSON rules.
3. `docs/reference/pbi-theme-studio-reference.html` — secondary older prototype only for fallback ideas.

Read `REFERENCE_DECISION.md` before implementation.

## Core product goals
- Convert the static Claude Design prototype into a modular production-ready Next.js app.
- Preserve the Datacense branding, clean studio layout, dashboard canvas, sidebars, and right-panel preview experience.
- Use the detailed prompt as the product and validation spec.
- Export valid Power BI theme JSON.
- Keep UI professional, Power BI-user friendly, and maintainable.

## Tech stack
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- CSS custom properties
- Zustand
- shadcn/ui
- lucide-react
- Vercel deployment target

## Critical Power BI theme JSON rules
- `textClasses` may only contain: `callout`, `title`, `header`, `label`.
- Every visualStyles color must use:
  `{ "solid": { "color": "#RRGGBB" } }`
- Never use plain color strings inside `visualStyles`.
- All hex colors must be sanitized to valid `#RRGGBB`.
- JSON export must be importable in Power BI Desktop.

## Build rules
- No TODO placeholders.
- No `any` unless unavoidable and explained.
- Run `npm run build` after major changes.
- Fix TypeScript and lint errors before moving to the next phase.
- Keep components small and modular.
- Do not move everything into one large component.
- Do not paste the old HTML or vanilla JS directly into a React component.

## File references
Read these files/folders before implementation:
- `REFERENCE_DECISION.md`
- `docs/reference/claude-design/Datacense Power BI Theme Studio.html`
- `docs/reference/claude-design/styles.css`
- `docs/reference/claude-design/src/*.js`
- `docs/reference/claude-design/data/*.js`
- `docs/reference/original-prompt.md`
- `docs/reference/pbi-theme-studio-reference.html`

## Implementation order
1. Types
2. Store
3. Lib constants/utilities
4. Layout shell
5. Canvas/dashboard components
6. Chart components
7. Sidebar controls
8. Right panel
9. Theme generator/import/export
10. QA/build fixes

## UI design standards
- Use Claude Design as the main visual reference.
- Preserve Datacense logo/brand feeling from `assets/datacense-logo.jpg`.
- Keep a clean 3-column studio shell: left controls, center canvas, right preview/format panel.
- Use the Datacense blue/cyan palette as the default brand theme.
- Single-series charts must use one data color only.
- Multi-series charts may use multiple theme colors.
- Keep the Power BI visual preview realistic and consistent.

## Commands
Useful checks:
- `npm run dev`
- `npm run build`
- `npm run lint`
- `git status`
- `git diff`
