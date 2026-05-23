/** Shared constants and helpers for all PBI-style chart SVG components */

/** Power BI axis / grid colour tokens */
export const AX = {
  line:  'var(--preview-axis-line, #C8C6C4)',
  grid:  'var(--preview-gridline-color, #EDEBE9)',
  label: 'var(--preview-axis-label-color, #605E5C)',
  font:  "var(--preview-font-family, 'Segoe UI', sans-serif)",
} as const

/** Compact number formatter  142000 → "142K", 1500000 → "1.5M" */
export function fmt(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (abs >= 1_000)     return (n / 1_000).toFixed(0) + 'K'
  return String(n)
}

/** Percentage string  42.857 → "43%" */
export function pct(n: number): string { return Math.round(n) + '%' }

/**
 * Polar-to-Cartesian for pie/donut arc paths.
 * angle=0 is 12 o'clock; increases clockwise.
 */
export function arc(
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number,
): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startDeg))
  const y1 = cy + r * Math.sin(toRad(startDeg))
  const x2 = cx + r * Math.cos(toRad(endDeg))
  const y2 = cy + r * Math.sin(toRad(endDeg))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`
}

/** Label position for a pie slice midpoint */
export function sliceMid(
  cx: number, cy: number, r: number, startDeg: number, endDeg: number,
): { x: number; y: number } {
  const mid = (startDeg + endDeg) / 2
  const rad = ((mid - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** CSS variable reference with fallback */
export function cv(n: number, fallbacks: string[] = [
  '#0D9488','#3B82F6','#8B5CF6','#F59E0B',
  '#EF4444','#10B981','#F97316','#EC4899',
]): string {
  return `var(--c${n}, ${fallbacks[n - 1] ?? '#666'})`
}

type AxisPreview = {
  show?: boolean
  visible?: boolean
  labelVisible?: boolean
  titleShow?: boolean
  titleVisible?: boolean
  titleText?: string
}

export function axisTitle(axis: AxisPreview | undefined): string {
  const text = axis?.titleText?.trim()
  if (!axisVisible(axis) || !(axis?.titleVisible ?? axis?.titleShow) || !text || text.toLowerCase() === 'auto') return ''
  return text
}

export function axisVisible(axis: boolean | AxisPreview | undefined): boolean {
  if (typeof axis === 'boolean') return axis
  return axis?.visible ?? axis?.show ?? true
}

export function axisLabelVisible(axis: AxisPreview | undefined): boolean {
  return axisVisible(axis) && (axis?.labelVisible ?? true)
}

export function axisLine(axis: boolean | AxisPreview | undefined): string {
  return axisVisible(axis) ? AX.line : 'transparent'
}
