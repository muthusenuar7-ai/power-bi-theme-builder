import type { ChartDataset } from '@/types'

/*
 * Dashboard Preview configuration — Sales and HR only.
 *
 * This module owns the layout data (headers, KPIs, filter chips) and the chart
 * datasets for the two preview dashboards. Dashboard Preview is theme-reactive
 * only: it uses CSS-var palette colours (--c1…--c10, --theme-primary, etc.) and
 * the shared card vars (--card-bg, --card-border, --card-shadow) — it does NOT
 * read formatProps or detailed visual-level format settings. Those live in the
 * Visuals section, which remains separate and unchanged.
 */

export interface PreviewKpi {
  label:    string
  value:    string
  delta:    string
  /** true = up-delta is good; false = up-delta is bad (e.g. Expenses). */
  positive: boolean
}

export interface PreviewHeader {
  title:    string
  subtitle: string
  insight:  string
}

/** Palette CSS-variable colour with a hard fallback. */
function c(n: number): string {
  const fb = ['#0D9488','#3B82F6','#8B5CF6','#F59E0B','#EF4444','#10B981','#F97316','#EC4899','#2563EB','#64748B']
  return `var(--c${n}, ${fb[(n - 1) % fb.length] ?? '#666'})`
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export const SALES_HEADER: PreviewHeader = {
  title:    'Sales Performance Dashboard',
  subtitle: 'Revenue, margin, targets and regional growth',
  insight:  'Aug revenue ₹62L beat target by 13% · Online channel at 44% of mix · West leads regional growth by 18%',
}

export const SALES_KPIS: PreviewKpi[] = [
  { label: 'Total Revenue',      value: '₹48.6L',  delta: '+12.4%', positive: true },
  { label: 'Target Achievement', value: '86.4%',   delta: '+8.2%',  positive: true },
  { label: 'Gross Margin',       value: '24.8%',   delta: '-1.1%',  positive: false },
  { label: 'Avg Order Value',    value: '₹12,650', delta: '+3.2%',  positive: true },
]

export const SALES_CHARTS: {
  revenueVsTarget: ChartDataset
  channelDonut:    ChartDataset
  categoryByRegion: ChartDataset
  salesVsMargin:   ChartDataset
} = {
  revenueVsTarget: {
    categories:   ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
    columnSeries: [{ name: 'Target (₹L)',  color: c(2) }],
    columnValues: [[36],[39],[42],[44],[38],[46],[48],[55]],
    lineSeries:   [{ name: 'Revenue (₹L)', color: c(1) }],
    lineValues:   [[33],[41],[38],[48],[36],[52],[44],[62]],
  },

  channelDonut: {
    slices: [
      { label: 'Online',  value: 44 },
      { label: 'Retail',  value: 31 },
      { label: 'Partner', value: 16 },
      { label: 'Direct',  value: 9  },
    ],
  },

  categoryByRegion: {
    categories: ['North', 'South', 'East', 'West'],
    series: [
      { name: 'Electronics', color: c(1) },
      { name: 'Apparel',     color: c(2) },
      { name: 'FMCG',        color: c(3) },
      { name: 'Home',        color: c(4) },
    ],
    // values[categoryIdx][seriesIdx]
    values: [
      [12, 9, 7, 5],
      [8, 11, 4, 6],
      [9,  6, 8, 4],
      [5,  8, 6, 10],
    ],
  },

  salesVsMargin: {
    categories: ['Q1', 'Q2', 'Q3', 'Q4'],
    series: [
      { name: 'Revenue (₹L)', color: c(1) },
      { name: 'Margin %',     color: c(3) },
    ],
    values: [
      [38, 14],
      [44, 18],
      [41, 16],
      [52, 22],
    ],
  },
}

// ─── HR ───────────────────────────────────────────────────────────────────────

export const HR_HEADER: PreviewHeader = {
  title:    'HR Workforce Analytics',
  subtitle: 'Headcount, attrition, hiring and department health',
  insight:  'Attrition eased to 10.8% — an 8-month low · Sales and Engineering carry the highest backfill risk',
}

export const HR_KPIS: PreviewKpi[] = [
  { label: 'Total Employees', value: '2,480',  delta: '+4.2%',  positive: true  },
  { label: 'Attrition Rate',  value: '10.8%',  delta: '-1.4%',  positive: true  },
  { label: 'New Hires',       value: '168',    delta: '+6.5%',  positive: true  },
  { label: 'Open Positions',  value: '28',     delta: '-5',     positive: true  },
  { label: 'Engagement',      value: '82.4%',  delta: '+2.1%',  positive: true  },
]

export const HR_CHARTS: {
  attritionByDept:  ChartDataset
  workforceMix:     ChartDataset
  headcountByDept:  ChartDataset
} = {
  attritionByDept: {
    categories: ['Sales', 'Operations', 'Finance', 'Marketing', 'Engineering', 'HR'],
    series: [{ name: 'Attrition %', color: c(4) }],
    values: [[18.4],[13.2],[8.6],[9.2],[11.4],[7.8]],
  },

  workforceMix: {
    slices: [
      { label: 'Full-time', value: 72 },
      { label: 'Contract',  value: 18 },
      { label: 'Intern',    value: 10 },
    ],
  },

  headcountByDept: {
    categories: ['Sales', 'Engg', 'Ops', 'Finance', 'HR'],
    series: [
      { name: 'L1–L2', color: c(1) },
      { name: 'L3–L4', color: c(2) },
      { name: 'L5+',   color: c(3) },
    ],
    values: [
      [120, 180, 85],
      [90,  140, 60],
      [210, 150, 40],
      [60,   90, 30],
      [40,   60, 20],
    ],
  },
}
