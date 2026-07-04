'use client'

import type { ComponentType } from 'react'
import { getChartCssVars, normalizeHex, numberValue, resolveVisualPreviewFormat } from '@/lib/formatPreview'
import type { ResolvedVisualPreviewFormat } from '@/lib/formatPreview'
import type { ChartDataset } from '@/types'
import { resolveDashboardTheme, type DashboardTheme } from '@/lib/dashboardThemeResolver'
import { resolvePreviewThemeDefaults } from '@/lib/effectiveVisualFormatResolver'
import { useThemeStore } from '@/store/themeStore'
import { BarChartVisual }                         from './BarChartVisual'
import { ColumnChartVisual }                      from './ColumnChartVisual'
import { ClusteredBarChartVisual }                from './ClusteredBarChartVisual'
import { ClusteredColumnChartVisual }             from './ClusteredColumnChartVisual'
import { StackedBarChartVisual }                  from './StackedBarChartVisual'
import { StackedColumnChartVisual }               from './StackedColumnChartVisual'
import { HundredPercentStackedBarChartVisual }    from './HundredPercentStackedBarChartVisual'
import { HundredPercentStackedColumnChartVisual } from './HundredPercentStackedColumnChartVisual'
import { LineChartVisual }                        from './LineChartVisual'
import { AreaChartVisual }                        from './AreaChartVisual'
import { StackedAreaChartVisual }                 from './StackedAreaChartVisual'
import { HundredPercentStackedAreaChartVisual }   from './HundredPercentStackedAreaChartVisual'
import { RibbonChartVisual }                      from './RibbonChartVisual'
import { TreemapVisual }                          from './TreemapVisual'
import { WaterfallChartVisual }                   from './WaterfallChartVisual'
import { BubbleChartVisual }                      from './BubbleChartVisual'
import { ScatterChartVisual }                     from './ScatterChartVisual'
import { LineClusteredColumnVisual }              from './LineClusteredColumnVisual'
import { LineStackedColumnVisual }                from './LineStackedColumnVisual'
import { PieChartVisual }                         from './PieChartVisual'
import { DonutChartVisual }                       from './DonutChartVisual'
import { DecompositionTreeVisual }                from './DecompositionTreeVisual'
import { FunnelChartVisual }                      from './FunnelChartVisual'
import { TableVisual }                            from './TableVisual'
import { MatrixVisual }                           from './MatrixVisual'

export type VisualSize = 'card' | 'focus'
export type { ChartDataset } from '@/types'
export interface ChartVisualProps {
  showLegend?:      boolean
  showDataLabels?:  boolean
  showMarkers?:     boolean
  format?:          ResolvedVisualPreviewFormat
  /** Optional injected per-domain data; falls back to embedded sample when omitted. */
  dataset?:         ChartDataset
}

interface Props {
  visualId: string
  size?:    VisualSize
  dataset?: ChartDataset
  dashboardPreview?: boolean
}

const REGISTRY: Record<string, ComponentType<ChartVisualProps>> = {
  bar:               BarChartVisual,
  column:            ColumnChartVisual,
  clusteredbar:      ClusteredBarChartVisual,
  clusteredcol:      ClusteredColumnChartVisual,
  stackedbar:        StackedBarChartVisual,
  stackedcol:        StackedColumnChartVisual,
  hundredstackedbar: HundredPercentStackedBarChartVisual,
  hundredstackedcol: HundredPercentStackedColumnChartVisual,
  line:              LineChartVisual,
  area:              AreaChartVisual,
  stackedarea:       StackedAreaChartVisual,
  hundredstackedarea: HundredPercentStackedAreaChartVisual,
  ribbon:            RibbonChartVisual,
  treemap:           TreemapVisual,
  waterfall:         WaterfallChartVisual,
  bubble:            BubbleChartVisual,
  scatter:           ScatterChartVisual,
  lineclustered:     LineClusteredColumnVisual,
  linestacked:       LineStackedColumnVisual,
  pie:               PieChartVisual,
  donut:             DonutChartVisual,
  decompositiontree: DecompositionTreeVisual,
  funnel:            FunnelChartVisual,
  table:             TableVisual,
  matrix:            MatrixVisual,
}

/**
 * Card-size legibility tuning for the small Visuals-gallery / dashboard-card
 * renders. It only bumps minimum font sizes, constrains axis label area, and
 * gives the plot a subtle themed fill — it does NOT set element colours, so the
 * theme-or-custom colours already resolved by `resolveVisualPreviewFormat`
 * (custom value wins, else theme value) are preserved untouched.
 */
function withDashboardReadability(format: ResolvedVisualPreviewFormat, theme: DashboardTheme): ResolvedVisualPreviewFormat {
  const axisLabelSize = Math.max(9.5, theme.labelFontSize)
  const axisTitleSize = Math.max(9, theme.labelFontSize)
  const legendSize = Math.max(9, theme.labelFontSize)
  const dataLabelSize = Math.max(9, theme.dataLabelFontSize)
  const isHorizontal = format.orientation === 'horizontal'

  return {
    ...format,
    xAxis: {
      ...format.xAxis,
      fontSize: Math.max(format.xAxis.fontSize, axisLabelSize),
      titleFontSize: Math.max(format.xAxis.titleFontSize, axisTitleSize),
      maxHeightPct: isHorizontal ? format.xAxis.maxHeightPct : Math.min(format.xAxis.maxHeightPct, 18),
    },
    yAxis: {
      ...format.yAxis,
      fontSize: Math.max(format.yAxis.fontSize, axisLabelSize),
      titleFontSize: Math.max(format.yAxis.titleFontSize, axisTitleSize),
      maxWidthPct: isHorizontal ? Math.min(format.yAxis.maxWidthPct, 22) : format.yAxis.maxWidthPct,
      categorySize: isHorizontal ? Math.min(format.yAxis.categorySize, 16) : format.yAxis.categorySize,
    },
    legend: {
      ...format.legend,
      fontSize: Math.max(format.legend.fontSize, legendSize),
      titleFontSize: Math.max(format.legend.titleFontSize, legendSize),
    },
    dataLabels: {
      ...format.dataLabels,
      fontSize: Math.max(format.dataLabels.fontSize, dataLabelSize),
    },
    plotBackground: {
      ...format.plotBackground,
      show: true,
      color: theme.plotBackground,
      opacity: 1,
    },
  }
}

function GenericFallback({ id }: { id: string }) {
  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%">
      <rect x="4" y="4" width="192" height="112" rx="3"
        fill="var(--c1,#0D9488)" fillOpacity=".1"
        stroke="var(--c1,#0D9488)" strokeWidth="1" strokeOpacity=".3" />
      <text x="100" y="64" textAnchor="middle" fontSize="10" fill="var(--theme-fg-muted,#605E5C)">{id}</text>
    </svg>
  )
}

export function ChartRenderer({ visualId, size = 'card', dataset, dashboardPreview = false }: Props) {
  const Component  = REGISTRY[visualId]
  const formatProps = useThemeStore((s) => s.formatProps)
  const dataColors  = useThemeStore((s) => s.dataColors)
  const paletteSize = useThemeStore((s) => s.paletteSize)
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
  const primary = useThemeStore((s) => s.primary)
  const accent = useThemeStore((s) => s.accent)
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
  const activePalette = dataColors.length ? dataColors : ['#0D9488']
  const dashboardTheme = resolveDashboardTheme({
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
  })
  // Theme-effective fallback colours/font (custom user values still win) so the
  // focused Visuals preview inherits the selected theme instead of hardcoded greys.
  const previewThemeDefaults = resolvePreviewThemeDefaults({
    dataColors,
    paletteSize,
    fg,
    bg,
    customCanvasBackground,
    visualBackground,
    cardBackground,
    borderColor,
    titleColor,
    labelColor,
    tableAccent,
    gridlineColor,
    dividerColor,
    highlight,
    tooltipBackground,
    tableHeaderBackground,
    tableRowAlt,
    primary,
    accent,
    good,
    neutral,
    bad,
    canvasBackgroundMode,
    visualBackgroundMode,
    formatProps,
  }, visualId)
  const resolvedFormat = resolveVisualPreviewFormat(visualId, formatProps, activePalette, previewThemeDefaults)
  const format      = size === 'card' && (dataset || dashboardPreview) ? withDashboardReadability(resolvedFormat, dashboardTheme) : resolvedFormat
  const chartVars   = {
    ...getChartCssVars(format),
    '--preview-title-color': normalizeHex(formatProps['general.title.fontColor'], dashboardTheme.titleColor),
    '--preview-title-size': `${numberValue(formatProps, 'general.title.fontSize', 9.2)}px`,
    '--preview-font-family': dashboardTheme.fontFamily,
    '--preview-label-size': `${dashboardTheme.labelFontSize}px`,
    '--preview-data-label-size': `${dashboardTheme.dataLabelFontSize}px`,
    '--preview-header-size': `${dashboardTheme.headerFontSize}px`,
    '--preview-callout-size': `${dashboardTheme.calloutFontSize}px`,
    // Power BI series-order behaviour for line+column / combo charts: the column
    // series takes the first theme colour, the line series takes the second.
    '--combo-line-color': activePalette[1] ?? dashboardTheme.secondary,
  }

  if (!Component) return <GenericFallback id={visualId} />
  return (
    <div
      data-visual-size={size}
      style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'stretch', ...chartVars }}
    >
      <Component
        showLegend={format.legend.show}
        showDataLabels={format.dataLabels.show}
        showMarkers={format.markers.show}
        format={format}
        dataset={dataset}
      />
    </div>
  )
}
