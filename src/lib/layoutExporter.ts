import type { ChartDefinition, KpiDef, SlicerDef, ThemeState } from '@/types'
import { CHART_POOL } from './chartPool'
import { getChartsForPage, getLayoutPlan } from './layoutEngine'
import { KPI_DEFS } from './kpiDefs'
import { PAGE_SIZES } from './pageSizes'
import { SLICER_DEFS } from './slicerDefs'
import { downloadTextFile } from './exportUtils'

export interface LayoutRect {
  x: number
  y: number
  width: number
  height: number
}

interface ExportedSlicer extends SlicerDef {
  zone: LayoutRect
}

interface ExportedKpi extends KpiDef {
  zone: LayoutRect
}

export interface ExportedChart extends ChartDefinition {
  zone: LayoutRect
}

export interface ExportedLayoutPage {
  pageNumber: number
  header: LayoutRect
  slicerZone: LayoutRect | null
  kpiZone: LayoutRect | null
  chartZone: LayoutRect
  slicers: ExportedSlicer[]
  kpiCards: ExportedKpi[]
  charts: ExportedChart[]
}

export interface ExportedLayoutJSON {
  themeName: string
  pageSize: string
  pageSizeLabel: string
  pageWidth: number
  pageHeight: number
  spacing: number
  slicerPosition: ThemeState['layout']['slicerPos']
  numSlicers: number
  numKpis: number
  currentPage: number
  totalPages: number
  focusVisual: string | null
  pages: ExportedLayoutPage[]
}

const HEADER_HEIGHT = 58
const KPI_HEIGHT = 76
const TOP_SLICER_HEIGHT = 72
const SIDE_SLICER_WIDTH = 190

function roundRect(rect: LayoutRect): LayoutRect {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  }
}

function splitRow(zone: LayoutRect, count: number, gap: number): LayoutRect[] {
  if (count <= 0) return []
  const width = (zone.width - gap * (count - 1)) / count
  return Array.from({ length: count }, (_, index) => roundRect({
    x: zone.x + index * (width + gap),
    y: zone.y,
    width,
    height: zone.height,
  }))
}

function splitColumn(zone: LayoutRect, count: number, gap: number): LayoutRect[] {
  if (count <= 0) return []
  const height = (zone.height - gap * (count - 1)) / count
  return Array.from({ length: count }, (_, index) => roundRect({
    x: zone.x,
    y: zone.y + index * (height + gap),
    width: zone.width,
    height,
  }))
}

function splitGrid(zone: LayoutRect, cols: number, rows: number, gap: number, count: number): LayoutRect[] {
  const cellWidth = (zone.width - gap * (cols - 1)) / cols
  const cellHeight = (zone.height - gap * (rows - 1)) / rows

  return Array.from({ length: count }, (_, index) => {
    const col = index % cols
    const row = Math.floor(index / cols)
    return roundRect({
      x: zone.x + col * (cellWidth + gap),
      y: zone.y + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    })
  })
}

function buildPage(state: ThemeState, pageNumber: number): ExportedLayoutPage {
  const plan = getLayoutPlan(state.pageSize)
  const { layout, spacing } = state
  const pageWidth = plan.pageWidth
  const pageHeight = plan.pageHeight
  const contentX = spacing
  const contentWidth = pageWidth - spacing * 2
  const header = roundRect({ x: contentX, y: spacing, width: contentWidth, height: HEADER_HEIGHT })
  const afterHeaderY = header.y + header.height + spacing
  const bottomY = pageHeight - spacing

  let slicerZone: LayoutRect | null = null
  let kpiZone: LayoutRect | null = null
  let chartZone: LayoutRect

  if (layout.numSlicers > 0 && layout.slicerPos === 'left') {
    slicerZone = roundRect({ x: spacing, y: afterHeaderY, width: SIDE_SLICER_WIDTH, height: bottomY - afterHeaderY })
    const mainX = slicerZone.x + slicerZone.width + spacing
    const mainWidth = pageWidth - mainX - spacing
    if (layout.numKpis > 0) {
      kpiZone = roundRect({ x: mainX, y: afterHeaderY, width: mainWidth, height: KPI_HEIGHT })
      chartZone = roundRect({ x: mainX, y: kpiZone.y + kpiZone.height + spacing, width: mainWidth, height: bottomY - (kpiZone.y + kpiZone.height + spacing) })
    } else {
      chartZone = roundRect({ x: mainX, y: afterHeaderY, width: mainWidth, height: bottomY - afterHeaderY })
    }
  } else if (layout.numSlicers > 0 && layout.slicerPos === 'right') {
    slicerZone = roundRect({ x: pageWidth - spacing - SIDE_SLICER_WIDTH, y: afterHeaderY, width: SIDE_SLICER_WIDTH, height: bottomY - afterHeaderY })
    const mainWidth = slicerZone.x - spacing * 2
    if (layout.numKpis > 0) {
      kpiZone = roundRect({ x: spacing, y: afterHeaderY, width: mainWidth, height: KPI_HEIGHT })
      chartZone = roundRect({ x: spacing, y: kpiZone.y + kpiZone.height + spacing, width: mainWidth, height: bottomY - (kpiZone.y + kpiZone.height + spacing) })
    } else {
      chartZone = roundRect({ x: spacing, y: afterHeaderY, width: mainWidth, height: bottomY - afterHeaderY })
    }
  } else {
    let cursorY = afterHeaderY
    if (layout.numSlicers > 0) {
      slicerZone = roundRect({ x: spacing, y: cursorY, width: contentWidth, height: TOP_SLICER_HEIGHT })
      cursorY += TOP_SLICER_HEIGHT + spacing
    }
    if (layout.numKpis > 0) {
      kpiZone = roundRect({ x: spacing, y: cursorY, width: contentWidth, height: KPI_HEIGHT })
      cursorY += KPI_HEIGHT + spacing
    }
    chartZone = roundRect({ x: spacing, y: cursorY, width: contentWidth, height: bottomY - cursorY })
  }

  const slicerRects = slicerZone
    ? layout.slicerPos === 'top'
      ? splitRow(slicerZone, layout.numSlicers, spacing)
      : splitColumn(slicerZone, layout.numSlicers, spacing)
    : []
  const kpiRects = kpiZone ? splitRow(kpiZone, layout.numKpis, spacing) : []
  const charts = getChartsForPage(state.pageSize, pageNumber)
  const chartRects = splitGrid(chartZone, plan.cols, plan.rows, spacing, charts.length)

  return {
    pageNumber: pageNumber + 1,
    header,
    slicerZone,
    kpiZone,
    chartZone,
    slicers: SLICER_DEFS.slice(0, layout.numSlicers).map((slicer, index) => ({
      ...slicer,
      zone: slicerRects[index],
    })),
    kpiCards: KPI_DEFS.slice(0, layout.numKpis).map((kpi, index) => ({
      ...kpi,
      zone: kpiRects[index],
    })),
    charts: charts.map((chart, index) => ({
      ...chart,
      zone: chartRects[index],
    })),
  }
}

export function generateLayoutJSON(state: ThemeState): ExportedLayoutJSON {
  const plan = getLayoutPlan(state.pageSize)
  const pageSize = PAGE_SIZES[state.pageSize] ?? PAGE_SIZES['16:9']

  return {
    themeName: state.themeName.trim() || 'Datacense Power BI Theme',
    pageSize: pageSize.key,
    pageSizeLabel: pageSize.label,
    pageWidth: plan.pageWidth,
    pageHeight: plan.pageHeight,
    spacing: state.spacing,
    slicerPosition: state.layout.slicerPos,
    numSlicers: state.layout.numSlicers,
    numKpis: state.layout.numKpis,
    currentPage: state.currentPage + 1,
    totalPages: plan.totalPages,
    focusVisual: state.focusVisual,
    pages: Array.from({ length: plan.totalPages }, (_, index) => buildPage(state, index)),
  }
}

export function downloadLayoutJSON(state: ThemeState): void {
  const layout = generateLayoutJSON(state)
  downloadTextFile(
    'datacense-theme-layout.json',
    JSON.stringify(layout, null, 2),
    'application/json;charset=utf-8',
  )
}

export function getCurrentPageLayout(state: ThemeState): ExportedLayoutPage {
  const layout = generateLayoutJSON(state)
  return layout.pages[Math.max(0, Math.min(layout.pages.length - 1, state.currentPage))]
}

export function getAllCharts(): ChartDefinition[] {
  return CHART_POOL
}
