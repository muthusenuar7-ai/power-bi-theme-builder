import { KPI_DEFS } from '@/lib/kpiDefs'

interface Props { numKpis: number; colors: string[] }

export function KpiStrip({ numKpis, colors }: Props) {
  if (numKpis === 0) return null
  const kpis = KPI_DEFS.slice(0, numKpis)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${numKpis}, 1fr)`,
      gap: 'var(--gap, 10px)',
      height: '100%',
    }}>
      {kpis.map((kpi, i) => {
        const accent = colors[i % colors.length]
        const isUp   = kpi.trend === 'up'
        return (
          <div key={kpi.lbl} style={{
            background: 'var(--card-bg, #fff)',
            border: '1px solid var(--card-border, transparent)',
            borderRadius: 'var(--card-radius, 6px)',
            boxShadow: 'var(--card-shadow)',
            padding: '10px 12px 10px 14px',
            position: 'relative',
            display: 'flex', flexDirection: 'column', gap: 2,
            overflow: 'hidden',
          }}>
            {/* Left accent bar */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
              background: accent,
            }} />
            <div style={{ fontSize: 10.5, color: 'var(--theme-fg-muted, #605E5C)', fontWeight: 500, letterSpacing: '.02em' }}>
              {kpi.lbl}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif", color: 'var(--theme-fg, #252423)', letterSpacing: '-.02em', lineHeight: 1.1 }}>
              {kpi.val}
            </div>
            <div style={{ fontSize: 10.5, fontWeight: 500, color: isUp ? '#107C41' : '#C72F2F', display: 'flex', alignItems: 'center', gap: 3 }}>
              {isUp ? '▲' : '▼'} {kpi.delta}
            </div>
          </div>
        )
      })}
    </div>
  )
}
