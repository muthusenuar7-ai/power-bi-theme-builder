'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { LineAreaFamilyVisual } from './LineAreaFamilyVisual'
import { AREA_STACK_CATS, AREA_STACK_SERIES, AREA_STACK_VALUES } from './lineAreaSampleData'

export function HundredPercentStackedAreaChartVisual(props: ChartVisualProps) {
  const d = props.dataset
  return (
    <LineAreaFamilyVisual
      {...props}
      mode="hundredPercentArea"
      categories={d?.categories ?? AREA_STACK_CATS}
      series={d?.series ?? AREA_STACK_SERIES}
      values={d?.values ?? AREA_STACK_VALUES}
    />
  )
}
