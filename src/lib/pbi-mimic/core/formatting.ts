import type { CSSProperties } from 'react'
import { formatNumber } from './numberFormatter'
import type { DisplayUnit } from './types'

export function fontWeightFromBold(bold: boolean): number {
  return bold ? 700 : 400
}

export function fontStyleFromItalic(italic: boolean): CSSProperties['fontStyle'] {
  return italic ? 'italic' : 'normal'
}

export function textDecorationFromUnderline(underline: boolean): CSSProperties['textDecoration'] {
  return underline ? 'underline' : 'none'
}

export function opacityFromTransparency(transparency: number): number {
  return Math.max(0, Math.min(1, (100 - transparency) / 100))
}

export function displayUnitFromString(value: string | undefined): DisplayUnit {
  const normalized = (value ?? 'auto').trim().toLowerCase()
  if (normalized === 'none') return 'none'
  if (normalized === 'thousands') return 'thousands'
  if (normalized === 'millions') return 'millions'
  if (normalized === 'billions') return 'billions'
  if (normalized === 'trillions') return 'trillions'
  return 'auto'
}

export function decimalPlacesFromValue(value: string | number | undefined, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.min(10, Math.round(value)))
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (!normalized || normalized === 'auto') return fallback
    const parsed = Number.parseInt(normalized, 10)
    if (Number.isFinite(parsed)) return Math.max(0, Math.min(10, parsed))
  }
  return fallback
}

export function formatDisplayValue(
  value: number,
  displayUnits: string | undefined,
  decimals: string | number | undefined,
  options: { alreadyScaled?: boolean; suffix?: string } = {},
): string {
  const unit = displayUnitFromString(displayUnits)
  const decimalCount = decimalPlacesFromValue(decimals, unit === 'none' ? 0 : 1)
  const rawValue = options.alreadyScaled ? value : value * 1_000_000
  return `${formatNumber(rawValue, unit, decimalCount)}${options.suffix ?? ''}`
}

export function truncateText(value: string, maxChars: number): string {
  if (value.length <= maxChars) return value
  if (maxChars <= 3) return value.slice(0, maxChars)
  return `${value.slice(0, maxChars - 1)}…`
}
