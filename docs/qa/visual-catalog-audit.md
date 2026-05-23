# Visual Catalog Audit

Date: 2026-05-20

## Scope

This audit stabilizes the visual catalog before the next live-formatting implementation pass. It compares the canonical catalog in `src/lib/visualCatalog.ts` with the selector, renderer, Batch 1 format-pane schemas, live preview bindings, and current Power BI theme JSON export mappings.

Primary reference: `docs/reference/format-pane/powerbi-format-pane-master-reference.html`.

## Counts

| Area | Count |
| --- | ---: |
| Canonical planned catalog | 33 |
| Current selector visuals | 24 |
| Current renderer entries | 24 |
| Batch 1 app schema ids | 12 |
| Planned/missing visuals | 9 |

Batch 1 reference groups from the master HTML: Donut, Pie, Funnel, Treemap, Bar / Stacked Bar, Clustered Bar, Clustered Column, Column / Stacked Column, 100% Stacked Bar, 100% Stacked Column.

The app maps those 10 captured groups to 12 app ids because shared reference schemas intentionally cover both plain and stacked internal ids:

- `bar` and `stackedbar`
- `column` and `stackedcol`
- `clusteredbar`
- `clusteredcol`
- `hundredstackedbar`
- `hundredstackedcol`
- `pie`
- `donut`
- `funnel`
- `treemap`

## Naming Notes

The catalog keeps current implementation ids as primary ids to avoid breaking selector and renderer behavior. Product/planned names are tracked as aliases where needed:

| Product term | Current app id |
| --- | --- |
| `stackedcolumn` | `stackedcol` |
| `clusteredcolumn` | `clusteredcol` |
| `hundredstackedcolumn` | `hundredstackedcol` |
| `lineclusteredcolumn` | `lineclustered` |
| `linestackedcolumn` | `linestacked` |
| `scatterBubblePreview` | `bubble` |

No dot plot preview exists today, so no dot plot catalog entry was added in this pass.

## Status Matrix

| Visual id | Display name | Selector | Renderer | Format schema | Live preview | JSON export | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `bar` | Bar Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `stackedbar` | Stacked Bar Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `clusteredbar` | Clustered Bar Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `hundredstackedbar` | 100% Stacked Bar Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `column` | Column Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `stackedcol` | Stacked Column Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `clusteredcol` | Clustered Column Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `hundredstackedcol` | 100% Stacked Column Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `lineclustered` | Line and Clustered Column Chart | Yes | Yes | None | Partial | Partial | Partial |
| `linestacked` | Line and Stacked Column Chart | Yes | Yes | None | Partial | Partial | Partial |
| `line` | Line Chart | Yes | Yes | None | Partial | Partial | Partial |
| `area` | Area Chart | Yes | Yes | None | None | Partial | Partial |
| `stackedarea` | Stacked Area Chart | Yes | Yes | None | None | Partial | Partial |
| `hundredstackedarea` | 100% Stacked Area Chart | No | No | None | Planned | Planned | Planned |
| `pie` | Pie Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `donut` | Donut Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `funnel` | Funnel Chart | Yes | Yes | Partial | Partial | Partial | Partial |
| `treemap` | Treemap | Yes | Yes | Partial | Partial | Partial | Partial |
| `waterfall` | Waterfall Chart | Yes | Yes | None | None | Partial | Partial |
| `ribbon` | Ribbon Chart | Yes | Yes | None | None | Partial | Partial |
| `scatter` | Scatter Chart | Yes | Yes | None | Partial | Partial | Partial |
| `bubble` | Bubble Chart | Yes | Yes | None | Partial | None | Partial |
| `table` | Table | Yes | Yes | None | None | Partial | Partial |
| `matrix` | Matrix | Yes | Yes | None | None | Partial | Partial |
| `cardCurrent` | Card (new) | No | No | None | Planned | Partial | Planned |
| `cardLegacy` | Card (legacy) | No | No | None | Planned | Planned | Planned |
| `multirowcard` | Multi-row Card | No | No | None | Planned | Planned | Planned |
| `kpi` | KPI | No | No | None | Planned | Planned | Planned |
| `slicerStandard` | Slicer | No | No | None | Planned | Planned | Planned |
| `buttonSlicer` | Button Slicer | No | No | None | Planned | Planned | Planned |
| `listSlicer` | List Slicer | No | No | None | Planned | Planned | Planned |
| `tileSlicer` | Tile Slicer | No | No | None | Planned | Planned | Planned |
| `decompositiontree` | Decomposition Tree | Yes | Yes | None | None | None | Partial |

## Current Preview Support

Selector and renderer support are aligned for all 24 current selector visuals. There are no selector visuals without renderer support.

Live preview binding is partial for the bar/column family, pie, donut, funnel, treemap, line, combo, scatter, and bubble because those components consume at least some resolved format props or CSS variables. Live preview binding is not detected for `area`, `stackedarea`, `waterfall`, `ribbon`, `table`, `matrix`, and `decompositiontree`.

## Current JSON Export Support

The current JSON generator emits general visual shell styles and partial visual-specific mappings for:

- Bar/column family through `barChart`, `clusteredBarChart`, `hundredPercentStackedBarChart`, `columnChart`, `clusteredColumnChart`, and `hundredPercentStackedColumnChart`
- Combo visuals through `lineClusteredColumnComboChart` and `lineStackedColumnComboChart`
- Line/area/ribbon/scatter through existing line-style cards
- Pie/donut through `pieChart` and `donutChart`
- Funnel through `funnel`
- Treemap through `treemap`
- Table/matrix through `tableEx` and `pivotTable`
- Generic card styling through `card`

Not currently mapped as dedicated visualStyles:

- `bubble`
- `decompositiontree`
- 100% stacked area
- slicer variants
- card legacy / multi-row card / KPI visual-specific cards

## Missing Visuals Not Yet Implemented

- `hundredstackedarea`
- `cardCurrent`
- `cardLegacy`
- `multirowcard`
- `kpi`
- `slicerStandard`
- `buttonSlicer`
- `listSlicer`
- `tileSlicer`

The dashboard already has KPI and slicer zones, but those are layout elements, not selectable catalog visuals.

## Implemented Visuals Not In Catalog

None after this pass. `chartPool.ts` now derives selector visuals from `src/lib/visualCatalog.ts`, so the catalog is the source of truth for selector membership.

## X-Axis / Y-Axis Toggle Diagnosis

Trace for Batch 1 bar/column visuals:

1. Format pane schema:
   `horizontalAxisSection` and `verticalAxisSection` define section toggles with `stateKey: "bar.xAxis.show"` and `stateKey: "bar.yAxis.show"`.

2. UI control:
   `FormatSection.tsx` renders the section toggle using `ToggleControl` and writes to Zustand via `setProp(key, next)`.

3. Zustand state:
   `themeStore.ts` stores the values in `formatProps`.

4. Resolver:
   `formatPreview.ts` reads `bar.xAxis.show` and `bar.yAxis.show` into `ResolvedVisualPreviewFormat.xAxis.show` and `.yAxis.show`.

5. Renderer:
   `ChartRenderer.tsx` passes the resolved `format` object and preview CSS variables into the selected chart component.

6. SVG component:
   Bar/column family components conditionally hide axis label text using `format?.xAxis.show` and `format?.yAxis.show`.

Current classification:

- A. Control exists but is not state-backed: No for Batch 1 bar/column axis toggles.
- B. Control updates state using wrong property path: No for the section toggles.
- C. State exists but resolver does not resolve it: No for Batch 1 bar/column axis toggles.
- D. ChartRenderer does not pass it onward: No for Batch 1 bar/column axis toggles.
- E. Individual chart component ignores the property: Partially. Current components hide label text, but still leave gridlines and axis domain lines visible. Some non-Batch1 visuals ignore the format object entirely.
- F. JSON theme mapping is missing: Partially. The generated theme maps axis show/color/font size for the bar family, but not every captured axis sub-property.

Root cause for the perceived "axis toggle does not update" issue:

The live path is present for Batch 1 bar/column axis toggles, but the visual effect is incomplete. The toggle currently hides axis labels only; axis lines and gridlines remain visible, so the visual can still look like the axis is on. For non-Batch1 visuals and several legacy SVG components, the chart component still does not consume resolved format props at all.

## Recommended Immediate Priorities

1. Finish axis toggle semantics for Batch 1 bar/column visuals: hide labels, axis line, tick/gridline layer, and axis titles consistently where the Power BI pane says the axis is off.
2. Add a dedicated preview binding contract test for the Batch 1 bar/column family.
3. Extend schema coverage next for table/matrix, line/area, scatter/bubble, and card/KPI before adding more visual-specific export mappings.
4. Decide whether to migrate internal ids from shorthand names like `stackedcol` to product names like `stackedcolumn`, or keep aliases permanently.
5. Add visual-specific JSON mappings only after confirming Power BI visualStyles keys and object shapes.

## QA Script

Run:

```bash
npm run qa:visuals
```

The script checks:

- Catalog id uniqueness
- Selector id uniqueness
- Renderer id uniqueness
- Selector ids missing from the catalog
- Renderer ids missing from the catalog
- Format schema ids missing from the catalog
- Whether each catalog visual has selector, renderer, schema, live binding, and JSON export coverage
- Which preview components do not appear to consume live-binding hooks

The script intentionally treats planned missing visuals as reportable gaps, not fatal errors.
