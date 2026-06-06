'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { ComboFamilyVisual } from './ComboFamilyVisual'
import {
  COMBO_CATS,
  COMBO_STACKED_COLUMNS,
  COMBO_STACKED_COLUMN_VALUES,
  COMBO_STACKED_LINE,
  COMBO_STACKED_LINE_VALUES,
} from './lineAreaSampleData'

export function LineStackedColumnVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <ComboFamilyVisual
      {...props}
      columnMode="stacked"
      categories={d?.categories ?? COMBO_CATS}
      columnSeries={d?.columnSeries ?? COMBO_STACKED_COLUMNS}
      columnValues={d?.columnValues ?? COMBO_STACKED_COLUMN_VALUES}
      lineSeries={d?.lineSeries ?? COMBO_STACKED_LINE}
      lineValues={d?.lineValues ?? COMBO_STACKED_LINE_VALUES}
    />
  )
}
