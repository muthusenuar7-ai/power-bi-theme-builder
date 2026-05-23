import { AX, fmt, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const CATS   = ['Q1', 'Q2', 'Q3', 'Q4']
const SERIES = ['Prod A', 'Prod B']
const DATA   = [[82, 68], [95, 78], [88, 92], [112, 84]]  // [cat][series]
const MAX    = 120
const GRIDS  = [0, 40, 80, 120]

const Lx = 32, Ly = 8, Lw = 160, Lh = 82
const slotW  = Lw / CATS.length   // 40
const barW   = 13
const barGap = 2
const groupW = SERIES.length * barW + (SERIES.length - 1) * barGap  // 28

const COLORS = [cv(1), cv(2)]

export function ClusteredColumnChartVisual({ showLegend = true, showDataLabels = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)
  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {/* Gridlines */}
      {GRIDS.map((v) => {
        const y = Ly + Lh - (v / MAX) * Lh
        return (
          <g key={v}>
            <line
              x1={Lx}
              y1={y}
              x2={Lx + Lw}
              y2={y}
              stroke={v === 0 ? axisLine(format?.yAxis) : AX.grid}
              strokeWidth={v === 0 ? .8 : 'var(--preview-gridline-width, .5)'}
              strokeDasharray={v === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'}
            />
            {showYAxis && (
              <text x={Lx - 3} y={y + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 7.5px)" fill="var(--preview-y-axis-label-color, #605E5C)">{fmt(v)}</text>
            )}
          </g>
        )
      })}

      {/* Clustered columns */}
      {CATS.map((cat, ci) => {
        const slotX  = Lx + ci * slotW
        const groupX = slotX + (slotW - groupW) / 2
        return (
          <g key={cat}>
            {showXAxis && (
              <text x={slotX + slotW / 2} y={Ly + Lh + 10} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 8px)" fill="var(--preview-x-axis-label-color, #605E5C)">{cat}</text>
            )}
            {SERIES.map((_, si) => {
              const x    = groupX + si * (barW + barGap)
              const barH = (DATA[ci][si] / MAX) * Lh
              const y    = Ly + Lh - barH
              return (
                <g key={si}>
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="0"
                    fill={COLORS[si]}
                    fillOpacity="var(--preview-shape-opacity, 1)"
                    stroke="var(--preview-shape-border-color, none)"
                    strokeWidth="var(--preview-shape-border-width, 0)"
                  />
                  {showDataLabels && (
                    <text x={x + barW / 2} y={y - 2} textAnchor="middle" fontSize="var(--preview-data-label-size, 6.6px)" fill="var(--preview-data-label-color, #252423)">
                      {fmt(DATA[ci][si])}
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Legend */}
      {showLegend && SERIES.map((s, i) => (
        <g key={s} transform={`translate(${Lx + i * 42}, 110)`}>
          <rect width="8" height="8" rx="1" fill={COLORS[i]} />
          <text x="11" y="7.5" fontSize="var(--preview-legend-size, 8px)" fill="var(--preview-legend-color, #605E5C)">{s}</text>
        </g>
      ))}
      {xTitle && (
        <text x={Lx + Lw / 2} y={107} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
          {xTitle}
        </text>
      )}
      {yTitle && (
        <text transform={`translate(8 ${Ly + Lh / 2}) rotate(-90)`} textAnchor="middle" fontSize="var(--preview-y-axis-title-size, 8px)" fill="var(--preview-y-axis-title-color, #605E5C)" fontWeight="600">
          {yTitle}
        </text>
      )}
    </svg>
  )
}
