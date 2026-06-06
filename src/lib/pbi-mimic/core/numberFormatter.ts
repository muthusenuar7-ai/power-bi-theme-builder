/**
 * Number Formatter — Power BI-style display-unit formatting.
 *
 * Mirrors the PBI "Display units" dropdown:
 *   Auto · None · Thousands (K) · Millions (M) · Billions (B) · Trillions (T)
 *
 * Used by axisLayout (y-axis tick labels) and by chart components
 * when rendering data-label text.
 */

import type { DisplayUnit } from './types'

/* ── Unit thresholds (descending order) ─────────────────────────────── */

const UNIT_TABLE: ReadonlyArray<{ suffix: string; divisor: number; minAbs: number }> = [
  { suffix: 'T', divisor: 1_000_000_000_000, minAbs: 1_000_000_000_000 },
  { suffix: 'B', divisor: 1_000_000_000,     minAbs: 1_000_000_000     },
  { suffix: 'M', divisor: 1_000_000,         minAbs: 1_000_000         },
  { suffix: 'K', divisor: 1_000,             minAbs: 1_000             },
]

/* ── Helpers ──────────────────────────────────────────────────────────── */

/** Format a divided value to `decimals` places, stripping trailing zeros. */
function fmt(value: number, decimals: number): string {
  if (decimals <= 0) return String(Math.round(value))
  return value.toFixed(decimals).replace(/\.?0+$/, '')
}

/* ── Public API ──────────────────────────────────────────────────────── */

/**
 * Format a number using Power BI display-unit conventions.
 *
 * @param value        The raw numeric value
 * @param displayUnit  One of: 'auto' | 'none' | 'thousands' | 'millions' | 'billions' | 'trillions'
 * @param decimals     Number of decimal places to show (0–10, default 0)
 */
export function formatNumber(
  value: number,
  displayUnit: DisplayUnit,
  decimals = 0,
): string {
  if (!Number.isFinite(value)) return '—'

  switch (displayUnit) {
    case 'thousands': return `${fmt(value / 1_000, decimals)}K`
    case 'millions':  return `${fmt(value / 1_000_000, decimals)}M`
    case 'billions':  return `${fmt(value / 1_000_000_000, decimals)}B`
    case 'trillions': return `${fmt(value / 1_000_000_000_000, decimals)}T`

    case 'none':
      return fmt(value, decimals)

    case 'auto':
    default: {
      const abs = Math.abs(value)
      const entry = UNIT_TABLE.find((t) => abs >= t.minAbs)
      if (!entry) return fmt(value, decimals)
      return `${fmt(value / entry.divisor, Math.max(0, decimals))}${entry.suffix}`
    }
  }
}

/**
 * Format a fraction [0, 1] as a percentage string.
 *
 * @param fraction  Value in the range [0, 1]
 * @param decimals  Decimal places (default 1)
 */
export function formatPercent(fraction: number, decimals = 1): string {
  if (!Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(decimals).replace(/\.?0+$/, '')}%`
}
