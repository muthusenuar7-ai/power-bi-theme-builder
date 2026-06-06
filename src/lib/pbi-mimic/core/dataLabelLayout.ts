/**
 * Data Label Layout — computes label positions for all visual types.
 *
 * Pie / donut:   outside leader-line labels (full implementation)
 * Bar / column:  inside-end, outside-end, inside-center, inside-base (structure ready)
 *
 * All coordinates are in SVG viewBox units.
 */

import type { Rect, PieLabelPoint, BarLabelPoint, DataLabelPosition } from './types'

/* ── Rounding helper ─────────────────────────────────────────────────── */

function f(n: number): number { return Math.round(n * 1000) / 1000 }

/* ── Polar helpers ───────────────────────────────────────────────────── */

/** "0° = top, clockwise" degree → radians */
export function polarRad(deg: number): number {
  return ((deg - 90) * Math.PI) / 180
}

/* ── Pie fill factors ────────────────────────────────────────────────── */

/**
 * Fraction of min(plotW, plotH)/2 used as the circle radius.
 * Leaves room for leader lines when labels are enabled.
 */
export const PIE_FILL_WITH_LABELS    = 0.64
export const PIE_FILL_WITHOUT_LABELS = 0.88

/**
 * Compute the circle radius that best fills the plot area.
 * @param plotW         Plot rectangle width
 * @param plotH         Plot rectangle height
 * @param showLabels    Whether outside labels are visible
 */
export function computeCircleRadius(
  plotW: number,
  plotH: number,
  showLabels: boolean,
): number {
  const fill = showLabels ? PIE_FILL_WITH_LABELS : PIE_FILL_WITHOUT_LABELS
  return Math.max(8, Math.min(plotW, plotH) / 2 * fill)
}

/* ── Pie / donut labels ──────────────────────────────────────────────── */

interface SliceAngles {
  sliceIdx: number
  startDeg: number
  endDeg: number
  /** Percentage (0–100) — slices below minPct are not labelled */
  pct: number
}

/** Internal intermediate label point before overlap resolution */
interface RawPieLabelPoint {
  sliceIdx: number
  isRight: boolean
  edgeX: number
  edgeY: number
  bendX: number
  rawY: number   // before overlap resolution
}

/**
 * Compute raw (pre-overlap-resolution) label seed for one slice.
 */
function sliceSeed(
  cx: number, cy: number,
  r: number, bendR: number,
  startDeg: number, endDeg: number,
  sliceIdx: number,
): RawPieLabelPoint {
  const mid = (startDeg + endDeg) / 2
  const rad = polarRad(mid)
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  return {
    sliceIdx,
    isRight: cos >= 0,
    edgeX:   f(cx + r     * cos),
    edgeY:   f(cy + r     * sin),
    bendX:   f(cx + bendR * cos),
    rawY:    f(cy + bendR * sin),
  }
}

/**
 * Resolve overlapping labels on one side (left or right) so they don't
 * collide. Returns a new sorted array — inputs are not mutated.
 *
 * @param seeds   Unsorted seeds for one side
 * @param minGap  Minimum vertical distance between adjacent labels
 * @param yMin    Upper clamp bound
 * @param yMax    Lower clamp bound
 */
function resolveOneSide(
  seeds: RawPieLabelPoint[],
  minGap: number,
  yMin: number,
  yMax: number,
): Array<RawPieLabelPoint & { adjustedY: number }> {
  if (seeds.length === 0) return []

  // Sort by raw y (ascending = topmost first)
  let pts = seeds.map((s) => ({ ...s, adjustedY: s.rawY }))
    .sort((a, b) => a.rawY - b.rawY)

  // Forward pass: push lower label down
  for (let i = 1; i < pts.length; i++) {
    if (pts[i].adjustedY - pts[i - 1].adjustedY < minGap) {
      pts[i] = { ...pts[i], adjustedY: pts[i - 1].adjustedY + minGap }
    }
  }

  // Backward pass: push upper label up
  for (let i = pts.length - 2; i >= 0; i--) {
    if (pts[i + 1].adjustedY - pts[i].adjustedY < minGap) {
      pts[i] = { ...pts[i], adjustedY: pts[i + 1].adjustedY - minGap }
    }
  }

  // Clamp to plot area
  pts = pts.map((p) => ({
    ...p,
    adjustedY: Math.max(yMin, Math.min(p.adjustedY, yMax)),
  }))

  return pts
}

/**
 * Compute fully resolved leader-line label positions for all pie / donut slices.
 *
 * @param cx            Circle centre x
 * @param cy            Circle centre y
 * @param r             Outer radius
 * @param leaderLength  Length of the radial leader line from circle edge
 * @param elbowLength   Length of the horizontal elbow segment
 * @param slices        Slice angle data
 * @param minPct        Minimum slice % to show a label (default 4)
 * @param plotRect      Plot bounding box (used for clamping)
 */
export function computePieLabels(
  cx: number,
  cy: number,
  r: number,
  leaderLength: number,
  elbowLength: number,
  slices: SliceAngles[],
  minPct: number,
  plotRect: Rect,
): PieLabelPoint[] {
  const bendR = r + leaderLength

  // Compute raw seeds for visible slices only
  const visible = slices.filter((s) => s.pct >= minPct)
  const seeds   = visible.map((s) =>
    sliceSeed(cx, cy, r, bendR, s.startDeg, s.endDeg, s.sliceIdx),
  )

  const yMin = plotRect.y + 4
  const yMax = plotRect.y + plotRect.h - 4

  // Resolve overlap on each side independently
  const leftResolved  = resolveOneSide(seeds.filter((s) => !s.isRight), 15, yMin, yMax)
  const rightResolved = resolveOneSide(seeds.filter((s) =>  s.isRight), 15, yMin, yMax)
  const allResolved   = [...leftResolved, ...rightResolved]

  // Build final label points
  return allResolved.map((pt) => {
    const { adjustedY } = pt
    const textX = pt.isRight
      ? Math.min(f(pt.bendX + elbowLength), plotRect.x + plotRect.w - 2)
      : Math.max(f(pt.bendX - elbowLength), plotRect.x + 2)
    const lineEndX = pt.isRight ? textX - 1 : textX + 1

    return {
      sliceIdx: pt.sliceIdx,
      isRight:  pt.isRight,
      edgeX:    pt.edgeX,
      edgeY:    pt.edgeY,
      bendX:    f(pt.bendX),
      bendY:    f(adjustedY),
      lineEndX: f(lineEndX),
      textX,
      textY:    f(adjustedY),
      anchor:   pt.isRight ? 'start' : 'end',
    }
  })
}

/* ── Bar / column labels ─────────────────────────────────────────────── */

interface BarSegment {
  barIdx: number
  seriesIdx: number
  /** Bar/segment top-left in viewBox coords */
  x: number
  y: number
  w: number
  h: number
  value: number
  isNegative: boolean
}

/**
 * Compute label positions for bar / column segments.
 * Only outside-end and inside-end are implemented for now.
 *
 * @param segments  Bar/column segments to label
 * @param position  Label placement mode
 * @param plotRect  Plot bounding box (used for outside-end clamping)
 */
export function computeBarLabels(
  segments: BarSegment[],
  position: DataLabelPosition,
  plotRect: Rect,
): BarLabelPoint[] {
  return segments.map((seg) => {
    let x: number, y: number
    let anchor: BarLabelPoint['anchor'] = 'middle'
    let baseline: BarLabelPoint['baseline'] = 'auto'

    switch (position) {
      case 'outside-end':
        // Above the bar for columns; right of bar for bars
        x = seg.x + seg.w / 2
        y = Math.max(plotRect.y + 2, seg.y - 2)
        anchor   = 'middle'
        baseline = 'auto'
        break

      case 'inside-end':
        x = seg.x + seg.w / 2
        y = seg.y + 4
        anchor   = 'middle'
        baseline = 'hanging'
        break

      case 'inside-center':
        x = seg.x + seg.w / 2
        y = seg.y + seg.h / 2
        anchor   = 'middle'
        baseline = 'middle'
        break

      case 'inside-base':
        x = seg.x + seg.w / 2
        y = seg.y + seg.h - 4
        anchor   = 'middle'
        baseline = 'auto'
        break

      default:
        x = seg.x + seg.w / 2
        y = Math.max(plotRect.y + 2, seg.y - 2)
        anchor   = 'middle'
        baseline = 'auto'
    }

    return { barIdx: seg.barIdx, seriesIdx: seg.seriesIdx, x: f(x), y: f(y), anchor, baseline }
  })
}
