import type { LayoutPlan } from '@/types'
import { PAGE_SIZES } from './pageSizes'
import { CHART_POOL } from './chartPool'

function getGridConfig(w: number): { cols: number; rows: number } {
  if (w < 700)  return { cols: 1, rows: 3 }
  if (w < 1000) return { cols: 2, rows: 2 }
  if (w < 1700) return { cols: 2, rows: 2 }
  if (w < 2300) return { cols: 3, rows: 2 }
  return { cols: 4, rows: 2 }
}

export function getLayoutPlan(pageSizeKey: string): LayoutPlan {
  const size = PAGE_SIZES[pageSizeKey] ?? PAGE_SIZES['16:9']
  const { cols, rows } = getGridConfig(size.w)
  const chartsPerPage = cols * rows
  const totalCharts = CHART_POOL.length
  const totalPages = Math.ceil(totalCharts / chartsPerPage)

  return {
    pageSizeKey,
    cols,
    rows,
    chartsPerPage,
    totalCharts,
    totalPages,
    pageWidth: size.w,
    pageHeight: size.h,
  }
}

export function getTotalPages(pageSizeKey: string): number {
  return getLayoutPlan(pageSizeKey).totalPages
}

export function getChartsForPage(pageSizeKey: string, page: number) {
  const { chartsPerPage } = getLayoutPlan(pageSizeKey)
  const start = page * chartsPerPage
  return CHART_POOL.slice(start, start + chartsPerPage)
}

export function getSlicerWidth(pageWidth: number): number {
  if (pageWidth < 700)  return pageWidth
  if (pageWidth < 1000) return 160
  if (pageWidth < 1700) return 200
  if (pageWidth < 2300) return 220
  return 260
}
