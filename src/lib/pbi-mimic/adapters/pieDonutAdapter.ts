import {
  computeCircleRadius,
  computeContainerLayout,
  computeLegendLayout,
  computePieLabels,
  polarRad,
} from '../core'
import type { LegendItem, LegendLayoutResult, PieLabelPoint, Rect } from '../core'

export interface PieDonutDatum {
  label: string
  value: number
  color: string
}

export interface PieDonutSlice extends PieDonutDatum {
  index: number
  startDeg: number
  endDeg: number
  sweepDeg: number
  percent: number
  path: string
}

export interface PieDonutModel {
  width: number
  height: number
  isDonut: boolean
  plotRect: Rect
  legend: LegendLayoutResult
  legendItems: LegendItem[]
  slices: PieDonutSlice[]
  labelPoints: PieLabelPoint[]
  cx: number
  cy: number
  outerRadius: number
  innerRadius: number
  total: number
}

export interface PieDonutModelOptions {
  width: number
  height: number
  data: PieDonutDatum[]
  isDonut: boolean
  showLegend: boolean
  legendPosition: string
  legendFontSize: number
  legendTextVisible?: boolean
  legendTitleVisible?: boolean
  legendTitleHeight?: number
  showDataLabels: boolean
  innerRadiusRatio?: number
  startAngleDeg?: number
  minLabelPercent?: number
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000
}

function pointOnCircle(cx: number, cy: number, r: number, deg: number) {
  const rad = polarRad(deg)
  return {
    x: round(cx + r * Math.cos(rad)),
    y: round(cy + r * Math.sin(rad)),
  }
}

export function pieSlicePath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = pointOnCircle(cx, cy, r, startDeg)
  const end = pointOnCircle(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx},${cy} L ${start.x},${start.y} A ${r},${r} 0 ${large} 1 ${end.x},${end.y} Z`
}

export function donutSlicePath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startDeg: number,
  endDeg: number,
): string {
  const outerStart = pointOnCircle(cx, cy, outerRadius, startDeg)
  const outerEnd = pointOnCircle(cx, cy, outerRadius, endDeg)
  const innerStart = pointOnCircle(cx, cy, innerRadius, startDeg)
  const innerEnd = pointOnCircle(cx, cy, innerRadius, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0

  return [
    `M ${outerStart.x},${outerStart.y}`,
    `A ${outerRadius},${outerRadius} 0 ${large} 1 ${outerEnd.x},${outerEnd.y}`,
    `L ${innerEnd.x},${innerEnd.y}`,
    `A ${innerRadius},${innerRadius} 0 ${large} 0 ${innerStart.x},${innerStart.y}`,
    'Z',
  ].join(' ')
}

export function buildPieDonutModel(options: PieDonutModelOptions): PieDonutModel {
  const {
    width,
    height,
    data,
    isDonut,
    showLegend,
    legendPosition,
    legendFontSize,
    legendTextVisible = true,
    legendTitleVisible = false,
    legendTitleHeight,
    showDataLabels,
    innerRadiusRatio = 0.5,
    startAngleDeg = 0,
    minLabelPercent = 4,
  } = options

  const { innerRect } = computeContainerLayout(width, height)
  const legendItems = data.map((datum) => ({ label: datum.label, color: datum.color }))
  const legend = computeLegendLayout(innerRect, legendItems, legendPosition, showLegend, legendFontSize, {
    textVisible: legendTextVisible,
    titleVisible: legendTitleVisible,
    titleHeight: legendTitleHeight,
  })
  const plotRect = legend.plotRect

  const cx = round(plotRect.x + plotRect.w / 2)
  const cy = round(plotRect.y + plotRect.h / 2)
  const outerRadius = computeCircleRadius(plotRect.w, plotRect.h, showDataLabels)
  const innerRadius = isDonut
    ? round(outerRadius * Math.max(0.15, Math.min(0.85, innerRadiusRatio)))
    : 0
  const total = data.reduce((sum, datum) => sum + Math.max(0, datum.value), 0) || 1

  let cursor = startAngleDeg
  const slices: PieDonutSlice[] = data.map((datum, index) => {
    const value = Math.max(0, datum.value)
    const sweepDeg = (value / total) * 360
    const startDeg = cursor
    const endDeg = cursor + sweepDeg
    cursor = endDeg

    return {
      ...datum,
      index,
      startDeg,
      endDeg,
      sweepDeg,
      percent: (value / total) * 100,
      path: isDonut
        ? donutSlicePath(cx, cy, outerRadius, innerRadius, startDeg, endDeg)
        : pieSlicePath(cx, cy, outerRadius, startDeg, endDeg),
    }
  })

  const labelPoints = showDataLabels
    ? computePieLabels(
        cx,
        cy,
        outerRadius,
        6,
        14,
        slices.map((slice) => ({
          sliceIdx: slice.index,
          startDeg: slice.startDeg,
          endDeg: slice.endDeg,
          pct: slice.percent,
        })),
        minLabelPercent,
        plotRect,
      )
    : []

  return {
    width,
    height,
    isDonut,
    plotRect,
    legend,
    legendItems,
    slices,
    labelPoints,
    cx,
    cy,
    outerRadius,
    innerRadius,
    total,
  }
}

export function sliceStartLine(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startDeg: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const outer = pointOnCircle(cx, cy, outerRadius, startDeg)
  const inner = pointOnCircle(cx, cy, innerRadius, startDeg)

  return {
    x1: inner.x,
    y1: inner.y,
    x2: outer.x,
    y2: outer.y,
  }
}
