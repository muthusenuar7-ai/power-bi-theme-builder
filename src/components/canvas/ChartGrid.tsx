'use client'

import { useThemeStore } from '@/store/themeStore'
import { getLayoutPlan, getChartsForPage } from '@/lib/layoutEngine'
import { ChartCard } from './ChartCard'

function gridTemplateFor(cols: number): { gridTemplateColumns: string; gridTemplateRows: string } {
  if (cols === 1) return { gridTemplateColumns: '1fr',               gridTemplateRows: '1fr 1fr 1fr' }
  if (cols === 2) return { gridTemplateColumns: '1fr 1fr',           gridTemplateRows: '1fr 1fr' }
  if (cols === 3) return { gridTemplateColumns: '1fr 1fr 1fr',       gridTemplateRows: '1fr 1fr' }
  return            { gridTemplateColumns: 'repeat(4, 1fr)',      gridTemplateRows: '1fr 1fr' }
}

export function ChartGrid() {
  const pageSize       = useThemeStore((s) => s.pageSize)
  const currentPage    = useThemeStore((s) => s.currentPage)
  const selectedVisual = useThemeStore((s) => s.selectedVisual)

  const { cols } = getLayoutPlan(pageSize)
  const charts   = getChartsForPage(pageSize, currentPage)
  const template = gridTemplateFor(cols)

  return (
    <div style={{
      display: 'grid',
      gap: 'var(--gap, 10px)',
      height: '100%',
      minHeight: 0,
      ...template,
    }}>
      {charts.map((chart) => (
        <ChartCard
          key={chart.id}
          chart={chart}
          isSelected={selectedVisual === chart.id}
        />
      ))}
    </div>
  )
}
