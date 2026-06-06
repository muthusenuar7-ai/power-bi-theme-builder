/**
 * Legend Layout: resolves Power BI-like legend placement for the visual mimic engine.
 *
 * Supported positions:
 * - Top left, Top center, Top right
 * - Top left stacked, Top right stacked
 * - Center left, Center right
 * - Bottom left, Bottom center, Bottom right
 */

import type {
  LegendAlignment,
  LegendDirection,
  LegendItem,
  LegendLayoutResult,
  LegendPosition,
  LegendSide,
  Rect,
} from './types'

const ITEM_H = 11
const LEGEND_GAP = 4
const HORIZ_ITEM_MIN_W = 46
const HORIZ_ITEM_MAX_W = 132
const MAX_LABEL_CHARS = 16
const ICON_W = 10
const CHAR_W = 5.5
const ITEM_TRAIL_GAP = 8

export interface LegendLayoutOptions {
  titleVisible?: boolean
  titleHeight?: number
  textVisible?: boolean
  itemHeight?: number
}

function trunc(value: string, maxChars: number): string {
  return value.length > maxChars ? `${value.slice(0, Math.max(1, maxChars - 1))}...` : value
}

function measureItemWidth(items: LegendItem[]): number {
  let widestChars = 1
  for (const item of items) {
    widestChars = Math.max(widestChars, Math.min(item.label.length, MAX_LABEL_CHARS))
  }
  return ICON_W + widestChars * CHAR_W + ITEM_TRAIL_GAP
}

function clampWidth(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

export function normalizeLegendPosition(input: string): LegendPosition {
  if (!input) return 'None'

  const canonical: LegendPosition[] = [
    'Top left',
    'Top center',
    'Top right',
    'Top left stacked',
    'Top right stacked',
    'Center left',
    'Center right',
    'Bottom left',
    'Bottom center',
    'Bottom right',
    'None',
  ]
  if ((canonical as string[]).includes(input)) return input as LegendPosition

  const slug = input.toLowerCase().replace(/[-_\s]+/g, '')
  const map: Record<string, LegendPosition> = {
    top: 'Top left',
    topleft: 'Top left',
    topcenter: 'Top center',
    topmiddle: 'Top center',
    topright: 'Top right',
    topleftstacked: 'Top left stacked',
    toprightstacked: 'Top right stacked',
    left: 'Center left',
    centerleft: 'Center left',
    right: 'Center right',
    centerright: 'Center right',
    bottom: 'Bottom left',
    bottomleft: 'Bottom left',
    bottomcenter: 'Bottom center',
    bottommiddle: 'Bottom center',
    bottomright: 'Bottom right',
    none: 'None',
  }

  return map[slug] ?? 'Top left'
}

function parseLegendPosition(position: string): {
  side: LegendSide
  alignment: LegendAlignment
  forceVertical: boolean
} {
  const value = position.toLowerCase().trim()
  if (!value || value === 'none') {
    return { side: 'none', alignment: 'left', forceVertical: false }
  }

  const forceVertical = value.includes('stacked')

  if (value.includes('center left') || value === 'left') {
    return { side: 'left', alignment: 'left', forceVertical }
  }

  if (value.includes('center right') || value === 'right') {
    return { side: 'right', alignment: 'right', forceVertical }
  }

  if (value.includes('bottom')) {
    return {
      side: 'bottom',
      alignment: value.includes('center') ? 'center' : value.includes('right') ? 'right' : 'left',
      forceVertical,
    }
  }

  return {
    side: 'top',
    alignment: value.includes('center') ? 'center' : value.includes('right') ? 'right' : 'left',
    forceVertical,
  }
}

function hiddenLegend(innerRect: Rect, itemHeight: number): LegendLayoutResult {
  return {
    visible: false,
    plotRect: { ...innerRect },
    legendRect: { x: innerRect.x, y: innerRect.y, w: 0, h: 0 },
    side: 'none',
    direction: 'vertical',
    alignment: 'left',
    itemWidth: HORIZ_ITEM_MIN_W,
    itemHeight,
    itemsPerRow: 1,
  }
}

function alignX(innerRect: Rect, width: number, alignment: LegendAlignment): number {
  if (alignment === 'center') return innerRect.x + (innerRect.w - width) / 2
  if (alignment === 'right') return innerRect.x + innerRect.w - width
  return innerRect.x
}

export function computeLegendLayout(
  innerRect: Rect,
  items: LegendItem[],
  position: string,
  show: boolean,
  fontSize = 7,
  options: LegendLayoutOptions = {},
): LegendLayoutResult {
  const textVisible = options.textVisible ?? true
  const titleVisible = options.titleVisible ?? false
  const itemH = options.itemHeight ?? Math.max(ITEM_H, Math.ceil(fontSize + 4))
  const titleH = titleVisible ? (options.titleHeight ?? Math.max(10, Math.ceil(fontSize + 4))) : 0
  const itemCount = textVisible ? items.length : 0

  if (!show || (itemCount === 0 && !titleVisible)) return hiddenLegend(innerRect, itemH)

  const canonical = normalizeLegendPosition(position)
  const { side, alignment, forceVertical } = parseLegendPosition(canonical)
  if (side === 'none') return hiddenLegend(innerRect, itemH)

  const measured = textVisible ? measureItemWidth(items) : Math.max(46, titleH * 4)
  const safeCount = Math.max(1, itemCount)

  if (forceVertical && (side === 'top' || side === 'bottom')) {
    const legW = clampWidth(measured, 46, Math.max(46, innerRect.w * 0.45))
    const legH = titleH + itemCount * itemH
    const legendRect = {
      x: alignX(innerRect, legW, alignment),
      y: side === 'top' ? innerRect.y : innerRect.y + innerRect.h - legH,
      w: legW,
      h: legH,
    }
    const plotRect = side === 'top'
      ? {
          x: innerRect.x,
          y: innerRect.y + legH + LEGEND_GAP,
          w: innerRect.w,
          h: Math.max(0, innerRect.h - legH - LEGEND_GAP),
        }
      : {
          x: innerRect.x,
          y: innerRect.y,
          w: innerRect.w,
          h: Math.max(0, innerRect.h - legH - LEGEND_GAP),
        }

    return {
      visible: true,
      plotRect,
      legendRect,
      side,
      direction: 'vertical',
      alignment,
      itemWidth: legW,
      itemHeight: itemH,
      itemsPerRow: 1,
    }
  }

  if (side === 'left' || side === 'right') {
    const legW = clampWidth(measured, 46, Math.max(46, innerRect.w * 0.34))
    const legH = titleH + itemCount * itemH
    const legendRect = {
      x: side === 'left' ? innerRect.x : innerRect.x + innerRect.w - legW,
      y: innerRect.y + Math.max(0, (innerRect.h - legH) / 2),
      w: legW,
      h: legH,
    }
    const plotRect = side === 'left'
      ? {
          x: innerRect.x + legW + LEGEND_GAP,
          y: innerRect.y,
          w: Math.max(0, innerRect.w - legW - LEGEND_GAP),
          h: innerRect.h,
        }
      : {
          x: innerRect.x,
          y: innerRect.y,
          w: Math.max(0, innerRect.w - legW - LEGEND_GAP),
          h: innerRect.h,
        }

    return {
      visible: true,
      plotRect,
      legendRect,
      side,
      direction: 'vertical',
      alignment,
      itemWidth: legW,
      itemHeight: itemH,
      itemsPerRow: 1,
    }
  }

  const itemW = clampWidth(measureItemWidth(items), HORIZ_ITEM_MIN_W, Math.min(HORIZ_ITEM_MAX_W, innerRect.w))
  const itemsPerRow = Math.max(1, Math.min(safeCount, Math.floor(innerRect.w / itemW)))
  const rows = Math.ceil(safeCount / itemsPerRow)
  const legH = titleH + rows * itemH
  const totalUsedW = Math.min(safeCount, itemsPerRow) * itemW
  const legX = alignX(innerRect, totalUsedW, alignment)

  const legendRect = side === 'top'
    ? { x: legX, y: innerRect.y, w: totalUsedW, h: legH }
    : { x: legX, y: innerRect.y + Math.max(0, innerRect.h - legH), w: totalUsedW, h: legH }
  const plotRect = side === 'top'
    ? {
        x: innerRect.x,
        y: innerRect.y + legH + LEGEND_GAP,
        w: innerRect.w,
        h: Math.max(0, innerRect.h - legH - LEGEND_GAP),
      }
    : {
        x: innerRect.x,
        y: innerRect.y,
        w: innerRect.w,
        h: Math.max(0, innerRect.h - legH - LEGEND_GAP),
      }

  return {
    visible: true,
    plotRect,
    legendRect,
    side,
    direction: 'horizontal' as LegendDirection,
    alignment,
    itemWidth: itemW,
    itemHeight: itemH,
    itemsPerRow,
  }
}

export function truncateLegendLabel(label: string, itemWidth: number, iconW = 10, charW = 5.5): string {
  const textWidth = Math.max(0, itemWidth - iconW)
  const maxChars = Math.max(3, Math.floor(textWidth / charW))
  return trunc(label, maxChars)
}
