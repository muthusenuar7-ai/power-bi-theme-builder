'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { ComboFamilyVisual } from './ComboFamilyVisual'
import {
  COMBO_CATS,
  COMBO_CLUSTERED_COLUMNS,
  COMBO_CLUSTERED_COLUMN_VALUES,
  COMBO_CLUSTERED_LINE,
  COMBO_CLUSTERED_LINE_VALUES,
} from './lineAreaSampleData'

export function LineClusteredColumnVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <ComboFamilyVisual
      {...props}
      columnMode="clustered"
      categories={d?.categories ?? COMBO_CATS}
      columnSeries={d?.columnSeries ?? COMBO_CLUSTERED_COLUMNS}
      columnValues={d?.columnValues ?? COMBO_CLUSTERED_COLUMN_VALUES}
      lineSeries={d?.lineSeries ?? COMBO_CLUSTERED_LINE}
      lineValues={d?.lineValues ?? COMBO_CLUSTERED_LINE_VALUES}
    />
  )
}
