'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { CartesianFamilyVisual } from './CartesianFamilyVisual'
import { SINGLE_COLUMN_CATS, SINGLE_COLUMN_VALUES, SINGLE_SERIES } from './cartesianSampleData'

export function ColumnChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <CartesianFamilyVisual
      {...props}
      orientation="vertical"
      mode="single"
      categories={d?.categories ?? SINGLE_COLUMN_CATS}
      series={d?.series ?? SINGLE_SERIES}
      values={d?.values ?? SINGLE_COLUMN_VALUES}
    />
  )
}
