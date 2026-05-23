import type { LayoutConfig } from '@/types'
import { KpiStrip } from './KpiStrip'
import { SlicerSidebar } from './SlicerSidebar'
import { ChartGrid } from './ChartGrid'

const PAGE_LABELS = [
  { name: 'Overview',   sub: 'Executive summary' },
  { name: 'Sales',      sub: 'Revenue & pipeline' },
  { name: 'Operations', sub: 'Throughput & SLA' },
  { name: 'Finance',    sub: 'P&L and cash' },
  { name: 'Marketing',  sub: 'Campaigns & attribution' },
  { name: 'HR',         sub: 'Headcount & talent' },
]

const PILLS = ['All', 'Q1', 'Q2', 'Q3', 'Q4']

interface Props {
  currentPage: number
  layout:      LayoutConfig
  dataColors:  string[]
}

function buildGridStyle(
  numSlicers: number,
  slicerPos: LayoutConfig['slicerPos'],
  numKpis: number,
): React.CSSProperties {
  if (numSlicers === 0 && numKpis === 0) {
    return {
      gridTemplateRows: 'auto 1fr',
      gridTemplateAreas: '"header" "charts"',
    }
  }
  if (numSlicers === 0) {
    return {
      gridTemplateRows: 'auto auto 1fr',
      gridTemplateAreas: '"header" "kpis" "charts"',
    }
  }
  if (slicerPos === 'left') {
    return {
      gridTemplateColumns: '190px 1fr',
      gridTemplateRows: 'auto auto 1fr',
      gridTemplateAreas: '"header header" "sidebar kpis" "sidebar charts"',
    }
  }
  if (slicerPos === 'right') {
    return {
      gridTemplateColumns: '1fr 190px',
      gridTemplateRows: 'auto auto 1fr',
      gridTemplateAreas: '"header header" "kpis sidebar" "charts sidebar"',
    }
  }
  // top
  const kpisRow = numKpis > 0 ? '"kpis"' : ''
  const areas = `"header" "topslicers" ${kpisRow} "charts"`
  const rows  = numKpis > 0 ? 'auto auto auto 1fr' : 'auto auto 1fr'
  return { gridTemplateRows: rows, gridTemplateAreas: areas }
}

export function DashboardLayout({ currentPage, layout, dataColors }: Props) {
  const { numSlicers, slicerPos, numKpis } = layout
  const page = PAGE_LABELS[currentPage % PAGE_LABELS.length]
  const gap  = 'var(--gap, 10px)'

  const gridStyle: React.CSSProperties = {
    position: 'absolute', inset: 0,
    display: 'grid',
    padding: gap, gap,
    ...buildGridStyle(numSlicers, slicerPos, numKpis),
  }

  const slicerArea = slicerPos === 'top' ? 'topslicers' : 'sidebar'

  return (
    <div style={gridStyle}>
      {/* Report header */}
      <div style={{
        gridArea: 'header',
        background: 'var(--card-bg, #fff)',
        border: '1px solid var(--card-border, transparent)',
        borderRadius: 'var(--card-radius, 6px)',
        boxShadow: 'var(--card-shadow)',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 14,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: '-.01em', color: 'var(--theme-fg, #252423)' }}>
            {page.name}
          </h1>
          <div style={{ fontSize: 11, color: 'var(--theme-fg-muted, #605E5C)', marginTop: 2 }}>
            {page.sub}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          {PILLS.map((pill, i) => (
            <button key={pill} style={{
              height: 22, padding: '0 9px', fontSize: 11,
              border: i === 0
                ? '1px solid var(--theme-primary, #0D9488)'
                : '1px solid rgba(0,0,0,.1)',
              background: i === 0 ? 'var(--theme-primary, #0D9488)' : 'rgba(255,255,255,.6)',
              borderRadius: 4, cursor: 'pointer',
              color: i === 0 ? '#fff' : 'var(--theme-fg-muted, #605E5C)',
              fontFamily: "'Segoe UI', sans-serif", fontWeight: i === 0 ? 600 : 400,
            }}>
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Slicers */}
      {numSlicers > 0 && (
        <div style={{ gridArea: slicerArea }}>
          <SlicerSidebar numSlicers={numSlicers} slicerPos={slicerPos} />
        </div>
      )}

      {/* KPI strip */}
      {numKpis > 0 && (
        <div style={{ gridArea: 'kpis' }}>
          <KpiStrip numKpis={numKpis} colors={dataColors} />
        </div>
      )}

      {/* Chart grid */}
      <div style={{ gridArea: 'charts', minHeight: 0 }}>
        <ChartGrid />
      </div>
    </div>
  )
}
