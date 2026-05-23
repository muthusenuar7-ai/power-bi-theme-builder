import { AX, cv } from './chartUtils'

type MeasureNodeProps = {
  x: number
  y: number
  w: number
  h: number
  label: string
  value: string
  color: string
  ratio: number
  selected?: boolean
}

const COUNTRIES = [
  { label: 'Saudi', value: '76.3M', ratio: 0.46, color: cv(1) },
  { label: 'UAE', value: '59.7M', ratio: 0.36, color: cv(2) },
  { label: 'Oman', value: '16.8M', ratio: 0.1, color: cv(3) },
  { label: 'Kuwait', value: '5.8M', ratio: 0.04, color: cv(4) },
  { label: 'Bahrain', value: '5.2M', ratio: 0.03, color: cv(5) },
  { label: 'Qatar', value: '1.5M', ratio: 0.01, color: cv(6) },
]

const CITIES = [
  { label: 'Riyadh', value: '23.6M', ratio: 0.31 },
  { label: 'Jeddah', value: '18.6M', ratio: 0.24 },
  { label: 'Madina', value: '17.1M', ratio: 0.22 },
  { label: 'Dammam', value: '14.1M', ratio: 0.19 },
  { label: 'Al Khobar', value: '2.5M', ratio: 0.03 },
  { label: 'Mecca', value: '0.4M', ratio: 0.01 },
]

const countryYs = [27, 45, 63, 81, 99, 117]
const cityYs = [27, 45, 63, 81, 99, 117]

function MeasureNode({ x, y, w, h, label, value, color, ratio, selected = false }: MeasureNodeProps) {
  return (
    <g>
      <rect
        x={x}
        y={y - h / 2}
        width={w}
        height={h}
        rx="1.5"
        fill="white"
        stroke={selected ? color : AX.line}
        strokeWidth={selected ? 1.2 : 0.7}
      />
      <rect x={x + 1} y={y - h / 2 + 1} width="3" height={h - 2} fill={color} fillOpacity=".9" />
      <rect x={x + 5} y={y + h / 2 - 4} width={(w - 7) * ratio} height="2.4" fill={color} fillOpacity=".75" />
      <text x={x + 7} y={y - 1.5} fontSize="6.4" fill="#252423" fontWeight="600">{label}</text>
      <text x={x + 7} y={y + 6.3} fontSize="6.1" fill={AX.label}>{value}</text>
    </g>
  )
}

function SplitChip({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width="43" height="11" rx="1.5" fill="#F8F7F6" stroke={AX.line} strokeWidth=".6" />
      <text x={x + 5} y={y + 7.8} fontSize="6.5" fill={AX.label}>{label}</text>
    </g>
  )
}

export function DecompositionTreeVisual() {
  const rootX = 8
  const rootY = 72
  const rootW = 46
  const rootH = 25
  const countryX = 74
  const cityX = 160
  const nodeW = 54
  const nodeH = 14
  const cityW = 66
  const countryBusX = 66
  const cityBusX = 151

  return (
    <svg viewBox="0 0 240 140" width="100%" height="100%" style={{ fontFamily: AX.font, overflow: 'visible' }}>
      <SplitChip x={countryX} y={8} label="Country x" />
      <SplitChip x={cityX} y={8} label="Area x" />

      <rect x={rootX} y={rootY - rootH / 2} width={rootW} height={rootH} rx="2" fill={cv(1)} />
      <text x={rootX + rootW / 2} y={rootY - 2} textAnchor="middle" fontSize="7.5" fill="white" fontWeight="700">Revenue</text>
      <text x={rootX + rootW / 2} y={rootY + 8} textAnchor="middle" fontSize="6.8" fill="white">165.5M</text>

      <line x1={rootX + rootW} y1={rootY} x2={countryBusX} y2={rootY} stroke={AX.line} strokeWidth=".8" />
      <line x1={countryBusX} y1={countryYs[0]} x2={countryBusX} y2={countryYs[countryYs.length - 1]} stroke={AX.line} strokeWidth=".8" />

      {COUNTRIES.map((country, i) => (
        <g key={country.label}>
          <line x1={countryBusX} y1={countryYs[i]} x2={countryX} y2={countryYs[i]} stroke={AX.line} strokeWidth=".65" />
          <MeasureNode
            x={countryX}
            y={countryYs[i]}
            w={nodeW}
            h={nodeH}
            label={country.label}
            value={country.value}
            color={country.color}
            ratio={country.ratio}
            selected={country.label === 'Saudi'}
          />
        </g>
      ))}

      <line x1={countryX + nodeW} y1={countryYs[0]} x2={cityBusX} y2={countryYs[0]} stroke={AX.line} strokeWidth=".8" />
      <line x1={cityBusX} y1={cityYs[0]} x2={cityBusX} y2={cityYs[cityYs.length - 1]} stroke={AX.line} strokeWidth=".8" />

      {CITIES.map((city, i) => (
        <g key={city.label}>
          <line x1={cityBusX} y1={cityYs[i]} x2={cityX} y2={cityYs[i]} stroke={AX.line} strokeWidth=".65" />
          <MeasureNode
            x={cityX}
            y={cityYs[i]}
            w={cityW}
            h={nodeH}
            label={city.label}
            value={city.value}
            color={cv(1)}
            ratio={city.ratio}
          />
        </g>
      ))}
    </svg>
  )
}
