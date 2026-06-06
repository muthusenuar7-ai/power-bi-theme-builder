export type DropShadowPosition = 'Outer' | 'Inner'
export type GridlineStyle = 'solid' | 'dashed' | 'dotted' | 'custom'
export type PieLabelPosition = 'outside' | 'inside' | 'preferOutside' | 'preferInside'
export type TreemapTilingMethod = 'stableSquarified' | 'binary' | 'alternating'

function normalizedString(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase().replace(/[\s_-]+/g, '') : ''
}

export function normalizeDropShadowPosition(value: unknown): DropShadowPosition {
  const normalized = normalizedString(value)
  return normalized === 'inner' || normalized.includes('inside') ? 'Inner' : 'Outer'
}

export function normalizeGridlineStyle(value: unknown): GridlineStyle {
  const normalized = normalizedString(value)
  if (normalized.includes('dash')) return 'dashed'
  if (normalized.includes('dot')) return 'dotted'
  if (normalized.includes('custom')) return 'custom'
  return 'solid'
}

export function normalizePieLabelPosition(value: unknown): PieLabelPosition {
  const normalized = normalizedString(value)
  if (normalized === 'inside') return 'inside'
  if (normalized === 'preferinside') return 'preferInside'
  if (normalized === 'preferoutside') return 'preferOutside'
  return 'outside'
}

export function normalizeDonutInnerRadiusRatio(value: unknown): number {
  const parsed = typeof value === 'number'
    ? value
    : Number.parseFloat(String(value ?? '60'))

  const radius = Number.isFinite(parsed) ? parsed : 60
  const percentageRadius = radius > 0 && radius <= 1 ? radius * 100 : radius

  return Math.max(0, Math.min(100, Math.round(percentageRadius)))
}

export function normalizeTreemapTilingMethod(value: unknown): TreemapTilingMethod {
  const normalized = normalizedString(value)
  if (normalized.includes('binary')) return 'binary'
  if (normalized.includes('alternating')) return 'alternating'
  return 'stableSquarified'
}

export function normalizeOutlineStyle(value: unknown): number {
  if (typeof value === 'number' && Number.isInteger(value)) return value

  const normalized = normalizedString(value)
  if (!normalized || normalized === 'none') return 0

  const parsed = Number.parseInt(normalized, 10)
  return Number.isInteger(parsed) ? parsed : 0
}
