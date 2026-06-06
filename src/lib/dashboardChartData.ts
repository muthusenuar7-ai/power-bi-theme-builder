import type { ChartDataset, DashboardDomain } from '@/types'

/*
 * True per-domain chart data for the Studio Preview dashboards.
 *
 * Each entry is keyed by ChartRenderer REGISTRY id and threaded into the mimic
 * chart components via the `dataset` prop (ChartRenderer → wrappers → family
 * components). When a visual has no entry here it falls back to its embedded
 * gallery sample, so the Visuals gallery / format lab are unaffected.
 *
 * Series colours use the live palette CSS variables (`--c1` through `--c10`) via `c()` so the
 * charts react to theme/palette changes exactly like the rest of the app.
 *
 * Data is intentionally domain-specific and realistic: line trends have genuine
 * ups *and* downs (not monotonic climbs), donut shares are unequal, and
 * categories are short enough to read inside a dashboard tile.
 */

/** Palette CSS-variable colour with a hard fallback (mirrors chartUtils.cv). */
function c(n: number): string {
  const fallbacks = [
    '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B',
    '#EF4444', '#10B981', '#F97316', '#EC4899',
    '#2563EB', '#64748B',
  ]
  return `var(--c${n}, ${fallbacks[(n - 1) % fallbacks.length] ?? '#666'})`
}

/** Helper: build [categoryIdx][seriesIdx=0] values from a flat single series. */
function single(values: number[]): number[][] {
  return values.map((v) => [v])
}

export const DOMAIN_CHART_DATA: Record<DashboardDomain, Record<string, ChartDataset>> = {
  /* ── Sales: target achievement, regional mix, channel share ── */
  sales: {
    clusteredcol: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [{ name: 'Actual', color: c(1) }, { name: 'Target', color: c(2) }],
      values: [
        [42, 40], [38, 40], [51, 45], [47, 48],
        [55, 50], [49, 52], [62, 55], [58, 55],
      ],
    },
    line: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [{ name: 'Revenue (₹L)', color: c(1) }],
      values: single([38, 44, 41, 52, 48, 57, 53, 64]),
    },
    stackedbar: {
      categories: ['North', 'South', 'East', 'West'],
      series: [
        { name: 'Electronics', color: c(1) },
        { name: 'Apparel', color: c(2) },
        { name: 'Grocery', color: c(3) },
        { name: 'Home', color: c(4) },
      ],
      values: [
        [22, 14, 9, 7], [18, 20, 11, 6], [12, 9, 16, 5], [25, 15, 8, 10],
      ],
    },
    donut: {
      slices: [
        { label: 'Online', value: 44 },
        { label: 'Retail', value: 31 },
        { label: 'Partner', value: 16 },
        { label: 'Direct', value: 9 },
      ],
    },
    bar: {
      categories: ['Smart TV', 'Earbuds', 'Cooler', 'Blender', 'Router'],
      series: [{ name: 'Sales (₹L)', color: c(1) }],
      values: single([84, 67, 52, 41, 33]),
    },
  },

  /* ── HR: headcount structure, attrition risk, hiring flow ── */
  hr: {
    stackedcol: {
      categories: ['Sales', 'Engg', 'Ops', 'Finance', 'HR'],
      series: [
        { name: 'L1–L2', color: c(1) },
        { name: 'L3–L4', color: c(2) },
        { name: 'L5+', color: c(3) },
      ],
      values: [
        [120, 80, 25], [160, 140, 40], [90, 60, 18], [40, 35, 12], [20, 18, 6],
      ],
    },
    line: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [{ name: 'Attrition %', color: c(5) }],
      values: single([13.2, 12.8, 13.5, 12.1, 11.9, 12.4, 11.3, 10.8]),
    },
    donut: {
      slices: [
        { label: 'Full-time', value: 72 },
        { label: 'Contract', value: 18 },
        { label: 'Intern', value: 6 },
        { label: 'Consultant', value: 4 },
      ],
    },
    bar: {
      categories: ['Sales', 'Engineering', 'Operations', 'Finance', 'People'],
      series: [{ name: 'Attrition %', color: c(5) }],
      values: single([14.2, 9.1, 12.6, 7.3, 8.0]),
    },
    clusteredcol: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [{ name: 'Hires', color: c(6) }, { name: 'Exits', color: c(5) }],
      values: [
        [28, 20], [22, 18], [31, 24], [26, 29], [34, 22], [30, 27],
      ],
    },
  },

  /* ── Finance: P&L trend, expense drivers, cash flow ── */
  finance: {
    lineclustered: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      columnSeries: [{ name: 'Revenue', color: c(1) }, { name: 'Expenses', color: c(2) }],
      columnValues: [
        [120, 82], [110, 80], [135, 90], [128, 95], [150, 98], [142, 96],
      ],
      lineSeries: [{ name: 'Net Profit', color: c(3) }],
      lineValues: single([38, 30, 45, 33, 52, 46]),
    },
    donut: {
      slices: [
        { label: 'Salaries', value: 46 },
        { label: 'Operations', value: 22 },
        { label: 'Marketing', value: 14 },
        { label: 'IT', value: 11 },
        { label: 'Other', value: 7 },
      ],
    },
    bar: {
      categories: ['Sales', 'Operations', 'IT', 'Marketing', 'G&A'],
      series: [{ name: 'Spend (₹Cr)', color: c(2) }],
      values: single([28, 22, 14, 12, 9]),
    },
    column: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [{ name: 'Cash Flow (₹Cr)', color: c(6) }],
      values: single([18, 12, 22, 9, 26, 20]),
    },
  },

  /* ── Supply Chain: carrier performance, delivery speed, delay drivers ── */
  supplychain: {
    clusteredbar: {
      categories: ['BlueDart', 'Delhivery', 'DTDC', 'FedEx', 'Ekart'],
      series: [{ name: 'On-Time', color: c(6) }, { name: 'Delayed', color: c(5) }],
      values: [
        [94, 6], [88, 12], [82, 18], [91, 9], [79, 21],
      ],
    },
    line: {
      categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
      series: [{ name: 'Avg Days', color: c(4) }],
      values: single([3.8, 3.6, 3.9, 3.4, 3.5, 3.2, 3.3, 3.0]),
    },
    stackedcol: {
      categories: ['North', 'South', 'East', 'West'],
      series: [
        { name: 'Weather', color: c(1) },
        { name: 'Traffic', color: c(2) },
        { name: 'Inventory', color: c(3) },
        { name: 'Other', color: c(4) },
      ],
      values: [
        [8, 12, 5, 3], [5, 9, 7, 2], [11, 7, 4, 5], [6, 10, 6, 3],
      ],
    },
    donut: {
      slices: [
        { label: 'Road', value: 52 },
        { label: 'Air', value: 24 },
        { label: 'Rail', value: 15 },
        { label: 'Sea', value: 9 },
      ],
    },
    bar: {
      categories: ['North', 'South', 'East', 'West', 'Central'],
      series: [{ name: 'Shipments (K)', color: c(1) }],
      values: single([8.2, 6.4, 5.1, 7.3, 4.0]),
    },
  },

  /* ── Marketing: funnel, channel efficiency, source mix ── */
  marketing: {
    line: {
      categories: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
      series: [{ name: 'Leads (K)', color: c(1) }],
      values: single([4.2, 5.1, 4.8, 6.3, 5.6, 7.1, 6.4, 8.0]),
    },
    clusteredcol: {
      categories: ['Search', 'Social', 'Email', 'Display', 'Video'],
      series: [{ name: 'Spend (₹L)', color: c(4) }, { name: 'Revenue (₹L)', color: c(1) }],
      values: [
        [42, 180], [35, 140], [12, 96], [28, 84], [22, 70],
      ],
    },
    donut: {
      slices: [
        { label: 'Organic', value: 34 },
        { label: 'Paid Search', value: 27 },
        { label: 'Social', value: 21 },
        { label: 'Email', value: 12 },
        { label: 'Referral', value: 6 },
      ],
    },
    bar: {
      categories: ['Email', 'Search', 'Social', 'Video', 'Display'],
      series: [{ name: 'ROAS (x)', color: c(6) }],
      values: single([8.0, 4.3, 4.0, 3.2, 3.0]),
    },
  },

  /* ── Healthcare: volume, department revenue, stay & readmission ── */
  healthcare: {
    line: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
      series: [{ name: 'Visits (K)', color: c(1) }],
      values: single([11.2, 12.4, 11.8, 13.1, 12.6, 13.9, 13.2, 14.3]),
    },
    clusteredcol: {
      categories: ['Cardiology', 'Ortho', 'Pediatrics', 'ENT', 'Neuro'],
      series: [{ name: 'Inpatient', color: c(1) }, { name: 'Outpatient', color: c(2) }],
      values: [
        [68, 42], [54, 38], [40, 52], [28, 34], [46, 30],
      ],
    },
    donut: {
      slices: [
        { label: 'Outpatient', value: 58 },
        { label: 'Inpatient', value: 24 },
        { label: 'Emergency', value: 12 },
        { label: 'Day-care', value: 6 },
      ],
    },
    bar: {
      categories: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'ENT'],
      series: [{ name: 'Avg Stay (days)', color: c(3) }],
      values: single([5.4, 4.8, 6.2, 3.1, 2.4]),
    },
    column: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      series: [{ name: 'Readmission %', color: c(5) }],
      values: single([8.2, 7.6, 8.0, 7.1, 7.8, 6.9]),
    },
  },
}

/** Dataset for a domain's visual, or undefined to use the embedded sample. */
export function getVisualDataset(domain: DashboardDomain, visualId: string): ChartDataset | undefined {
  return DOMAIN_CHART_DATA[domain]?.[visualId]
}
