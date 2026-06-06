'use client'

import { useMemo } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { SELECTOR_VISUAL_CATALOG } from '@/lib/visualCatalog'
import { getVisualIconEntry } from '@/lib/visualIconRegistry'
import { ChartMiniIcon } from '@/components/charts/ChartMiniIcon'
import { useThemeStore } from '@/store/themeStore'

interface VisualIconProps {
  id: string
  displayName: string
  active: boolean
}

/**
 * Bar / Column variant children. These are intentionally NOT shown as separate
 * tiles in the left panel — only the family heads (`bar`, `column`) appear in
 * the grid, and the variants are reached via the variant tabs above the canvas
 * (see DashboardCanvas). This keeps the left panel a single compact grid while
 * leaving every visual type reachable.
 */
const VARIANT_CHILD_IDS = new Set([
  'stackedbar',
  'clusteredbar',
  'hundredstackedbar',
  'stackedcol',
  'clusteredcol',
  'hundredstackedcol',
])

/** Compact tile labels (full names remain available on hover via `title`). */
const SHORT_LABELS: Record<string, string> = {
  bar: 'Bar',
  column: 'Column',
  line: 'Line',
  area: 'Area',
  stackedarea: 'Stack Area',
  hundredstackedarea: '100% Area',
  lineclustered: 'Line+Col',
  linestacked: 'Line+Stk',
  pie: 'Pie',
  donut: 'Donut',
  funnel: 'Funnel',
  treemap: 'Treemap',
  waterfall: 'Waterfall',
  ribbon: 'Ribbon',
  scatter: 'Scatter',
  bubble: 'Bubble',
  table: 'Table',
  matrix: 'Matrix',
  multirowcard: 'Multi-row',
  kpi: 'KPI',
  decompositiontree: 'Decomp.',
}

function VisualIcon({ id, displayName, active }: VisualIconProps) {
  const { icon } = getVisualIconEntry(id)

  if (icon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={icon}
        alt={displayName}
        width={18}
        height={18}
        className="visual-selector-icon-img"
        style={{ opacity: active ? 1 : 0.74 }}
      />
    )
  }

  return <ChartMiniIcon id={id} size={18} />
}

export function LeftPanelVisuals() {
  const focusVisual = useThemeStore((s) => s.focusVisual)
  const setFocusVisual = useThemeStore((s) => s.setFocusVisual)
  const setSelectedVisual = useThemeStore((s) => s.setSelectedVisual)

  // One flat compact grid: every catalog visual EXCEPT the bar/column variant
  // children (those are reached through the canvas variant tabs).
  const gridVisuals = useMemo(
    () => SELECTOR_VISUAL_CATALOG.filter((visual) => !VARIANT_CHILD_IDS.has(visual.id)),
    [],
  )

  function selectVisual(id: string | null) {
    setFocusVisual(id)
    setSelectedVisual(id)
  }

  const isDashboard = focusVisual === null
  // Bar/Column family heads are "active" whenever any of their variants is focused.
  const activeId = focusVisual

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        type="button"
        onClick={() => selectVisual(null)}
        className="visual-dashboard-button"
        style={{
          borderColor: isDashboard ? 'var(--accent-ui)' : 'var(--border-ui)',
          background: isDashboard ? 'var(--accent-soft)' : 'var(--surface)',
          color: isDashboard ? 'var(--accent-ui)' : 'var(--text-2)',
          boxShadow: isDashboard ? '0 0 0 2px rgba(13,148,136,.12)' : 'none',
        }}
      >
        <LayoutDashboard size={15} strokeWidth={1.8} />
        <span>Dashboard</span>
      </button>

      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-3)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      >
        Visuals
      </div>

      <div className="visual-tile-grid">
        {gridVisuals.map((visual) => {
          const { label } = getVisualIconEntry(visual.id)
          const compactLabel = SHORT_LABELS[visual.id] ?? label
          // Family heads stay highlighted while any of their variants is focused.
          const isActive =
            activeId === visual.id ||
            (visual.id === 'bar' && (activeId === 'stackedbar' || activeId === 'clusteredbar' || activeId === 'hundredstackedbar')) ||
            (visual.id === 'column' && (activeId === 'stackedcol' || activeId === 'clusteredcol' || activeId === 'hundredstackedcol'))

          return (
            <button
              key={visual.id}
              type="button"
              title={visual.displayName}
              aria-label={visual.displayName}
              onClick={() => selectVisual(visual.id)}
              className="visual-tile-compact"
              data-active={isActive}
            >
              <VisualIcon id={visual.id} displayName={visual.displayName} active={isActive} />
              <span className="visual-tile-label">{compactLabel}</span>
            </button>
          )
        })}
      </div>

      <div
        style={{
          padding: '8px 10px',
          background: 'var(--surface-2)',
          borderRadius: 7,
          border: '1px solid var(--border-ui)',
          fontSize: 10,
          color: 'var(--text-3)',
          lineHeight: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <span>Select a visual to format it in the right panel.</span>
        <span>Bar &amp; Column variants appear as tabs above the canvas. Full names on hover.</span>
      </div>
    </div>
  )
}
