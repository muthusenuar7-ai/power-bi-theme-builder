import type { LayoutPlan } from '@/types'
import { PAGE_SIZES } from './pageSizes'
import { CHART_POOL } from './chartPool'

/*
 * Curated page compositions — one per dashboard page label (see
 * DashboardLayout.PAGE_LABELS). Each page leads with the 4 visuals shown in a
 * 2×2 grid and carries extras to fill 3×2 / 4×2 grids on larger canvases.
 * Composition goals: a balanced mix per theme, no repeated visual on a page,
 * and Donut/Pie used sparingly (Overview + Marketing only).
 */
// Page 0 — Overview (Executive summary): trend + comparison + share + detail
const PAGE_0_VISUAL_IDS = ['clusteredcol', 'line', 'donut', 'table', 'area', 'bar', 'scatter', 'matrix']
// Page 1 — Sales (Revenue & pipeline): bar / column emphasis + pipeline funnel
const PAGE_1_VISUAL_IDS = ['bar', 'clusteredcol', 'stackedcol', 'line', 'column', 'clusteredbar', 'area', 'funnel']
// Page 2 — Operations (Throughput & SLA): advanced / combo mix
const PAGE_2_VISUAL_IDS = ['lineclustered', 'waterfall', 'ribbon', 'hundredstackedcol', 'stackedarea', 'linestacked', 'treemap', 'scatter']
// Page 3 — Finance (P&L and cash): tables, matrix, decomposition, scatter/bubble
const PAGE_3_VISUAL_IDS = ['table', 'matrix', 'waterfall', 'scatter', 'decompositiontree', 'bubble', 'line', 'clusteredcol']
// Page 4 — Marketing (Campaigns & attribution): treemap, ribbon, scatter, share
const PAGE_4_VISUAL_IDS = ['treemap', 'ribbon', 'scatter', 'funnel', 'waterfall', 'bubble', 'area', 'pie']
// Page 5 — HR (Headcount & talent): table, matrix, decomposition, bubble
const PAGE_5_VISUAL_IDS = ['table', 'matrix', 'decompositiontree', 'bubble', 'clusteredbar', 'line', 'column', 'scatter']

function getGridConfig(w: number): { cols: number; rows: number } {
  if (w < 700)  return { cols: 1, rows: 3 }
  if (w < 1000) return { cols: 2, rows: 2 }
  if (w < 1700) return { cols: 2, rows: 2 }
  if (w < 2300) return { cols: 3, rows: 2 }
  return { cols: 4, rows: 2 }
}

const CURATED_PAGES: Record<number, string[]> = {
  0: PAGE_0_VISUAL_IDS,
  1: PAGE_1_VISUAL_IDS,
  2: PAGE_2_VISUAL_IDS,
  3: PAGE_3_VISUAL_IDS,
  4: PAGE_4_VISUAL_IDS,
  5: PAGE_5_VISUAL_IDS,
}

/** Number of curated dashboard pages — matches DashboardLayout.PAGE_LABELS. */
const CURATED_PAGE_COUNT = Object.keys(CURATED_PAGES).length

export function getLayoutPlan(pageSizeKey: string): LayoutPlan {
  const size = PAGE_SIZES[pageSizeKey] ?? PAGE_SIZES['16:9']
  const { cols, rows } = getGridConfig(size.w)
  const chartsPerPage = cols * rows
  const totalCharts = CHART_POOL.length
  // Page count is driven by the curated compositions so every page is a
  // hand-balanced dashboard rather than an arbitrary slice of the pool.
  const totalPages = CURATED_PAGE_COUNT

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
  const curated = CURATED_PAGES[page]
  if (curated) {
    const result = curated
      .map((id) => CHART_POOL.find((c) => c.id === id))
      .filter((c): c is NonNullable<typeof c> => c != null)
      .slice(0, chartsPerPage)
    if (result.length > 0) return result
  }
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
