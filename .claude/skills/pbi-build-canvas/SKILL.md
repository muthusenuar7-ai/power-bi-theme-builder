---
description: Build the canvas, dashboard preview, toolbar, visual selector, KPI strip, slicers, and page navigator.
---

# Skill: PBI Build Canvas

## Read first
- `AGENTS.md`
- `REFERENCE_DECISION.md`
- `docs/reference/claude-design/Datacense Power BI Theme Studio.html`
- `docs/reference/claude-design/styles.css`
- `docs/reference/claude-design/src/*.js`
- `docs/reference/claude-design/data/*.js`
- `docs/reference/original-prompt.md`
- `docs/reference/pbi-theme-studio-reference.html`

## Goal
Build the central Power BI-style preview canvas.

## Components
- `CanvasToolbar`
- `VisualSelectorBar`
- `DashboardCanvas`
- `DashboardLayout`
- `FocusView`
- `KpiStrip`
- `SlicerSidebar`
- `ChartGrid`
- `ChartCard`
- `PageNavigator`

## Rules
- Use Zustand store for page size, zoom, spacing, slicer count, KPI count, current page, and focus mode.
- Use the HTML reference for look and feel.
- Do not migrate all chart SVGs in this phase; use temporary real mini chart components only if needed.
- Ensure all toolbar controls change the state.

## Verification
Run:
```bash
npm run build
```
