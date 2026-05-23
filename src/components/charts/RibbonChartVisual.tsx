import { AX, cv } from './chartUtils'

const PERIODS = [
  '2015 Qtr 1',
  '2015 Qtr 2',
  '2015 Qtr 3',
  '2015 Qtr 4',
  '2016 Qtr 1',
  '2016 Qtr 2',
  '2016 Qtr 3',
  '2016 Qtr 4',
]

const MANAGERS = [
  { label: 'Ali', values: [4.6, 4.4, 4.2, 4.5, 4.8, 5.3, 5.0, 4.9], color: cv(1) },
  { label: 'Arun', values: [2.2, 2.0, 1.9, 2.4, 4.2, 5.1, 4.1, 4.4], color: cv(2) },
  { label: 'Ayub', values: [1.6, 1.3, 0.8, 0.8, 0.9, 0.9, 0.9, 0.9], color: cv(3) },
  { label: 'Joseph', values: [5.2, 5.2, 5.2, 5.5, 6.6, 7.6, 6.8, 8.2], color: cv(4) },
  { label: 'Meer', values: [4.2, 3.7, 3.3, 3.1, 3.7, 5.4, 7.7, 5.0], color: cv(5) },
  { label: 'Mikel', values: [3.4, 3.9, 4.8, 4.0, 3.2, 2.8, 3.7, 5.6], color: cv(6) },
  { label: 'Rajesh', values: [2.8, 4.9, 3.6, 5.0, 5.8, 4.7, 4.6, 3.8], color: cv(7) },
] as const

type RibbonSegment = {
  label: string
  value: number
  color: string
  y0: number
  y1: number
}

const VIEW_W = 240
const VIEW_H = 140
const Lx = 15
const Ly = 28
const Lw = 210
const Lh = 76
const colW = 14

const xCenters = PERIODS.map((_, i) => Lx + colW / 2 + (i / (PERIODS.length - 1)) * (Lw - colW))

const periodLayouts = PERIODS.map((_, periodIndex) => {
  const total = MANAGERS.reduce((sum, manager) => sum + manager.values[periodIndex], 0)
  let cursor = Ly

  return [...MANAGERS]
    .map((manager) => ({
      label: manager.label,
      value: manager.values[periodIndex],
      color: manager.color,
    }))
    .sort((a, b) => b.value - a.value)
    .map((manager) => {
      const height = (manager.value / total) * Lh
      const segment = { ...manager, y0: cursor, y1: cursor + height }
      cursor += height
      return segment
    })
})

const periodMaps: ReadonlyArray<Map<string, RibbonSegment>> = periodLayouts.map(
  (layout) => new Map(layout.map((segment) => [segment.label, segment])),
)

function bandPath(label: string, periodIndex: number): string {
  const start = periodMaps[periodIndex].get(label)
  const end = periodMaps[periodIndex + 1].get(label)
  if (!start || !end) return ''

  const x1 = xCenters[periodIndex] + colW / 2
  const x2 = xCenters[periodIndex + 1] - colW / 2
  const cx1 = x1 + (x2 - x1) * 0.45
  const cx2 = x1 + (x2 - x1) * 0.55

  return [
    `M ${x1},${start.y0}`,
    `C ${cx1},${start.y0} ${cx2},${end.y0} ${x2},${end.y0}`,
    `L ${x2},${end.y1}`,
    `C ${cx2},${end.y1} ${cx1},${start.y1} ${x1},${start.y1}`,
    'Z',
  ].join(' ')
}

function periodLabelParts(label: string): [string, string] {
  const [year, , quarter] = label.split(' ')
  return [year, `Qtr ${quarter}`]
}

export function RibbonChartVisual() {
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      {MANAGERS.slice(0, 4).map((manager, i) => (
        <g key={manager.label} transform={`translate(${16 + i * 54}, 7)`}>
          <rect width="7" height="7" fill={manager.color} />
          <text x="10" y="6.7" fontSize="7" fill={AX.label}>{manager.label}</text>
        </g>
      ))}
      {MANAGERS.slice(4).map((manager, i) => (
        <g key={manager.label} transform={`translate(${16 + i * 62}, 18)`}>
          <rect width="7" height="7" fill={manager.color} />
          <text x="10" y="6.7" fontSize="7" fill={AX.label}>{manager.label}</text>
        </g>
      ))}

      <line x1={Lx} y1={Ly + Lh} x2={Lx + Lw} y2={Ly + Lh} stroke={AX.line} strokeWidth=".7" />

      {MANAGERS.map((manager) =>
        PERIODS.slice(0, -1).map((_, periodIndex) => (
          <path
            key={`${manager.label}-${periodIndex}`}
            d={bandPath(manager.label, periodIndex)}
            fill={manager.color}
            fillOpacity=".28"
          />
        )),
      )}

      {periodLayouts.map((layout, periodIndex) => {
        const x = xCenters[periodIndex] - colW / 2
        return (
          <g key={PERIODS[periodIndex]}>
            {layout.map((segment) => {
              const height = Math.max(segment.y1 - segment.y0, 0.8)
              return (
                <g key={`${PERIODS[periodIndex]}-${segment.label}`}>
                  <rect
                    x={x}
                    y={segment.y0}
                    width={colW}
                    height={height}
                    rx="0"
                    fill={segment.color}
                    fillOpacity=".9"
                    stroke="white"
                    strokeWidth=".35"
                  />
                  {height >= 8.2 && segment.value >= 3.2 && (
                    <text x={x + colW / 2} y={segment.y0 + height / 2 + 2.2} textAnchor="middle" fontSize="5.4" fill="white" fontWeight="600">
                      {segment.value.toFixed(1)}M
                    </text>
                  )}
                </g>
              )
            })}
            <line x1={x + colW / 2} y1={Ly} x2={x + colW / 2} y2={Ly + Lh} stroke={AX.grid} strokeWidth=".35" />
            <text x={x + colW / 2} y={Ly + Lh + 11} textAnchor="middle" fontSize="6.3" fill={AX.label}>
              {periodLabelParts(PERIODS[periodIndex])[0]}
            </text>
            <text x={x + colW / 2} y={Ly + Lh + 19} textAnchor="middle" fontSize="6.3" fill={AX.label}>
              {periodLabelParts(PERIODS[periodIndex])[1]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
