import { AX, cv } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

type Year = '2015' | '2016'

const YEAR_COLORS: Record<Year, string> = {
  '2015': cv(1),
  '2016': cv(2),
}

const BUBBLES = [
  { city: 'Riyadh', sales: 13.8, gm: 57, radius: 13, year: '2016' as Year },
  { city: 'Dubai', sales: 12.5, gm: 54, radius: 11, year: '2016' as Year },
  { city: 'Jeddah', sales: 9.6, gm: 50, radius: 9, year: '2015' as Year },
  { city: 'Abu Dhabi', sales: 8.3, gm: 47, radius: 8, year: '2015' as Year },
  { city: 'Dammam', sales: 7.1, gm: 44, radius: 7, year: '2015' as Year },
  { city: 'Muscat', sales: 6.4, gm: 59, radius: 7, year: '2016' as Year },
  { city: 'Sharjah', sales: 4.8, gm: 52, radius: 5.8, year: '2015' as Year },
  { city: 'Manama', sales: 3.5, gm: 43, radius: 5.2, year: '2016' as Year },
  { city: 'Doha', sales: 2.2, gm: 60, radius: 4.6, year: '2016' as Year },
]

const X_TICKS = [0, 4, 8, 12, 16]
const Y_TICKS = [40, 45, 50, 55, 60]

const Lx = 38
const Ly = 25
const Lw = 178
const Lh = 76

const xOf = (sales: number) => Lx + (sales / 16) * Lw
const yOf = (gm: number) => Ly + Lh - ((gm - 40) / 20) * Lh

export function BubbleChartVisual({ showLegend = true }: ChartVisualProps) {
  return (
    <svg viewBox="0 0 240 140" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      <text x="8" y="14" fontSize="var(--preview-title-size, 9.2px)" fontWeight="600" fill="var(--preview-title-color, #252423)">
        Sales and GM% by City
      </text>

      {Y_TICKS.map((value) => {
        const y = yOf(value)
        return (
          <g key={`y-${value}`}>
            <line
              x1={Lx}
              y1={y}
              x2={Lx + Lw}
              y2={y}
              stroke={value === 40 ? AX.line : AX.grid}
              strokeWidth={value === 40 ? 0.85 : 'var(--preview-gridline-width, .55)'}
              strokeDasharray={value === 40 ? '0' : 'var(--preview-gridline-dasharray, 0)'}
            />
            <text x={Lx - 5} y={y + 3} textAnchor="end" fontSize="6.7" fill={AX.label}>{value}%</text>
          </g>
        )
      })}

      {X_TICKS.map((value) => {
        const x = xOf(value)
        return (
          <g key={`x-${value}`}>
            <line
              x1={x}
              y1={Ly}
              x2={x}
              y2={Ly + Lh}
              stroke={value === 0 ? AX.line : AX.grid}
              strokeWidth={value === 0 ? 0.85 : 'var(--preview-gridline-width, .55)'}
              strokeDasharray={value === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'}
            />
            <text x={x} y={Ly + Lh + 10} textAnchor="middle" fontSize="6.7" fill={AX.label}>{value}M</text>
          </g>
        )
      })}

      {BUBBLES.map((bubble) => {
        const color = YEAR_COLORS[bubble.year]
        return (
          <circle
            key={`${bubble.city}-${bubble.year}`}
            cx={xOf(bubble.sales)}
            cy={yOf(bubble.gm)}
            r={bubble.radius}
            fill={color}
            fillOpacity=".42"
            stroke={color}
            strokeWidth=".9"
          />
        )
      })}

      <text x={Lx + Lw / 2} y={Ly + Lh + 22} textAnchor="middle" fontSize="7" fill={AX.label}>Sales</text>
      <text
        x={Lx - 26}
        y={Ly + Lh / 2}
        textAnchor="middle"
        fontSize="7"
        fill={AX.label}
        transform={`rotate(-90, ${Lx - 26}, ${Ly + Lh / 2})`}
      >
        GM%
      </text>

      {showLegend && (
        <g transform="translate(84 128)">
          {(['2015', '2016'] as Year[]).map((year, i) => (
            <g key={year} transform={`translate(${i * 46} 0)`}>
              <circle cx="3.5" cy="-3.5" r="3.5" fill={YEAR_COLORS[year]} fillOpacity=".55" stroke={YEAR_COLORS[year]} strokeWidth=".8" />
              <text x="11" y="-1" fontSize="var(--preview-legend-size, 6.8px)" fill="var(--preview-legend-color, #252423)">{year}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
