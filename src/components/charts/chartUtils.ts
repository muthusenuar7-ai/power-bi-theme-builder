/** Shared constants and helpers for all PBI-style chart SVG components */
import { formatDisplayValue, truncateText } from '@/lib/pbi-mimic'
import type { ResolvedAxisPreviewStyle, ResolvedDataLabelPreviewStyle, ResolvedLegendPreviewStyle } from '@/lib/formatPreview'

/**
 * Round a coordinate to 3 decimal places.
 * Ensures SVG path strings are identical on server and client (SSR hydration safe).
 */
export function f(n: number): number { return Math.round(n * 1000) / 1000 }

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
  const x1 = f(cx + r * Math.cos(toRad(startDeg)))
  const y1 = f(cy + r * Math.sin(toRad(startDeg)))
  const x2 = f(cx + r * Math.cos(toRad(endDeg)))
  const y2 = f(cy + r * Math.sin(toRad(endDeg)))
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${large} 1 ${x2},${y2} Z`
}

/** Label position for a pie slice midpoint */
export function sliceMid(
  cx: number, cy: number, r: number, startDeg: number, endDeg: number,
): { x: number; y: number } {
  const mid = (startDeg + endDeg) / 2
  const rad = ((mid - 90) * Math.PI) / 180
  return { x: f(cx + r * Math.cos(rad)), y: f(cy + r * Math.sin(rad)) }
}

/** CSS variable reference with fallback */
export function cv(n: number, fallbacks: string[] = [
  '#0D9488','#3B82F6','#8B5CF6','#F59E0B',
  '#EF4444','#10B981','#F97316','#EC4899','#2563EB','#64748B',
]): string {
  return `var(--c${n}, ${fallbacks[(n - 1) % fallbacks.length] ?? '#666'})`
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

export function axisLabelTextProps(axis: 'x' | 'y', fallbackSize = '7.5px') {
  return {
    fontSize: `var(--preview-${axis}-axis-label-size, ${fallbackSize})`,
    fill: `var(--preview-${axis}-axis-label-color, #605E5C)`,
    fontFamily: `var(--preview-${axis}-axis-label-font-family, var(--preview-font-family, 'Segoe UI', sans-serif))`,
    fontWeight: `var(--preview-${axis}-axis-label-font-weight, 400)`,
    fontStyle: `var(--preview-${axis}-axis-label-font-style, normal)`,
    textDecoration: `var(--preview-${axis}-axis-label-text-decoration, none)`,
  }
}

export function axisTitleTextProps(axis: 'x' | 'y', fallbackSize = '8px') {
  return {
    fontSize: `var(--preview-${axis}-axis-title-size, ${fallbackSize})`,
    fill: `var(--preview-${axis}-axis-title-color, #605E5C)`,
    fontFamily: `var(--preview-${axis}-axis-title-font-family, var(--preview-font-family, 'Segoe UI', sans-serif))`,
    fontWeight: `var(--preview-${axis}-axis-title-font-weight, 700)`,
    fontStyle: `var(--preview-${axis}-axis-title-font-style, normal)`,
    textDecoration: `var(--preview-${axis}-axis-title-text-decoration, none)`,
  }
}

export function legendTextProps(fallbackSize = '7px') {
  return {
    fontSize: `var(--preview-legend-size, ${fallbackSize})`,
    fill: 'var(--preview-legend-color, #605E5C)',
    fontFamily: `var(--preview-legend-font-family, var(--preview-font-family, 'Segoe UI', sans-serif))`,
    fontWeight: 'var(--preview-legend-font-weight, 400)',
    fontStyle: 'var(--preview-legend-font-style, normal)',
    textDecoration: 'var(--preview-legend-text-decoration, none)',
  }
}

export function dataLabelTextProps(fillFallback = '#fff', fallbackSize = '6.5px') {
  return {
    fontSize: `var(--preview-data-label-size, ${fallbackSize})`,
    fill: `var(--preview-data-label-color, ${fillFallback})`,
    fontFamily: `var(--preview-data-label-font-family, var(--preview-font-family, 'Segoe UI', sans-serif))`,
    fontWeight: 'var(--preview-data-label-font-weight, 700)',
    fontStyle: 'var(--preview-data-label-font-style, normal)',
    textDecoration: 'var(--preview-data-label-text-decoration, none)',
  }
}

export function gridOpacity(): string {
  return 'var(--preview-gridline-opacity, 1)'
}

export function formattedMeasure(
  value: number,
  dataLabels: ResolvedDataLabelPreviewStyle | undefined,
  options: { suffix?: string; alreadyScaled?: boolean } = {},
): string {
  return formatDisplayValue(value, dataLabels?.displayUnits ?? 'Auto', dataLabels?.decimals ?? 'Auto', options)
}

export function categoryLabelParts(label: string, concatenate = false): string[] {
  const cityByCountry: Record<string, string> = {
    Saudi: 'Riyadh',
    UAE: 'Dubai',
    Oman: 'Muscat',
    Kuwait: 'Kuwait City',
    Bahrain: 'Manama',
    Qatar: 'Doha',
    EMEA: 'Enterprise',
    Americas: 'Retail',
    APAC: 'Channel',
    Q1: '2015',
    Q2: '2015',
    Q3: '2016',
    Q4: '2016',
  }
  const detail = cityByCountry[label]
  if (!detail) return [label]
  return concatenate ? [`${label}, ${detail}`] : [label, detail]
}

export function truncateCategoryLabel(label: string, axis: ResolvedAxisPreviewStyle | undefined, baseChars = 9): string {
  const pct = Math.max(20, Math.min(50, axis?.maxWidthPct ?? 25))
  const maxChars = Math.round(baseChars + ((pct - 20) / 30) * 10)
  return truncateText(label, maxChars)
}

export function legendVisible(legend: ResolvedLegendPreviewStyle | undefined, fallback = true): boolean {
  if (!legend) return fallback
  return legend.show && legend.textShow
}
