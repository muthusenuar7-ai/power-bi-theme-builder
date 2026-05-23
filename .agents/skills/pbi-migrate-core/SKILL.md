---
description: Migrate core TypeScript types, Zustand store, constants, and utility files for the Power BI Theme Studio.
---

# Skill: PBI Migrate Core

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
Create strongly typed core files before UI implementation.

## Files to create/update
- `src/types/index.ts`
- `src/store/themeStore.ts`
- `src/lib/pageSizes.ts`
- `src/lib/chartPool.ts`
- `src/lib/kpiDefs.ts`
- `src/lib/slicerDefs.ts`
- `src/lib/presets.ts`
- `src/lib/layoutEngine.ts`
- `src/lib/colorUtils.ts`
- `src/lib/coolorsParser.ts`

## Rules
- Use strict TypeScript.
- No `any`.
- Use the uploaded prompt as the source of truth.
- Zustand store must sync colors to CSS custom properties.
- Presets must have exactly 8 colors each.

## Verification
Run:
```bash
npm run build
```
