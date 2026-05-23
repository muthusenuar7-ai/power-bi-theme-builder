import { AX, fmt, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const VALS   = [62, 85, 73, 108, 94, 132]
const MAX    = 140
const GRIDS  = [0, 35, 70, 105, 140]

const Lx = 32, Ly = 8, Lw = 160, Lh = 88
const xs  = MONTHS.map((_, i) => Lx + (i / (MONTHS.length - 1)) * Lw)
const yOf = (v: number) => Ly + Lh - (v / MAX) * Lh

const linePoints = VALS.map((v, i) => `${xs[i]},${yOf(v)}`).join(' ')
const areaPoints = [
  `${xs[0]},${Ly + Lh}`,
  ...VALS.map((v, i) => `${xs[i]},${yOf(v)}`),
  `${xs[xs.length - 1]},${Ly + Lh}`,
].join(' ')

export function AreaChartVisual({ format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)

  return (
    <svg viewBox="0 0 200 128" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
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

      {/* Filled area */}
      <polygon points={areaPoints} fill={cv(1)} fillOpacity=".18" />

      {/* Line */}
      <polyline points={linePoints} fill="none" stroke={cv(1)} strokeWidth="1.8"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Dots */}
      {VALS.map((v, i) => (
        <circle key={i} cx={xs[i]} cy={yOf(v)} r="2.2" fill={cv(1)} />
      ))}
      {xTitle && (
        <text x={Lx + Lw / 2} y={119} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
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
