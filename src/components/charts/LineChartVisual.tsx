import { AX, fmt, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const MONTHS  = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const REVENUE = [120, 145, 132, 168, 155, 190]
const COST    = [85,  92,  88,  105, 98,  115]
const MAX     = 200
const GRIDS   = [0, 50, 100, 150, 200]

const Lx = 32, Ly = 8, Lw = 160, Lh = 82
const xs = MONTHS.map((_, i) => Lx + (i / (MONTHS.length - 1)) * Lw)
const yOf = (v: number) => Ly + Lh - (v / MAX) * Lh

const pts = (vals: number[]) => vals.map((v, i) => `${xs[i]},${yOf(v)}`).join(' ')

export function LineChartVisual({ showLegend = true, showDataLabels = true, showMarkers = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)

  return (
    <svg viewBox="0 0 200 130" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {/* Gridlines */}
      {GRIDS.map((v) => {
        const y = yOf(v)
        return (
          <g key={v}>
            <line x1={Lx} y1={y} x2={Lx + Lw} y2={y}
              stroke={v === 0 ? axisLine(format?.yAxis) : AX.grid}
              strokeWidth={v === 0 ? .8 : 'var(--preview-gridline-width, .5)'}
              strokeDasharray={v === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'} />
            {showYAxis && (
              <text x={Lx - 3} y={y + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 7.5px)" fill="var(--preview-y-axis-label-color, #605E5C)">{fmt(v)}</text>
            )}
          </g>
        )
      })}
      <line x1={Lx} y1={Ly} x2={Lx} y2={Ly + Lh} stroke={axisLine(format?.yAxis)} strokeWidth=".7" />

      {/* X-axis labels */}
      {showXAxis && MONTHS.map((m, i) => (
        <text key={m} x={xs[i]} y={Ly + Lh + 10} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 7.5px)" fill="var(--preview-x-axis-label-color, #605E5C)">{m}</text>
      ))}

      {/* Cost line (behind) */}
      <polyline points={pts(COST)} fill="none" stroke={cv(2)} strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round" />
      {showMarkers && COST.map((v, i) => <circle key={i} cx={xs[i]} cy={yOf(v)} r="2.2" fill={cv(2)} />)}

      {/* Revenue line (front) */}
      <polyline points={pts(REVENUE)} fill="none" stroke={cv(1)} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />
      {showMarkers && REVENUE.map((v, i) => <circle key={i} cx={xs[i]} cy={yOf(v)} r="2.2" fill={cv(1)} />)}
      {showDataLabels && REVENUE.map((v, i) => (
        <text key={i} x={xs[i]} y={yOf(v) - 5} textAnchor="middle" fontSize="var(--preview-data-label-size, 6.8px)" fill="var(--preview-data-label-color, #252423)">
          {fmt(v)}
        </text>
      ))}

      {/* Legend */}
      {showLegend && [['Revenue', cv(1)], ['Cost', cv(2)]].map(([label, color], i) => (
          <g key={label} transform={`translate(${Lx + i * 48}, 120)`}>
            <line x1="0" y1="4" x2="10" y2="4" stroke={color} strokeWidth="2" />
            {showMarkers && <circle cx="5" cy="4" r="2" fill={color} />}
            <text x="13" y="7.5" fontSize="var(--preview-legend-size, 8px)" fill="var(--preview-legend-color, #605E5C)">{label}</text>
          </g>
        ))}
      {xTitle && (
        <text x={Lx + Lw / 2} y={111} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
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
