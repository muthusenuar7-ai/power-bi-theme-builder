/**
 * Shared types for the Power BI Visual Mimic Engine.
 *
 * All coordinate values use SVG viewBox units (e.g. 240 × 126 for chart cards).
 * No React imports — these types are pure data structures.
 */

/* ── Geometry primitives ─────────────────────────────────────────────── */

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface Point {
  x: number
  y: number
}

/* ── Legend ──────────────────────────────────────────────────────────── */

/**
 * All PBI legend position strings as they appear in visualFormatSchema.ts
 * LEGEND_POSITIONS and Power BI's own UI.
 */
export type LegendPosition =
  | 'Top left'
  | 'Top center'
  | 'Top right'
  | 'Top left stacked'
  | 'Top right stacked'
  | 'Center left'
  | 'Center right'
  | 'Bottom left'
  | 'Bottom center'
  | 'Bottom right'
  | 'None'

/** Reduced four-way side used internally by layout functions */
export type LegendSide = 'top' | 'bottom' | 'left' | 'right' | 'none'

/** Whether items run side-by-side or are stacked vertically */
export type LegendDirection = 'horizontal' | 'vertical'

/** Horizontal alignment of the legend block within its reserved strip */
export type LegendAlignment = 'left' | 'center' | 'right'

/** One item in a legend */
export interface LegendItem {
  label: string
  color: string
}

/** Return value of `computeLegendLayout` */
export interface LegendLayoutResult {
  /** False → legend is hidden; all other values are zero/default */
  visible: boolean
  /** Remaining area available to the chart after legend is reserved */
  plotRect: Rect
  /** Bounding box of the entire legend block */
  legendRect: Rect
  side: LegendSide
  direction: LegendDirection
  alignment: LegendAlignment
  /** Width of one horizontal legend item (icon + gap + text) */
  itemWidth: number
  /** Height of one legend row */
  itemHeight: number
  /** Items rendered per row (≥1) */
  itemsPerRow: number
}

/* ── Container ───────────────────────────────────────────────────────── */

export interface PaddingRect {
  top: number
  right: number
  bottom: number
  left: number
}

/** Options for computing the container layout */
export interface VisualChromeOptions {
  /** Height to reserve inside the SVG for a title row (0 if rendered in HTML) */
  titleH?: number
  /** Height to reserve inside the SVG for a subtitle row */
  subtitleH?: number
  /** Outer padding inside the viewBox */
  padding?: PaddingRect
}

/** Return value of `computeContainerLayout` */
export interface ContainerLayoutResult {
  /** Full viewBox rectangle: {x:0, y:0, w:vw, h:vh} */
  outerRect: Rect
  /** Title row (zero-height when title is rendered outside SVG) */
  titleRect: Rect
  /** Subtitle row (zero-height when subtitle is rendered outside SVG) */
  subtitleRect: Rect
  /**
   * Available inner area after outer padding and title/subtitle rows.
   * This is the input to `computeLegendLayout`.
   */
  innerRect: Rect
}

/* ── Axes ────────────────────────────────────────────────────────────── */

/** Options for one axis (x or y) */
export interface AxisOptions {
  show: boolean
  showLabels: boolean
  labelFontSize: number
  labelColor: string
  /** 0 = horizontal labels, 45 = diagonal, 90 = vertical */
  labelAngle?: number
  showTitle: boolean
  titleText: string
  titleFontSize: number
  titleColor: string
  /** Category labels for a discrete axis */
  categories?: string[]
  /** Value range for a numeric axis (engine auto-calculates if omitted) */
  min?: number
  max?: number
  step?: number
}

/** One gridline / tick position computed by the axis engine */
export interface GridTick {
  value: number
  /** SVG coordinate position */
  pos: number
  label: string
}

/** Return value of `computeAxisLayout` */
export interface AxisLayoutResult {
  /** Reduced plot area after axis space is reserved */
  plotRect: Rect
  /** Rectangle reserved for x-axis labels + title */
  xAxisRect: Rect
  /** Rectangle reserved for y-axis labels + title */
  yAxisRect: Rect
  /** Category band midpoints on the x-axis */
  xPositions: Array<{ label: string; x: number; bandLeft: number; bandWidth: number }>
  /** Horizontal gridline ticks on the y-axis */
  yGridlines: GridTick[]
  /** SVG y-coordinate of the x-axis baseline */
  xAxisLineY: number
  /** SVG x-coordinate of the y-axis baseline */
  yAxisLineX: number
}

/* ── Data labels ─────────────────────────────────────────────────────── */

export type DataLabelPosition =
  | 'inside-end'
  | 'inside-center'
  | 'inside-base'
  | 'outside-end'
  | 'outside-leader'   // pie / donut leader-line style

/** Fully resolved label point for a pie / donut slice */
export interface PieLabelPoint {
  sliceIdx: number
  isRight: boolean
  /** Point on the circle edge */
  edgeX: number
  edgeY: number
  /** Leader line bend point (overlap-resolved, clamped to plot area) */
  bendX: number
  bendY: number
  /** Horizontal end of the elbow line (text anchor side) */
  lineEndX: number
  /** Text anchor position */
  textX: number
  textY: number
  anchor: 'start' | 'end'
}

/** Fully resolved label point for a bar / column segment */
export interface BarLabelPoint {
  barIdx: number
  seriesIdx: number
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
  baseline: 'auto' | 'hanging' | 'middle'
}

/* ── Number formatting ───────────────────────────────────────────────── */

export type DisplayUnit =
  | 'auto'
  | 'none'
  | 'thousands'
  | 'millions'
  | 'billions'
  | 'trillions'

/* ── Visual kinds ─────────────────────────────────────────────────────── */

export type VisualKind =
  | 'bar'
  | 'clusteredBar'
  | 'stackedBar'
  | 'hundredPercentBar'
  | 'column'
  | 'clusteredColumn'
  | 'stackedColumn'
  | 'hundredPercentColumn'
  | 'lineClustered'
  | 'lineStacked'
  | 'line'
  | 'area'
  | 'stackedArea'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'funnel'
  | 'waterfall'
  | 'treemap'
  | 'ribbon'
  | 'table'
  | 'matrix'
  | 'card'
  | 'kpi'

/* ── Resolved theme ──────────────────────────────────────────────────── */

/** Theme resolved for a specific pie / donut visual from formatProps */
export interface ResolvedPieTheme {
  fontFamily: string
  dataColors: string[]

  /* Legend */
  legendShow: boolean
  legendPosition: string
  legendFontSize: number
  legendColor: string
  legendTitleShow: boolean
  legendTitleText: string
  legendTextShow: boolean
  legendFontFamily: string
  legendFontWeight: number
  legendFontStyle: string
  legendTextDecoration: string
  legendTitleColor: string
  legendTitleFontSize: number
  legendTitleFontFamily: string
  legendTitleFontWeight: number
  legendTitleFontStyle: string
  legendTitleTextDecoration: string

  /* Detail labels */
  labelsShow: boolean
  labelsFontSize: number
  labelsColor: string
  labelsStyle: string
  labelsFontFamily: string
  labelsFontWeight: number
  labelsFontStyle: string
  labelsTextDecoration: string
  labelsDisplayUnits: string
  labelsDecimals: string

  /* Shape */
  sliceOpacity: number
  sliceBorderShow: boolean
  sliceBorderColor: string
  sliceBorderWidth: number
}

/** Minimal resolved theme used by the visual mimic engine internally */
export interface VisualMimicTheme {
  dataColors: string[]
  fontFamily: string
  background: string
  foreground: string
  gridlineColor: string
  axisColor: string
  labelColor: string
}
