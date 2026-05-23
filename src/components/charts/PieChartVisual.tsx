import { AX, arc, cv } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

const SLICES = [
  { label: 'Still Water', value: 96, color: cv(1) },
  { label: 'Accessories', value: 46, color: cv(2) },
  { label: 'Sparkling Water', value: 16, color: cv(3) },
  { label: 'Coolers', value: 7, color: cv(4) },
  { label: 'Flavoured Water', value: 1, color: cv(5) },
]

const TOTAL = SLICES.reduce((sum, slice) => sum + slice.value, 0)
const cx = 76
const cy = 78
const r = 36

function polarRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180
}

function outerLabel(startDeg: number, endDeg: number) {
  const mid = (startDeg + endDeg) / 2
  const rad = polarRad(mid)
  const edgeX = cx + r * Math.cos(rad)
  const edgeY = cy + r * Math.sin(rad)
  const bendR = r + 11
  const bendX = cx + bendR * Math.cos(rad)
  const bendY = cy + bendR * Math.sin(rad)
  const isRight = Math.cos(rad) >= 0
  const textX = isRight ? Math.min(bendX + 8, 148) : Math.max(bendX - 8, 6)
  const lineEndX = isRight ? textX - 2 : textX + 2
  const textY = Math.max(24, Math.min(bendY, 124))

  return {
    edgeX,
    edgeY,
    bendX,
    bendY: textY,
    lineEndX,
    textX,
    textY,
    anchor: isRight ? 'start' as const : 'end' as const,
  }
}

const SLICE_DATA = SLICES.map((slice, i) => {
  const startA = SLICES.slice(0, i).reduce((sum, item) => sum + (item.value / TOTAL) * 360, 0)
  const sweep = (slice.value / TOTAL) * 360
  return { ...slice, startA, endA: startA + sweep, pct: Math.round((slice.value / TOTAL) * 100) }
})

export function PieChartVisual({ showLegend = true, showDataLabels = true }: ChartVisualProps) {
  return (
    <svg viewBox="0 0 240 140" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      <text x="8" y="14" fontSize="var(--preview-title-size, 9.2px)" fontWeight="600" fill="var(--preview-title-color, #252423)">
        Sales by Product Subcategory
      </text>

      {SLICE_DATA.map((slice) => (
        <path
          key={slice.label}
          d={arc(cx, cy, r, slice.startA, slice.endA)}
          fill={slice.color}
          fillOpacity="var(--preview-shape-opacity, 1)"
          stroke="var(--preview-shape-border-color, none)"
          strokeWidth="var(--preview-shape-border-width, 0)"
        />
      ))}

      {SLICE_DATA.map((slice) => {
        const rad = polarRad(slice.startA)
        return (
          <line
            key={`sep-${slice.label}`}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(rad)}
            y2={cy + r * Math.sin(rad)}
            stroke="white"
            strokeWidth="1.8"
          />
        )
      })}

      {showDataLabels &&
        SLICE_DATA.filter((slice) => slice.pct >= 4).map((slice) => {
          const lbl = outerLabel(slice.startA, slice.endA)
          const short = slice.label.length > 14 ? `${slice.label.slice(0, 13)}...` : slice.label
          return (
            <g key={`lbl-${slice.label}`}>
              <polyline
                points={`${lbl.edgeX},${lbl.edgeY} ${lbl.bendX},${lbl.bendY} ${lbl.lineEndX},${lbl.textY}`}
                fill="none"
                stroke={AX.line}
                strokeWidth=".7"
              />
              <text x={lbl.textX} y={lbl.textY - 6} textAnchor={lbl.anchor} fontSize="var(--preview-data-label-size, 6.4px)" fill="var(--preview-data-label-color, #252423)" fontWeight="700">
                {short}
              </text>
              <text x={lbl.textX} y={lbl.textY + 2} textAnchor={lbl.anchor} fontSize="var(--preview-data-label-size, 6.2px)" fill="var(--preview-data-label-color, #605E5C)">
                {slice.value}M ({slice.pct}%)
              </text>
            </g>
          )
        })}

      {showLegend && (
        <g transform="translate(164 30)">
          <text x="0" y="-6" fontSize="var(--preview-legend-size, 6.8px)" fill="var(--preview-legend-color, #605E5C)">Product Subcategory</text>
          {SLICES.map((slice, i) => (
            <g key={`legend-${slice.label}`} transform={`translate(0 ${i * 15})`}>
              <circle cx="3.5" cy="3.5" r="3.2" fill={slice.color} />
              <text x="11" y="6" fontSize="var(--preview-legend-size, 7px)" fill="var(--preview-legend-color, #252423)">{slice.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
