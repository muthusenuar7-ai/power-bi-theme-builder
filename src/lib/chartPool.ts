import type { ChartDefinition } from '@/types'
import { SELECTOR_VISUAL_CATALOG } from './visualCatalog'

export const CHART_POOL: ChartDefinition[] = SELECTOR_VISUAL_CATALOG.map((visual) => ({
  id: visual.id,
  title: visual.title,
  sub: visual.subtitle,
}))

export const CHART_IDS = CHART_POOL.map((chart) => chart.id)
