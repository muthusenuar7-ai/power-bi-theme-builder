/**
 * Axis Layout — computes axis geometry for bar, column, and line charts.
 *
 * Currently a full implementation for the most common case (vertical bars /
 * horizontal categories / numeric Y-axis). Pie / donut charts do not use this
 * module — they call legendLayout directly.
 *
 * Future batch migrations (bar, column, line) will consume this module.
 */

import type { Rect, AxisOptions, AxisLayoutResult, GridTick } from './types'
import { formatNumber } from './numberFormatter'

/* ── Constants ───────────────────────────────────────────────────────── */

/** Estimated pixel width per character in axis labels */
const CHAR_W = 5.5

/** Minimum height of the x-axis strip (labels + gap) */
const X_AXIS_MIN_H = 14

/** Minimum width of the y-axis strip (labels + gap) */
const Y_AXIS_MIN_W = 24

/** Space reserved for an axis title (orthogonal to the axis direction) */
const AXIS_TITLE_THICKNESS = 9

/** Number of y-axis gridline divisions (PBI default) */
const DEFAULT_GRIDLINE_COUNT = 4

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Round a value up to a "nice" number for axis tick calculation */
function niceStep(rawStep: number): number {
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const fraction  = rawStep / magnitude
  let nice: number
  if (fraction <= 1) nice = 1
  else if (fraction <= 2) nice = 2
  else if (fraction <= 5) nice = 5
  else nice = 10
  return nice * magnitude
}

/** Compute nice min/max/step for a value range */
function niceRange(
  values: number[],
  targetDivisions = DEFAULT_GRIDLINE_COUNT,
): { min: number; max: number; step: number } {
  if (values.length === 0) return { min: 0, max: 100, step: 25 }

  const dataMin = Math.min(...values, 0)
  const dataMax = Math.max(...values, 0)
  const range   = dataMax - dataMin || 1
  const rawStep = range / targetDivisions
  const step    = niceStep(rawStep)
  const min     = Math.floor(dataMin / step) * step
  const max     = Math.ceil(dataMax  / step) * step

  return { min, max, step }
}

/* ── Public API ──────────────────────────────────────────────────────── */

/**
 * Compute axis geometry for a standard Cartesian chart (bar, column, line).
 *
 * @param plotRect    Available plot area (output of legendLayout)
 * @param xAxis       X-axis options
 * @param yAxis       Y-axis options
 * @param categories  Category labels for the x-axis
 * @param values      All data values (used to compute y-axis range)
 */
export function computeAxisLayout(
  plotRect: Rect,
  xAxis: AxisOptions,
  yAxis: AxisOptions,
  categories: string[],
  values: number[],
): AxisLayoutResult {
  /* ── Y-axis (left, vertical) ── */
  const yLabelW  = yAxis.show && yAxis.showLabels ? Y_AXIS_MIN_W : 0
  const yTitleW  = yAxis.show && yAxis.showTitle && yAxis.titleText
    ? AXIS_TITLE_THICKNESS
    : 0
  const yAxisW   = yLabelW + yTitleW

  /* ── X-axis (bottom, horizontal) ── */
  const xLabelH  = xAxis.show && xAxis.showLabels ? X_AXIS_MIN_H : 0
  const xTitleH  = xAxis.show && xAxis.showTitle && xAxis.titleText
    ? AXIS_TITLE_THICKNESS
    : 0
  const xAxisH   = xLabelH + xTitleH

  /* ── Reduced chart area ── */
  const chartRect: Rect = {
    x: plotRect.x + yAxisW,
    y: plotRect.y,
    w: Math.max(0, plotRect.w - yAxisW),
    h: Math.max(0, plotRect.h - xAxisH),
  }

  /* ── Y-axis gridlines and labels ── */
  const { min, max, step } = niceRange(
    values,
    DEFAULT_GRIDLINE_COUNT,
  )

  const yGridlines: GridTick[] = []
  for (let v = min; v <= max + 1e-9; v = Math.round((v + step) * 1e9) / 1e9) {
    const fraction = max === min ? 0 : (v - min) / (max - min)
    const y = chartRect.y + chartRect.h * (1 - fraction)
    yGridlines.push({
      value: v,
      pos:   y,
      label: formatNumber(v, 'auto', 0),
    })
  }

  /* ── X-axis category positions ── */
  const bandW = categories.length > 0 ? chartRect.w / categories.length : chartRect.w
  const xPositions = categories.map((label, i) => ({
    label,
    x:         chartRect.x + i * bandW + bandW / 2,
    bandLeft:  chartRect.x + i * bandW,
    bandWidth: bandW,
  }))

  /* ── Axis rects ── */
  const yAxisRect: Rect = {
    x: plotRect.x,
    y: plotRect.y,
    w: yAxisW,
    h: chartRect.h,
  }

  const xAxisRect: Rect = {
    x: chartRect.x,
    y: chartRect.y + chartRect.h,
    w: chartRect.w,
    h: xAxisH,
  }

  return {
    plotRect: chartRect,
    xAxisRect,
    yAxisRect,
    xPositions,
    yGridlines,
    xAxisLineY: chartRect.y + chartRect.h,
    yAxisLineX: chartRect.x,
  }
}

/**
 * Build a default AxisOptions from resolved format values.
 * Useful when migrating chart components to the engine.
 */
export function defaultAxisOptions(overrides: Partial<AxisOptions> = {}): AxisOptions {
  return {
    show:          true,
    showLabels:    true,
    labelFontSize: 7.5,
    labelColor:    '#605E5C',
    labelAngle:    0,
    showTitle:     false,
    titleText:     '',
    titleFontSize: 8,
    titleColor:    '#605E5C',
    categories:    [],
    ...overrides,
  }
}

/** Estimated width of a y-axis label string given font size */
export function estimateYLabelWidth(maxValue: number, fontSize = 7.5): number {
  const label = formatNumber(maxValue, 'auto', 0)
  return Math.ceil(label.length * (fontSize * 0.62))
}
