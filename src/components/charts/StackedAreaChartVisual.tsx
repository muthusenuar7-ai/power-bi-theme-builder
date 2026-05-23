import { AX, cv, fmt, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const PERIODS = ['Jan 15', 'Apr', 'Jul', 'Oct', 'Jan 16', 'Apr', 'Jul', 'Oct']

const SERIES = [
  { label: 'Bahrain', values: [0.4, 0.5, 0.6, 0.7, 0.8, 0.8, 0.9, 1.0], color: cv(1) },
  { label: 'Kuwait', values: [0.6, 0.7, 0.8, 1.0, 1.1, 1.2, 1.3, 1.4], color: cv(2) },
  { label: 'Qatar', values: [0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4], color: cv(3) },
  { label: 'Oman', values: [1.8, 2.0, 2.3, 2.6, 3.0, 3.2, 3.4, 3.6], color: cv(4) },
  { label: 'UAE', values: [4.1, 4.8, 5.5, 6.2, 7.1, 7.8, 8.4, 9.0], color: cv(5) },
  { label: 'Saudi', values: [6.3, 7.0, 8.2, 9.0, 10.1, 10.9, 11.6, 12.2], color: cv(6) },
] as const

const MAX_VALUE = 30
const GRIDS = [0, 10, 20, 30]

const Lx = 34
const Ly = 26
const Lw = 190
const Lh = 82

const xs = PERIODS.map((_, i) => Lx + (i / (PERIODS.length - 1)) * Lw)
const yOf = (value: number) => Ly + Lh - (value / MAX_VALUE) * Lh

function cumulativeAt(seriesIndex: number, pointIndex: number): number {
  return SERIES.slice(0, seriesIndex + 1).reduce((sum, series) => sum + series.values[pointIndex], 0)
}

function previousCumulativeAt(seriesIndex: number, pointIndex: number): number {
  if (seriesIndex === 0) return 0
  return SERIES.slice(0, seriesIndex).reduce((sum, series) => sum + series.values[pointIndex], 0)
}

function layerPolygon(seriesIndex: number): string {
  const tops = PERIODS.map((_, pointIndex) => `${xs[pointIndex]},${yOf(cumulativeAt(seriesIndex, pointIndex))}`)
  const bottoms = PERIODS.map((_, pointIndex) => `${xs[pointIndex]},${yOf(previousCumulativeAt(seriesIndex, pointIndex))}`).reverse()
  return [...tops, ...bottoms].join(' ')
}

function layerLine(seriesIndex: number): string {
  return PERIODS.map((_, pointIndex) => `${xs[pointIndex]},${yOf(cumulativeAt(seriesIndex, pointIndex))}`).join(' ')
}

const totals = PERIODS.map((_, pointIndex) =>
  SERIES.reduce((sum, series) => sum + series.values[pointIndex], 0),
)

export function StackedAreaChartVisual({ showLegend = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)

  return (
    <svg viewBox="0 0 240 150" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {showLegend && SERIES.map((series, i) => (
        <g key={series.label} transform={`translate(${34 + (i % 3) * 64}, ${7 + Math.floor(i / 3) * 10})`}>
          <rect width="9" height="6" fill={series.color} fillOpacity=".58" />
          <text x="12" y="6.1" fontSize="var(--preview-legend-size, 6.7px)" fill="var(--preview-legend-color, #605E5C)">{series.label}</text>
        </g>
      ))}

      {GRIDS.map((value) => {
        const y = yOf(value)
        return (
          <g key={value}>
            <line
              x1={Lx}
              y1={y}
              x2={Lx + Lw}
              y2={y}
              stroke={value === 0 ? axisLine(format?.yAxis) : AX.grid}
              strokeWidth={value === 0 ? 0.8 : 'var(--preview-gridline-width, .5)'}
              strokeDasharray={value === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'}
            />
            {showYAxis && (
              <text x={Lx - 4} y={y + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 7px)" fill="var(--preview-y-axis-label-color, #605E5C)">{fmt(value * 1_000_000)}</text>
            )}
          </g>
        )
      })}
      <line x1={Lx} y1={Ly} x2={Lx} y2={Ly + Lh} stroke={axisLine(format?.yAxis)} strokeWidth=".7" />

      {SERIES.map((series, seriesIndex) => (
        <g key={`${series.label}-area`}>
          <polygon points={layerPolygon(seriesIndex)} fill={series.color} fillOpacity=".48" />
          <polyline points={layerLine(seriesIndex)} fill="none" stroke={series.color} strokeWidth=".8" strokeOpacity=".72" />
        </g>
      ))}

      {showXAxis && PERIODS.map((period, i) => (
        <text key={period} x={xs[i]} y={Ly + Lh + 10} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 6.2px)" fill="var(--preview-x-axis-label-color, #605E5C)">{period}</text>
      ))}

      <text x={xs[xs.length - 1] - 2} y={yOf(totals[totals.length - 1]) - 5} textAnchor="end" fontSize="6.5" fill={AX.label} fontWeight="600">
        {Math.round(totals[totals.length - 1])}M
      </text>
      {xTitle && (
        <text x={Lx + Lw / 2} y={132} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
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
