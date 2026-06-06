'use client'

import type { ChartVisualProps } from './ChartRenderer'
import { AX, cv, f } from './chartUtils'
import { useElementSize } from '@/hooks/useElementSize'

type Step =
  | { label: string; type: 'total'; value: number }
  | { label: string; type: 'increase' | 'decrease'; delta: number }

type ComputedStep = Step & {
  start: number
  end: number
  displayValue: number
}

const STEPS: Step[] = [
  { label: '2015',        type: 'total',    value: 69.1 },
  { label: 'Volume',      type: 'increase', delta: 13.7 },
  { label: 'Price',       type: 'increase', delta: 8.8 },
  { label: 'Discount',    type: 'decrease', delta: -4.6 },
  { label: 'Mix',         type: 'increase', delta: 6.2 },
  { label: 'Freight',     type: 'decrease', delta: -3.1 },
  { label: 'Returns',     type: 'decrease', delta: -2.4 },
  { label: 'Other',       type: 'increase', delta: 8.6 },
  { label: '2016',        type: 'total',    value: 96.3 },
]

const INCREASE_COLOR = cv(1)
const DECREASE_COLOR = cv(5)
const TOTAL_COLOR = cv(2)

function computeSteps(): ComputedStep[] {
  const result: ComputedStep[] = []
  let running = 0

  STEPS.forEach((step) => {
    if (step.type === 'total') {
      result.push({ ...step, start: 0, end: step.value, displayValue: step.value })
      running = step.value
      return
    }

    const start = running
    const end = running + step.delta
    result.push({ ...step, start, end, displayValue: step.delta })
    running = end
  })

  return result
}

function valueLabel(step: ComputedStep): string {
  if (step.type === 'total') return `${step.displayValue.toFixed(0)}M`
  return `${step.displayValue > 0 ? '+' : ''}${step.displayValue.toFixed(1)}M`
}

function fillFor(step: ComputedStep): string {
  if (step.type === 'total') return TOTAL_COLOR
  return step.type === 'increase' ? INCREASE_COLOR : DECREASE_COLOR
}

export function WaterfallChartVisual({ format }: ChartVisualProps) {
  const { ref, width, height } = useElementSize({ width: 420, height: 260 })
  const steps = computeSteps()
  const maxValue = Math.max(100, ...steps.map((step) => Math.max(step.start, step.end))) * 1.05
  const minValue = Math.min(0, ...steps.map((step) => Math.min(step.start, step.end)))
  const topPad = 24
  const bottomPad = 28
  const leftPad = 34
  const rightPad = 12
  const plot = {
    x: leftPad,
    y: topPad,
    w: Math.max(80, width - leftPad - rightPad),
    h: Math.max(60, height - topPad - bottomPad),
  }
  const yOf = (value: number) => plot.y + plot.h - ((value - minValue) / (maxValue - minValue)) * plot.h
  const gridValues = [0, 25, 50, 75, 100]
  const slotW = plot.w / steps.length
  const barW = Math.max(12, Math.min(28, slotW * 0.52))
  const labelColor = format?.dataLabels.color ?? 'var(--theme-fg)'
  const labelSize = Math.max(8, format?.dataLabels.fontSize ?? 8)

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'hidden' }}>
        {format?.plotBackground.show && (
          <rect x={f(plot.x)} y={f(plot.y)} width={f(plot.w)} height={f(plot.h)} fill={format.plotBackground.color} fillOpacity={format.plotBackground.opacity} />
        )}

        {[
          ['Increase', INCREASE_COLOR],
          ['Decrease', DECREASE_COLOR],
          ['Total', TOTAL_COLOR],
        ].map(([label, color], i) => (
          <g key={label} transform={`translate(${f(plot.x + i * 74)}, 6)`}>
            <rect width="8" height="8" fill={color} />
            <text x="11" y="7.4" fontSize="8.5" fill="var(--theme-fg-muted)">{label}</text>
          </g>
        ))}

        {gridValues.map((value) => {
          const y = yOf(value)
          return (
            <g key={value}>
              <line
                x1={f(plot.x)}
                y1={f(y)}
                x2={f(plot.x + plot.w)}
                y2={f(y)}
                stroke={value === 0 ? AX.line : AX.grid}
                strokeWidth={value === 0 ? 0.8 : 'var(--preview-gridline-width, 0.5)'}
                strokeOpacity={value === 0 ? 1 : 'var(--preview-gridline-opacity, 1)'}
              />
              <text x={f(plot.x - 5)} y={f(y + 3)} textAnchor="end" fontSize="8.5" fill={AX.label}>{value}M</text>
            </g>
          )
        })}

        {steps.map((step, i) => {
          const x = plot.x + i * slotW + (slotW - barW) / 2
          const yStart = yOf(step.start)
          const yEnd = yOf(step.end)
          const yTop = Math.min(yStart, yEnd)
          const h = Math.max(Math.abs(yStart - yEnd), 1)
          const labelY = step.type === 'decrease' ? yTop + h + labelSize + 1 : yTop - 4
          const nextX = plot.x + (i + 1) * slotW + (slotW - barW) / 2
          const connectorY = yOf(step.end)

          return (
            <g key={step.label}>
              <rect x={f(x)} y={f(yTop)} width={f(barW)} height={f(h)} rx="0" fill={fillFor(step)} />
              {format?.dataLabels.show !== false && (
                <text
                  x={f(x + barW / 2)}
                  y={f(labelY)}
                  textAnchor="middle"
                  fontSize={labelSize}
                  fill={step.type === 'decrease' ? DECREASE_COLOR : labelColor}
                  fontWeight="650"
                >
                  {valueLabel(step)}
                </text>
              )}
              {i < steps.length - 1 && (
                <line
                  x1={f(x + barW)}
                  y1={f(connectorY)}
                  x2={f(nextX)}
                  y2={f(connectorY)}
                  stroke="var(--theme-fg-muted)"
                  strokeOpacity=".55"
                  strokeWidth=".75"
                  strokeDasharray="3 2"
                />
              )}
              <text x={f(x + barW / 2)} y={f(plot.y + plot.h + 14)} textAnchor="middle" fontSize="8.2" fill={AX.label}>
                {step.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
