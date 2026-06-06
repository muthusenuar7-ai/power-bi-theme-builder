'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { LineAreaFamilyVisual } from './LineAreaFamilyVisual'
import { AREA_CATS, AREA_SERIES, AREA_VALUES } from './lineAreaSampleData'

export function AreaChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <LineAreaFamilyVisual
      {...props}
      mode="area"
      categories={d?.categories ?? AREA_CATS}
      series={d?.series ?? AREA_SERIES}
      values={d?.values ?? AREA_VALUES}
    />
  )
}
