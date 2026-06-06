'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { PieDonutMimicVisual } from './PieDonutMimicVisual'

export function PieChartVisual(props: ChartVisualProps) {
  return <PieDonutMimicVisual {...props} variant="pie" data={props.dataset?.slices} />
}
