'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { PieDonutMimicVisual } from './PieDonutMimicVisual'

export function DonutChartVisual(props: ChartVisualProps) {
  return <PieDonutMimicVisual {...props} variant="donut" data={props.dataset?.slices} />
}
