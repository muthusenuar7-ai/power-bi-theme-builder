/**
 * Container Layout — computes the visual chrome bounding boxes.
 *
 * In Theme Studio, the title and subtitle are rendered in HTML *above* the SVG
 * (in ChartCard.tsx), so inside the SVG we have the full viewBox for chart
 * content. Pass `titleH: 0, subtitleH: 0` for this case.
 *
 * For visuals that render their own title inside the SVG (e.g. FocusView
 * custom layouts) pass non-zero titleH / subtitleH.
 */

import type { Rect, PaddingRect, VisualChromeOptions, ContainerLayoutResult } from './types'

/* ── Defaults ────────────────────────────────────────────────────────── */

const DEFAULT_PADDING: PaddingRect = { top: 4, right: 4, bottom: 4, left: 4 }

/* ── Helpers ──────────────────────────────────────────────────────────── */

function rectOf(x: number, y: number, w: number, h: number): Rect {
  return { x, y, w, h }
}

/* ── Public API ──────────────────────────────────────────────────────── */

/**
 * Compute outer, title, subtitle, and inner bounding boxes within a viewBox.
 *
 * @param vw       SVG viewBox width  (e.g. 240)
 * @param vh       SVG viewBox height (e.g. 126)
 * @param options  Chrome configuration (title height, subtitle height, padding)
 */
export function computeContainerLayout(
  vw: number,
  vh: number,
  options: VisualChromeOptions = {},
): ContainerLayoutResult {
  const pad       = options.padding ?? DEFAULT_PADDING
  const titleH    = Math.max(0, options.titleH    ?? 0)
  const subtitleH = Math.max(0, options.subtitleH ?? 0)

  const outerRect = rectOf(0, 0, vw, vh)

  const innerX = pad.left
  const innerY = pad.top
  const innerW = Math.max(0, vw - pad.left - pad.right)
  const innerH = Math.max(0, vh - pad.top  - pad.bottom)

  const titleRect    = rectOf(innerX, innerY,              innerW, titleH)
  const subtitleRect = rectOf(innerX, innerY + titleH,     innerW, subtitleH)
  const innerRect    = rectOf(innerX, innerY + titleH + subtitleH,
                              innerW, Math.max(0, innerH - titleH - subtitleH))

  return { outerRect, titleRect, subtitleRect, innerRect }
}

/**
 * Convenience: compute just the inner rect (most common usage).
 * Equivalent to `computeContainerLayout(vw, vh, options).innerRect`.
 */
export function getInnerRect(
  vw: number,
  vh: number,
  options?: VisualChromeOptions,
): Rect {
  return computeContainerLayout(vw, vh, options).innerRect
}
