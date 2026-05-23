import { AX, cv } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const CATEGORIES = [
  { label: 'Still Water', color: cv(1) },
  { label: 'Coolers', color: cv(2) },
  { label: 'Accessories', color: cv(3) },
] as const

const POINTS = [
  { qty: 24, litres: 14, category: 0 },
  { qty: 42, litres: 28, category: 0 },
  { qty: 61, litres: 33, category: 0 },
  { qty: 78, litres: 49, category: 0 },
  { qty: 115, litres: 56, category: 0 },
  { qty: 154, litres: 70, category: 0 },
  { qty: 35, litres: 42, category: 1 },
  { qty: 58, litres: 19, category: 1 },
  { qty: 91, litres: 37, category: 1 },
  { qty: 130, litres: 61, category: 1 },
  { qty: 176, litres: 64, category: 1 },
  { qty: 18, litres: 9, category: 2 },
  { qty: 73, litres: 22, category: 2 },
  { qty: 106, litres: 45, category: 2 },
  { qty: 142, litres: 51, category: 2 },
  { qty: 190, litres: 76, category: 2 },
]

const X_TICKS = [0, 50, 100, 150, 200]
const Y_TICKS = [0, 20, 40, 60, 80]

const Lx = 34
const Ly = 25
const Lw = 178
const Lh = 76

const xOf = (qty: number) => Lx + (qty / 200) * Lw
const yOf = (litres: number) => Ly + Lh - (litres / 80) * Lh

export function ScatterChartVisual({ showLegend = true }: ChartVisualProps) {
  return (
    <svg viewBox="0 0 240 140" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      <text x="8" y="14" fontSize="var(--preview-title-size, 9.2px)" fontWeight="600" fill="var(--preview-title-color, #252423)">
        Litres and Qty by Subcategory
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
              stroke={value === 0 ? AX.line : AX.grid}
              strokeWidth={value === 0 ? 0.85 : 'var(--preview-gridline-width, .55)'}
              strokeDasharray={value === 0 ? '0' : 'var(--preview-gridline-dasharray, 0)'}
            />
            <text x={Lx - 5} y={y + 3} textAnchor="end" fontSize="6.7" fill={AX.label}>{value}</text>
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
            <text x={x} y={Ly + Lh + 10} textAnchor="middle" fontSize="6.7" fill={AX.label}>{value}</text>
          </g>
        )
      })}

      {POINTS.map((point, index) => {
        const category = CATEGORIES[point.category]
        return (
          <circle
            key={`${point.qty}-${point.litres}-${index}`}
            cx={xOf(point.qty)}
            cy={yOf(point.litres)}
            r="3"
            fill={category.color}
            fillOpacity=".88"
            stroke="white"
            strokeWidth=".75"
          />
        )
      })}

      <text x={Lx + Lw / 2} y={Ly + Lh + 22} textAnchor="middle" fontSize="7" fill={AX.label}>Qty</text>
      <text
        x={Lx - 24}
        y={Ly + Lh / 2}
        textAnchor="middle"
        fontSize="7"
        fill={AX.label}
        transform={`rotate(-90, ${Lx - 24}, ${Ly + Lh / 2})`}
      >
        Litres
      </text>

      {showLegend && (
        <g transform="translate(34 128)">
          {CATEGORIES.map((category, i) => (
            <g key={category.label} transform={`translate(${i * 67} 0)`}>
              <circle cx="3.5" cy="-3.5" r="3" fill={category.color} />
              <text x="10" y="-1" fontSize="var(--preview-legend-size, 6.8px)" fill="var(--preview-legend-color, #252423)">{category.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
