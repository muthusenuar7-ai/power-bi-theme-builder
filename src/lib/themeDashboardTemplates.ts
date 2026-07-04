/**
 * Theme Dashboard Preview — layout templates (rebuild).
 *
 * Describes the structure of each preview dashboard: header copy, slicer chips,
 * KPI strip and the two visual rows. Each visual is a discriminated-union spec
 * that already carries its (theme-agnostic) dataset, so the renderer stays a
 * thin, type-safe switch. Only "sales" is populated in this pass; HR/others can
 * be added as new templates without touching the renderer.
 */

import {
  SALES_KPIS,
  SALES_REVENUE_TREND,
  SALES_CHANNELS,
  SALES_SEGMENT_MIX,
  SALES_REGION_MIX,
  SALES_PRODUCT_PERF,
  SALES_TOP_PRODUCTS,
  type KpiDatum,
  type ComboPoint,
  type DonutSlice,
  type TreemapDatum,
  type StackedBarData,
  type ClusteredColumnData,
  type ProductRow,
} from './themeDashboardData'

export type DashboardDomainId = 'sales' | 'hr'

/** Power BI-style slicer modes: a button group, a single-select dropdown, or a
 *  multi-select dropdown. Drives both the look and the selection behaviour in
 *  ThemeSlicerBar (preview-only — no real data filtering). */
export type SlicerKind = 'button' | 'dropdown' | 'multi'

export interface SlicerSpec {
  key: string
  label: string
  kind: SlicerKind
  options: string[]
}

/** Discriminated union — `type` selects both the renderer and the data shape. */
export type VisualSpec =
  | { id: string; title: string; subtitle?: string; tag?: string; type: 'comboLineColumn'; data: ComboPoint[] }
  | { id: string; title: string; subtitle?: string; tag?: string; type: 'donut'; data: DonutSlice[] }
  | { id: string; title: string; subtitle?: string; tag?: string; type: 'treemap'; data: TreemapDatum[] }
  | { id: string; title: string; subtitle?: string; tag?: string; type: 'stackedBar'; data: StackedBarData }
  | { id: string; title: string; subtitle?: string; tag?: string; type: 'clusteredColumn'; data: ClusteredColumnData }
  | { id: string; title: string; subtitle?: string; tag?: string; type: 'table'; data: ProductRow[] }

export interface DashboardRow {
  /** CSS grid-template-columns for this row of visual cards. */
  columns: string
  visuals: VisualSpec[]
}

export interface DashboardTemplate {
  id: DashboardDomainId
  name: string
  title: string
  subtitle: string
  slicers: SlicerSpec[]
  kpis: KpiDatum[]
  rows: DashboardRow[]
}

const SALES_TEMPLATE: DashboardTemplate = {
  id: 'sales',
  name: 'Sales',
  title: 'Sales Performance Dashboard',
  subtitle: 'Revenue, margin, targets and regional performance · FY 2025–26',
  slicers: [
    { key: 'region',  label: 'Region',  kind: 'button',   options: ['All', 'West', 'South', 'North', 'East'] },
    { key: 'segment', label: 'Segment', kind: 'multi',    options: ['Enterprise', 'Mid-Market', 'SMB', 'Public Sector'] },
    { key: 'year',    label: 'Year',    kind: 'dropdown', options: ['FY 25–26', 'FY 24–25', 'FY 23–24'] },
  ],
  kpis: SALES_KPIS,
  rows: [
    {
      columns: '1.7fr 1.05fr 1fr',
      visuals: [
        { id: 'sales-revenue', title: 'Revenue vs Target', subtitle: 'Monthly · $M', type: 'comboLineColumn', data: SALES_REVENUE_TREND },
        { id: 'sales-channel', title: 'Sales by Channel', subtitle: 'Share of bookings', type: 'donut', data: SALES_CHANNELS },
        { id: 'sales-segments', title: 'Customer Segment Mix', subtitle: 'Revenue share · $M', type: 'treemap', data: SALES_SEGMENT_MIX },
      ],
    },
    {
      columns: '1.2fr 1.3fr 1.1fr',
      visuals: [
        { id: 'sales-region', title: 'Revenue by Region & Category', subtitle: '$M · stacked', type: 'stackedBar', data: SALES_REGION_MIX },
        { id: 'sales-product', title: 'Sales vs Profit by Product Group', subtitle: '$M', type: 'clusteredColumn', data: SALES_PRODUCT_PERF },
        { id: 'sales-top', title: 'Top Products', subtitle: 'By revenue', type: 'table', data: SALES_TOP_PRODUCTS },
      ],
    },
  ],
}

export const DASHBOARD_TEMPLATES: Record<'sales', DashboardTemplate> = {
  sales: SALES_TEMPLATE,
}

export function getDashboardTemplate(id: 'sales' = 'sales'): DashboardTemplate {
  return DASHBOARD_TEMPLATES[id]
}
