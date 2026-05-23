# Axis Anatomy Fix Report

Date: 2026-05-22

## Summary

The previous preview path treated `xAxis` and `yAxis` as generic physical directions. That is not enough for Power BI-style visuals because the meaning of each axis changes by visual grammar:

- Horizontal bar charts: X-axis is the value/measure axis, Y-axis is the category axis.
- Vertical column charts: X-axis is the category axis, Y-axis is the value/measure axis.
- Line/area charts: X-axis is time/category, Y-axis is value.
- Pie, donut, funnel, and treemap do not have X/Y axes.

This pass adds a dedicated visual anatomy layer and routes preview resolution through that layer before chart SVGs render axis labels, titles, and gridlines.

## Visual Anatomy Table

| Visual ids | Orientation | X-axis role | X-axis default title | X label type | Y-axis role | Y-axis default title | Y label type | Gridlines | Shape role |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `bar`, `stackedbar`, `clusteredbar`, `hundredstackedbar` | Horizontal | Value | Sum of Sales | Numeric | Category | Country | Category | Vertical | Bars |
| `column`, `clusteredcol`, `stackedcol`, `hundredstackedcol` | Vertical | Category | Country | Category | Value | Sum of Sales | Numeric | Horizontal | Columns |
| `clusteredcolumn`, `stackedcolumn`, `hundredstackedcolumn` | Vertical | Category | Country | Category | Value | Sum of Sales | Numeric | Horizontal | Columns |
| `line` | Vertical | Time | Month | Time | Value | Sum of Sales | Numeric | Horizontal | Line |
| `area`, `stackedarea`, `hundredstackedarea` | Vertical | Time | Month | Time | Value | Sum of Sales | Numeric | Horizontal | Area |
| `lineclustered`, `lineclusteredcolumn`, `linestacked`, `linestackedcolumn` | Vertical | Category | Country | Category | Value | Revenue | Numeric | Horizontal | Columns |
| `pie`, `donut` | None | None |  | None | None |  | None | None | Slices |
| `funnel` | None | None |  | None | None |  | None | None | Funnel |
| `treemap` | None | None |  | None | None |  | None | None | Tiles |

## Files Modified

- `src/lib/visualAnatomy.ts`
- `src/lib/formatPreview.ts`
- `src/components/charts/chartUtils.ts`
- `src/components/charts/BarChartVisual.tsx`
- `src/components/charts/StackedBarChartVisual.tsx`
- `src/components/charts/ClusteredBarChartVisual.tsx`
- `src/components/charts/HundredPercentStackedBarChartVisual.tsx`
- `src/components/charts/ColumnChartVisual.tsx`
- `src/components/charts/StackedColumnChartVisual.tsx`
- `src/components/charts/ClusteredColumnChartVisual.tsx`
- `src/components/charts/HundredPercentStackedColumnChartVisual.tsx`
- `src/components/charts/LineChartVisual.tsx`
- `src/components/charts/AreaChartVisual.tsx`
- `src/components/charts/StackedAreaChartVisual.tsx`
- `src/components/charts/LineClusteredColumnVisual.tsx`
- `src/components/charts/LineStackedColumnVisual.tsx`

## What Now Works

- X/Y axis roles are resolved from visual anatomy before rendering.
- Axis title text uses anatomy defaults when the format-pane value is missing or `Auto`.
- Horizontal bar visuals now default to X = `Sum of Sales`, Y = `Country`.
- Vertical column visuals now default to X = `Country`, Y = `Sum of Sales`.
- Line and area visuals now default to X = `Month`, Y = `Sum of Sales`.
- Combo line/column visuals now default to X = `Country`, Y = `Revenue`.
- Axis title visibility, color, and font size are consumed by the axis-based SVGs.
- Axis labels use resolved label visibility, color, and font size.
- Gridline direction is chosen from visual anatomy rather than simple string checks.
- Pie, donut, funnel, and treemap resolve to no-axis anatomy and do not receive fake axes.

## Still Needs Follow-Up

- Power BI theme JSON export still needs a role-aware categoryAxis/valueAxis mapping pass. This task focused on preview anatomy and did not change JSON export shape.
- Line, area, stacked area, and combo visuals still do not have full Batch 1-style format-pane schemas, so some controls are not visible for those visuals yet.
- Bar and column families still share the `bar.*` state scope from the captured schema. The anatomy layer corrects preview interpretation, but a future state migration may separate scopes more cleanly.
- Scatter, bubble, waterfall, ribbon, table, matrix, and decomposition tree are outside this axis-anatomy pass.

## Manual Test Checklist

### Bar Chart

1. Open `/editor`.
2. Select `Bar Chart` or `Stacked Bar Chart`.
3. In Visual > X-axis, set Title text to `Sum of Sales`.
4. Confirm the X-axis title appears under the numeric/value axis.
5. In Visual > Y-axis, set Title text to `Country`.
6. Confirm the Y-axis title appears on the category axis.
7. Toggle X-axis values off and confirm numeric labels hide.
8. Toggle Y-axis values off and confirm category labels hide.
9. Change X/Y title color and size and confirm title styling updates.

### Column Chart

1. Select `Clustered Column` or `Stacked Column`.
2. Set X-axis Title text to `Country`.
3. Confirm it appears beneath country/category labels.
4. Set Y-axis Title text to `Sum of Sales`.
5. Confirm it appears on the numeric/value axis.
6. Toggle X/Y values and titles to verify label/title visibility.
7. Change label color/size and title color/size.

### Line And Area Charts

1. Select `Line Chart`.
2. Confirm default titles resolve to X = `Month`, Y = `Sum of Sales`.
3. Toggle labels and title visibility through state-backed controls when available.
4. Change label/title color and size where controls are available.
5. Repeat visual sanity checks for `Area` and `Stacked Area`.

## Build Result

`npm.cmd run build` passed successfully after the fix.
