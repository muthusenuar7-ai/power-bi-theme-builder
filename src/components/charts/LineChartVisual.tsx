'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { LineAreaFamilyVisual } from './LineAreaFamilyVisual'
import { LINE_CATS, LINE_SERIES, LINE_VALUES } from './lineAreaSampleData'

export function LineChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <LineAreaFamilyVisual
      {...props}
      mode="line"
      categories={d?.categories ?? LINE_CATS}
      series={d?.series ?? LINE_SERIES}
      values={d?.values ?? LINE_VALUES}
    />
  )
}
