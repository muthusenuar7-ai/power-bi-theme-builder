import { AX, fmt, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const CATS  = ['Q1', 'Q2', 'Q3', 'Q4']
const VALS  = [142, 185, 162, 208]
const MAX   = 220
const GRIDS = [0, 55, 110, 165, 220]

// Layout
const Lx = 34, Ly = 8, Lw = 158, Lh = 88
const slotW = Lw / CATS.length   // ~39.5
const barW  = 22

export function ColumnChartVisual({ showDataLabels = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)
  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {/* Horizontal gridlines + Y-axis labels */}
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

      {/* Columns */}
      {CATS.map((cat, i) => {
        const x    = Lx + i * slotW + (slotW - barW) / 2
        const barH = (VALS[i] / MAX) * Lh
        const y    = Ly + Lh - barH
        return (
          <g key={cat}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="0"
              fill={cv(1)}
              fillOpacity="var(--preview-shape-opacity, 1)"
              stroke="var(--preview-shape-border-color, none)"
              strokeWidth="var(--preview-shape-border-width, 0)"
            />
            {showXAxis && (
              <text x={x + barW / 2} y={Ly + Lh + 10} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 8px)" fill="var(--preview-x-axis-label-color, #605E5C)">{cat}</text>
            )}
            {showDataLabels && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fontSize="var(--preview-data-label-size, 7.5px)" fill="var(--preview-data-label-color, #252423)">{fmt(VALS[i])}</text>
            )}
          </g>
        )
      })}
      {xTitle && (
        <text x={Lx + Lw / 2} y={117} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
          {xTitle}
        </text>
      )}
      {yTitle && (
        <text transform={`translate(9 ${Ly + Lh / 2}) rotate(-90)`} textAnchor="middle" fontSize="var(--preview-y-axis-title-size, 8px)" fill="var(--preview-y-axis-title-color, #605E5C)" fontWeight="600">
          {yTitle}
        </text>
      )}
    </svg>
  )
}
