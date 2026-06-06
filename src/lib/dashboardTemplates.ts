import type { ChartDataset, DashboardDomain } from '@/types'
import { DASHBOARD_DATA, type DomainKpiCard, type DomainSlicer } from './sampleDashboardData'
import { getVisualDataset } from './dashboardChartData'

/*
 * Config-driven domain dashboard templates.
 *
 * Each template is a reusable description of one professional Power BI–style
 * report page: a header (title + subtitle), a row of KPI cards, a slicer
 * panel, and 4–6 mimic visuals. The DomainDashboard component renders ANY
 * template from this config — there is no per-domain JSX. To add or retune a
 * dashboard, edit data here, not components.
 *
 * `visuals[].id` MUST be a valid ChartRenderer REGISTRY id (see
 * components/charts/ChartRenderer.tsx). Each visual is keyed by type within a
 * page and the types are distinct per domain, so the existing visual selector,
 * focus view, and format pane keep working unchanged.
 *
 * KPI + slicer values come from sampleDashboardData (real HTML data). Chart
 * series stay embedded in the mimic components — see docs.
 */

export interface DomainVisual {
  /** ChartRenderer REGISTRY id (e.g. 'clusteredcol', 'donut', 'matrix'). */
  id: string
  /** Visual title shown in the card header. */
  title: string
  /** Visual subtitle shown under the title. */
  subtitle: string
  /** Grid column span inside the visual grid. 2 = full-width hero row. */
  span?: 1 | 2
  /** Per-domain data threaded into the mimic chart (undefined → embedded sample). */
  dataset?: ChartDataset
}

export interface DashboardTemplate {
  id: DashboardDomain
  /** Short label for the domain selector tab. */
  name: string
  /** Report header title. */
  title: string
  /** Report header subtitle. */
  subtitle: string
  /** Management-level headline insight shown in the report header. */
  insight: string
  kpis: DomainKpiCard[]
  slicers: DomainSlicer[]
  visuals: DomainVisual[]
}

/** Display order of the domain selector tabs. */
export const DASHBOARD_DOMAINS: DashboardDomain[] = [
  'sales',
  'hr',
  'finance',
  'supplychain',
  'marketing',
  'healthcare',
]

/*
 * Each domain leads with a different full-width "hero" visual (span 2) so the
 * dashboards have distinct silhouettes, then four supporting tiles. The old
 * repeated full-width bottom matrix/table is gone — every tile is now a chart
 * carrying real per-domain data (see dashboardChartData.ts).
 *
 * hero + 4 tiles = 6 grid cells = a clean 3-row, 2-column page with no gaps.
 */
const VISUALS: Record<DashboardDomain, DomainVisual[]> = {
  // Sales — target-achievement story: hero is monthly actual-vs-target.
  sales: [
    { id: 'clusteredcol', title: 'Sales vs Target by Month',   subtitle: 'Actual vs target (₹L)', span: 2 },
    { id: 'line',         title: 'Revenue Trend',              subtitle: 'Trailing 8 months (₹L)' },
    { id: 'stackedbar',   title: 'Category Mix by Region',     subtitle: 'Contribution (₹L)' },
    { id: 'donut',        title: 'Revenue by Channel',         subtitle: 'Share of revenue' },
    { id: 'bar',          title: 'Top Products by Sales',      subtitle: 'Ranked (₹L)' },
  ],
  // HR — workforce structure leads, attrition risk supports.
  hr: [
    { id: 'stackedcol',   title: 'Headcount by Department & Grade', subtitle: 'Staffing structure', span: 2 },
    { id: 'line',         title: 'Attrition Rate Trend',       subtitle: 'Trailing 8 months (%)' },
    { id: 'donut',        title: 'Workforce by Type',          subtitle: 'Employment mix' },
    { id: 'bar',          title: 'Attrition by Department',    subtitle: 'Risk ranking (%)' },
    { id: 'clusteredcol', title: 'Hires vs Exits by Month',    subtitle: 'Net movement' },
  ],
  // Finance — waterfall profit bridge as the signature hero.
  finance: [
    { id: 'waterfall',     title: 'Profit Bridge',             subtitle: 'Revenue to net profit', span: 2 },
    { id: 'lineclustered', title: 'Revenue, Expense & Profit', subtitle: 'Monthly, dual axis' },
    { id: 'donut',         title: 'Expense Distribution',      subtitle: 'By category' },
    { id: 'bar',           title: 'Spend by Department',       subtitle: 'Actuals (₹Cr)' },
    { id: 'column',        title: 'Monthly Cash Flow',         subtitle: 'Net (₹Cr)' },
  ],
  // Supply Chain — command-center: wide carrier comparison hero.
  supplychain: [
    { id: 'clusteredbar', title: 'Carrier On-Time vs Delayed', subtitle: 'Service level (%)', span: 2 },
    { id: 'line',         title: 'Avg Delivery Days',          subtitle: 'Trailing 8 weeks' },
    { id: 'stackedcol',   title: 'Delay Reasons by Region',    subtitle: 'Root-cause mix' },
    { id: 'donut',        title: 'Freight Cost by Mode',       subtitle: 'Spend share' },
    { id: 'bar',          title: 'Shipments by Region',        subtitle: 'Volume (K)' },
  ],
  // Marketing — funnel-first.
  marketing: [
    { id: 'funnel',       title: 'Lead-to-Customer Funnel',    subtitle: 'Stage conversion', span: 2 },
    { id: 'line',         title: 'Weekly Leads Trend',         subtitle: 'Inflow (K)' },
    { id: 'clusteredcol', title: 'Spend vs Revenue by Channel', subtitle: 'Channel efficiency (₹L)' },
    { id: 'donut',        title: 'Leads by Source',            subtitle: 'Acquisition mix' },
    { id: 'bar',          title: 'ROAS by Channel',            subtitle: 'Return on ad spend (x)' },
  ],
  // Healthcare — operations: patient-volume trend hero.
  healthcare: [
    { id: 'line',         title: 'Patient Visits Trend',       subtitle: 'Trailing 8 months (K)', span: 2 },
    { id: 'clusteredcol', title: 'Revenue by Department',      subtitle: 'Inpatient vs outpatient' },
    { id: 'donut',        title: 'Visits by Patient Type',     subtitle: 'Service mix' },
    { id: 'bar',          title: 'Avg Length of Stay',         subtitle: 'By department (days)' },
    { id: 'column',       title: 'Readmissions by Month',      subtitle: 'Rate (%)' },
  ],
}

const META: Record<DashboardDomain, { name: string; title: string; subtitle: string; insight: string }> = {
  sales: {
    name: 'Sales', title: 'Sales Performance Dashboard',
    subtitle: 'Revenue, margin, targets, and regional performance',
    insight: 'Aug sales of ₹62L beat target by 13%; Online is now 44% of revenue and West leads regional growth.',
  },
  hr: {
    name: 'HR', title: 'HR Workforce Analytics',
    subtitle: 'Headcount, attrition, hiring, and employee performance',
    insight: 'Attrition eased to 10.8% — an 8-month low; Sales and Operations remain the highest-risk teams to backfill.',
  },
  finance: {
    name: 'Finance', title: 'Finance Performance Dashboard',
    subtitle: 'Revenue, expenses, profit, and budget tracking',
    insight: 'Net profit climbed to ₹52Cr in May on flat expenses; salaries still drive 46% of total spend.',
  },
  supplychain: {
    name: 'Supply Chain', title: 'Supply Chain Performance',
    subtitle: 'Orders, delivery, delays, inventory, and logistics',
    insight: 'BlueDart leads on-time at 94% and avg delivery improved to 3.0 days; Ekart (79%) needs attention.',
  },
  marketing: {
    name: 'Marketing', title: 'Marketing Performance Dashboard',
    subtitle: 'Leads, conversion, campaign spend, and ROI',
    insight: 'Leads grew ~90% over 8 weeks; Email returns the best ROAS (8x) while Search drives the most revenue.',
  },
  healthcare: {
    name: 'Healthcare', title: 'Healthcare Operations Dashboard',
    subtitle: 'Patients, revenue, satisfaction, and service efficiency',
    insight: 'Visits reached 14.3K with readmissions down to 6.9%; Pediatrics is the most outpatient-heavy service.',
  },
}

function buildTemplate(domain: DashboardDomain): DashboardTemplate {
  const meta = META[domain]
  const data = DASHBOARD_DATA[domain]
  return {
    id: domain,
    name: meta.name,
    title: meta.title,
    subtitle: meta.subtitle,
    insight: meta.insight,
    kpis: data.kpis,
    slicers: data.slicers,
    visuals: VISUALS[domain].map((visual) => ({
      ...visual,
      dataset: visual.dataset ?? getVisualDataset(domain, visual.id),
    })),
  }
}

export const DASHBOARD_TEMPLATES: Record<DashboardDomain, DashboardTemplate> = {
  sales:       buildTemplate('sales'),
  hr:          buildTemplate('hr'),
  finance:     buildTemplate('finance'),
  supplychain: buildTemplate('supplychain'),
  marketing:   buildTemplate('marketing'),
  healthcare:  buildTemplate('healthcare'),
}

export function getDashboardTemplate(domain: DashboardDomain): DashboardTemplate {
  return DASHBOARD_TEMPLATES[domain] ?? DASHBOARD_TEMPLATES.sales
}
