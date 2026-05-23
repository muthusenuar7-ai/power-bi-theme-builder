import { AX, fmt, cv, axisLabelVisible, axisLine, axisTitle } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const CATS   = ['EMEA', 'Americas', 'APAC']
const SERIES = ['2023', '2022']
const DATA   = [[95, 82], [118, 106], [72, 65]]  // [cat][series]
const MAX    = 130
const GRIDS  = [0, 40, 80, 120]

const Lx = 52, Ly = 8, Lw = 134, Lh = 85
const slotH  = Lh / CATS.length   // ~28.3
const barH   = 9
const barGap = 2
const groupH = SERIES.length * barH + (SERIES.length - 1) * barGap  // 20

const COLORS = [cv(1), cv(2)]

export function ClusteredBarChartVisual({ showLegend = true, showDataLabels = true, format }: ChartVisualProps) {
  const showXAxis = axisLabelVisible(format?.xAxis)
  const showYAxis = axisLabelVisible(format?.yAxis)
  const xTitle = axisTitle(format?.xAxis)
  const yTitle = axisTitle(format?.yAxis)
  return (
    <svg viewBox="0 0 200 120" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {/* Gridlines */}
      {GRIDS.map((v) => {
        const x = Lx + (v / MAX) * Lw
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
              <text x={x} y={Ly + Lh + 9} textAnchor="middle" fontSize="var(--preview-x-axis-label-size, 7.5px)" fill="var(--preview-x-axis-label-color, #605E5C)">{fmt(v)}</text>
            )}
          </g>
        )
      })}

      {/* Clustered bars */}
      {CATS.map((cat, ci) => {
        const slotY = Ly + ci * slotH
        const groupY = slotY + (slotH - groupH) / 2
        return (
          <g key={cat}>
            {showYAxis && (
              <text x={Lx - 4} y={slotY + slotH / 2 + 3} textAnchor="end" fontSize="var(--preview-y-axis-label-size, 8.5px)" fill="var(--preview-y-axis-label-color, #605E5C)">{cat}</text>
            )}
            {SERIES.map((_, si) => {
              const y    = groupY + si * (barH + barGap)
              const barW = (DATA[ci][si] / MAX) * Lw
              return (
                <g key={si}>
                  <rect
                    x={Lx}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="0"
                    fill={COLORS[si]}
                    fillOpacity="var(--preview-shape-opacity, 1)"
                    stroke="var(--preview-shape-border-color, none)"
                    strokeWidth="var(--preview-shape-border-width, 0)"
                  />
                  {showDataLabels && (
                    <text x={Lx + barW + 3} y={y + barH / 2 + 3} fontSize="var(--preview-data-label-size, 7px)" fill="var(--preview-data-label-color, #252423)">{fmt(DATA[ci][si])}</text>
                  )}
                </g>
              )
            })}
          </g>
        )
      })}

      {/* Legend */}
      {showLegend && SERIES.map((s, i) => (
        <g key={s} transform={`translate(${Lx + i * 38}, 108)`}>
          <rect width="8" height="8" rx="1" fill={COLORS[i]} />
          <text x="11" y="7.5" fontSize="var(--preview-legend-size, 8px)" fill="var(--preview-legend-color, #605E5C)">{s}</text>
        </g>
      ))}
      {xTitle && (
        <text x={Lx + Lw / 2} y={119} textAnchor="middle" fontSize="var(--preview-x-axis-title-size, 8px)" fill="var(--preview-x-axis-title-color, #605E5C)" fontWeight="600">
          {xTitle}
        </text>
      )}
      {yTitle && (
        <text transform={`translate(9 ${Ly + Lh / 2}) rotate(-90)`} textAnchor="middle" fontSize="var(--preview-y-axis-title-size, 8px)" fill="var(--preview-y-axis-title-color, #605E5C)" fontWeight="600">
          {yTitle}
        </text>
      )}
    </svg>
  )
}
