import { AX, cv } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

type ChildTile = {
  label: string
  x: number
  y: number
  w: number
  h: number
  lines?: readonly string[]
}

type CountryGroup = {
  label: string
  ci: number
  x: number
  y: number
  w: number
  h: number
  children: readonly ChildTile[]
}

const GROUPS: readonly CountryGroup[] = [
  {
    label: 'Saudi',
    ci: 1,
    x: 2,
    y: 2,
    w: 103,
    h: 128,
    children: [
      { label: 'Riyadh', x: 4, y: 16, w: 49, h: 48 },
      { label: 'Jeddah', x: 55, y: 16, w: 48, h: 39 },
      { label: 'Madina', x: 4, y: 66, w: 49, h: 36 },
      { label: 'Dammam', x: 55, y: 57, w: 48, h: 45 },
      { label: 'Al Khobar', x: 4, y: 104, w: 70, h: 24, lines: ['Al', 'Khobar'] },
      { label: 'Mecca', x: 76, y: 104, w: 27, h: 24 },
    ],
  },
  {
    label: 'UAE',
    ci: 2,
    x: 107,
    y: 2,
    w: 68,
    h: 78,
    children: [
      { label: 'Abu Dhabi', x: 109, y: 16, w: 32, h: 36, lines: ['Abu', 'Dhabi'] },
      { label: 'Dubai', x: 143, y: 16, w: 30, h: 36 },
      { label: 'Sharjah', x: 109, y: 54, w: 64, h: 24 },
    ],
  },
  {
    label: 'Oman',
    ci: 3,
    x: 177,
    y: 2,
    w: 41,
    h: 42,
    children: [
      { label: 'Muscat', x: 179, y: 16, w: 37, h: 26 },
    ],
  },
  {
    label: 'Kuwait',
    ci: 4,
    x: 177,
    y: 46,
    w: 41,
    h: 47,
    children: [
      { label: 'Salmiya', x: 179, y: 60, w: 18, h: 31, lines: ['Sal', 'miya'] },
      { label: 'Kuwait City', x: 199, y: 60, w: 17, h: 31, lines: ['Kuw', 'City'] },
    ],
  },
  {
    label: 'Bahrain',
    ci: 5,
    x: 107,
    y: 82,
    w: 46,
    h: 48,
    children: [
      { label: 'Manama', x: 109, y: 96, w: 42, h: 32 },
    ],
  },
  {
    label: 'Qatar',
    ci: 6,
    x: 155,
    y: 82,
    w: 63,
    h: 48,
    children: [
      { label: 'Doha', x: 157, y: 96, w: 59, h: 32 },
    ],
  },
]

function fontSizeFor(tile: ChildTile): number {
  if (tile.w >= 45 && tile.h >= 24) return 7
  if (tile.w >= 30 && tile.h >= 20) return 6.2
  return 5.4
}

export function TreemapVisual({ showLegend = true, showDataLabels = true }: ChartVisualProps) {
  return (
    <svg viewBox="0 0 220 132" width="100%" height="100%" style={{ fontFamily: AX.font }}>
      {GROUPS.map((group) => (
        <g key={group.label}>
          <rect
            x={group.x}
            y={group.y}
            width={group.w}
            height={group.h}
            rx="0"
            fill={cv(group.ci)}
            fillOpacity=".2"
            stroke="var(--preview-shape-border-color, white)"
            strokeWidth="var(--preview-shape-border-width, 2)"
          />
          {showDataLabels && (
            <text x={group.x + 4} y={group.y + 9} fontSize="var(--preview-data-label-size, 7.2px)" fill="var(--preview-data-label-color, #252423)" fontWeight="700">
              {group.label}
            </text>
          )}

          {group.children.map((tile, tileIndex) => {
            const lines = tile.lines ?? [tile.label]
            const fontSize = fontSizeFor(tile)
            const lineStart = tile.y + tile.h / 2 - ((lines.length - 1) * fontSize) / 2 + fontSize / 3

            return (
              <g key={tile.label}>
                <rect
                  x={tile.x}
                  y={tile.y}
                  width={tile.w}
                  height={tile.h}
                  rx="0"
                  fill={cv(group.ci)}
                  fillOpacity={`calc(var(--preview-shape-opacity, 1) * ${0.9 - tileIndex * 0.055})`}
                  stroke="var(--preview-shape-border-color, white)"
                  strokeWidth="var(--preview-shape-border-width, 1)"
                />
                {showDataLabels && tile.w > 15 && tile.h > 14 && (
                  <text x={tile.x + tile.w / 2} y={lineStart} textAnchor="middle" fontSize={`var(--preview-data-label-size, ${fontSize}px)`} fill="var(--preview-data-label-color, white)" fontWeight="600">
                    {lines.map((line, lineIndex) => (
                      <tspan key={line} x={tile.x + tile.w / 2} dy={lineIndex === 0 ? 0 : fontSize + 1}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      ))}
      {showLegend && (
        <g transform="translate(137 5)">
          <rect x="-5" y="-3" width="78" height="31" rx="1" fill="var(--card-bg, #FFFFFF)" fillOpacity=".86" />
          {GROUPS.slice(0, 4).map((group, index) => {
            const x = (index % 2) * 37
            const y = Math.floor(index / 2) * 13
            return (
              <g key={`legend-${group.label}`} transform={`translate(${x} ${y})`}>
                <rect width="6" height="6" y="1" fill={cv(group.ci)} />
                <text x="9" y="6.5" fontSize="var(--preview-legend-size, 6.4px)" fill="var(--preview-legend-color, #605E5C)">
                  {group.label}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}
