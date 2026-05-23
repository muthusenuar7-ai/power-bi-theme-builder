'use client'

import type { ComponentType } from 'react'
import { getChartCssVars, normalizeHex, numberValue, resolveVisualPreviewFormat } from '@/lib/formatPreview'
import type { ResolvedVisualPreviewFormat } from '@/lib/formatPreview'
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
export interface ChartVisualProps {
  showLegend?:      boolean
  showDataLabels?:  boolean
  showMarkers?:     boolean
  format?:          ResolvedVisualPreviewFormat
}

interface Props {
  visualId: string
  size?:    VisualSize
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

export function ChartRenderer({ visualId, size = 'card' }: Props) {
  const Component  = REGISTRY[visualId]
  const formatProps = useThemeStore((s) => s.formatProps)
  const dataColors  = useThemeStore((s) => s.dataColors)
  const format      = resolveVisualPreviewFormat(visualId, formatProps, dataColors)
  const chartVars   = {
    ...getChartCssVars(format),
    '--preview-title-color': normalizeHex(formatProps['general.title.fontColor'], '#252423'),
    '--preview-title-size': `${numberValue(formatProps, 'general.title.fontSize', 9.2)}px`,
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
      />
    </div>
  )
}
