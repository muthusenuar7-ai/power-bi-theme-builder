---
description: Bootstrap the Datacense Power BI Theme Studio project structure and base shell. Use when starting or resetting the project foundation.
---

# Skill: PBI Bootstrap

## Goal
Create the base Next.js app structure for Datacense Power BI Theme Studio.

## Read first
- `AGENTS.md`
- `REFERENCE_DECISION.md`
- `docs/reference/Codex-design/Datacense Power BI Theme Studio.html`
- `docs/reference/Codex-design/styles.css`
- `docs/reference/Codex-design/src/*.js`
- `docs/reference/Codex-design/data/*.js`
- `docs/reference/original-prompt.md`
- `docs/reference/pbi-theme-studio-reference.html`

## Tasks
1. Confirm the app uses Next.js App Router, TypeScript, Tailwind, and `src/`.
2. Create/verify:
   - `src/app/layout.tsx`
   - `src/app/page.tsx`
   - `src/app/editor/page.tsx`
   - `src/app/globals.css`
   - `src/components/layout/AppShell.tsx`
   - `src/components/layout/LeftSidebar.tsx`
   - `src/components/layout/RightPanel.tsx`
3. Create empty but real component placeholders only if they are functional shells with visible layout.
4. Add the CSS variables from the reference design.
5. Make `/` redirect to `/editor`.
6. The page must visually show:
   - top nav
   - left sidebar
   - center canvas placeholder
   - right panel

## Verification
Run:
```bash
npm run build
```

Fix all build errors before finishing.
