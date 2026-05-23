import { AX, cv } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const STAGES = [
  { label: 'Leads',     value: 1000 },
  { label: 'Qualified', value:  650 },
  { label: 'Proposals', value:  320 },
  { label: 'Demos',     value:  180 },
  { label: 'Closed',    value:   95 },
]
const MAX_VAL = STAGES[0].value
const COLORS  = [cv(1), cv(2), cv(3), cv(4), cv(5)]

// Each stage bar is centred horizontally, width proportional to value
const VIEW_W = 200, VIEW_H = 120
const MAX_BAR_W = 140    // max bar width (100%)
const BAR_H     = 16
const GAP        = 3
const START_Y    = 6
const CX         = VIEW_W / 2

export function FunnelChartVisual({ showDataLabels = true }: ChartVisualProps) {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%" style={{ fontFamily: AX.font }}>
      {STAGES.map((stage, i) => {
        const w  = (stage.value / MAX_VAL) * MAX_BAR_W
        const x  = CX - w / 2
        const y  = START_Y + i * (BAR_H + GAP)
        const pct = Math.round((stage.value / MAX_VAL) * 100)
        return (
          <g key={stage.label}>
            <rect
              x={x}
              y={y}
              width={w}
              height={BAR_H}
              rx="1"
              fill={COLORS[i]}
              fillOpacity="var(--preview-shape-opacity, 1)"
              stroke="var(--preview-shape-border-color, none)"
              strokeWidth="var(--preview-shape-border-width, 0)"
            />
            {/* Stage label left */}
            {showDataLabels && (
              <text x={x - 3} y={y + BAR_H / 2 + 3.5} textAnchor="end" fontSize="var(--preview-data-label-size, 7.5px)" fill="var(--preview-data-label-color, #605E5C)">{stage.label}</text>
            )}
            {/* Value inside bar */}
            {showDataLabels && (
              <text x={CX} y={y + BAR_H / 2 + 3.5} textAnchor="middle" fontSize="var(--preview-data-label-size, 7.5px)" fill="var(--preview-data-label-color, #fff)" fontWeight="600">
                {stage.value.toLocaleString()}
              </text>
            )}
            {/* Percentage right */}
            {showDataLabels && (
              <text x={CX + w / 2 + 3} y={y + BAR_H / 2 + 3.5} fontSize="var(--preview-data-label-size, 7px)" fill="var(--preview-data-label-color, #605E5C)">{pct}%</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
