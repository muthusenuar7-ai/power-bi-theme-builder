---
name: pbi-theme-studio-architect
description: Use this skill when building or reviewing the Datacense Power BI Theme Studio Next.js app.
---

# Skill: PBI Theme Studio Architect

## Reference priority
1. `docs/reference/claude-design/` is the primary visual and static implementation reference.
2. `docs/reference/original-prompt.md` is the canonical feature and Power BI JSON rule spec.
3. `docs/reference/pbi-theme-studio-reference.html` is secondary only.

## Architecture target
Convert the static modular JavaScript app into clean React + TypeScript modules using:
- Next.js App Router
- Tailwind CSS
- Zustand
- shadcn/ui
- lucide-react

## Key migration mapping
- `src/state.js` → `src/store/themeStore.ts`
- `src/utils.js` → `src/lib/colorUtils.ts`, `src/lib/coolorsParser.ts`, small DOM-free utility modules
- `src/charts.js` → `src/components/charts/*.tsx`
- `src/canvas.js` → `src/components/canvas/*.tsx`
- `src/sidebar.js` → `src/components/sidebar/*.tsx`
- `src/rightpanel.js` + `src/format-pane.js` → `src/components/right-panel` and `src/components/format-pane`
- `src/exports.js` → `src/lib/themeGenerator.ts` and exporter utilities
- `data/presets.js` → `src/lib/presets.ts`
- `data/fonts.js` → `src/lib/formatProps.ts` or `src/lib/fonts.ts`
- `styles.css` → `src/app/globals.css` + Tailwind component classes where appropriate

## Rules
- Do not paste raw HTML or vanilla JS into React.
- Preserve behavior and appearance, but make the code typed and maintainable.
- Run `npm run build` after changes.
