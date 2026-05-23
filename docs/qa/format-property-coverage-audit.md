# Format Property Coverage Audit

Date: 2026-05-22

Primary reference: `docs/reference/format-pane/powerbi-format-pane-master-reference.html`

## Executive Summary

The Batch 1 format pane is now schema-driven and most high-impact controls are state-backed through `FormatSection` and `PropertyRow`. The remaining failures were not caused by the controls being static. They were mostly caused by three gaps:

1. Some schema-generated paths were not read by `formatPreview.ts`.
2. Several resolver defaults disagreed with the schema defaults shown in the UI.
3. The Batch 1 SVG components consumed only a subset of the resolved format object, especially axis titles and axis/domain line visibility.

This pass fixes the P0 demo-critical preview bindings for General title/subtitle shell styling and for Batch 1 bar/column axis, gridline, legend, data label, and shape-color behavior where the compact preview supports it. JSON export remains valid and partially mapped; uncertain Power BI theme JSON paths were intentionally not invented.

## Batch 1 Visuals And Internal IDs

| Reference group | Current app ids | Format schema source | Notes |
| --- | --- | --- | --- |
| Donut | `donut` | Donut schema | Dedicated state scope `donut` |
| Pie | `pie` | Pie schema | Dedicated state scope `pie` |
| Funnel | `funnel` | Funnel schema | Uses funnel scope for color and shared `bar.dataLabels` for data labels |
| Treemap | `treemap` | Treemap schema | Dedicated state scope `treemap` |
| Bar / Stacked Bar | `bar`, `stackedbar` | Shared bar schema | Shared state scope `bar` |
| Clustered Bar | `clusteredbar` | Clustered bar schema | Shared state scope `bar` |
| Clustered Column | `clusteredcol` | Clustered column schema | Shared state scope `bar` |
| Column / Stacked Column | `column`, `stackedcol` | Shared column schema | Shared state scope `bar` |
| 100% Stacked Bar | `hundredstackedbar` | 100% stacked bar schema | Shared state scope `bar` |
| 100% Stacked Column | `hundredstackedcol` | 100% stacked column schema | Shared state scope `bar` |

## General Tab Coverage

| Property category | UI visible | State-backed | Preview applied | JSON exported | Status |
| --- | --- | --- | --- | --- | --- |
| Title show/hide | Yes | Yes | Yes | Yes | Working |
| Title text | Yes | Yes | Yes | Theme visual title text is state-only; JSON theme name/title style only | Preview working |
| Title color | Yes | Yes | Yes | Yes | Working |
| Title font size | Yes | Yes | Yes | Yes | Working |
| Title font family | Yes | Yes | Yes | Yes | Working |
| Title bold/italic/underline | Yes | Yes | Yes | Bold exported; italic/underline preview-only | Partial |
| Title alignment | Yes | Yes | Yes | Yes | Working |
| Subtitle show/hide | Yes | Yes | Yes | No | Preview working |
| Subtitle text | Yes | Yes | Yes | No | Preview working |
| Subtitle color | Yes | Yes | Yes | No | Fixed in this pass |
| Subtitle font size/family/style | Yes | Yes | Yes | No | Fixed in this pass |
| Background show/color/transparency | Yes | Yes | Yes | Yes | Working |
| Border show/color/width/radius | Yes | Yes | Yes | Yes | Working |
| Shadow show/color | Yes | Yes | Yes | Partial | Partial |
| Padding | Yes | Yes | Yes | Yes | Working |
| Header icons, tooltips, alt text | Yes | Mostly state-backed | Not previewed | Partial or no | P1/P2 |

## Bar And Column Family Coverage

Applies to `bar`, `stackedbar`, `clusteredbar`, `column`, `stackedcol`, `clusteredcol`, `hundredstackedbar`, and `hundredstackedcol`.

| Property category | UI visible | State-backed | Preview applied | JSON exported | Status |
| --- | --- | --- | --- | --- | --- |
| X-axis show/hide | Yes | Yes | Yes | Yes | Fixed/working |
| Y-axis show/hide | Yes | Yes | Yes | Yes | Fixed/working |
| X-axis label color | Yes | Yes | Yes | Yes | Working |
| Y-axis label color | Yes | Yes | Yes | Yes | Working |
| X-axis label font size/family | Yes | Yes | Yes | Font size yes; family inherited in preview | Partial |
| Y-axis label font size/family | Yes | Yes | Yes | Font size yes; family inherited in preview | Partial |
| X-axis title show/hide | Yes | Yes | Yes | No confirmed safe mapping | Fixed preview-only |
| Y-axis title show/hide | Yes | Yes | Yes | No confirmed safe mapping | Fixed preview-only |
| X-axis title text | Yes | Yes | Yes | Not a theme style | Fixed preview-only |
| Y-axis title text | Yes | Yes | Yes | Not a theme style | Fixed preview-only |
| X-axis title color | Yes | Yes | Yes | Title color partially exported | Fixed/partial export |
| Y-axis title color | Yes | Yes | Yes | Title color partially exported | Fixed/partial export |
| X/Y title font size | Yes | Yes | Yes | No confirmed safe mapping | Fixed preview-only |
| Gridlines show/hide | Yes | Yes | Yes | Gridline color yes; show partially | Fixed/partial export |
| Gridline color | Yes | Yes | Yes | Yes | Working |
| Gridline style/width | Yes | Yes | Yes | No confirmed safe mapping | Fixed preview-only |
| Legend show/hide | Yes | Yes | Yes where visual has legend | Yes | Working |
| Legend text color/font size | Yes | Yes | Yes where visual has legend | Yes | Working |
| Data labels show/hide | Yes | Yes | Yes | Yes | Working |
| Data label color/font size | Yes | Yes | Yes | Yes | Working |
| Bar/column color | Yes | Yes | Yes for primary rendered series | Not safely mapped yet | Preview-only |
| Bar/column border | Yes | Yes | Yes | Border shell exported; data point border not safely mapped | Preview-only |
| Ribbons, total labels, zoom slider, advanced layout | Yes | Mostly state-backed | Not previewed | Not exported | P1/P2 |

## Pie, Donut, Funnel, Treemap Coverage

| Visual | Property category | UI visible | State-backed | Preview applied | JSON exported | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Pie | Legend show/text styling | Yes | Yes | Yes | Yes | Working |
| Pie | Detail labels show/color/size | Yes | Yes | Yes | Yes | Working |
| Pie | Slice color/border | Yes | Yes | Primary color/border preview only | Not safely mapped | Partial |
| Donut | Legend show/text styling | Yes | Yes | Yes | Yes | Working |
| Donut | Detail labels show/color/size | Yes | Yes | Yes | Yes | Working |
| Donut | Slice color/border | Yes | Yes | Primary color/border preview only | Not safely mapped | Partial |
| Funnel | Data labels show/color/size | Yes | Yes via `bar.dataLabels` | Yes | Yes through funnel/bar cards | Working |
| Funnel | Funnel color | Yes | Yes | Primary color only | No dedicated safe mapping | Partial |
| Treemap | Data labels show/color/size | Yes | Yes | Yes | Yes | Working |
| Treemap | Category labels | Yes | Yes | Not separately rendered from data labels | Yes | Partial |
| Treemap | Legend | Yes | Yes | Yes, compact country legend | Yes | Fixed/working |
| Treemap | Tile colors | Yes | Yes | Primary country color only | No dedicated safe mapping | Partial |

## Root Cause Classification

| Failure class | Found? | Examples |
| --- | --- | --- |
| A. Control not state-backed | Rare | Placeholder/note/browse/fx controls are intentionally non-functional or disabled |
| B. Wrong state path | Yes | General subtitle color/size used schema-generated `general.title.subtitle.*` paths while resolver read `general.subtitle.*` only |
| C. State exists but preview resolver missing | Yes | Gridline orientation selection and axis-title default handling were incomplete |
| D. Preview resolver exists but ChartRenderer does not pass prop | No for Batch 1 P0 | `ChartRenderer` passes resolved `format`, legend, data labels, and markers |
| E. Chart component ignores prop | Yes | Bar/column SVGs ignored axis title text/show/color/size and did not hide domain lines with axis toggles |
| F. JSON export mapping missing | Yes | Axis title text/font size, shape fill colors, and several advanced controls are preview/state only |
| G. Unsupported by compact preview | Yes | Treemap legend, Power BI zoom slider, small multiples, total labels, advanced ribbons/layout |

## Axis And Axis Title Bug Trace

Path: Format pane control -> Zustand `formatProps` -> `formatPreview.ts` -> `ChartRenderer.tsx` -> individual SVG component.

| Item | Diagnosis before fix | Status after P0 pass |
| --- | --- | --- |
| X-axis show/hide | State and resolver worked, but domain/grid made effect look incomplete | Labels and domain line now respond |
| Y-axis show/hide | State and resolver worked, but domain/grid made effect look incomplete | Labels and domain line now respond |
| X-axis values show/hide | Same state key as axis show in captured schema | Working |
| Y-axis values show/hide | Same state key as axis show in captured schema | Working |
| X-axis title show/hide | Resolver default mismatched schema and SVG ignored title props | Fixed in preview |
| Y-axis title show/hide | Resolver default mismatched schema and SVG ignored title props | Fixed in preview |
| X-axis title text | State updated but no SVG rendered it | Fixed in preview |
| Y-axis title text | State updated but no SVG rendered it | Fixed in preview |
| X/Y label color | Already resolved and applied through CSS vars | Working |
| X/Y label font size | Already resolved and applied through CSS vars | Working |
| X/Y title color | State/resolver existed but SVG ignored it | Fixed in preview |
| X/Y title font size | State/resolver existed but SVG ignored it | Fixed in preview |

## P0 Demo Blockers Fixed In This Pass

- General subtitle generated path handling for color, font size, font family, and font style.
- Gridline resolver orientation so horizontal column gridlines and vertical bar gridlines no longer collide through shared `bar` scope.
- Axis title default handling so the UI toggle default and resolver default agree.
- Axis title rendering for Batch 1 bar/column SVG previews.
- Axis/domain line visibility for Batch 1 bar/column previews when axis show/hide is toggled.
- Compact treemap legend show/hide and legend text styling.

## P1 Follow-Up Items

- Add dedicated visual state scopes for bar versus column families to avoid shared `bar.*` path collisions over time.
- Split Power BI JSON export orientation for bar charts versus column charts where category/value axes differ.
- Add verified JSON mappings for data point fill/border once Power BI object names are confirmed.
- Extend the same live-binding rigor to combo, line/area, scatter/bubble, table/matrix, waterfall, ribbon, and decomposition tree.

## P2 Future / State-Only Items

- Zoom slider controls
- Small multiples controls
- Ribbons advanced properties
- Total labels
- Conditional formatting `fx` controls
- Image/browse placeholder controls
- Alternate text and rich tooltip behavior

## Manual Demo Checklist

1. Open `/editor`.
2. Select `Clustered Bar`.
3. In the Visual tab, toggle X-axis and Y-axis values off/on.
4. Set X-axis title text to `Revenue` and Y-axis title text to `Region`.
5. Change axis title color and font size.
6. Change axis label color and font size.
7. Toggle gridlines and change gridline color/style.
8. Toggle legend and data labels.
9. Change bar color in the Bars section.
10. Switch to `Clustered Column`, `Stacked Bar`, `Stacked Column`, `100% Stacked Bar`, and `100% Stacked Column` and repeat the axis-title checks.
11. Select Pie/Donut and verify legend and detail labels.
12. Select Funnel/Treemap and verify data labels and primary fill/border behavior.
13. Confirm JSON preview still renders and Export JSON still downloads valid JSON.
