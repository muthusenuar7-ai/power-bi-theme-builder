import { AX, fmt, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const CATS = ['Electronics', 'Clothing', 'Food', 'Sports', 'Books']
const VALS = [84, 62, 45, 71, 38]
const MAX  = 90
const GRID = [0, 30, 60, 90]

// Layout
const Lx = 60, Ly = 8, Lw = 130, Lh = 95
const slotH = Lh / CATS.length   // 19
const barH  = 11

export function BarChartVisual({ showDataLabels = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)
  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {/* Vertical gridlines + value axis labels */}
      {GRID.map((v) => {
        const x = Lx + (v / MAX) * Lw
        return (
          <g key={v}>
            <line x1={x} y1={Ly} x2={x} y2={Ly + Lh}
              stroke={v === 0 ? axisLine(format?.xAxis) : AX.grid}
              strokeWidth={v === 0 ? .8 : 'var(--preview-gridline-width, .5)'}
              strokeDasharray={v === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'} />
            {showXAxis && (
              <text x={x} y={Ly + Lh + 9} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 7.5px)" fill="var(--preview-x-axis-label-color, #605E5C)">{fmt(v)}</text>
            )}
          </g>
        )
      })}

      {/* Bars */}
      {CATS.map((cat, i) => {
        const y   = Ly + i * slotH + (slotH - barH) / 2
        const barW = (VALS[i] / MAX) * Lw
        return (
          <g key={cat}>
            {showYAxis && (
              <text x={Lx - 4} y={y + barH / 2 + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 8px)" fill="var(--preview-y-axis-label-color, #605E5C)">{cat}</text>
            )}
            <rect
              x={Lx}
              y={y}
              width={barW}
              height={barH}
              rx="0"
              fill={cv(1)}
              fillOpacity="var(--preview-shape-opacity, 1)"
              stroke="var(--preview-shape-border-color, none)"
              strokeWidth="var(--preview-shape-border-width, 0)"
            />
            {showDataLabels && (
              <text x={Lx + barW + 3} y={y + barH / 2 + 3} fontSize="var(--preview-data-label-size, 7.5px)" fill="var(--preview-data-label-color, #252423)">{fmt(VALS[i])}</text>
            )}
          </g>
        )
      })}
      {xTitle && (
        <text x={Lx + Lw / 2} y={119} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
          {xTitle}
        </text>
      )}
      {yTitle && (
        <text transform={`translate(10 ${Ly + Lh / 2}) rotate(-90)`} textAnchor="middle" fontSize="var(--preview-y-axis-title-size, 8px)" fill="var(--preview-y-axis-title-color, #605E5C)" fontWeight="600">
          {yTitle}
        </text>
      )}
    </svg>
  )
}
