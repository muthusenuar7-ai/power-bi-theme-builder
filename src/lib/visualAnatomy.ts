export type VisualOrientation = 'horizontal' | 'vertical' | 'none'
export type AxisRole = 'category' | 'value' | 'time' | 'none'
export type AxisLabelType = 'category' | 'numeric' | 'time' | 'none'
export type GridlineDirection = 'horizontal' | 'vertical' | 'both' | 'none'
export type ShapeRole = 'bars' | 'columns' | 'line' | 'area' | 'slices' | 'funnel' | 'tiles' | 'none'

export interface AxisAnatomy {
  role: AxisRole
  defaultTitle: string
  labelType: AxisLabelType
}

export interface VisualAnatomy {
  id: string
  orientation: VisualOrientation
  xAxis: AxisAnatomy
  yAxis: AxisAnatomy
  gridlineDirection: GridlineDirection
  shapeRole: ShapeRole
}

const NONE_AXIS: AxisAnatomy = {
  role: 'none',
  defaultTitle: '',
  labelType: 'none',
}

function anatomy(
  id: string,
  orientation: VisualOrientation,
  xAxis: AxisAnatomy,
  yAxis: AxisAnatomy,
  gridlineDirection: GridlineDirection,
  shapeRole: ShapeRole,
): VisualAnatomy {
  return { id, orientation, xAxis, yAxis, gridlineDirection, shapeRole }
}

const VALUE_SALES: AxisAnatomy = {
  role: 'value',
  defaultTitle: 'Sum of Sales',
  labelType: 'numeric',
}

const VALUE_REVENUE: AxisAnatomy = {
  role: 'value',
  defaultTitle: 'Revenue',
  labelType: 'numeric',
}

const CATEGORY_COUNTRY: AxisAnatomy = {
  role: 'category',
  defaultTitle: 'Country',
  labelType: 'category',
}

const CATEGORY_MONTH: AxisAnatomy = {
  role: 'time',
  defaultTitle: 'Month',
  labelType: 'time',
}

const HORIZONTAL_BAR = anatomy('horizontalBar', 'horizontal', VALUE_SALES, CATEGORY_COUNTRY, 'vertical', 'bars')
const VERTICAL_COLUMN = anatomy('verticalColumn', 'vertical', CATEGORY_COUNTRY, VALUE_SALES, 'horizontal', 'columns')
const TIME_LINE = anatomy('timeLine', 'vertical', CATEGORY_MONTH, VALUE_SALES, 'horizontal', 'line')
const TIME_AREA = anatomy('timeArea', 'vertical', CATEGORY_MONTH, VALUE_SALES, 'horizontal', 'area')
const COMBO_COLUMN_LINE = anatomy('comboColumnLine', 'vertical', CATEGORY_COUNTRY, VALUE_REVENUE, 'horizontal', 'columns')

export const VISUAL_ANATOMY: Record<string, VisualAnatomy> = {
  bar: HORIZONTAL_BAR,
  stackedbar: HORIZONTAL_BAR,
  clusteredbar: HORIZONTAL_BAR,
  hundredstackedbar: HORIZONTAL_BAR,

  column: VERTICAL_COLUMN,
  clusteredcol: VERTICAL_COLUMN,
  clusteredcolumn: VERTICAL_COLUMN,
  stackedcol: VERTICAL_COLUMN,
  stackedcolumn: VERTICAL_COLUMN,
  hundredstackedcol: VERTICAL_COLUMN,
  hundredstackedcolumn: VERTICAL_COLUMN,

  line: TIME_LINE,
  area: TIME_AREA,
  stackedarea: TIME_AREA,
  hundredstackedarea: TIME_AREA,

  lineclustered: COMBO_COLUMN_LINE,
  lineclusteredcolumn: COMBO_COLUMN_LINE,
  linestacked: COMBO_COLUMN_LINE,
  linestackedcolumn: COMBO_COLUMN_LINE,

  pie: anatomy('pie', 'none', NONE_AXIS, NONE_AXIS, 'none', 'slices'),
  donut: anatomy('donut', 'none', NONE_AXIS, NONE_AXIS, 'none', 'slices'),
  funnel: anatomy('funnel', 'none', NONE_AXIS, NONE_AXIS, 'none', 'funnel'),
  treemap: anatomy('treemap', 'none', NONE_AXIS, NONE_AXIS, 'none', 'tiles'),
  ribbon: anatomy('ribbon', 'vertical', CATEGORY_MONTH, VALUE_SALES, 'horizontal', 'columns'),
}

export const FALLBACK_VISUAL_ANATOMY = HORIZONTAL_BAR

export function getVisualAnatomy(visualId: string | null | undefined): VisualAnatomy {
  if (!visualId) return FALLBACK_VISUAL_ANATOMY
  return VISUAL_ANATOMY[visualId] ?? FALLBACK_VISUAL_ANATOMY
}

export function hasAxes(visualId: string | null | undefined): boolean {
  return getVisualAnatomy(visualId).orientation !== 'none'
}
