import type { DashboardDomain } from '@/types'

/*
 * Realistic, domain-specific sample data for the domain dashboard preview.
 *
 * Only the parts of a dashboard that are plain HTML — the KPI cards and the
 * slicer panel — consume this data directly. The mimic SVG chart components
 * (ChartRenderer / REGISTRY) embed their own representative sample series, so
 * the chart geometry is *not* driven from here (see docs/qa/
 * domain-dashboard-preview.md → Remaining Limitations). The values below are
 * intentionally varied per domain: mixed up/down deltas, non-round numbers,
 * and "good when it goes down" metrics (attrition, readmission, delivery days)
 * flagged via `positive` so the trend colour reads correctly.
 */

export interface DomainKpiCard {
  /** Short metric label, e.g. "Total Sales". */
  label: string
  /** Pre-formatted display value, e.g. "₹48.6L". */
  value: string
  /** Signed change string, e.g. "+12.4%" or "-1.4%". Arrow is derived from the sign. */
  delta: string
  /** Whether the change is a *good* outcome (drives green vs. red), independent of arrow direction. */
  positive: boolean
}

export interface DomainSlicer {
  title: string
  type: 'list' | 'buttons' | 'dropdown' | 'slider'
  items?: string[]
  /** Indices of pre-selected items (list / buttons). */
  sel?: number[]
  min?: number
  max?: number
}

export interface DomainDashboardData {
  kpis: DomainKpiCard[]
  slicers: DomainSlicer[]
}

export const DASHBOARD_DATA: Record<DashboardDomain, DomainDashboardData> = {
  sales: {
    kpis: [
      { label: 'Total Sales',     value: '₹48.6L',  delta: '+12.4%', positive: true },
      { label: 'Total Orders',    value: '3,842',   delta: '+8.7%',  positive: true },
      { label: 'Avg Order Value', value: '₹12,650', delta: '+3.2%',  positive: true },
      { label: 'Profit Margin',   value: '24.8%',   delta: '-1.1%',  positive: false },
    ],
    slicers: [
      { title: 'Region',  type: 'buttons',  items: ['North', 'South', 'East', 'West'], sel: [0, 2] },
      { title: 'Segment', type: 'list',     items: ['Enterprise', 'Mid-Market', 'SMB', 'Consumer'], sel: [0, 1] },
      { title: 'Year',    type: 'dropdown', items: ['FY24-25', 'FY23-24', 'FY22-23'] },
    ],
  },

  hr: {
    kpis: [
      { label: 'Total Employees', value: '2,480',   delta: '+4.2%',  positive: true },
      { label: 'Attrition Rate',  value: '11.3%',   delta: '-1.4%',  positive: true },
      { label: 'New Hires',       value: '168',     delta: '+6.5%',  positive: true },
      { label: 'Avg Tenure',      value: '4.6 yrs', delta: '+0.3',   positive: true },
    ],
    slicers: [
      { title: 'Department', type: 'list',     items: ['Sales', 'Engineering', 'Operations', 'Finance', 'HR'], sel: [0, 1] },
      { title: 'Location',   type: 'buttons',  items: ['HQ', 'Regional', 'Remote'], sel: [0, 2] },
      { title: 'Grade',      type: 'dropdown', items: ['L1–L2', 'L3–L4', 'L5+'] },
    ],
  },

  finance: {
    kpis: [
      { label: 'Revenue',         value: '₹128.4Cr', delta: '+9.1%',  positive: true },
      { label: 'Expenses',        value: '₹86.2Cr',  delta: '+5.4%',  positive: false },
      { label: 'Net Profit',      value: '₹42.2Cr',  delta: '+14.7%', positive: true },
      { label: 'Budget Variance', value: '+3.8%',    delta: '+1.6%',  positive: true },
    ],
    slicers: [
      { title: 'Month',      type: 'dropdown', items: ['Q4 FY25', 'Q3 FY25', 'Q2 FY25', 'Q1 FY25'] },
      { title: 'Department', type: 'list',     items: ['Sales', 'Operations', 'IT', 'Marketing', 'G&A'], sel: [0, 1] },
      { title: 'Scenario',   type: 'buttons',  items: ['Actual', 'Budget', 'Forecast'], sel: [0] },
    ],
  },

  supplychain: {
    kpis: [
      { label: 'Total Shipments',    value: '24,860', delta: '+7.3%', positive: true },
      { label: 'On-Time Delivery',   value: '94.2%',  delta: '+1.8%', positive: true },
      { label: 'Avg Delivery Days',  value: '3.4',    delta: '-0.2',  positive: true },
      { label: 'Freight Cost',       value: '₹6.8Cr', delta: '+4.1%', positive: false },
    ],
    slicers: [
      { title: 'Region',          type: 'buttons',  items: ['North', 'South', 'East', 'West'], sel: [0, 1] },
      { title: 'Carrier',         type: 'list',     items: ['BlueDart', 'Delhivery', 'DTDC', 'FedEx'], sel: [0, 2] },
      { title: 'Delivery Status', type: 'dropdown', items: ['All', 'On-time', 'Delayed'] },
    ],
  },

  marketing: {
    kpis: [
      { label: 'Total Leads',     value: '38,420', delta: '+18.2%', positive: true },
      { label: 'Conversion Rate', value: '6.4%',   delta: '+0.9%',  positive: true },
      { label: 'Campaign Spend',  value: '₹2.4Cr', delta: '+11.5%', positive: false },
      { label: 'ROAS',            value: '4.7x',   delta: '+0.6',   positive: true },
    ],
    slicers: [
      { title: 'Channel',  type: 'list',     items: ['Paid Search', 'Social', 'Email', 'Organic'], sel: [0, 1] },
      { title: 'Campaign', type: 'dropdown', items: ['Always-On', 'Q1 Launch', 'Festive'] },
      { title: 'Region',   type: 'buttons',  items: ['National', 'Metro', 'Tier-2'], sel: [0] },
    ],
  },

  healthcare: {
    kpis: [
      { label: 'Patient Visits',       value: '14,260', delta: '+5.6%', positive: true },
      { label: 'Revenue',              value: '₹38.9Cr', delta: '+8.3%', positive: true },
      { label: 'Patient Satisfaction', value: '92.4%',  delta: '+1.2%', positive: true },
      { label: 'Readmission Rate',     value: '7.8%',   delta: '-0.6%', positive: true },
    ],
    slicers: [
      { title: 'Department',   type: 'list',     items: ['Cardiology', 'Orthopedics', 'Pediatrics', 'ENT'], sel: [0, 1] },
      { title: 'Region',       type: 'buttons',  items: ['Central', 'North', 'South'], sel: [0] },
      { title: 'Patient Type', type: 'dropdown', items: ['All', 'Inpatient', 'Outpatient'] },
    ],
  },
}

export function getDashboardData(domain: DashboardDomain): DomainDashboardData {
  return DASHBOARD_DATA[domain]
}
