/**
 * Theme Dashboard Preview — data layer (rebuild).
 *
 * Pure, theme-AGNOSTIC sample data for the new Dashboard Preview. These modules
 * own numbers + labels only; every colour is supplied at render time from the
 * resolved DashboardTheme (see dashboardThemeResolver.ts), so the preview is
 * fully theme-driven and never hardcodes a background, card or text colour.
 *
 * Layout/structure lives in themeDashboardTemplates.ts. Detailed per-visual
 * formatting stays in the separate Visuals section — this is preview-only data.
 */

export type Tone = 'ok' | 'warn' | 'bad'

export interface KpiDatum {
  label: string
  value: string
  delta: string
  positive: boolean
  caption: string
}

/** A single month on the Revenue-vs-Target combo chart. */
export interface ComboPoint {
  month: string
  actual: number
  target: number
}

export interface DonutSlice {
  label: string
  value: number
}

/** One treemap tile (theme-agnostic; colours come from the resolved
 *  DashboardTheme dataColors at render time, one palette colour per tile). */
export interface TreemapDatum {
  label: string
  value: number
}

/** Horizontal stacked bar: one row per category, values aligned to `segments`. */
export interface StackedBarData {
  unit: string
  segments: string[]
  categories: string[]
  values: number[][]
}

/** Clustered column: one group per category, values aligned to `series`. */
export interface ClusteredColumnData {
  unit: string
  series: string[]
  groups: string[]
  values: number[][]
}

export interface ProductRow {
  product: string
  revenue: string
  margin: string
  yoy: string
  tone: Tone
}

// ─── Sales Performance Dashboard ────────────────────────────────────────────────

export const SALES_KPIS: KpiDatum[] = [
  { label: 'Revenue',             value: '$842.6M', delta: '+14.2%',  positive: true,  caption: 'vs $737.8M LY' },
  { label: 'Target',              value: '103%',    delta: '+3 pts',  positive: true,  caption: 'of $820M goal' },
  { label: 'Gross Margin',        value: '38.4%',   delta: '+1.8 pts', positive: true,  caption: 'Target 37.0%' },
  { label: 'Average Order Value', value: '$18.4K',  delta: '+6.9%',   positive: true,  caption: 'Up-market mix' },
  { label: 'New Customers',       value: '1,284',   delta: '-4.1%',   positive: false, caption: 'vs 1,339 LY' },
]

/** 12 months, deliberate ups AND downs (not a smooth climb). */
export const SALES_REVENUE_TREND: ComboPoint[] = [
  { month: 'Apr', actual: 58.0, target: 60 },
  { month: 'May', actual: 61.0, target: 63 },
  { month: 'Jun', actual: 56.5, target: 61 },
  { month: 'Jul', actual: 67.0, target: 66 },
  { month: 'Aug', actual: 63.0, target: 66 },
  { month: 'Sep', actual: 71.5, target: 70 },
  { month: 'Oct', actual: 66.0, target: 69 },
  { month: 'Nov', actual: 78.0, target: 75 },
  { month: 'Dec', actual: 72.0, target: 73 },
  { month: 'Jan', actual: 69.0, target: 79 },
  { month: 'Feb', actual: 81.0, target: 78 },
  { month: 'Mar', actual: 77.6, target: 83 },
]

/** 5 slices — donut stays compact (TASK 10: 4–6 slices). */
export const SALES_CHANNELS: DonutSlice[] = [
  { label: 'Enterprise', value: 44 },
  { label: 'Channel',    value: 27 },
  { label: 'Online',     value: 19 },
  { label: 'Inside',     value: 14 },
  { label: 'Renewal',    value: 10 },
]

/** Customer segment revenue mix — one tile per segment. Values are $M and are
 *  deliberately spread so every theme palette colour gets a visible tile. */
export const SALES_SEGMENT_MIX: TreemapDatum[] = [
  { label: 'Enterprise',     value: 312 },
  { label: 'Mid-Market',     value: 218 },
  { label: 'Small Business', value: 146 },
  { label: 'Public Sector',  value: 98 },
  { label: 'Partners',       value: 68 },
]

/** 6 regions × 3 categories (TASK 7/10: 5–6 regions, 3–4 categories). */
export const SALES_REGION_MIX: StackedBarData = {
  unit: '$M',
  segments: ['Products', 'Services', 'Support'],
  categories: ['West', 'South', 'North', 'East', 'Central', 'GCC'],
  values: [
    [168, 96, 48],
    [132, 78, 38],
    [92, 54, 30],
    [54, 32, 20.6],
    [44, 24, 14],
    [34, 20, 10],
  ],
}

/** 7 product groups × 2 series (TASK 7/10: 6–8 groups, balanced columns). */
export const SALES_PRODUCT_PERF: ClusteredColumnData = {
  unit: '$M',
  series: ['Sales', 'Profit'],
  groups: ['BI Enterprise', 'Analytics', 'DataOps', 'Embedded', 'Mobile BI', 'Gateway', 'Legacy'],
  values: [
    [186, 77],
    [153, 58],
    [98, 33],
    [76, 34],
    [54, 19],
    [42, 15],
    [42, 9],
  ],
}

/** Top 4 products by revenue. Tones span ok / neutral / bad so the table clearly
 *  demonstrates the theme's good/neutral/bad semantic colours. */
export const SALES_TOP_PRODUCTS: ProductRow[] = [
  { product: 'Power BI Enterprise', revenue: '$186.4M', margin: '41.2%', yoy: '+18%', tone: 'ok' },
  { product: 'Analytics Cloud',     revenue: '$152.7M', margin: '37.8%', yoy: '+11%', tone: 'ok' },
  { product: 'DataOps Suite',       revenue: '$98.3M',  margin: '33.1%', yoy: '+4%',  tone: 'warn' },
  { product: 'Embedded BI',         revenue: '$76.2M',  margin: '44.6%', yoy: '-3%',  tone: 'bad' },
]
