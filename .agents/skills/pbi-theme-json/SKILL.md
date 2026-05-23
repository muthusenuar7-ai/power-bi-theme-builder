---
description: Implement valid Microsoft Power BI theme JSON import, preview, validation, and export.
---

# Skill: PBI Theme JSON

## Read first
- `AGENTS.md`
- `REFERENCE_DECISION.md`
- `docs/reference/Codex-design/Datacense Power BI Theme Studio.html`
- `docs/reference/Codex-design/styles.css`
- `docs/reference/Codex-design/src/*.js`
- `docs/reference/Codex-design/data/*.js`
- `docs/reference/original-prompt.md`
- `docs/reference/pbi-theme-studio-reference.html`

## Goal
Create valid Power BI theme JSON generation and download logic.

## Files
- `src/lib/themeGenerator.ts`
- `src/components/right-panel/JsonPreview.tsx`
- import/export handlers where appropriate

## Critical rules
- `textClasses` accepts only:
  - `callout`
  - `title`
  - `header`
  - `label`
- Colors inside `visualStyles` must be objects:
  `{ solid: { color: "#RRGGBB" } }`
- Never use plain color strings inside `visualStyles`.
- Sanitize all hex values.
- JSON preview must update when Zustand state changes.
- Export button must download a `.json` file.
- Import button must read an existing theme JSON and update the store.

## Verification
Run:
```bash
npm run build
```
Then inspect generated JSON manually.
