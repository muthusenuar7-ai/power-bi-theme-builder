'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { CartesianFamilyVisual } from './CartesianFamilyVisual'
import { STACKED_CATS, STACKED_SERIES, STACKED_VALUES } from './cartesianSampleData'

export function HundredPercentStackedBarChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <CartesianFamilyVisual
      {...props}
      orientation="horizontal"
      mode="hundredPercent"
      categories={d?.categories ?? STACKED_CATS}
      series={d?.series ?? STACKED_SERIES}
      values={d?.values ?? STACKED_VALUES}
    />
  )
}
