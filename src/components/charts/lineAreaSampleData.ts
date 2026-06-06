/**
 * Shared sample datasets for the line / area / combo families.
 *
 * `values` are always shaped [categoryIndex][seriesIndex] to match the
 * lineAreaAdapter / comboAdapter contract. Colours use the live theme palette
 * via the cv() CSS-variable helper so they react to palette changes.
 */
import { cv } from './chartUtils'

export interface SeriesDef {
  name: string
  color: string
}

/* ── Line (multi-series) ─────────────────────────────────────────────── */
export const LINE_CATS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
export const LINE_SERIES: SeriesDef[] = [
  { name: 'Revenue', color: cv(1) },
  { name: 'Cost', color: cv(2) },
]
// [category][series] => [revenue, cost]
export const LINE_VALUES: number[][] = [
  [120, 85],
  [145, 92],
  [132, 88],
  [168, 105],
  [155, 98],
  [190, 115],
]

/* ── Area (single series) ────────────────────────────────────────────── */
export const AREA_CATS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
export const AREA_SERIES: SeriesDef[] = [{ name: 'Sales', color: cv(1) }]
export const AREA_VALUES: number[][] = [[62], [85], [73], [108], [94], [132]]

/* ── Stacked / 100 % stacked area (multi-series, time) ───────────────── */
export const AREA_STACK_CATS = ['Jan 15', 'Apr', 'Jul', 'Oct', 'Jan 16', 'Apr', 'Jul', 'Oct']
export const AREA_STACK_SERIES: SeriesDef[] = [
  { name: 'Bahrain', color: cv(1) },
  { name: 'Kuwait', color: cv(2) },
  { name: 'Qatar', color: cv(3) },
  { name: 'Oman', color: cv(4) },
  { name: 'UAE', color: cv(5) },
  { name: 'Saudi', color: cv(6) },
]
// per-series time values, transposed below into [category][series]
const AREA_STACK_BY_SERIES: number[][] = [
  [0.4, 0.5, 0.6, 0.7, 0.8, 0.8, 0.9, 1.0], // Bahrain
  [0.6, 0.7, 0.8, 1.0, 1.1, 1.2, 1.3, 1.4], // Kuwait
  [0.1, 0.2, 0.2, 0.2, 0.3, 0.3, 0.4, 0.4], // Qatar
  [1.8, 2.0, 2.3, 2.6, 3.0, 3.2, 3.4, 3.6], // Oman
  [4.1, 4.8, 5.5, 6.2, 7.1, 7.8, 8.4, 9.0], // UAE
  [6.3, 7.0, 8.2, 9.0, 10.1, 10.9, 11.6, 12.2], // Saudi
]
export const AREA_STACK_VALUES: number[][] = AREA_STACK_CATS.map((_, ci) =>
  AREA_STACK_BY_SERIES.map((series) => series[ci]),
)

/* ── Combo: clustered columns + line ─────────────────────────────────── */
export const COMBO_CATS = ['Bahrain', 'Kuwait', 'Oman', 'Qatar', 'Saudi', 'UAE']
export const COMBO_CLUSTERED_COLUMNS: SeriesDef[] = [
  { name: '2015', color: cv(1) },
  { name: '2016', color: cv(2) },
]
// [category][series] => [2015, 2016]
export const COMBO_CLUSTERED_COLUMN_VALUES: number[][] = [
  [3, 2],
  [3, 3],
  [8, 9],
  [1, 1],
  [36, 40],
  [28, 32],
]
export const COMBO_CLUSTERED_LINE: SeriesDef[] = [{ name: 'Gross Profit', color: 'var(--combo-line-color, var(--c3))' }]
export const COMBO_CLUSTERED_LINE_VALUES: number[][] = [[2], [2], [8], [1], [34], [27]]

/* ── Combo: stacked columns + line ───────────────────────────────────── */
export const COMBO_STACKED_COLUMNS: SeriesDef[] = [
  { name: 'Capital', color: cv(1) },
  { name: 'Coastal', color: cv(2) },
  { name: 'Interior', color: cv(3) },
  { name: 'Other', color: cv(4) },
]
const COMBO_STACKED_BY_SERIES: number[][] = [
  [3.2, 4.0, 9.6, 1.2, 23.6, 27.8], // Capital
  [1.2, 1.1, 4.2, 0.5, 18.6, 19.3], // Coastal
  [0.4, 0.6, 2.1, 0.2, 17.1, 8.2], // Interior
  [0.2, 0.3, 1.1, 0.1, 16.7, 4.7], // Other
]
export const COMBO_STACKED_COLUMN_VALUES: number[][] = COMBO_CATS.map((_, ci) =>
  COMBO_STACKED_BY_SERIES.map((series) => series[ci]),
)
export const COMBO_STACKED_LINE: SeriesDef[] = [{ name: 'Gross Profit', color: 'var(--combo-line-color, var(--c5))' }]
export const COMBO_STACKED_LINE_VALUES: number[][] = [[2], [3], [8], [1], [34], [27]]
