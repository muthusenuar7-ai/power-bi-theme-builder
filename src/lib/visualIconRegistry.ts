/**
 * Visual icon registry — maps every visual catalog ID to:
 *   icon  — public path to the PNG (null → use ChartMiniIcon fallback)
 *   label — compact display label for the selector grid
 *
 * Icon files live at:  public/assets/pbi-visual-icons/
 * Public URL base:     /assets/pbi-visual-icons/
 */

const BASE = '/assets/pbi-visual-icons'

export interface VisualIconEntry {
  /** Absolute public path, or null when no dedicated PNG exists. */
  icon: string | null
  /** Short label shown beneath the icon in the selector grid. */
  label: string
}

export const VISUAL_ICON_REGISTRY: Record<string, VisualIconEntry> = {
  // ── Bar ──────────────────────────────────────────────────────────────────
  // 'bar' is the generic bar ID; 'stackedbar' is the explicit stacked variant.
  // Both share the same PBI style key (barChart) but get distinct labels.
  bar:                { icon: `${BASE}/stacked-bar-chart.png`,              label: 'Bar' },
  stackedbar:         { icon: `${BASE}/stacked-bar-chart.png`,              label: 'Stacked Bar' },
  clusteredbar:       { icon: `${BASE}/clustered-bar-chart.png`,            label: 'Clustered Bar' },
  hundredstackedbar:  { icon: `${BASE}/100-stacked-bar.png`,                label: '100% Bar' },

  // ── Column ───────────────────────────────────────────────────────────────
  // 'column' is the generic column ID; 'stackedcol' is the explicit stacked variant.
  column:             { icon: `${BASE}/stacked-column-chart.png`,           label: 'Column' },
  stackedcol:         { icon: `${BASE}/stacked-column-chart.png`,           label: 'Stacked Col' },
  clusteredcol:       { icon: `${BASE}/clustered-column-chart.png`,         label: 'Clustered Col' },
  hundredstackedcol:  { icon: `${BASE}/100-stacked-column.png`,             label: '100% Col' },

  // ── Combo ────────────────────────────────────────────────────────────────
  lineclustered:      { icon: `${BASE}/line-and-clustered-column-chart.png`,label: 'Line+Clust Col' },
  linestacked:        { icon: `${BASE}/line-and-stacked-column-chart.png`,  label: 'Line+Stk Col' },

  // ── Line & Area ──────────────────────────────────────────────────────────
  line:               { icon: `${BASE}/line-chart.png`,                     label: 'Line' },
  area:               { icon: `${BASE}/area-chart.png`,                     label: 'Area' },
  stackedarea:        { icon: `${BASE}/stacked-area-chart.png`,             label: 'Stacked Area' },
  hundredstackedarea: { icon: `${BASE}/100-stacked-area-chart.png`,         label: '100% Area' },

  // ── Composition ──────────────────────────────────────────────────────────
  pie:                { icon: `${BASE}/pie-chart.png`,                      label: 'Pie' },
  donut:              { icon: `${BASE}/donut-chart.png`,                    label: 'Donut' },
  funnel:             { icon: `${BASE}/funnel.png`,                         label: 'Funnel' },
  treemap:            { icon: `${BASE}/treemap.png`,                        label: 'Treemap' },
  waterfall:          { icon: `${BASE}/waterfall-chart.png`,                label: 'Waterfall' },
  ribbon:             { icon: `${BASE}/ribbon-chart.png`,                   label: 'Ribbon' },

  // ── Relationship ─────────────────────────────────────────────────────────
  scatter:            { icon: `${BASE}/scatter-plot.png`,                   label: 'Scatter' },
  bubble:             { icon: `${BASE}/scatter-plot.png`,                   label: 'Bubble' },

  // ── Tabular ──────────────────────────────────────────────────────────────
  table:              { icon: `${BASE}/table.png`,                          label: 'Table' },
  matrix:             { icon: `${BASE}/matrix.png`,                         label: 'Matrix' },

  // ── Advanced ─────────────────────────────────────────────────────────────
  decompositiontree:  { icon: null,                                         label: 'Decomp Tree' },

  // ── Cards, KPI, Slicers (not in selector yet — kept for completeness) ────
  cardCurrent:        { icon: `${BASE}/single-card.png`,                    label: 'Card' },
  cardLegacy:         { icon: `${BASE}/single-card.png`,                    label: 'Card (old)' },
  multirowcard:       { icon: `${BASE}/multi-card.png`,                     label: 'Multi-row' },
  kpi:                { icon: `${BASE}/kpi.png`,                            label: 'KPI' },
  slicerStandard:     { icon: `${BASE}/slicer.png`,                         label: 'Slicer' },
  buttonSlicer:       { icon: `${BASE}/button-slicer.png`,                  label: 'Btn Slicer' },
  gauge:              { icon: `${BASE}/gauge-chart.png`,                    label: 'Gauge' },
}

/**
 * Look up icon entry for a visual ID.
 * Falls back gracefully (icon: null, label: id) for any unmapped ID.
 */
export function getVisualIconEntry(id: string): VisualIconEntry {
  return VISUAL_ICON_REGISTRY[id] ?? { icon: null, label: id }
}
