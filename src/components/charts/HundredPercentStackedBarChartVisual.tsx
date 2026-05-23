import { AX, pct, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const COUNTRIES = ['Saudi', 'UAE', 'Oman', 'Kuwait', 'Bahrain', 'Qatar']
const SERIES = ['Groceries', 'Hotels', 'Hypermarkets', 'Supermarkets']

const DATA = [
  [7, 18, 9, 42],
  [6, 5, 5, 44],
  [2, 3, 4, 8],
  [1, 1.5, 1.5, 2],
  [0.8, 1.2, 1, 2],
  [0.3, 0.4, 0.5, 0.8],
]

const NORMALIZED = DATA.map((row) => {
  const total = row.reduce((sum, value) => sum + value, 0)
  return row.map((value) => (value / total) * 100)
})

const TICKS = [0, 50, 100]
const COLORS = [cv(1), cv(2), cv(3), cv(4)]

const Lx = 58
const Ly = 27
const Lw = 158
const Lh = 78
const slotH = Lh / COUNTRIES.length
const barH = 8.8

export function HundredPercentStackedBarChartVisual({ showLegend = true, showDataLabels = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)
  return (
    <svg viewBox="0 0 240 132" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {showLegend && SERIES.map((name, i) => (
        <g key={name} transform={`translate(${46 + i * 48}, 9)`}>
          <rect x="0" y="-5.5" width="6" height="6" fill={COLORS[i]} />
          <text x="9" y="0" fontSize="var(--preview-legend-size, 6.7px)" fill="var(--preview-legend-color, #605E5C)">{name}</text>
        </g>
      ))}

      {TICKS.map((v) => {
        const x = Lx + (v / 100) * Lw
        return (
          <g key={v}>
            <line
              x1={x}
              y1={Ly}
              x2={x}
              y2={Ly + Lh}
              stroke={v === 0 ? axisLine(format?.xAxis) : AX.grid}
              strokeWidth={v === 0 ? .8 : 'var(--preview-gridline-width, .5)'}
              strokeDasharray={v === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'}
            />
            {showXAxis && (
              <text x={x} y={Ly + Lh + 12} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 7.3px)" fill="var(--preview-x-axis-label-color, #605E5C)">
                {v}%
              </text>
            )}
          </g>
        )
      })}

      <line x1={Lx} y1={Ly + Lh} x2={Lx + Lw} y2={Ly + Lh} stroke={axisLine(format?.xAxis)} strokeWidth=".8" />

      {COUNTRIES.map((country, ci) => {
        const y = Ly + ci * slotH + (slotH - barH) / 2
        let xCursor = Lx
        return (
          <g key={country}>
            {showYAxis && (
              <text x={Lx - 6} y={y + barH / 2 + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 7.8px)" fill="var(--preview-y-axis-label-color, #605E5C)">
                {country}
              </text>
            )}
            {NORMALIZED[ci].map((percentage, si) => {
              const segmentWidth = si === SERIES.length - 1
                ? Lx + Lw - xCursor
                : (percentage / 100) * Lw
              const segment = (
                <g key={si}>
                  <rect
                    x={xCursor}
                    y={y}
                    width={segmentWidth}
                    height={barH}
                    rx="0"
                    fill={COLORS[si]}
                    fillOpacity="var(--preview-shape-opacity, 1)"
                    stroke="var(--preview-shape-border-color, none)"
                    strokeWidth="var(--preview-shape-border-width, 0)"
                  />
                  {showDataLabels && segmentWidth > 22 && (
                    <text x={xCursor + segmentWidth / 2} y={y + barH / 2 + 3}
                      textAnchor="middle" fontSize="var(--preview-data-label-size, 6.4px)" fill="var(--preview-data-label-color, #fff)" fontWeight="600">
                      {pct(percentage)}
                    </text>
                  )}
                </g>
              )
              xCursor += segmentWidth
              return segment
            })}
          </g>
        )
      })}
      {xTitle && (
        <text x={Lx + Lw / 2} y={130} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
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
