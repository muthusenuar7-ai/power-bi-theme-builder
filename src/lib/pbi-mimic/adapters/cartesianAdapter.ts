/**
 * Cartesian Adapter — geometry for bar / column families.
 *
 * Handles both orientations (vertical = column, horizontal = bar) and the four
 * Power BI cluster modes (single, clustered, stacked, hundredPercent).
 *
 * All coordinates are returned in SVG viewBox units. When the consuming
 * component drives the viewBox from a ResizeObserver (1:1 with the rendered
 * pixel box), these units equal CSS pixels, so font sizes render at their
 * intended size regardless of card / focus size.
 */

import {
  computeContainerLayout,
  computeLegendLayout,
  formatDisplayValue,
} from '../core'
import type { LegendItem, LegendLayoutResult, Rect } from '../core'

export type CartesianOrientation = 'vertical' | 'horizontal'
export type CartesianMode = 'single' | 'clustered' | 'stacked' | 'hundredPercent'

export interface CartesianAxisInput {
  showLabels: boolean
  labelFontSize: number
  showTitle: boolean
  titleText: string
  titleFontSize: number
  switchPosition: boolean
}

export interface CartesianModelOptions {
  width: number
  height: number
  orientation: CartesianOrientation
  mode: CartesianMode
  categories: string[]
  seriesColors: string[]
  /** values[categoryIndex][seriesIndex] */
  values: number[][]

  /* legend */
  showLegend: boolean
  legendItems: LegendItem[]
  legendPosition: string
  legendFontSize: number
  legendTextVisible?: boolean
  legendTitleVisible?: boolean
  legendTitleHeight?: number

  /* value axis (numeric) */
  valueAxis: CartesianAxisInput
  valueDisplayUnits?: string
  valueDecimals?: string

  /* category axis (discrete) */
  categoryAxis: CartesianAxisInput
  /** Estimated number of text lines per category label (1 or 2) */
  categoryMaxLines?: number
  /** Category-axis size hint (PBI minimum category width/height, 0..100) */
  categorySize?: number
  /** PBI "Maximum width" for category labels (% of plot) — bar/horizontal. */
  categoryMaxWidthPct?: number
  /** PBI "Maximum height" for category labels (% of plot) — column/vertical. */
  categoryMaxHeightPct?: number

  gridlineCount?: number
}

export interface CartesianSegment {
  categoryIdx: number
  seriesIdx: number
  x: number
  y: number
  w: number
  h: number
  color: string
  value: number
  /** Raw (pre-normalisation) value used for data labels */
  rawValue: number
}

export interface CartesianValueTick {
  value: number
  /** SVG coordinate along the value axis */
  pos: number
  label: string
}

export interface CartesianCategoryBand {
  categoryIdx: number
  label: string
  /** Centre coordinate on the category axis */
  center: number
  bandStart: number
  bandSize: number
}

export interface CartesianModel {
  orientation: CartesianOrientation
  mode: CartesianMode
  plotRect: Rect
  innerPlot: Rect
  legend: LegendLayoutResult
  legendItems: LegendItem[]
  segments: CartesianSegment[]
  valueTicks: CartesianValueTick[]
  categoryBands: CartesianCategoryBand[]
  /** SVG coordinate of the zero baseline on the value axis */
  valueBaseline: number
  /** True when the value axis sits on the right (column) / top (bar) */
  valueAxisSwitched: boolean
  /** True when the category axis labels sit on the opposite side */
  categoryAxisSwitched: boolean
  valueIsPercent: boolean
  valueMax: number
  valueAxisRect: Rect
  categoryAxisRect: Rect
}

const OUTER_PADDING = { top: 4, right: 6, bottom: 4, left: 6 }

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function longestCategoryChars(categories: string[]): number {
  return categories.reduce((max, label) => {
    const parts = String(label).split(/[,/\n]/).map((part) => part.trim()).filter(Boolean)
    return Math.max(max, ...parts.map((part) => part.length))
  }, 1)
}

/** Compute a "nice" value-axis scale (max + evenly-spaced ticks). */
function niceValueScale(maxValue: number, divisions: number): { max: number; ticks: number[] } {
  if (!(maxValue > 0)) {
    const ticks: number[] = []
    for (let i = 0; i <= divisions; i++) ticks.push(i)
    return { max: divisions, ticks }
  }
  const rough = maxValue / divisions
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)))
  const norm = rough / magnitude
  const niceNorm = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10
  const step = niceNorm * magnitude
  const max = Math.ceil(maxValue / step) * step
  const ticks: number[] = []
  for (let v = 0; v <= max + step * 1e-6; v += step) {
    ticks.push(Math.round(v * 1e9) / 1e9)
  }
  return { max, ticks }
}

/** Sum of one category's series values (negatives clamped to 0 for stacking). */
function categorySum(row: number[]): number {
  return row.reduce((sum, v) => sum + Math.max(0, v), 0)
}

export function buildCartesianModel(options: CartesianModelOptions): CartesianModel {
  const {
    width,
    height,
    orientation,
    mode,
    categories,
    seriesColors,
    values,
    showLegend,
    legendItems,
    legendPosition,
    legendFontSize,
    legendTextVisible = true,
    legendTitleVisible = false,
    legendTitleHeight,
    valueAxis,
    valueDisplayUnits = 'Auto',
    valueDecimals = 'Auto',
    categoryAxis,
    categoryMaxLines = 1,
    categorySize = 20,
    categoryMaxWidthPct = 25,
    categoryMaxHeightPct = 25,
    gridlineCount = 4,
  } = options

  const isVertical = orientation === 'vertical'
  const isPercent = mode === 'hundredPercent'
  const seriesCount = Math.max(1, seriesColors.length)

  /* ── Chrome + legend ── */
  const { innerRect } = computeContainerLayout(width, height, { padding: OUTER_PADDING })
  const legend = computeLegendLayout(innerRect, legendItems, legendPosition, showLegend, legendFontSize, {
    textVisible: legendTextVisible,
    titleVisible: legendTitleVisible,
    titleHeight: legendTitleHeight,
  })
  const plotRect = legend.plotRect

  /* ── Value scale ── */
  const rawMax = isPercent
    ? 100
    : mode === 'stacked'
      ? Math.max(0, ...values.map(categorySum))
      : Math.max(0, ...values.flat())
  const { max: valueMax, ticks: tickValues } = isPercent
    ? { max: 100, ticks: [0, 25, 50, 75, 100] }
    : niceValueScale(rawMax, gridlineCount)

  const tickLabels = tickValues.map((v) =>
    isPercent ? `${v}%` : formatDisplayValue(v, valueDisplayUnits, valueDecimals, { alreadyScaled: false }),
  )

  /* ── Axis space reservation ── */
  const valueLabelFontSize = valueAxis.labelFontSize
  const catLabelFontSize = categoryAxis.labelFontSize

  // Value-axis label thickness (perpendicular to value axis).
  const longestTickChars = tickLabels.reduce((m, s) => Math.max(m, s.length), 1)
  const valueLabelThickness = valueAxis.showLabels
    ? isVertical
      ? Math.min(plotRect.w * 0.4, longestTickChars * valueLabelFontSize * 0.58 + 6)
      : valueLabelFontSize * 1.2 + 6
    : 0
  const valueTitleThickness = valueAxis.showTitle && valueAxis.titleText ? valueAxis.titleFontSize + 3 : 0
  const valueAxisExtent = valueLabelThickness + valueTitleThickness

  // Category-axis label thickness.
  // • Column (vertical): labels sit under bars → thickness = text height (line
  //   count), capped by the PBI "Maximum height" control.
  // • Bar (horizontal): labels sit beside bars → thickness = width reserved by
  //   the PBI "Maximum width" control. Increasing it directly shrinks the bar
  //   plot width (and a `categorySize` minimum keeps short labels readable).
  const estimatedCategoryLabelWidth = longestCategoryChars(categories) * catLabelFontSize * 0.58 + 8
  const categoryLabelThickness = categoryAxis.showLabels
    ? isVertical
      ? Math.min(
          catLabelFontSize * 1.04 * Math.max(1, categoryMaxLines) + 5,
          plotRect.h * (clamp(categoryMaxHeightPct, 8, 60) / 100) + catLabelFontSize,
        )
      : clamp(
          estimatedCategoryLabelWidth,
          Math.min(28 + clamp(categorySize, 0, 80) * 0.08, plotRect.w * 0.2),
          plotRect.w * 0.55,
        )
    : 0
  const categoryMaxWidth = plotRect.w * (clamp(categoryMaxWidthPct, 8, 55) / 100)
  const categoryLabelExtent = isVertical ? categoryLabelThickness : Math.min(categoryLabelThickness, categoryMaxWidth)
  const categoryTitleThickness = categoryAxis.showTitle && categoryAxis.titleText ? categoryAxis.titleFontSize + 3 : 0
  const categoryAxisExtent = categoryLabelExtent + categoryTitleThickness

  const valueSwitched = valueAxis.switchPosition
  const categorySwitched = categoryAxis.switchPosition

  /* ── Inner plot rect ── */
  let innerPlot: Rect
  let valueAxisRect: Rect
  let categoryAxisRect: Rect

  if (isVertical) {
    // Column: value axis vertical (left/right), category axis horizontal (bottom/top).
    const left = valueSwitched ? 0 : valueAxisExtent
    const right = valueSwitched ? valueAxisExtent : 0
    const top = categorySwitched ? categoryAxisExtent : 0
    const bottom = categorySwitched ? 0 : categoryAxisExtent
    innerPlot = {
      x: plotRect.x + left,
      y: plotRect.y + top,
      w: Math.max(10, plotRect.w - left - right),
      h: Math.max(10, plotRect.h - top - bottom),
    }
    valueAxisRect = {
      x: valueSwitched ? innerPlot.x + innerPlot.w : plotRect.x,
      y: innerPlot.y,
      w: valueAxisExtent,
      h: innerPlot.h,
    }
    categoryAxisRect = {
      x: innerPlot.x,
      y: categorySwitched ? plotRect.y : innerPlot.y + innerPlot.h,
      w: innerPlot.w,
      h: categoryAxisExtent,
    }
  } else {
    // Bar: category axis vertical (left/right), value axis horizontal (bottom/top).
    const left = categorySwitched ? 0 : categoryAxisExtent
    const right = categorySwitched ? categoryAxisExtent : 0
    const top = valueSwitched ? valueAxisExtent : 0
    const bottom = valueSwitched ? 0 : valueAxisExtent
    innerPlot = {
      x: plotRect.x + left,
      y: plotRect.y + top,
      w: Math.max(10, plotRect.w - left - right),
      h: Math.max(10, plotRect.h - top - bottom),
    }
    categoryAxisRect = {
      x: categorySwitched ? innerPlot.x + innerPlot.w : plotRect.x,
      y: innerPlot.y,
      w: categoryAxisExtent,
      h: innerPlot.h,
    }
    valueAxisRect = {
      x: innerPlot.x,
      y: valueSwitched ? plotRect.y : innerPlot.y + innerPlot.h,
      w: innerPlot.w,
      h: valueAxisExtent,
    }
  }

  /* ── Value position mapping ── */
  const valueBaseline = isVertical ? innerPlot.y + innerPlot.h : innerPlot.x
  const valueToPos = (v: number): number =>
    isVertical
      ? innerPlot.y + innerPlot.h * (1 - v / valueMax)
      : innerPlot.x + innerPlot.w * (v / valueMax)
  const valueToLength = (v: number): number =>
    ((Math.max(0, v) / valueMax) * (isVertical ? innerPlot.h : innerPlot.w))

  const valueTicks: CartesianValueTick[] = tickValues.map((value, i) => ({
    value,
    pos: round(valueToPos(value)),
    label: tickLabels[i],
  }))

  /* ── Category bands ── */
  const nCats = Math.max(1, categories.length)
  const bandExtent = (isVertical ? innerPlot.w : innerPlot.h) / nCats
  const bandAxisStart = isVertical ? innerPlot.x : innerPlot.y
  const categoryBands: CartesianCategoryBand[] = categories.map((label, i) => {
    const bandStart = bandAxisStart + i * bandExtent
    return {
      categoryIdx: i,
      label,
      center: round(bandStart + bandExtent / 2),
      bandStart: round(bandStart),
      bandSize: round(bandExtent),
    }
  })

  /* ── Bar thickness ──
   * Fraction of each category band occupied by bars (the remainder is the
   * inter-category gap). Tuned toward Power BI defaults: thick bars with a
   * small gap. `categorySize` (minimum category width) nudges the fill up. */
  const grouped = mode === 'clustered'
  const stacked = mode === 'stacked' || isPercent
  const sizeNudge = clamp(categorySize, 0, 80) * 0.0009 // 0..0.072
  const fillRatio = (grouped ? 0.74 : stacked ? 0.82 : 0.76) + sizeNudge
  const groupThickness = bandExtent * Math.min(0.92, fillRatio)
  const barGap = grouped ? Math.min(2.5, groupThickness * 0.06) : 0
  const rawPerBar = grouped
    ? (groupThickness - barGap * (seriesCount - 1)) / seriesCount
    : groupThickness
  const maxBarThickness = isVertical ? (grouped ? 28 : 36) : 30
  const perBarThickness = Math.max(2, Math.min(rawPerBar, maxBarThickness))

  /* ── Segments ── */
  const segments: CartesianSegment[] = []

  categories.forEach((_, ci) => {
    const row = values[ci] ?? []
    const sum = categorySum(row)
    const norm = isPercent && sum > 0 ? 100 / sum : 1
    const band = categoryBands[ci]

    if (grouped) {
      const groupStart = band.center - groupThickness / 2
      row.forEach((rawValue, si) => {
        const value = Math.max(0, rawValue)
        const len = valueToLength(value)
        const offset = groupStart + si * (perBarThickness + barGap)
        if (isVertical) {
          segments.push({
            categoryIdx: ci, seriesIdx: si,
            x: round(offset), y: round(valueBaseline - len),
            w: round(perBarThickness), h: round(len),
            color: seriesColors[si] ?? seriesColors[0], value, rawValue,
          })
        } else {
          segments.push({
            categoryIdx: ci, seriesIdx: si,
            x: round(valueBaseline), y: round(offset),
            w: round(len), h: round(perBarThickness),
            color: seriesColors[si] ?? seriesColors[0], value, rawValue,
          })
        }
      })
    } else if (stacked) {
      const thickness = perBarThickness
      const start = band.center - thickness / 2
      let cursor = 0 // accumulated value
      row.forEach((rawValue, si) => {
        const value = Math.max(0, rawValue) * norm
        const len = valueToLength(value)
        if (isVertical) {
          const yTop = valueBaseline - valueToLength(cursor) - len
          segments.push({
            categoryIdx: ci, seriesIdx: si,
            x: round(start), y: round(yTop),
            w: round(thickness), h: round(len),
            color: seriesColors[si] ?? seriesColors[0], value, rawValue,
          })
        } else {
          const xStart = valueBaseline + valueToLength(cursor)
          segments.push({
            categoryIdx: ci, seriesIdx: si,
            x: round(xStart), y: round(start),
            w: round(len), h: round(thickness),
            color: seriesColors[si] ?? seriesColors[0], value, rawValue,
          })
        }
        cursor += value
      })
    } else {
      // single series
      const rawValue = row[0] ?? 0
      const value = Math.max(0, rawValue)
      const len = valueToLength(value)
      const thickness = perBarThickness
      const start = band.center - thickness / 2
      if (isVertical) {
        segments.push({
          categoryIdx: ci, seriesIdx: 0,
          x: round(start), y: round(valueBaseline - len),
          w: round(thickness), h: round(len),
          color: seriesColors[0], value, rawValue,
        })
      } else {
        segments.push({
          categoryIdx: ci, seriesIdx: 0,
          x: round(valueBaseline), y: round(start),
          w: round(len), h: round(thickness),
          color: seriesColors[0], value, rawValue,
        })
      }
    }
  })

  return {
    orientation,
    mode,
    plotRect,
    innerPlot,
    legend,
    legendItems,
    segments,
    valueTicks,
    categoryBands,
    valueBaseline: round(valueBaseline),
    valueAxisSwitched: valueSwitched,
    categoryAxisSwitched: categorySwitched,
    valueIsPercent: isPercent,
    valueMax,
    valueAxisRect,
    categoryAxisRect,
  }
}
