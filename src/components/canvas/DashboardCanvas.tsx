'use client'

import { useMemo } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { PAGE_SIZES } from '@/lib/pageSizes'
import { getDashboardThemeCssVars, resolveDashboardTheme } from '@/lib/dashboardThemeResolver'
import { ThemeDashboardCanvas } from '@/components/dashboard-preview/ThemeDashboardCanvas'
import { ThemeDashboardPreview } from '@/components/dashboard-preview/ThemeDashboardPreview'
import { ThemeAuditPanel } from '@/components/dashboard-preview/ThemeAuditPanel'
import { FocusView } from './FocusView'

/**
 * DashboardCanvas — the report surface host.
 *
 * It resolves the single source-of-truth DashboardTheme from the store, applies
 * the derived CSS variables to its subtree, and renders one scaled 16:9 paper
 * (ThemeDashboardCanvas) containing either the focused Visual (Visuals section)
 * or the fully theme-driven ThemeDashboardPreview.
 *
 * Background layering (Power BI Desktop model):
 *   • Outer editor surround + dotted "desk" — a FIXED neutral, NOT theme-driven.
 *     This is the editor chrome behind the report; it must stay constant so the
 *     report paper visibly sits "on a desk" and the theme effect reads clearly
 *     (a dark report on a light desk, etc.).
 *   • Report paper (canvasBackground) and every visual/card (visualBackground)
 *     ARE theme-driven — those are the only surfaces that follow the theme.
 */
const EDITOR_SURROUND_BG = '#E8EDF2'
const EDITOR_SURROUND_DOT = '#CBD5E1'

/**
 * Bar/Column families. When one of these variants is focused, a compact tab
 * strip is shown at the top of the canvas preview so the user can switch
 * between variants without leaving the focused view.
 */
interface VariantTab {
  id: string
  label: string
}
const VARIANT_FAMILIES: VariantTab[][] = [
  [
    { id: 'bar', label: 'Bar' },
    { id: 'stackedbar', label: 'Stacked Bar' },
    { id: 'clusteredbar', label: 'Clustered Bar' },
    { id: 'hundredstackedbar', label: '100% Bar' },
  ],
  [
    { id: 'column', label: 'Column' },
    { id: 'stackedcol', label: 'Stacked Column' },
    { id: 'clusteredcol', label: 'Clustered Column' },
    { id: 'hundredstackedcol', label: '100% Column' },
  ],
]

function findVariantFamily(visualId: string | null): VariantTab[] | null {
  if (!visualId) return null
  return VARIANT_FAMILIES.find((family) => family.some((variant) => variant.id === visualId)) ?? null
}

export function DashboardCanvas() {
  const bg = useThemeStore((s) => s.bg)
  const customCanvasBackground = useThemeStore((s) => s.customCanvasBackground)
  const visualBackground = useThemeStore((s) => s.visualBackground)
  const cardBackground = useThemeStore((s) => s.cardBackground)
  const borderColor = useThemeStore((s) => s.borderColor)
  const titleColor = useThemeStore((s) => s.titleColor)
  const labelColor = useThemeStore((s) => s.labelColor)
  const canvasBackgroundMode = useThemeStore((s) => s.canvasBackgroundMode)
  const visualBackgroundMode = useThemeStore((s) => s.visualBackgroundMode)
  const fg = useThemeStore((s) => s.fg)
  const good = useThemeStore((s) => s.good)
  const neutral = useThemeStore((s) => s.neutral)
  const bad = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)
  const gridlineColor = useThemeStore((s) => s.gridlineColor)
  const dividerColor = useThemeStore((s) => s.dividerColor)
  const highlight = useThemeStore((s) => s.highlight)
  const tooltipBackground = useThemeStore((s) => s.tooltipBackground)
  const tableHeaderBackground = useThemeStore((s) => s.tableHeaderBackground)
  const tableRowAlt = useThemeStore((s) => s.tableRowAlt)
  const primary = useThemeStore((s) => s.primary)
  const accent = useThemeStore((s) => s.accent)
  const dataColors = useThemeStore((s) => s.dataColors)
  const paletteSize = useThemeStore((s) => s.paletteSize)
  const spacing = useThemeStore((s) => s.spacing)
  const pageSize = useThemeStore((s) => s.pageSize)
  const zoom = useThemeStore((s) => s.zoom)
  const focusVisual = useThemeStore((s) => s.focusVisual)
  const setFocusVisual = useThemeStore((s) => s.setFocusVisual)
  const setSelectedVisual = useThemeStore((s) => s.setSelectedVisual)
  const formatProps = useThemeStore((s) => s.formatProps)

  const variantFamily = findVariantFamily(focusVisual)
  const selectVariant = (id: string) => {
    setFocusVisual(id)
    setSelectedVisual(id)
  }

  const dashboardTheme = useMemo(
    () =>
      resolveDashboardTheme({
        dataColors,
        paletteSize,
        primary,
        accent,
        bg,
        customCanvasBackground,
        visualBackground,
        cardBackground,
        borderColor,
        titleColor,
        labelColor,
        canvasBackgroundMode,
        visualBackgroundMode,
        fg,
        good,
        neutral,
        bad,
        tableAccent,
        gridlineColor,
        dividerColor,
        highlight,
        tooltipBackground,
        tableHeaderBackground,
        tableRowAlt,
        formatProps,
      }),
    [dataColors, paletteSize, primary, accent, bg, customCanvasBackground, visualBackground, cardBackground, borderColor, titleColor, labelColor, canvasBackgroundMode, visualBackgroundMode, fg, good, neutral, bad, tableAccent, gridlineColor, dividerColor, highlight, tooltipBackground, tableHeaderBackground, tableRowAlt, formatProps],
  )
  const dashboardVars = useMemo(() => getDashboardThemeCssVars(dashboardTheme), [dashboardTheme])

  const sz = PAGE_SIZES[pageSize] ?? PAGE_SIZES['16:9']

  return (
    <div
      style={{
        ...dashboardVars,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        // Fixed editor surround — intentionally NOT theme-driven (see header note).
        background: EDITOR_SURROUND_BG,
      }}
    >
      {variantFamily && (
        <div className="canvas-variant-tabs" role="tablist" aria-label="Chart variant">
          {variantFamily.map((variant) => (
            <button
              key={variant.id}
              type="button"
              role="tab"
              aria-selected={focusVisual === variant.id}
              data-active={focusVisual === variant.id}
              className="canvas-variant-tab"
              title={variant.label}
              onClick={() => selectVariant(variant.id)}
            >
              {variant.label}
            </button>
          ))}
        </div>
      )}

      <div
        className="canvas-workspace"
        style={{
          position: 'relative',
          // Fixed neutral "desk" + dot grid; the report paper on top is themed.
          backgroundColor: EDITOR_SURROUND_BG,
          backgroundImage: `radial-gradient(circle, ${EDITOR_SURROUND_DOT} 1px, transparent 1px)`,
        }}
      >
        <ThemeDashboardCanvas
          width={sz.w}
          height={sz.h}
          zoom={zoom}
          background={dashboardTheme.canvasBackground}
          shadow={dashboardTheme.canvasShadow}
        >
          {focusVisual ? (
            <FocusView chartId={focusVisual} theme={dashboardTheme} />
          ) : (
            <ThemeDashboardPreview theme={dashboardTheme} spacing={spacing} />
          )}
        </ThemeDashboardCanvas>

        {focusVisual && (
          <button
            type="button"
            onClick={() => setFocusVisual(null)}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              background: dashboardTheme.chipActiveBackground,
              color: dashboardTheme.chipActiveText,
              fontSize: 11,
              padding: '5px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            ← Back
          </button>
        )}

        {/* DEV-ONLY theme property audit. Statically removed from prod builds. */}
        {process.env.NODE_ENV === 'development' && <ThemeAuditPanel />}
      </div>
    </div>
  )
}
