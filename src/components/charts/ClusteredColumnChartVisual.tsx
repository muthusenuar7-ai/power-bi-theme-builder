'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { CartesianFamilyVisual } from './CartesianFamilyVisual'
import { CLUSTERED_COL_CATS, CLUSTERED_COL_SERIES, CLUSTERED_COL_VALUES } from './cartesianSampleData'

export function ClusteredColumnChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <CartesianFamilyVisual
      {...props}
      orientation="vertical"
      mode="clustered"
      categories={d?.categories ?? CLUSTERED_COL_CATS}
      series={d?.series ?? CLUSTERED_COL_SERIES}
      values={d?.values ?? CLUSTERED_COL_VALUES}
    />
  )
}
