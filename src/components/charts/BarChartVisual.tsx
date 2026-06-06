'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { CartesianFamilyVisual } from './CartesianFamilyVisual'
import { SINGLE_BAR_CATS, SINGLE_BAR_VALUES, SINGLE_SERIES } from './cartesianSampleData'

export function BarChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <CartesianFamilyVisual
      {...props}
      orientation="horizontal"
      mode="single"
      categories={d?.categories ?? SINGLE_BAR_CATS}
      series={d?.series ?? SINGLE_SERIES}
      values={d?.values ?? SINGLE_BAR_VALUES}
    />
  )
}
