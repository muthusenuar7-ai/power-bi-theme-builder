---
description: Convert all Power BI-style SVG visuals from the HTML prototype into modular React chart components.
---

# Skill: PBI Migrate Charts

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
Create all chart components under `src/components/charts`.

## Required charts
- ClusteredColumn
- HorizontalBar
- LineChart
- StackedColumn
- ClusteredBar
- StackedBar
- DonutChart
- PieChart
- AreaChart
- ScatterChart
- TreemapChart
- FunnelChart
- LineColumnCombo
- LineStackedCombo
- GaugeChart
- TableVisual
- MatrixVisual
- MapVisual
- SlicerVisual

## Chart rules
- SVG viewBox: `0 0 380 185`
- Use `width="100%"` and `height="100%"`
- Font: Segoe UI
- Single-series charts: use `colors[0]` only.
- Pie/donut/treemap: use multiple colors.
- Multi-series charts: use series-based colors.
- No random rainbow colors on single-series charts.

## Verification
Run:
```bash
npm run build
```
