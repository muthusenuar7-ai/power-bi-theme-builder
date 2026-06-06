/** Shared sample datasets for the bar / column mimic family. */
import { cv } from './chartUtils'

export interface CartesianSeriesDef {
  name: string
  color: string
}

/* ── Single series ── */
export const SINGLE_BAR_CATS = ['Electronics', 'Clothing', 'Food', 'Sports', 'Books']
export const SINGLE_BAR_VALUES: number[][] = [[84], [62], [45], [71], [38]]

export const SINGLE_COLUMN_CATS = ['Q1', 'Q2', 'Q3', 'Q4']
export const SINGLE_COLUMN_VALUES: number[][] = [[142], [185], [162], [208]]

export const SINGLE_SERIES: CartesianSeriesDef[] = [{ name: 'Value', color: cv(1) }]

/* ── Stacked / 100% stacked (bar + column share this dataset) ── */
export const STACKED_CATS = ['Saudi', 'UAE', 'Oman', 'Kuwait', 'Bahrain', 'Qatar']
export const STACKED_SERIES: CartesianSeriesDef[] = [
  { name: 'Groceries', color: cv(1) },
  { name: 'Hotels', color: cv(2) },
  { name: 'Hypermarkets', color: cv(3) },
  { name: 'Supermarkets', color: cv(4) },
]
export const STACKED_VALUES: number[][] = [
  [7, 18, 9, 42],
  [6, 5, 5, 44],
  [2, 3, 4, 8],
  [1, 1.5, 1.5, 2],
  [0.8, 1.2, 1, 2],
  [0.3, 0.4, 0.5, 0.8],
]

/* ── Clustered bar ── */
export const CLUSTERED_BAR_CATS = ['EMEA', 'Americas', 'APAC']
export const CLUSTERED_BAR_SERIES: CartesianSeriesDef[] = [
  { name: '2023', color: cv(1) },
  { name: '2022', color: cv(2) },
]
export const CLUSTERED_BAR_VALUES: number[][] = [[95, 82], [118, 106], [72, 65]]

/* ── Clustered column ── */
export const CLUSTERED_COL_CATS = ['Q1', 'Q2', 'Q3', 'Q4']
export const CLUSTERED_COL_SERIES: CartesianSeriesDef[] = [
  { name: 'Prod A', color: cv(1) },
  { name: 'Prod B', color: cv(2) },
]
export const CLUSTERED_COL_VALUES: number[][] = [[82, 68], [95, 78], [88, 92], [112, 84]]
