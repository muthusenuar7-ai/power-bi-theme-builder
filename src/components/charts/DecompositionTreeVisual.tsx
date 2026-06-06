import { AX, cv, f } from './chartUtils'

type TreeNode = {
  label: string
  value: string
  ratio: number
  color: string
  selected?: boolean
}

type HeaderProps = {
  x: number
  y: number
  width: number
  label: string
}

type NodeRowProps = {
  x: number
  y: number
  width: number
  node: TreeNode
}

const TEXT = 'var(--theme-fg, #252423)'
const MUTED = 'var(--theme-fg-muted, var(--preview-axis-label-color, #605E5C))'
const CONNECTOR = 'var(--preview-gridline-color, #D8D6D3)'
const SELECTED = 'var(--theme-primary, var(--c1, #0D9488))'

const COUNTRIES: TreeNode[] = [
  { label: 'Saudi', value: '76.3M', ratio: 0.46, color: cv(1), selected: true },
  { label: 'UAE', value: '59.7M', ratio: 0.36, color: cv(2) },
  { label: 'Oman', value: '16.8M', ratio: 0.1, color: cv(3) },
  { label: 'Kuwait', value: '5.8M', ratio: 0.04, color: cv(4) },
  { label: 'Qatar', value: '1.5M', ratio: 0.01, color: cv(5) },
]

const SEGMENTS: TreeNode[] = [
  { label: 'Enterprise', value: '23.6M', ratio: 0.31, color: cv(1), selected: true },
  { label: 'Retail', value: '18.6M', ratio: 0.24, color: cv(2) },
  { label: 'Government', value: '17.1M', ratio: 0.22, color: cv(3) },
  { label: 'SMB', value: '14.1M', ratio: 0.19, color: cv(4) },
  { label: 'Channel', value: '2.9M', ratio: 0.04, color: cv(5) },
]

const countryYs = [38, 60, 82, 104, 126]
const segmentYs = [38, 60, 82, 104, 126]

function Header({ x, y, width, label }: HeaderProps) {
  const closeX = x + width - 8

  return (
    <g>
      <text x={x} y={y} fontSize="7.3" fill={MUTED} fontWeight="600">
        {label}
      </text>
      <circle cx={closeX} cy={y - 2.7} r="3.1" fill="transparent" stroke={CONNECTOR} strokeWidth=".55" />
      <path
        d={`M ${f(closeX - 1.25)} ${f(y - 3.95)} L ${f(closeX + 1.25)} ${f(y - 1.45)} M ${f(closeX + 1.25)} ${f(y - 3.95)} L ${f(closeX - 1.25)} ${f(y - 1.45)}`}
        stroke={MUTED}
        strokeWidth=".55"
        strokeLinecap="round"
      />
      <line x1={x} y1={y + 5} x2={x + width} y2={y + 5} stroke={CONNECTOR} strokeWidth=".6" strokeOpacity=".9" />
    </g>
  )
}

function RootNode() {
  return (
    <g>
      <text x="12" y="74" fontSize="7.2" fill={MUTED} fontWeight="600">
        Revenue
      </text>
      <text x="12" y="84" fontSize="9.5" fill={TEXT} fontWeight="700">
        165.5M
      </text>
      <rect x="12" y="91" width="48" height="4" rx="2" fill={SELECTED} fillOpacity=".22" />
      <rect x="12" y="91" width="48" height="4" rx="2" fill={SELECTED} />
      <circle cx="66" cy="82" r="2.2" fill={SELECTED} />
    </g>
  )
}

function NodeRow({ x, y, width, node }: NodeRowProps) {
  const barWidth = Math.max(2, Math.min(width - 6, (width - 6) * node.ratio))
  const barColor = node.selected ? SELECTED : node.color

  return (
    <g>
      {node.selected && (
        <rect x={x - 4} y={y - 10} width={width + 8} height="20" rx="3" fill={SELECTED} fillOpacity=".07" />
      )}
      <line x1={x} y1={y + 10.5} x2={x + width} y2={y + 10.5} stroke={CONNECTOR} strokeWidth=".45" strokeOpacity=".65" />
      <text x={x} y={y - 1.5} fontSize="7.2" fill={TEXT} fontWeight={node.selected ? 700 : 500}>
        {node.label}
      </text>
      <text x={x + width} y={y - 1.5} textAnchor="end" fontSize="6.7" fill={MUTED} fontWeight="600">
        {node.value}
      </text>
      <rect x={x} y={y + 4.2} width={width - 6} height="3.2" rx="1.6" fill={barColor} fillOpacity=".16" />
      <rect x={x} y={y + 4.2} width={barWidth} height="3.2" rx="1.6" fill={barColor} fillOpacity={node.selected ? 1 : 0.58} />
      {node.selected && <circle cx={x - 7} cy={y + 5.8} r="2.1" fill={SELECTED} />}
    </g>
  )
}

function CurvedConnector({ fromX, fromY, toX, toY, active = false }: {
  fromX: number
  fromY: number
  toX: number
  toY: number
  active?: boolean
}) {
  const mid = (fromX + toX) / 2
  const d = `M ${fromX} ${fromY} C ${mid} ${fromY}, ${mid} ${toY}, ${toX} ${toY}`

  return (
    <path
      d={d}
      fill="none"
      stroke={active ? SELECTED : CONNECTOR}
      strokeWidth={active ? 1 : 0.65}
      strokeOpacity={active ? 0.72 : 0.72}
      strokeLinecap="round"
    />
  )
}

export function DecompositionTreeVisual() {
  const countryX = 82
  const segmentX = 182
  const nodeW = 78
  const rootAnchorX = 66
  const rootAnchorY = 82
  const selectedCountryY = countryYs[0]

  return (
    <svg viewBox="0 0 280 160" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      <Header x={countryX} y={18} width={nodeW} label="Country" />
      <Header x={segmentX} y={18} width={nodeW} label="Segment" />
      <RootNode />

      {COUNTRIES.map((country, index) => (
        <g key={country.label}>
          <CurvedConnector
            fromX={rootAnchorX}
            fromY={rootAnchorY}
            toX={countryX - 10}
            toY={countryYs[index] + 5.8}
            active={country.selected}
          />
          <NodeRow x={countryX} y={countryYs[index]} width={nodeW} node={country} />
        </g>
      ))}

      {SEGMENTS.map((segment, index) => (
        <g key={segment.label}>
          <CurvedConnector
            fromX={countryX + nodeW + 4}
            fromY={selectedCountryY + 5.8}
            toX={segmentX - 10}
            toY={segmentYs[index] + 5.8}
            active={segment.selected}
          />
          <NodeRow x={segmentX} y={segmentYs[index]} width={nodeW} node={segment} />
        </g>
      ))}
    </svg>
  )
}
