---
name: powerbi-theme-json-validator
description: Use this skill to validate Microsoft Power BI theme JSON generation and catch unsupported textClasses or invalid visualStyles color formats.
---

# Skill: Power BI Theme JSON Validator

## Critical validation rules
- `textClasses` can only contain: `callout`, `title`, `header`, `label`.
- Every color inside `visualStyles` must use:
  `{ "solid": { "color": "#RRGGBB" } }`
- Reject invalid hex values.
- Reject plain string colors inside `visualStyles`.
- Keep exported JSON compatible with Power BI Desktop.

## Tasks
1. Inspect `src/lib/themeGenerator.ts`.
2. Inspect any JSON import/export handlers.
3. Run `npm run build`.
4. Report invalid formats and fix them.
