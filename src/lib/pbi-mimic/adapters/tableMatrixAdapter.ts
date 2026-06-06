export interface TabularColumn {
  id: string
  label: string
  width: number
  align?: 'left' | 'center' | 'right'
}

export interface TabularModel<Row extends Record<string, string | number> = Record<string, string | number>> {
  columns: TabularColumn[]
  rows: Row[]
}

export function createTabularModel<Row extends Record<string, string | number>>(
  model: TabularModel<Row>,
): TabularModel<Row> {
  return model
}
