/**
 * Combo Adapter — geometry for column + line combo visuals.
 *
 * Supports the two Power BI combo flavours:
 *   • clustered column + line  (lineClustered)
 *   • stacked column + line    (lineStacked)
 *
 * Columns and line(s) currently share a single value axis (a secondary axis is
 * a future enhancement — see docs/qa/line-area-combo-mimic.md). Combo visuals
 * are always vertical: category on the X axis, value on the Y axis.
 *
 * Coordinates are returned in SVG viewBox units; when the consuming component
 * drives the viewBox from a ResizeObserver (1:1 with the rendered pixel box)
 * these units equal CSS pixels, so font sizes render at intended size.
 */

import {
  computeContainerLayout,
  computeLegendLayout,
  formatDisplayValue,
} from '../core'
import type { LegendItem, LegendLayoutResult, Point, Rect } from '../core'

export type ComboColumnMode = 'clustered' | 'stacked'

export interface ComboLegendItem extends LegendItem {
  kind: 'bar' | 'line'
}

export interface ComboAxisInput {
  showLabels: boolean
  labelFontSize: number
  showTitle: boolean
  titleText: string
  titleFontSize: number
  switchPosition: boolean
}

export interface ComboModelOptions {
  width: number
  height: number
  columnMode: ComboColumnMode
  categories: string[]

  /** Column series colours and values[categoryIndex][seriesIndex] */
  columnColors: string[]
  columnValues: number[][]

  /** Line series colours and values[categoryIndex][lineSeriesIndex] */
  lineColors: string[]
  lineValues: number[][]

  /* legend */
  showLegend: boolean
  legendItems: ComboLegendItem[]
  legendPosition: string
  legendFontSize: number
  legendTextVisible?: boolean
  legendTitleVisible?: boolean
  legendTitleHeight?: number

  /* value axis (numeric, Y) */
  valueAxis: ComboAxisInput
  valueDisplayUnits?: string
  valueDecimals?: string

  /* category axis (discrete, X) */
  categoryAxis: ComboAxisInput
  categoryMaxLines?: number

  gridlineCount?: number
}

export interface ComboColumnSegment {
  categoryIdx: number
  seriesIdx: number
  x: number
  y: number
  w: number
  h: number
  color: string
  value: number
  rawValue: number
}

export interface ComboLineDataPoint {
  categoryIdx: number
  x: number
  y: number
  rawValue: number
}

export interface ComboLineGeometry {
  seriesIdx: number
  label: string
  color: string
  points: Point[]
  markers: Point[]
  dataPoints: ComboLineDataPoint[]
}

export interface ComboValueTick {
  value: number
  pos: number
  label: string
}

export interface ComboCategoryBand {
  categoryIdx: number
  label: string
  center: number
  bandStart: number
  bandSize: number
}

export interface ComboModel {
  columnMode: ComboColumnMode
  plotRect: Rect
  innerPlot: Rect
  legend: LegendLayoutResult
  legendItems: ComboLegendItem[]
  columnSegments: ComboColumnSegment[]
  lineSeries: ComboLineGeometry[]
  valueTicks: ComboValueTick[]
  categoryBands: ComboCategoryBand[]
  valueBaseline: number
  valueMax: number
  valueAxisSwitched: boolean
  categoryAxisSwitched: boolean
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

function categorySum(row: number[]): number {
  return row.reduce((sum, v) => sum + Math.max(0, v), 0)
}

export function buildComboModel(options: ComboModelOptions): ComboModel {
  const {
    width,
    height,
    columnMode,
    categories,
    columnColors,
    columnValues,
    lineColors,
    lineValues,
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
    gridlineCount = 4,
  } = options

  const stacked = columnMode === 'stacked'
  const colSeriesCount = Math.max(1, columnColors.length)
  const lineSeriesCount = Math.max(0, lineColors.length)

  /* ── Chrome + legend ── */
  const { innerRect } = computeContainerLayout(width, height, { padding: OUTER_PADDING })
  const legend = computeLegendLayout(innerRect, legendItems, legendPosition, showLegend, legendFontSize, {
    textVisible: legendTextVisible,
    titleVisible: legendTitleVisible,
    titleHeight: legendTitleHeight,
  })
  const plotRect = legend.plotRect

  /* ── Value scale (columns + lines share one axis) ── */
  const colMax = stacked
    ? Math.max(0, ...columnValues.map(categorySum))
    : Math.max(0, ...columnValues.flat())
  const lineMax = Math.max(0, ...lineValues.flat())
  const rawMax = Math.max(colMax, lineMax)
  const { max: valueMax, ticks: tickValues } = niceValueScale(rawMax, gridlineCount)
  const tickLabels = tickValues.map((v) =>
    formatDisplayValue(v, valueDisplayUnits, valueDecimals, { alreadyScaled: false }),
  )

  /* ── Axis space reservation (vertical) ── */
  const valueLabelFontSize = valueAxis.labelFontSize
  const catLabelFontSize = categoryAxis.labelFontSize

  const longestTickChars = tickLabels.reduce((m, s) => Math.max(m, s.length), 1)
  const valueLabelThickness = valueAxis.showLabels
    ? Math.min(plotRect.w * 0.4, longestTickChars * valueLabelFontSize * 0.58 + 6)
    : 0
  const valueTitleThickness = valueAxis.showTitle && valueAxis.titleText ? valueAxis.titleFontSize + 3 : 0
  const valueAxisExtent = valueLabelThickness + valueTitleThickness

  const categoryLabelThickness = categoryAxis.showLabels
    ? catLabelFontSize * 1.04 * Math.max(1, categoryMaxLines) + 5
    : 0
  const categoryTitleThickness = categoryAxis.showTitle && categoryAxis.titleText ? categoryAxis.titleFontSize + 3 : 0
  const categoryAxisExtent = categoryLabelThickness + categoryTitleThickness

  const valueSwitched = valueAxis.switchPosition
  const categorySwitched = categoryAxis.switchPosition

  /* ── Inner plot rect ── */
  const left = valueSwitched ? 0 : valueAxisExtent
  const right = valueSwitched ? valueAxisExtent : 0
  const top = categorySwitched ? categoryAxisExtent : 0
  const bottom = categorySwitched ? 0 : categoryAxisExtent
  const innerPlot: Rect = {
    x: plotRect.x + left,
    y: plotRect.y + top,
    w: Math.max(10, plotRect.w - left - right),
    h: Math.max(10, plotRect.h - top - bottom),
  }
  const valueAxisRect: Rect = {
    x: valueSwitched ? innerPlot.x + innerPlot.w : plotRect.x,
    y: innerPlot.y,
    w: valueAxisExtent,
    h: innerPlot.h,
  }
  const categoryAxisRect: Rect = {
    x: innerPlot.x,
    y: categorySwitched ? plotRect.y : innerPlot.y + innerPlot.h,
    w: innerPlot.w,
    h: categoryAxisExtent,
  }

  /* ── Value mapping ── */
  const valueBaseline = innerPlot.y + innerPlot.h
  const valueToPos = (v: number): number => innerPlot.y + innerPlot.h * (1 - v / valueMax)
  const valueToLength = (v: number): number => (Math.max(0, v) / valueMax) * innerPlot.h

  const valueTicks: ComboValueTick[] = tickValues.map((value, i) => ({
    value,
    pos: round(valueToPos(value)),
    label: tickLabels[i],
  }))

  /* ── Category bands ── */
  const nCats = Math.max(1, categories.length)
  const bandExtent = innerPlot.w / nCats
  const categoryBands: ComboCategoryBand[] = categories.map((label, i) => {
    const bandStart = innerPlot.x + i * bandExtent
    return {
      categoryIdx: i,
      label,
      center: round(bandStart + bandExtent / 2),
      bandStart: round(bandStart),
      bandSize: round(bandExtent),
    }
  })

  /* ── Column thickness ── */
  const fillRatio = stacked ? 0.58 : 0.62
  const groupThickness = bandExtent * fillRatio
  const barGap = stacked ? 0 : Math.min(3, groupThickness * 0.08)
  const rawPerBarThickness = stacked
    ? groupThickness
    : Math.max(2, (groupThickness - barGap * (colSeriesCount - 1)) / colSeriesCount)
  const perBarThickness = Math.max(2, Math.min(rawPerBarThickness, stacked ? 34 : 28))

  /* ── Column segments ── */
  const columnSegments: ComboColumnSegment[] = []
  categories.forEach((_, ci) => {
    const row = columnValues[ci] ?? []
    const band = categoryBands[ci]

    if (stacked) {
      const start = band.center - perBarThickness / 2
      let cursor = 0
      row.forEach((rawValue, si) => {
        const value = Math.max(0, rawValue)
        const len = valueToLength(value)
        const yTop = valueBaseline - valueToLength(cursor) - len
        columnSegments.push({
          categoryIdx: ci, seriesIdx: si,
          x: round(start), y: round(yTop),
          w: round(perBarThickness), h: round(len),
          color: columnColors[si] ?? columnColors[0], value, rawValue,
        })
        cursor += value
      })
    } else {
      const groupStart = band.center - groupThickness / 2
      row.forEach((rawValue, si) => {
        const value = Math.max(0, rawValue)
        const len = valueToLength(value)
        const offset = groupStart + si * (perBarThickness + barGap)
        columnSegments.push({
          categoryIdx: ci, seriesIdx: si,
          x: round(offset), y: round(valueBaseline - len),
          w: round(perBarThickness), h: round(len),
          color: columnColors[si] ?? columnColors[0], value, rawValue,
        })
      })
    }
  })

  /* ── Line series (aligned to band centres) ── */
  const lineSeries: ComboLineGeometry[] = []
  for (let li = 0; li < lineSeriesCount; li++) {
    const points: Point[] = []
    const dataPoints: ComboLineDataPoint[] = []
    categories.forEach((_, ci) => {
      const rawValue = lineValues[ci]?.[li] ?? 0
      const x = categoryBands[ci].center
      const y = valueToPos(clamp(rawValue, 0, valueMax))
      points.push({ x: round(x), y: round(y) })
      dataPoints.push({ categoryIdx: ci, x: round(x), y: round(y), rawValue })
    })
    lineSeries.push({
      seriesIdx: li,
      label: legendItems.filter((it) => it.kind === 'line')[li]?.label ?? `Line ${li + 1}`,
      color: lineColors[li] ?? lineColors[0],
      points,
      markers: points,
      dataPoints,
    })
  }

  return {
    columnMode,
    plotRect,
    innerPlot,
    legend,
    legendItems,
    columnSegments,
    lineSeries,
    valueTicks,
    categoryBands,
    valueBaseline: round(valueBaseline),
    valueMax,
    valueAxisSwitched: valueSwitched,
    categoryAxisSwitched: categorySwitched,
    valueAxisRect,
    categoryAxisRect,
  }
}
