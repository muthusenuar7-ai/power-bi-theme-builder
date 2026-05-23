import type { SlicerDef } from '@/types'

export const SLICER_DEFS: SlicerDef[] = [
  {
    title: 'Date Range',
    type:  'list',
    items: ['Today', 'This Week', 'This Month', 'This Quarter', 'YTD'],
    sel:   [0, 2],
  },
  {
    title: 'Region',
    type:  'buttons',
    items: ['North', 'South', 'East', 'West'],
    sel:   [0, 2],
  },
  {
    title: 'Category',
    type:  'list',
    items: ['Electronics', 'Clothing', 'Food', 'Sports', 'Home'],
    sel:   [0, 1, 3],
  },
  {
    title: 'Year',
    type:  'dropdown',
    items: ['FY24-25', 'FY23-24', 'FY22-23', 'FY21-22'],
  },
  {
    title: 'Sales Range',
    type:  'slider',
    min:   0,
    max:   100,
  },
]
