/**
 * Line / Area Adapter — geometry for the line & area families.
 *
 * Handles four modes:
 *   • line                — one polyline per series, no fill
 *   • area                — overlapping filled areas (baseline 0)
 *   • stackedArea         — cumulative stacked areas
 *   • hundredPercentArea  — stacked areas normalised to 100 % per category
 *
 * All line/area visuals are "vertical": category/time on the X axis, value on
 * the Y axis. Coordinates are returned in SVG viewBox units. When the consuming
 * component drives the viewBox from a ResizeObserver (1:1 with the rendered
 * pixel box) these units equal CSS pixels, so font sizes render at their
 * intended size regardless of card / focus size.
 */

import {
  computeContainerLayout,
  computeLegendLayout,
  formatDisplayValue,
} from '../core'
import type { LegendItem, LegendLayoutResult, Point, Rect } from '../core'

export type LineAreaMode = 'line' | 'area' | 'stackedArea' | 'hundredPercentArea'

export interface LineAreaAxisInput {
  showLabels: boolean
  labelFontSize: number
  showTitle: boolean
  titleText: string
  titleFontSize: number
  switchPosition: boolean
}

export interface LineAreaModelOptions {
  width: number
  height: number
  mode: LineAreaMode
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

  /* value axis (numeric, Y) */
  valueAxis: LineAreaAxisInput
  valueDisplayUnits?: string
  valueDecimals?: string

  /* category axis (discrete/time, X) */
  categoryAxis: LineAreaAxisInput
  categoryMaxLines?: number

  gridlineCount?: number
}

export interface LineAreaDataPoint {
  categoryIdx: number
  x: number
  y: number
  rawValue: number
  /** Normalised value (raw for line/area, percent for 100 % stacked) */
  value: number
}

export interface LineAreaSeriesGeometry {
  seriesIdx: number
  label: string
  color: string
  /** Top edge of the series (the visible line) */
  linePoints: Point[]
  /** Bottom edge used to close the area polygon (baseline or previous layer) */
  basePoints: Point[]
  /** Marker centres (same as linePoints) */
  markers: Point[]
  dataPoints: LineAreaDataPoint[]
}

export interface LineAreaValueTick {
  value: number
  pos: number
  label: string
}

export interface LineAreaCategoryBand {
  categoryIdx: number
  label: string
  center: number
}

export interface LineAreaModel {
  mode: LineAreaMode
  plotRect: Rect
  innerPlot: Rect
  legend: LegendLayoutResult
  legendItems: LegendItem[]
  series: LineAreaSeriesGeometry[]
  valueTicks: LineAreaValueTick[]
  categoryBands: LineAreaCategoryBand[]
  valueBaseline: number
  valueMax: number
  valueIsPercent: boolean
  valueAxisSwitched: boolean
  categoryAxisSwitched: boolean
  valueAxisRect: Rect
  categoryAxisRect: Rect
}

const OUTER_PADDING = { top: 4, right: 6, bottom: 4, left: 6 }

function round(n: number): number {
  return Math.round(n * 1000) / 1000
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

function categorySum(row: number[]): number {
  return row.reduce((sum, v) => sum + Math.max(0, v), 0)
}

export function buildLineAreaModel(options: LineAreaModelOptions): LineAreaModel {
  const {
    width,
    height,
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
    gridlineCount = 4,
  } = options

  const isPercent = mode === 'hundredPercentArea'
  const isStacked = mode === 'stackedArea' || isPercent
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
    : isStacked
      ? Math.max(0, ...values.map(categorySum))
      : Math.max(0, ...values.flat())
  const { max: valueMax, ticks: tickValues } = isPercent
    ? { max: 100, ticks: [0, 25, 50, 75, 100] }
    : niceValueScale(rawMax, gridlineCount)

  const tickLabels = tickValues.map((v) =>
    isPercent ? `${v}%` : formatDisplayValue(v, valueDisplayUnits, valueDecimals, { alreadyScaled: false }),
  )

  /* ── Axis space reservation (vertical orientation) ── */
  const valueLabelFontSize = valueAxis.labelFontSize
  const catLabelFontSize = categoryAxis.labelFontSize

  const longestTickChars = tickLabels.reduce((m, s) => Math.max(m, s.length), 1)
  const valueLabelThickness = valueAxis.showLabels
    ? Math.min(plotRect.w * 0.4, longestTickChars * valueLabelFontSize * 0.58 + 6)
    : 0
  const valueTitleThickness = valueAxis.showTitle && valueAxis.titleText ? valueAxis.titleFontSize + 5 : 0
  const valueAxisExtent = valueLabelThickness + valueTitleThickness

  const categoryLabelThickness = categoryAxis.showLabels
    ? catLabelFontSize * 1.1 * Math.max(1, categoryMaxLines) + 6
    : 0
  const categoryTitleThickness = categoryAxis.showTitle && categoryAxis.titleText ? categoryAxis.titleFontSize + 5 : 0
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

  const valueTicks: LineAreaValueTick[] = tickValues.map((value, i) => ({
    value,
    pos: round(valueToPos(value)),
    label: tickLabels[i],
  }))

  /* ── Category X positions (edge-to-edge so lines span the plot) ── */
  const nCats = Math.max(1, categories.length)
  const xAt = (i: number): number =>
    nCats === 1 ? innerPlot.x + innerPlot.w / 2 : innerPlot.x + (i / (nCats - 1)) * innerPlot.w
  const categoryBands: LineAreaCategoryBand[] = categories.map((label, i) => ({
    categoryIdx: i,
    label,
    center: round(xAt(i)),
  }))

  /* ── Series geometry ── */
  const cumulative = new Array(nCats).fill(0) // running stack total per category
  const series: LineAreaSeriesGeometry[] = []

  for (let si = 0; si < seriesCount; si++) {
    const linePoints: Point[] = []
    const basePoints: Point[] = []
    const dataPoints: LineAreaDataPoint[] = []

    categories.forEach((_, ci) => {
      const row = values[ci] ?? []
      const rawValue = row[si] ?? 0
      const x = xAt(ci)

      if (isStacked) {
        const sum = categorySum(row)
        const norm = isPercent && sum > 0 ? 100 / sum : 1
        const value = Math.max(0, rawValue) * norm
        const prev = cumulative[ci]
        const topVal = prev + value
        linePoints.push({ x: round(x), y: round(valueToPos(topVal)) })
        basePoints.push({ x: round(x), y: round(valueToPos(prev)) })
        dataPoints.push({ categoryIdx: ci, x: round(x), y: round(valueToPos(topVal)), rawValue, value })
        cumulative[ci] = topVal
      } else {
        const value = rawValue
        const y = valueToPos(value)
        linePoints.push({ x: round(x), y: round(y) })
        basePoints.push({ x: round(x), y: round(valueBaseline) })
        dataPoints.push({ categoryIdx: ci, x: round(x), y: round(y), rawValue, value })
      }
    })

    series.push({
      seriesIdx: si,
      label: legendItems[si]?.label ?? `Series ${si + 1}`,
      color: seriesColors[si] ?? seriesColors[0],
      linePoints,
      basePoints,
      markers: linePoints,
      dataPoints,
    })
  }

  return {
    mode,
    plotRect,
    innerPlot,
    legend,
    legendItems,
    series,
    valueTicks,
    categoryBands,
    valueBaseline: round(valueBaseline),
    valueMax,
    valueIsPercent: isPercent,
    valueAxisSwitched: valueSwitched,
    categoryAxisSwitched: categorySwitched,
    valueAxisRect,
    categoryAxisRect,
  }
}
