'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { CartesianFamilyVisual } from './CartesianFamilyVisual'
import { CLUSTERED_BAR_CATS, CLUSTERED_BAR_SERIES, CLUSTERED_BAR_VALUES } from './cartesianSampleData'

export function ClusteredBarChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <CartesianFamilyVisual
      {...props}
      orientation="horizontal"
      mode="clustered"
      categories={d?.categories ?? CLUSTERED_BAR_CATS}
      series={d?.series ?? CLUSTERED_BAR_SERIES}
      values={d?.values ?? CLUSTERED_BAR_VALUES}
    />
  )
}
