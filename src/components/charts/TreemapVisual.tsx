'use client'

import { useId } from 'react'
import { useElementSize } from '@/hooks/useElementSize'
import {
  computeContainerLayout,
  computeLegendLayout,
  truncateLegendLabel,
  type LegendItem,
  type Rect,
} from '@/lib/pbi-mimic'
import { AX, cv, f } from './chartUtils'
import type { ChartVisualProps } from './ChartRenderer'

type TreemapChild = {
  label: string
  value: number
}

type TreemapGroup = {
  label: string
  color: string
  children: readonly TreemapChild[]
}

type LayoutItem<T> = {
  item: T
  rect: Rect
}

const GROUPS: readonly TreemapGroup[] = [
  {
    label: 'Saudi',
    color: cv(1),
    children: [
      { label: 'Riyadh', value: 23.6 },
      { label: 'Jeddah', value: 18.6 },
      { label: 'Madina', value: 17.1 },
      { label: 'Dammam', value: 14.1 },
      { label: 'Al Khobar', value: 2.5 },
      { label: 'Mecca', value: 0.4 },
    ],
  },
  {
    label: 'UAE',
    color: cv(2),
    children: [
      { label: 'Abu Dhabi', value: 15.1 },
      { label: 'Dubai', value: 12.9 },
      { label: 'Sharjah', value: 9.3 },
    ],
  },
  {
    label: 'Oman',
    color: cv(3),
    children: [
      { label: 'Muscat', value: 6.2 },
      { label: 'Sohar', value: 3.4 },
    ],
  },
  {
    label: 'Kuwait',
    color: cv(4),
    children: [
      { label: 'Kuwait City', value: 3.3 },
      { label: 'Salmiya', value: 2.5 },
    ],
  },
  {
    label: 'Qatar',
    color: cv(5),
    children: [
      { label: 'Doha', value: 4.7 },
      { label: 'Lusail', value: 1.6 },
    ],
  },
  {
    label: 'Bahrain',
    color: cv(6),
    children: [
      { label: 'Manama', value: 3.9 },
      { label: 'Riffa', value: 1.3 },
    ],
  },
]

function sumGroup(group: TreemapGroup): number {
  return group.children.reduce((sum, child) => sum + Math.max(0, child.value), 0)
}

function insetRect(rect: Rect, gap: number): Rect {
  const inset = gap / 2
  return {
    x: rect.x + inset,
    y: rect.y + inset,
    w: Math.max(0, rect.w - gap),
    h: Math.max(0, rect.h - gap),
  }
}

function splitIndex<T>(items: readonly T[], valueOf: (item: T) => number): number {
  const total = items.reduce((sum, item) => sum + valueOf(item), 0)
  let running = 0
  let bestIndex = 1
  let bestDelta = Number.POSITIVE_INFINITY

  for (let index = 1; index < items.length; index += 1) {
    running += valueOf(items[index - 1])
    const delta = Math.abs(total / 2 - running)
    if (delta < bestDelta) {
      bestDelta = delta
      bestIndex = index
    }
  }

  return bestIndex
}

function binaryTreemap<T>(
  items: readonly T[],
  rect: Rect,
  valueOf: (item: T) => number,
  gap: number,
): LayoutItem<T>[] {
  const sorted = [...items]
    .filter((item) => valueOf(item) > 0)
    .sort((a, b) => valueOf(b) - valueOf(a))

  if (sorted.length === 0 || rect.w <= 0 || rect.h <= 0) return []
  if (sorted.length === 1) return [{ item: sorted[0], rect: insetRect(rect, gap) }]

  const index = splitIndex(sorted, valueOf)
  const first = sorted.slice(0, index)
  const second = sorted.slice(index)
  const firstValue = first.reduce((sum, item) => sum + valueOf(item), 0)
  const total = firstValue + second.reduce((sum, item) => sum + valueOf(item), 0)
  const ratio = total > 0 ? firstValue / total : 0.5

  if (rect.w >= rect.h) {
    const firstW = rect.w * ratio
    return [
      ...binaryTreemap(first, { x: rect.x, y: rect.y, w: firstW, h: rect.h }, valueOf, gap),
      ...binaryTreemap(second, { x: rect.x + firstW, y: rect.y, w: rect.w - firstW, h: rect.h }, valueOf, gap),
    ]
  }

  const firstH = rect.h * ratio
  return [
    ...binaryTreemap(first, { x: rect.x, y: rect.y, w: rect.w, h: firstH }, valueOf, gap),
    ...binaryTreemap(second, { x: rect.x, y: rect.y + firstH, w: rect.w, h: rect.h - firstH }, valueOf, gap),
  ]
}

function maxChars(width: number, fontSize: number): number {
  return Math.max(2, Math.floor((width - 6) / (fontSize * 0.56)))
}

function truncate(value: string, chars: number): string {
  return value.length > chars ? `${value.slice(0, Math.max(1, chars - 1))}...` : value
}

function childFontSize(rect: Rect): number {
  const minSide = Math.min(rect.w, rect.h)
  if (minSide < 17 || rect.w < 28) return 0
  if (rect.w > 92 && rect.h > 52) return 9
  if (rect.w > 58 && rect.h > 30) return 8
  return 6.6
}

function renderLegendTextY(fontSize: number): number {
  return fontSize * 0.88
}

function safeId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export function TreemapVisual({
  showLegend = true,
  showDataLabels = true,
  format,
}: ChartVisualProps) {
  const { ref, width, height } = useElementSize({ width: 420, height: 260 })
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const legendFontSize = format?.legend.fontSize ?? 8
  const legendTitleFontSize = format?.legend.titleFontSize ?? legendFontSize
  const legendTextShow = format?.legend.textShow ?? true
  const legendTitleShow = Boolean(format?.legend.titleShow && format.legend.titleText)
  const legendTitleHeight = legendTitleShow ? Math.max(10, legendTitleFontSize + 4) : 0
  const legendVisible = showLegend && (legendTextShow || legendTitleShow)
  const { innerRect } = computeContainerLayout(width, height, {
    padding: { top: 5, right: 5, bottom: 5, left: 5 },
  })
  const legendItems: LegendItem[] = GROUPS.map((group) => ({ label: group.label, color: group.color }))
  const legend = computeLegendLayout(
    innerRect,
    legendItems,
    format?.legend.position ?? 'Top left',
    legendVisible,
    legendFontSize,
    {
      textVisible: legendTextShow,
      titleVisible: legendTitleShow,
      titleHeight: legendTitleHeight,
      itemHeight: Math.max(10, Math.ceil(legendFontSize + 3)),
    },
  )
  const plotRect = legend.plotRect
  const groupLayouts = binaryTreemap(GROUPS, plotRect, sumGroup, 2)
  const parentText = 'var(--theme-fg, #252423)'
  const childText = 'var(--preview-data-label-color, rgba(255,255,255,.94))'
  const groupStroke = format?.shape.borderShow
    ? format.shape.borderColor
    : 'var(--card-border, rgba(0,0,0,.14))'
  const groupStrokeWidth = format?.shape.borderShow ? Math.max(0.6, format.shape.borderWidth) : 0.7
  const tileStroke = 'var(--card-bg, #FFFFFF)'

  return (
    <div ref={ref} style={{ width: '100%', height: '100%', minWidth: 0, minHeight: 0 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height="100%"
        role="img"
        aria-label="Treemap preview"
        style={{ display: 'block', fontFamily: AX.font, overflow: 'hidden' }}
      >
        {groupLayouts.map(({ item: group, rect: groupRect }) => {
          const headerH = groupRect.h >= 30 && groupRect.w >= 40 ? Math.min(14, Math.max(10, groupRect.h * 0.12)) : 0
          const childRect = {
            x: groupRect.x + 1.2,
            y: groupRect.y + headerH + 1.2,
            w: Math.max(0, groupRect.w - 2.4),
            h: Math.max(0, groupRect.h - headerH - 2.4),
          }
          const childLayouts = binaryTreemap(group.children, childRect, (child) => child.value, 1.4)
          const groupClipId = `${idPrefix}-group-${safeId(group.label)}`

          return (
            <g key={group.label}>
              <clipPath id={groupClipId}>
                <rect x={groupRect.x} y={groupRect.y} width={groupRect.w} height={groupRect.h} rx="1.5" />
              </clipPath>
              <rect
                x={groupRect.x}
                y={groupRect.y}
                width={groupRect.w}
                height={groupRect.h}
                rx="1.5"
                fill={group.color}
                fillOpacity=".12"
                stroke={groupStroke}
                strokeWidth={groupStrokeWidth}
              />
              {showDataLabels && headerH > 0 && (
                <text
                  x={groupRect.x + 4}
                  y={groupRect.y + Math.min(10, headerH - 2)}
                  fontSize={Math.min(9, Math.max(6.4, headerH - 3))}
                  fill={parentText}
                  fontWeight="700"
                  clipPath={`url(#${groupClipId})`}
                >
                  {truncate(group.label, maxChars(groupRect.w, 8))}
                </text>
              )}

              {childLayouts.map(({ item: child, rect: tileRect }, childIndex) => {
                const fontSize = childFontSize(tileRect)
                const label = truncate(child.label, maxChars(tileRect.w, fontSize || 6.4))
                const value = `${child.value.toFixed(1).replace(/\.0$/, '')}M`
                const tileClipId = `${idPrefix}-${safeId(group.label)}-${safeId(child.label)}`
                const opacity = Math.max(0.42, Math.min(0.94, (format?.shape.opacity ?? 1) * (0.88 - childIndex * 0.055)))
                const showValue = fontSize > 0 && tileRect.h > 30 && tileRect.w > 42

                return (
                  <g key={`${group.label}-${child.label}`}>
                    <title>{`${group.label} > ${child.label}: ${value}`}</title>
                    <clipPath id={tileClipId}>
                      <rect x={tileRect.x} y={tileRect.y} width={tileRect.w} height={tileRect.h} rx="0.5" />
                    </clipPath>
                    <rect
                      x={tileRect.x}
                      y={tileRect.y}
                      width={tileRect.w}
                      height={tileRect.h}
                      rx="0.5"
                      fill={group.color}
                      fillOpacity={opacity}
                      stroke={tileStroke}
                      strokeWidth="1"
                    />
                    {showDataLabels && fontSize > 0 && (
                      <text
                        x={tileRect.x + 4}
                        y={tileRect.y + fontSize + 3}
                        fontSize={fontSize}
                        fill={childText}
                        fontWeight="650"
                        clipPath={`url(#${tileClipId})`}
                      >
                        <tspan x={tileRect.x + 4}>{label}</tspan>
                        {showValue && (
                          <tspan x={tileRect.x + 4} dy={fontSize + 2} fontSize={Math.max(5.8, fontSize - 1.1)} opacity=".86">
                            {value}
                          </tspan>
                        )}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )
        })}

        {showLegend && legend.visible && (
          <g transform={`translate(${f(legend.legendRect.x)} ${f(legend.legendRect.y)})`}>
            {legendTitleShow && (
              <text
                x={0}
                y={renderLegendTextY(legendTitleFontSize)}
                fontSize={legendTitleFontSize}
                fill={format?.legend.titleColor ?? 'var(--preview-legend-color,#605E5C)'}
                fontFamily={format?.legend.titleFontFamily ?? AX.font}
                fontWeight={format?.legend.titleFontWeight ?? 700}
                fontStyle={format?.legend.titleFontStyle ?? 'normal'}
                textDecoration={format?.legend.titleTextDecoration ?? 'none'}
              >
                {format?.legend.titleText}
              </text>
            )}
            {legendTextShow && legendItems.map((item, index) => {
              const horizontal = legend.direction === 'horizontal'
              const row = horizontal ? Math.floor(index / legend.itemsPerRow) : index
              const col = horizontal ? index % legend.itemsPerRow : 0
              const label = truncateLegendLabel(item.label, legend.itemWidth)

              return (
                <g
                  key={`legend-${item.label}`}
                  transform={`translate(${f(col * legend.itemWidth)} ${f(legendTitleHeight + row * legend.itemHeight)})`}
                >
                  <rect
                    x={0}
                    y={Math.max(1, legendFontSize * 0.16)}
                    width={Math.max(5, legendFontSize * 0.76)}
                    height={Math.max(5, legendFontSize * 0.76)}
                    rx="1"
                    fill={item.color}
                  />
                  <text
                    x={legendFontSize + 2}
                    y={renderLegendTextY(legendFontSize)}
                    fontSize={legendFontSize}
                    fill="var(--preview-legend-color,#605E5C)"
                    fontFamily={format?.legend.fontFamily ?? AX.font}
                    fontWeight={format?.legend.fontWeight ?? 400}
                    fontStyle={format?.legend.fontStyle ?? 'normal'}
                    textDecoration={format?.legend.textDecoration ?? 'none'}
                  >
                    {label}
                  </text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}
