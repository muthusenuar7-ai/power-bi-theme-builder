import { AX, cv, fmt, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const COUNTRIES = ['Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi', 'UAE']
const REVENUE_2015 = [3, 3, 8, 1, 36, 28]
const REVENUE_2016 = [2, 3, 9, 1, 40, 32]
const GROSS_PROFIT = [2, 2, 8, 1, 34, 27]

const MAX_VALUE = 80
const GRIDS = [0, 20, 40, 60, 80]

const Lx = 30
const Ly = 24
const Lw = 176
const Lh = 74
const slotW = Lw / COUNTRIES.length
const barW = 6
const barGap = 2
const groupW = barW * 2 + barGap

const xs = COUNTRIES.map((_, i) => Lx + i * slotW + slotW / 2)
const yOf = (value: number) => Ly + Lh - (value / MAX_VALUE) * Lh

export function LineClusteredColumnVisual({ showLegend = true, showDataLabels = true, showMarkers = true, format }: ChartVisualProps) {
  const linePoints = GROSS_PROFIT.map((value, i) => `${xs[i]},${yOf(value)}`).join(' ')
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)

  return (
    <svg viewBox="0 0 220 132" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {showLegend && [
        ['2015', cv(1), 'bar'],
        ['2016', cv(2), 'bar'],
        ['Gross Profit', cv(3), 'line'],
      ].map(([label, color, kind], i) => (
        <g key={label} transform={`translate(${34 + i * 56}, 9)`}>
          {kind === 'line'
            ? <line x1="0" y1="4" x2="11" y2="4" stroke={color} strokeWidth="1.8" />
            : <rect width="8" height="8" fill={color} />}
          <text x="14" y="7.4" fontSize="var(--preview-legend-size, 7px)" fill="var(--preview-legend-color, #605E5C)">{label}</text>
        </g>
      ))}

      {GRIDS.map((value) => {
        const y = yOf(value)
        return (
          <g key={value}>
            <line x1={Lx} y1={y} x2={Lx + Lw} y2={y} stroke={value === 0 ? axisLine(format?.yAxis) : AX.grid} strokeWidth={value === 0 ? 0.8 : 'var(--preview-gridline-width, .5)'} strokeDasharray={value === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'} />
            {showYAxis && (
              <text x={Lx - 4} y={y + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 7px)" fill="var(--preview-y-axis-label-color, #605E5C)">{fmt(value * 1_000_000)}</text>
            )}
          </g>
        )
      })}
      <line x1={Lx} y1={Ly} x2={Lx} y2={Ly + Lh} stroke={axisLine(format?.yAxis)} strokeWidth=".7" />

      {COUNTRIES.map((country, i) => {
        const groupX = xs[i] - groupW / 2
        const values = [
          { value: REVENUE_2015[i], color: cv(1), x: groupX },
          { value: REVENUE_2016[i], color: cv(2), x: groupX + barW + barGap },
        ]

        return (
          <g key={country}>
            {values.map((bar) => (
              <rect
                key={`${country}-${bar.color}`}
                x={bar.x}
                y={yOf(bar.value)}
                width={barW}
                height={Ly + Lh - yOf(bar.value)}
                rx="0"
                fill={bar.color}
                fillOpacity="var(--preview-shape-opacity, 1)"
                stroke="var(--preview-shape-border-color, none)"
                strokeWidth="var(--preview-shape-border-width, 0)"
              />
            ))}
            {showDataLabels && REVENUE_2016[i] >= 8 && (
              <text x={xs[i]} y={yOf(REVENUE_2016[i]) - 3} textAnchor="middle" fontSize="var(--preview-data-label-size, 6.1px)" fill="var(--preview-data-label-color, #252423)">
                {REVENUE_2016[i]}M
              </text>
            )}
            {showXAxis && (
              <text x={xs[i]} y={Ly + Lh + 10} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 6.2px)" fill="var(--preview-x-axis-label-color, #605E5C)">{country}</text>
            )}
          </g>
        )
      })}

      <polyline points={linePoints} fill="none" stroke={cv(3)} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {GROSS_PROFIT.map((value, i) => (
        <g key={`${COUNTRIES[i]}-gross-profit`}>
          {showMarkers && <circle cx={xs[i]} cy={yOf(value)} r="2.2" fill={cv(3)} stroke="white" strokeWidth=".6" />}
          {showDataLabels && value >= 8 && (
            <text x={xs[i]} y={yOf(value) - 6} textAnchor="middle" fontSize="var(--preview-data-label-size, 6.1px)" fill="var(--preview-data-label-color, #252423)" fontWeight="600">
              {value}M
            </text>
          )}
        </g>
      ))}
      {xTitle && (
        <text x={Lx + Lw / 2} y="125" textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
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
