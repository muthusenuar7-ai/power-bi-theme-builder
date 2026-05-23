import { AX, cv } from './chartUtils'

type Step =
  | { label: string; labelParts: string[]; type: 'total'; value: number }
  | { label: string; labelParts: string[]; type: 'increase' | 'decrease'; delta: number }

type ComputedStep = Step & {
  start: number
  end: number
  displayValue: number
}

const STEPS: Step[] = [
  { label: '2015', labelParts: ['2015'], type: 'total', value: 69.1 },
  { label: 'Carrefour', labelParts: ['Carrefour'], type: 'increase', delta: 19.9 },
  { label: 'Other', labelParts: ['Other'], type: 'increase', delta: 4.4 },
  { label: 'Union Co-op', labelParts: ['Union', 'Co-op'], type: 'increase', delta: 3.7 },
  { label: 'Al Maya', labelParts: ['Al Maya'], type: 'increase', delta: 1.2 },
  { label: 'New Era', labelParts: ['New Era'], type: 'increase', delta: 1.1 },
  { label: 'United Hyper', labelParts: ['United', 'Hyper'], type: 'decrease', delta: -3.2 },
  { label: '2016', labelParts: ['2016'], type: 'total', value: 96.3 },
]

const MIN_VALUE = 50
const MAX_VALUE = 100
const GRIDS = [50, 60, 70, 80, 90, 100]

const INCREASE_COLOR = cv(1)
const DECREASE_COLOR = cv(5)
const TOTAL_COLOR = cv(2)

const Lx = 30
const Ly = 24
const Lw = 202
const Lh = 82
const barW = 16
const slotW = Lw / STEPS.length

const yOf = (value: number) => Ly + Lh - ((value - MIN_VALUE) / (MAX_VALUE - MIN_VALUE)) * Lh

const computedSteps: ComputedStep[] = []
let running = 0

STEPS.forEach((step) => {
  if (step.type === 'total') {
    computedSteps.push({ ...step, start: MIN_VALUE, end: step.value, displayValue: step.value })
    running = step.value
    return
  }

  const start = running
  const end = running + step.delta
  computedSteps.push({ ...step, start, end, displayValue: step.delta })
  running = end
})

function valueLabel(step: ComputedStep): string {
  if (step.type === 'total') return `${step.displayValue.toFixed(1)}M`
  return `${step.displayValue > 0 ? '+' : ''}${step.displayValue.toFixed(1)}M`
}

function fillFor(step: ComputedStep): string {
  if (step.type === 'total') return TOTAL_COLOR
  return step.type === 'increase' ? INCREASE_COLOR : DECREASE_COLOR
}

export function WaterfallChartVisual() {
  return (
    <svg viewBox="0 0 240 140" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {[
        ['Increase', INCREASE_COLOR],
        ['Decrease', DECREASE_COLOR],
        ['Total', TOTAL_COLOR],
      ].map(([label, color], i) => (
        <g key={label} transform={`translate(${42 + i * 58}, 8)`}>
          <rect width="8" height="8" fill={color} />
          <text x="11" y="7.4" fontSize="7" fill={AX.label}>{label}</text>
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
              stroke={value === MIN_VALUE ? AX.line : AX.grid}
              strokeWidth={value === MIN_VALUE ? 0.8 : 0.5}
            />
            <text x={Lx - 4} y={y + 3} textAnchor="end" fontSize="7" fill={AX.label}>{value}M</text>
          </g>
        )
      })}
      <line x1={Lx} y1={Ly} x2={Lx} y2={Ly + Lh} stroke={AX.line} strokeWidth=".7" />

      {computedSteps.map((step, i) => {
        const x = Lx + i * slotW + (slotW - barW) / 2
        const yStart = yOf(step.start)
        const yEnd = yOf(step.end)
        const yTop = Math.min(yStart, yEnd)
        const height = Math.max(Math.abs(yStart - yEnd), 1)
        const labelY = step.type === 'decrease' ? yTop + height + 8 : yTop - 4
        const nextX = Lx + (i + 1) * slotW + (slotW - barW) / 2
        const connectorY = yOf(step.end)

        return (
          <g key={step.label}>
            <rect x={x} y={yTop} width={barW} height={height} rx="0" fill={fillFor(step)} />
            <text
              x={x + barW / 2}
              y={labelY}
              textAnchor="middle"
              fontSize="6.4"
              fill={step.type === 'decrease' ? DECREASE_COLOR : AX.label}
              fontWeight="600"
            >
              {valueLabel(step)}
            </text>
            {i < computedSteps.length - 1 && (
              <line
                x1={x + barW}
                y1={connectorY}
                x2={nextX}
                y2={connectorY}
                stroke={AX.label}
                strokeWidth=".65"
                strokeDasharray="2,1.4"
              />
            )}
            <text x={x + barW / 2} y={Ly + Lh + 10} textAnchor="middle" fontSize="6.1" fill={AX.label}>
              {step.labelParts.map((part, partIndex) => (
                <tspan key={part} x={x + barW / 2} dy={partIndex === 0 ? 0 : 7}>
                  {part}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
