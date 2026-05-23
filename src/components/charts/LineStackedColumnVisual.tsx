import { AX, cv, fmt, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const COUNTRIES = ['Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi', 'UAE']

const STACK_SERIES = [
  { label: 'Capital', values: [3.2, 4.0, 9.6, 1.2, 23.6, 27.8], color: cv(1) },
  { label: 'Coastal', values: [1.2, 1.1, 4.2, 0.5, 18.6, 19.3], color: cv(2) },
  { label: 'Interior', values: [0.4, 0.6, 2.1, 0.2, 17.1, 8.2], color: cv(3) },
  { label: 'Other', values: [0.2, 0.3, 1.1, 0.1, 16.7, 4.7], color: cv(4) },
] as const

const GROSS_PROFIT = [2, 3, 8, 1, 34, 27]

const MAX_VALUE = 80
const GRIDS = [0, 20, 40, 60, 80]

const Lx = 28
const Ly = 26
const Lw = 158
const Lh = 66
const barW = 17
const slotW = Lw / COUNTRIES.length

const xs = COUNTRIES.map((_, i) => Lx + i * slotW + slotW / 2)
const yOf = (value: number) => Ly + Lh - (value / MAX_VALUE) * Lh
const columnTotals = COUNTRIES.map((_, countryIndex) =>
  STACK_SERIES.reduce((sum, series) => sum + series.values[countryIndex], 0),
)

export function LineStackedColumnVisual({ showLegend = true, showDataLabels = true, showMarkers = true, format }: ChartVisualProps) {
  const linePoints = GROSS_PROFIT.map((value, i) => `${xs[i]},${yOf(value)}`).join(' ')
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)

  return (
    <svg viewBox="0 0 200 128" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {showLegend && STACK_SERIES.map((series, i) => (
        <g key={series.label} transform={`translate(${28 + i * 39}, 8)`}>
          <rect width="7" height="7" fill={series.color} />
          <text x="10" y="6.8" fontSize="var(--preview-legend-size, 6.8px)" fill="var(--preview-legend-color, #605E5C)">{series.label}</text>
        </g>
      ))}
      {showLegend && (
        <g transform="translate(28, 18)">
          <line x1="0" y1="3.5" x2="10" y2="3.5" stroke={cv(5)} strokeWidth="1.8" />
          <circle cx="5" cy="3.5" r="2" fill={cv(5)} />
          <text x="14" y="6.8" fontSize="var(--preview-legend-size, 6.8px)" fill="var(--preview-legend-color, #605E5C)">Gross Profit</text>
        </g>
      )}

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
              <text x={Lx - 4} y={y + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 7px)" fill="var(--preview-y-axis-label-color, #605E5C)">
                {fmt(value * 1_000_000)}
              </text>
            )}
          </g>
        )
      })}

      <line x1={Lx} y1={Ly} x2={Lx} y2={Ly + Lh} stroke={axisLine(format?.yAxis)} strokeWidth=".7" />

      {COUNTRIES.map((country, countryIndex) => {
        const x = xs[countryIndex] - barW / 2
        let cumulative = 0

        return (
          <g key={country}>
            {STACK_SERIES.map((series) => {
              const value = series.values[countryIndex]
              const yTop = yOf(cumulative + value)
              const yBase = yOf(cumulative)
              const height = Math.max(yBase - yTop, 0)
              cumulative += value

              return (
                <rect
                  key={`${country}-${series.label}`}
                  x={x}
                  y={yTop}
                  width={barW}
                  height={height}
                  rx="0"
                  fill={series.color}
                  fillOpacity="var(--preview-shape-opacity, 1)"
                  stroke="var(--preview-shape-border-color, none)"
                  strokeWidth="var(--preview-shape-border-width, 0)"
                />
              )
            })}
            {showDataLabels && columnTotals[countryIndex] >= 10 && (
              <text x={xs[countryIndex]} y={yOf(columnTotals[countryIndex]) - 3} textAnchor="middle" fontSize="var(--preview-data-label-size, 6.5px)" fill="var(--preview-data-label-color, #252423)">
                {Math.round(columnTotals[countryIndex])}M
              </text>
            )}
            {showXAxis && (
              <text x={xs[countryIndex]} y={Ly + Lh + 10} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 6.5px)" fill="var(--preview-x-axis-label-color, #605E5C)">
                {country}
              </text>
            )}
          </g>
        )
      })}

      <polyline
        points={linePoints}
        fill="none"
        stroke={cv(5)}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {GROSS_PROFIT.map((value, i) => (
        <g key={`${COUNTRIES[i]}-gross-profit`}>
          {showMarkers && <circle cx={xs[i]} cy={yOf(value)} r="2.3" fill={cv(5)} stroke="white" strokeWidth=".6" />}
          {showDataLabels && value >= 8 && (
            <text x={xs[i]} y={yOf(value) - 5} textAnchor="middle" fontSize="var(--preview-data-label-size, 6.4px)" fill="var(--preview-data-label-color, #252423)" fontWeight="600">
              {value}M
            </text>
          )}
        </g>
      ))}
      {xTitle && (
        <text x={Lx + Lw / 2} y="119" textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
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
