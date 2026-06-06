import type { FormatValue, PowerBIColorObject, PowerBITheme, ThemeState } from '@/types'
import {
  normalizeDonutInnerRadiusRatio,
  normalizeDropShadowPosition,
  normalizeGridlineStyle,
  normalizeOutlineStyle,
  normalizePieLabelPosition,
  normalizeTreemapTilingMethod,
} from '@/lib/powerBIThemeValueNormalizer'
import { resolveEffectiveFormat } from '@/lib/effectiveFormatResolver'

export type VisualStyleCards = Record<string, Array<Record<string, unknown>>>

const HEX_3 = /^#?([0-9a-fA-F]{3})$/
const HEX_6 = /^#?([0-9a-fA-F]{6})$/

const DATA_UNIT_MAP: Record<string, number> = {
  none: 1,
  thousands: 1000,
  millions: 1000000,
  billions: 1000000000,
  trillions: 1000000000000,
}

export const EXPORTED_VISUAL_TYPES = [
  'page',
  '*',
  'barChart',
  'clusteredBarChart',
  'hundredPercentStackedBarChart',
  'columnChart',
  'clusteredColumnChart',
  'hundredPercentStackedColumnChart',
  'lineChart',
  'areaChart',
  'stackedAreaChart',
  'hundredPercentStackedAreaChart',
  'lineClusteredColumnComboChart',
  'lineStackedColumnComboChart',
  'ribbonChart',
  'waterfallChart',
  'scatterChart',
  'funnel',
  'pieChart',
  'donutChart',
  'treemap',
  'card',
  'cardVisual',
  'multiRowCard',
  'tableEx',
  'pivotTable',
  'slicer',
] as const

type FormatProps = Record<string, FormatValue>

interface MapperContext {
  fp: FormatProps
  bg: string
  outspaceBackground: string
  fg: string
  primary: string
  accent: string
  tableAccent: string
  good: string
  neutral: string
  bad: string
  visualBackground: string
  borderColor: string
  gridlineColor: string
  titleColor: string
  titleBackground: string
  labelColor: string
  dividerColor: string
  highlight: string
  tooltipBackground: string
  tableHeaderBackground: string
  tableRowAlt: string
  fontFace: string
  titleSize: number
  subtitleSize: number
  labelSize: number
  headerSize: number
  calloutSize: number
  backgroundEnabled: boolean
  backgroundTransparency: number
  borderEnabled: boolean
  borderWidth: number
  borderRadius: number
  shadowEnabled: boolean
  shadowColor: string
  titleEnabled: boolean
  subtitleEnabled: boolean
}

export function normalizeHex(value: unknown, fallback = '#000000'): string {
  if (typeof value !== 'string') return fallback

  const raw = value.trim()
  const shortMatch = raw.match(HEX_3)
  if (shortMatch) {
    return `#${shortMatch[1].split('').map((char) => char + char).join('')}`.toUpperCase()
  }

  const longMatch = raw.match(HEX_6)
  if (longMatch) return `#${longMatch[1]}`.toUpperCase()

  return fallback
}

export function solidColor(value: unknown, fallback = '#000000'): PowerBIColorObject {
  return { solid: { color: normalizeHex(value, fallback) } }
}

function boolOf(fp: FormatProps, key: string, fallback: boolean): boolean {
  const value = fp[key]
  return typeof value === 'boolean' ? value : fallback
}

function firstBool(fp: FormatProps, keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const value = fp[key]
    if (typeof value === 'boolean') return value
  }
  return fallback
}

function numOf(fp: FormatProps, key: string, fallback: number): number {
  const value = fp[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function firstNum(fp: FormatProps, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = fp[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

function strOf(fp: FormatProps, key: string, fallback: string): string {
  const value = fp[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function optionalStr(fp: FormatProps, key: string): string | undefined {
  const value = fp[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function firstStr(fp: FormatProps, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = optionalStr(fp, key)
    if (value) return value
  }
  return fallback
}

function colorOf(fp: FormatProps, key: string, fallback: string): string {
  return normalizeHex(fp[key], fallback)
}

function firstColor(fp: FormatProps, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = fp[key]
    if (typeof value === 'string' && value.trim()) return normalizeHex(value, fallback)
  }
  return fallback
}

function cleanObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null),
  ) as T
}

function dataUnit(value: string): number | undefined {
  return DATA_UNIT_MAP[value.trim().toLowerCase()]
}

function decimalPlaces(value: string): number | undefined {
  const normalized = value.trim().toLowerCase()
  if (!normalized || normalized === 'auto') return undefined
  const parsed = Number.parseInt(normalized, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function legendPosition(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('top') && normalized.includes('center')) return 'TopCenter'
  if (normalized.includes('top') && normalized.includes('right')) return 'TopRight'
  if (normalized.includes('top') && normalized.includes('left')) return 'TopLeft'
  if (normalized.includes('bottom') && normalized.includes('center')) return 'BottomCenter'
  if (normalized.includes('bottom') && normalized.includes('right')) return 'BottomRight'
  if (normalized.includes('bottom') && normalized.includes('left')) return 'BottomLeft'
  if (normalized.includes('center') && normalized.includes('right')) return 'RightCenter'
  if (normalized.includes('center') && normalized.includes('left')) return 'LeftCenter'
  if (normalized === 'right') return 'Right'
  if (normalized === 'left') return 'Left'
  if (normalized === 'bottom') return 'Bottom'
  return 'Top'
}

function textAlignment(value: unknown): string {
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : 'left'
  if (normalized === 'center') return 'center'
  if (normalized === 'right') return 'right'
  return 'left'
}

function gridlineStyle(value: string): { gridlineStyle: string; gridlineDashArray: string } {
  const normalized = normalizeGridlineStyle(value)
  if (normalized === 'dotted') return { gridlineStyle: normalized, gridlineDashArray: '1 3' }
  if (normalized === 'dashed') return { gridlineStyle: normalized, gridlineDashArray: '4 3' }
  return { gridlineStyle: normalized, gridlineDashArray: '' }
}

function visualBackgroundCard(ctx: MapperContext): Record<string, unknown> {
  return {
    show: ctx.backgroundEnabled,
    color: solidColor(ctx.visualBackground),
    transparency: ctx.backgroundTransparency,
  }
}

function visualBorderCard(ctx: MapperContext): Record<string, unknown> {
  return cleanObject({
    show: ctx.borderEnabled,
    color: solidColor(ctx.borderColor),
    width: ctx.borderWidth,
    radius: ctx.borderRadius,
  })
}

function buildContext(state: ThemeState): MapperContext {
  const fp = state.formatProps
  const fg = normalizeHex(state.fg, '#252423')
  const effective = resolveEffectiveFormat(state)
  const bg = effective.canvasBackground
  const primary = normalizeHex(state.primary, '#0D9488')
  const fontFace = firstStr(fp, ['general.typography.fontFace', 'general.title.fontFamily'], 'Segoe UI')

  return {
    fp,
    bg,
    outspaceBackground: effective.outspaceBackground,
    fg: effective.foreground,
    primary,
    accent: normalizeHex(state.accent, '#3B82F6'),
    tableAccent: normalizeHex(state.tableAccent, primary),
    good: normalizeHex(state.good, '#10B981'),
    neutral: normalizeHex(state.neutral, '#F59E0B'),
    bad: normalizeHex(state.bad, '#EF4444'),
    visualBackground: effective.visualBackgroundColor,
    borderColor: effective.borderColor,
    gridlineColor: normalizeHex(state.gridlineColor, effective.gridlineColor),
    titleColor: effective.titleColor,
    titleBackground: effective.titleBackgroundColor,
    labelColor: effective.labelColor,
    dividerColor: normalizeHex(state.dividerColor, effective.gridlineColor),
    highlight: normalizeHex(state.highlight, normalizeHex(state.accent, primary)),
    tooltipBackground: normalizeHex(state.tooltipBackground, effective.visualBackgroundColor),
    tableHeaderBackground: normalizeHex(state.tableHeaderBackground, effective.tableHeaderBackground),
    tableRowAlt: normalizeHex(state.tableRowAlt, effective.tableRowAlt),
    fontFace,
    titleSize: effective.titleFontSize,
    subtitleSize: effective.subtitleFontSize,
    labelSize: numOf(fp, 'general.label.fontSize', 10),
    headerSize: numOf(fp, 'general.header.fontSize', 12),
    calloutSize: numOf(fp, 'general.callout.fontSize', 36),
    backgroundEnabled: effective.backgroundEnabled,
    backgroundTransparency: effective.backgroundTransparency,
    borderEnabled: effective.borderEnabled,
    borderWidth: effective.borderWidth,
    borderRadius: effective.borderRadius,
    shadowEnabled: effective.shadowEnabled,
    shadowColor: effective.shadowColor,
    titleEnabled: effective.titleEnabled,
    subtitleEnabled: effective.subtitleEnabled,
  }
}

function generalCards(ctx: MapperContext): VisualStyleCards {
  const titleText = optionalStr(ctx.fp, 'general.title.text')
  const subtitleText = optionalStr(ctx.fp, 'general.subtitle.text')

  return {
    background: [
      visualBackgroundCard(ctx),
    ],
    border: [
      visualBorderCard(ctx),
    ],
    dropShadow: [
      {
        show: ctx.shadowEnabled,
        color: solidColor(ctx.shadowColor),
        transparency: numOf(ctx.fp, 'general.shadow.transparency', 80),
        shadowBlur: numOf(ctx.fp, 'general.shadow.blur', 6),
        shadowDistance: Math.max(0, Math.abs(numOf(ctx.fp, 'general.shadow.offsetY', 2))),
        position: normalizeDropShadowPosition(strOf(ctx.fp, 'general.shadow.position', 'Outer')),
      },
    ],
    title: [
      cleanObject({
        show: ctx.titleEnabled,
        text: titleText,
        fontColor: solidColor(ctx.titleColor),
        fontFamily: firstStr(ctx.fp, ['general.title.fontFamily', 'general.typography.fontFace'], ctx.fontFace),
        fontSize: ctx.titleSize,
        bold: boolOf(ctx.fp, 'general.title.fontBold', true),
        italic: boolOf(ctx.fp, 'general.title.fontItalic', false),
        underline: boolOf(ctx.fp, 'general.title.fontUnderline', false),
        alignment: textAlignment(ctx.fp['general.title.alignment']),
        background: solidColor(ctx.titleBackground),
      }),
    ],
    subTitle: [
      cleanObject({
        show: ctx.subtitleEnabled,
        text: subtitleText,
        fontColor: solidColor(firstColor(ctx.fp, ['general.subtitle.fontColor', 'general.title.subtitle.fontColor'], ctx.labelColor)),
        fontFamily: firstStr(ctx.fp, ['general.subtitle.fontFamily', 'general.title.subtitle.font.family', 'general.typography.fontFace'], ctx.fontFace),
        fontSize: ctx.subtitleSize,
        bold: firstBool(ctx.fp, ['general.subtitle.fontBold', 'general.title.subtitle.fontStyle.bold'], false),
        italic: firstBool(ctx.fp, ['general.subtitle.fontItalic', 'general.title.subtitle.fontStyle.italic'], false),
        underline: firstBool(ctx.fp, ['general.subtitle.fontUnderline', 'general.title.subtitle.fontStyle.underline'], false),
        alignment: textAlignment(firstStr(ctx.fp, ['general.subtitle.alignment', 'general.title.subtitle.alignment'], 'Left')),
      }),
    ],
    visualHeader: [
      {
        show: boolOf(ctx.fp, 'general.headerIcons.show', true),
        foreground: solidColor(colorOf(ctx.fp, 'general.headerIcons.color', ctx.labelColor)),
        background: solidColor(colorOf(ctx.fp, 'general.headerIcons.background', ctx.visualBackground)),
        border: solidColor(ctx.borderColor),
        transparency: numOf(ctx.fp, 'general.headerIcons.transparency', 0),
      },
    ],
    visualTooltip: [
      {
        show: boolOf(ctx.fp, 'general.tooltip.show', true),
        fontFamily: ctx.fontFace,
        fontSize: numOf(ctx.fp, 'general.tooltip.fontSize', ctx.labelSize),
        titleFontColor: solidColor(ctx.titleColor),
        valueFontColor: solidColor(ctx.fg),
        background: solidColor(ctx.tooltipBackground),
      },
    ],
  }
}

function pageCards(ctx: MapperContext): VisualStyleCards {
  return {
    background: [
      {
        color: solidColor(ctx.bg),
        transparency: 0,
      },
    ],
    outspace: [
      {
        color: solidColor(ctx.outspaceBackground),
        transparency: 0,
      },
    ],
  }
}

function legendCard(scope: string, ctx: MapperContext): Record<string, unknown> {
  return cleanObject({
    show: boolOf(ctx.fp, `${scope}.legend.show`, true),
    position: legendPosition(strOf(ctx.fp, `${scope}.legend.position`, 'Top')),
    showTitle: boolOf(ctx.fp, `${scope}.legend.title.show`, true),
    titleText: optionalStr(ctx.fp, `${scope}.legend.titleText`),
    labelColor: solidColor(firstColor(ctx.fp, [`${scope}.legend.text.color`], ctx.labelColor)),
    fontFamily: strOf(ctx.fp, `${scope}.legend.text.font.family`, ctx.fontFace),
    fontSize: firstNum(ctx.fp, [`${scope}.legend.text.font.size`], ctx.labelSize),
    bold: boolOf(ctx.fp, `${scope}.legend.text.fontStyle.bold`, false),
    italic: boolOf(ctx.fp, `${scope}.legend.text.fontStyle.italic`, false),
    underline: boolOf(ctx.fp, `${scope}.legend.text.fontStyle.underline`, false),
  })
}

function axisCard(
  scope: string,
  axisId: 'xAxis' | 'yAxis',
  ctx: MapperContext,
  options: { role: 'category' | 'value'; includeGridlines: boolean; allowSwitch?: boolean; allowConcatenate?: boolean },
): Record<string, unknown> {
  const labelColor = colorOf(ctx.fp, `${scope}.${axisId}.color`, ctx.labelColor)
  const titleText = optionalStr(ctx.fp, `${scope}.${axisId}.titleText`)
  const unit = dataUnit(strOf(ctx.fp, `${scope}.${axisId}.values.displayUnits`, 'Auto'))
  const precision = decimalPlaces(strOf(ctx.fp, `${scope}.${axisId}.values.valueDecimals`, 'Auto'))
  const style = gridlineStyle(strOf(ctx.fp, `${scope}.gridlines.vertical.lineStyle`, strOf(ctx.fp, `${scope}.gridlines.horizontal.lineStyle`, 'Solid')))
  const gridDirection = strOf(ctx.fp, `${scope}.gridlines.vertical.color`, '') ? 'vertical' : 'horizontal'
  const gridPrefix = `${scope}.gridlines.${gridDirection}`

  return cleanObject({
    show: boolOf(ctx.fp, `${scope}.${axisId}.show`, true),
    labelColor: solidColor(labelColor),
    fontFamily: strOf(ctx.fp, `${scope}.${axisId}.values.font.family`, ctx.fontFace),
    fontSize: firstNum(ctx.fp, [`${scope}.${axisId}.values.font.size`], ctx.labelSize),
    bold: boolOf(ctx.fp, `${scope}.${axisId}.values.fontStyle.bold`, false),
    italic: boolOf(ctx.fp, `${scope}.${axisId}.values.fontStyle.italic`, false),
    underline: boolOf(ctx.fp, `${scope}.${axisId}.values.fontStyle.underline`, false),
    labelDisplayUnits: unit,
    labelPrecision: precision,
    showAxisTitle: boolOf(ctx.fp, `${scope}.${axisId}.title.show`, true),
    titleText: titleText && titleText.toLowerCase() !== 'auto' ? titleText : undefined,
    titleColor: solidColor(firstColor(ctx.fp, [`${scope}.${axisId}.title.color`, `${scope}.${axisId}.color`], labelColor)),
    titleFontFamily: strOf(ctx.fp, `${scope}.${axisId}.title.font.family`, ctx.fontFace),
    titleFontSize: firstNum(ctx.fp, [`${scope}.${axisId}.title.font.size`], ctx.titleSize),
    titleBold: boolOf(ctx.fp, `${scope}.${axisId}.title.fontStyle.bold`, true),
    titleItalic: boolOf(ctx.fp, `${scope}.${axisId}.title.fontStyle.italic`, false),
    titleUnderline: boolOf(ctx.fp, `${scope}.${axisId}.title.fontStyle.underline`, false),
    concatenateLabels: options.role === 'category' && options.allowConcatenate !== false
      ? boolOf(ctx.fp, `${scope}.${axisId}.values.concatenateLabels`, false)
      : undefined,
    switchAxisPosition: options.allowSwitch ? boolOf(ctx.fp, `${scope}.${axisId}.values.switchAxisPosition`, false) : undefined,
    maxMarginFactor: options.role === 'category'
      ? firstNum(ctx.fp, [`${scope}.${axisId}.values.maximumWidth`, `${scope}.${axisId}.values.maximumHeight`], 25)
      : undefined,
    gridlineShow: options.includeGridlines ? boolOf(ctx.fp, `${gridPrefix}.show`, true) : undefined,
    gridlineColor: options.includeGridlines ? solidColor(firstColor(ctx.fp, [`${scope}.plotArea.gridColor`, `${gridPrefix}.color`], ctx.gridlineColor)) : undefined,
    gridlineTransparency: options.includeGridlines ? numOf(ctx.fp, `${gridPrefix}.transparency`, 0) : undefined,
    gridlineStyle: options.includeGridlines ? style.gridlineStyle : undefined,
    gridlineDashArray: options.includeGridlines ? style.gridlineDashArray : undefined,
    gridlineThickness: options.includeGridlines ? firstNum(ctx.fp, [`${gridPrefix}.width`], 1) : undefined,
  })
}

function labelCard(scope: string, ctx: MapperContext): Record<string, unknown> {
  const unit = dataUnit(firstStr(ctx.fp, [`${scope}.value.displayUnits`, `${scope}.values.displayUnits`, `${scope}.displayUnits`], 'Auto'))
  const precision = decimalPlaces(firstStr(ctx.fp, [`${scope}.value.valueDecimals`, `${scope}.values.valueDecimals`, `${scope}.valueDecimals`], 'Auto'))

  return cleanObject({
    show: boolOf(ctx.fp, `${scope}.show`, true),
    color: solidColor(firstColor(ctx.fp, [`${scope}.color`, `${scope}.values.color`], ctx.fg)),
    fontFamily: firstStr(ctx.fp, [`${scope}.value.font.family`, `${scope}.values.font.family`], ctx.fontFace),
    fontSize: firstNum(ctx.fp, [`${scope}.fontSize`, `${scope}.value.font.size`, `${scope}.values.font.size`], ctx.labelSize),
    bold: boolOf(ctx.fp, `${scope}.value.fontStyle.bold`, boolOf(ctx.fp, `${scope}.values.fontStyle.bold`, false)),
    italic: boolOf(ctx.fp, `${scope}.value.fontStyle.italic`, boolOf(ctx.fp, `${scope}.values.fontStyle.italic`, false)),
    underline: boolOf(ctx.fp, `${scope}.value.fontStyle.underline`, boolOf(ctx.fp, `${scope}.values.fontStyle.underline`, false)),
    labelDisplayUnits: unit,
    labelPrecision: precision,
    labelPosition: optionalStr(ctx.fp, `${scope}.position`),
    labelOrientation: strOf(ctx.fp, `${scope}.orientation`, 'Horizontal').toLowerCase() === 'vertical' ? 1 : undefined,
  })
}

function pieLabelCard(scope: 'pie' | 'donut', ctx: MapperContext): Record<string, unknown> {
  const prefix = `${scope}.detailLabels`
  return cleanObject({
    show: boolOf(ctx.fp, `${prefix}.show`, true),
    color: solidColor(firstColor(ctx.fp, [`${prefix}.color`, `${prefix}.values.color`], ctx.fg)),
    fontFamily: firstStr(ctx.fp, [`${prefix}.values.font.family`], ctx.fontFace),
    fontSize: firstNum(ctx.fp, [`${prefix}.values.font.size`, `${prefix}.fontSize`], ctx.labelSize),
    bold: boolOf(ctx.fp, `${prefix}.values.fontStyle.bold`, false),
    italic: boolOf(ctx.fp, `${prefix}.values.fontStyle.italic`, false),
    underline: boolOf(ctx.fp, `${prefix}.values.fontStyle.underline`, false),
    labelStyle: strOf(ctx.fp, `${prefix}.labelStyle`, 'Data value, percent of total'),
    labelDisplayUnits: dataUnit(strOf(ctx.fp, `${prefix}.displayUnits`, 'Auto')),
    labelPrecision: decimalPlaces(strOf(ctx.fp, `${prefix}.valueDecimals`, 'Auto')),
    percentageLabelPrecision: decimalPlaces(strOf(ctx.fp, `${prefix}.percentDecimals`, 'Auto')),
    position: normalizePieLabelPosition(strOf(ctx.fp, `${prefix}.position`, 'outside')),
  })
}

function dataPointCard(ctx: MapperContext, fill: string, shapePrefix: string): Record<string, unknown> {
  return cleanObject({
    defaultColor: solidColor(fill),
    fill: solidColor(fill),
    fillTransparency: numOf(ctx.fp, `${shapePrefix}.color.transparency`, 0),
    borderShow: boolOf(ctx.fp, `${shapePrefix}.border.show`, false),
    borderColor: solidColor(colorOf(ctx.fp, `${shapePrefix}.border.color`, '#C8C6C4')),
    borderSize: firstNum(ctx.fp, [`${shapePrefix}.border.width`], 1),
    borderTransparency: numOf(ctx.fp, `${shapePrefix}.border.transparency`, 0),
  })
}

function cartesianCards(ctx: MapperContext, orientation: 'horizontal' | 'vertical'): VisualStyleCards {
  const shapePrefix = orientation === 'horizontal' ? 'bar.bars' : 'bar.columns'
  const shapeColor = firstColor(ctx.fp, [`${shapePrefix}.color.color`, `${shapePrefix}.color.fill`], ctx.primary)
  const labels = labelCard('bar.dataLabels', ctx)

  return {
    legend: [legendCard('bar', ctx)],
    categoryAxis: [axisCard('bar', orientation === 'horizontal' ? 'yAxis' : 'xAxis', ctx, { role: 'category', includeGridlines: false, allowSwitch: true })],
    valueAxis: [axisCard('bar', orientation === 'horizontal' ? 'xAxis' : 'yAxis', ctx, { role: 'value', includeGridlines: true, allowSwitch: orientation === 'vertical' })],
    labels: [labels],
    dataPoint: [dataPointCard(ctx, shapeColor, shapePrefix)],
    zoom: [
      {
        show: boolOf(ctx.fp, 'bar.zoomSlider.show', false),
        showOnCategoryAxis: orientation === 'vertical',
        showOnValueAxis: orientation === 'horizontal',
      },
    ],
  }
}

function lineCards(ctx: MapperContext): VisualStyleCards {
  const labels = labelCard('bar.dataLabels', ctx)
  return {
    legend: [legendCard('bar', ctx)],
    categoryAxis: [axisCard('bar', 'xAxis', ctx, { role: 'category', includeGridlines: false, allowSwitch: false, allowConcatenate: false })],
    valueAxis: [axisCard('bar', 'yAxis', ctx, { role: 'value', includeGridlines: true, allowSwitch: true })],
    labels: [labels],
    dataPoint: [{ defaultColor: solidColor(ctx.primary), showAllDataPoints: true }],
    lineStyles: [
      {
        strokeColor: solidColor(firstColor(ctx.fp, ['bar.lines.color.color'], ctx.primary)),
        markerColor: solidColor(ctx.accent),
        showMarker: boolOf(ctx.fp, 'bar.markers.show', true),
      },
    ],
  }
}

function comboLineCards(ctx: MapperContext): VisualStyleCards {
  return {
    legend: [legendCard('bar', ctx)],
    categoryAxis: [axisCard('bar', 'xAxis', ctx, { role: 'category', includeGridlines: false, allowSwitch: false, allowConcatenate: false })],
    valueAxis: [axisCard('bar', 'yAxis', ctx, { role: 'value', includeGridlines: true, allowSwitch: true })],
    labels: [labelCard('bar.dataLabels', ctx)],
    dataPoint: [
      dataPointCard(ctx, firstColor(ctx.fp, ['bar.columns.color.color', 'bar.columns.color.fill'], ctx.primary), 'bar.columns'),
    ],
    lineStyles: [
      {
        markerColor: solidColor(ctx.accent),
        showMarker: boolOf(ctx.fp, 'bar.markers.show', true),
      },
    ],
  }
}

function waterfallCards(ctx: MapperContext): VisualStyleCards {
  return {
    legend: [legendCard('bar', ctx)],
    categoryAxis: [axisCard('bar', 'xAxis', ctx, { role: 'category', includeGridlines: false, allowSwitch: false, allowConcatenate: false })],
    valueAxis: [axisCard('bar', 'yAxis', ctx, { role: 'value', includeGridlines: true, allowSwitch: false })],
    labels: [labelCard('bar.dataLabels', ctx)],
    sentimentColors: [
      {
        increaseFill: solidColor(ctx.good),
        decreaseFill: solidColor(ctx.bad),
        totalFill: solidColor(ctx.primary),
        otherFill: solidColor(ctx.neutral),
      },
    ],
  }
}

function scatterCards(ctx: MapperContext): VisualStyleCards {
  return {
    legend: [legendCard('bar', ctx)],
    categoryAxis: [axisCard('bar', 'xAxis', ctx, { role: 'value', includeGridlines: false, allowSwitch: false })],
    valueAxis: [axisCard('bar', 'yAxis', ctx, { role: 'value', includeGridlines: true, allowSwitch: true })],
    dataPoint: [{ defaultColor: solidColor(ctx.primary), fill: solidColor(ctx.primary), showAllDataPoints: true }],
    markers: [
      {
        borderColor: solidColor(ctx.borderColor),
        borderShow: boolOf(ctx.fp, 'bar.bars.border.show', false),
        borderWidth: firstNum(ctx.fp, ['bar.bars.border.width'], 1),
      },
    ],
    zoom: [
      {
        show: boolOf(ctx.fp, 'bar.zoomSlider.show', false),
        showOnCategoryAxis: true,
        showOnValueAxis: true,
      },
    ],
  }
}

function pieCards(scope: 'pie' | 'donut', ctx: MapperContext): VisualStyleCards {
  const fill = firstColor(ctx.fp, [`${scope}.slices.color.fill`, `${scope}.slices.color.color`], ctx.primary)
  return {
    legend: [legendCard(scope, ctx)],
    labels: [pieLabelCard(scope, ctx)],
    dataPoint: [dataPointCard(ctx, fill, `${scope}.slices`)],
    slices: [
      cleanObject({
        startAngle: numOf(ctx.fp, `${scope}.slices.rotation`, 0),
        innerRadiusRatio: scope === 'donut'
          ? normalizeDonutInnerRadiusRatio(numOf(ctx.fp, `${scope}.donutShape.innerRadius`, 60))
          : undefined,
      }),
    ],
  }
}

function funnelCards(ctx: MapperContext): VisualStyleCards {
  const fill = colorOf(ctx.fp, 'funnel.colors.default.default', ctx.primary)
  return {
    labels: [labelCard('bar.dataLabels', ctx)],
    dataPoint: [
      {
        defaultColor: solidColor(fill),
        fill: solidColor(fill),
        showAllDataPoints: true,
      },
    ],
  }
}

function treemapCards(ctx: MapperContext): VisualStyleCards {
  const label = labelCard('treemap.dataLabels', ctx)
  return {
    legend: [legendCard('treemap', ctx)],
    labels: [label],
    categoryLabels: [
      {
        show: boolOf(ctx.fp, 'treemap.categoryLabels.show', true),
        color: solidColor(firstColor(ctx.fp, ['treemap.categoryLabels.values.color', 'treemap.categoryLabels.color'], ctx.fg)),
        fontFamily: firstStr(ctx.fp, ['treemap.categoryLabels.values.font.family'], ctx.fontFace),
        fontSize: firstNum(ctx.fp, ['treemap.categoryLabels.values.font.size'], ctx.labelSize),
        bold: boolOf(ctx.fp, 'treemap.categoryLabels.values.fontStyle.bold', false),
        italic: boolOf(ctx.fp, 'treemap.categoryLabels.values.fontStyle.italic', false),
        underline: boolOf(ctx.fp, 'treemap.categoryLabels.values.fontStyle.underline', false),
      },
    ],
    dataPoint: [
      {
        fill: solidColor(firstColor(ctx.fp, ['treemap.colors.advanced.usa'], ctx.primary)),
      },
    ],
    layout: [
      {
        tilingMethod: normalizeTreemapTilingMethod(strOf(ctx.fp, 'treemap.layout.layout.tilingMethod', 'stableSquarified')),
        innerPadding: numOf(ctx.fp, 'treemap.layout.layout.nodeSpacing', 0),
        outerPadding: numOf(ctx.fp, 'treemap.layout.layout.groupSpacing', 0),
      },
    ],
  }
}

function cardCards(ctx: MapperContext): VisualStyleCards {
  return {
    labels: [
      {
        color: solidColor(ctx.primary),
        fontFamily: ctx.fontFace,
        fontSize: ctx.calloutSize,
      },
    ],
    categoryLabels: [
      {
        show: true,
        color: solidColor(ctx.labelColor),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
      },
    ],
    wordWrap: [{ show: true }],
  }
}

function cardVisualCards(ctx: MapperContext): VisualStyleCards {
  return {
    value: [
      {
        show: true,
        fontColor: solidColor(ctx.primary),
        fontFamily: ctx.fontFace,
        fontSize: ctx.calloutSize,
      },
    ],
    label: [
      {
        show: true,
        fontColor: solidColor(ctx.labelColor),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
      },
    ],
    fillCustom: [
      {
        show: true,
        fillColor: solidColor(ctx.visualBackground),
        transparency: numOf(ctx.fp, 'general.background.transparency', 0),
      },
    ],
    outline: [
      {
        show: boolOf(ctx.fp, 'general.border.show', false),
        lineColor: solidColor(ctx.borderColor),
        weight: numOf(ctx.fp, 'general.border.width', 1),
      },
    ],
  }
}

function multiRowCardCards(ctx: MapperContext): VisualStyleCards {
  return {
    dataLabels: [
      {
        color: solidColor(ctx.primary),
        fontFamily: ctx.fontFace,
        fontSize: ctx.headerSize,
      },
    ],
    categoryLabels: [
      {
        show: true,
        color: solidColor(ctx.labelColor),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
      },
    ],
    cardTitle: [
      {
        color: solidColor(ctx.titleColor),
        fontFamily: ctx.fontFace,
        fontSize: ctx.headerSize,
      },
    ],
    card: [
      {
        cardBackground: solidColor(ctx.visualBackground),
        outlineColor: solidColor(ctx.borderColor),
        outlineWeight: numOf(ctx.fp, 'general.border.width', 1),
        barShow: true,
        barColor: solidColor(ctx.accent),
      },
    ],
  }
}

function tableCards(ctx: MapperContext, matrix = false): VisualStyleCards {
  const headerBg = firstColor(ctx.fp, ['table.columnHeaders.background', 'matrix.columnHeaders.background'], ctx.tableHeaderBackground)
  const headerFg = firstColor(ctx.fp, ['table.columnHeaders.fontColor', 'matrix.columnHeaders.fontColor'], ctx.fg)
  const gridColor = firstColor(ctx.fp, ['table.grid.color', 'matrix.grid.color'], ctx.dividerColor)
  const cards: VisualStyleCards = {
    columnHeaders: [
      {
        backColor: solidColor(headerBg),
        fontColor: solidColor(headerFg),
        fontFamily: ctx.fontFace,
        fontSize: ctx.headerSize,
        bold: true,
        outlineColor: solidColor(gridColor),
      },
    ],
    values: [
      {
        backColorPrimary: solidColor(ctx.visualBackground),
        backColorSecondary: solidColor(ctx.tableRowAlt),
        fontColorPrimary: solidColor(ctx.fg),
        fontColorSecondary: solidColor(ctx.fg),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
        outlineColor: solidColor(gridColor),
      },
    ],
    grid: [
      {
        gridVertical: false,
        gridHorizontal: true,
        gridVerticalColor: solidColor(gridColor),
        gridHorizontalColor: solidColor(gridColor),
        gridHorizontalWeight: 1,
        gridVerticalWeight: 1,
        outlineColor: solidColor(gridColor),
        outlineWeight: 1,
        textSize: ctx.labelSize,
      },
    ],
    total: [
      {
        backColor: solidColor(ctx.tableAccent),
        fontColor: solidColor('#FFFFFF'),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
        bold: true,
      },
    ],
  }

  if (matrix) {
    cards.rowHeaders = [
      {
        backColor: solidColor(ctx.visualBackground),
        fontColor: solidColor(ctx.fg),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
        outlineColor: solidColor(gridColor),
      },
    ]
    cards.subTotals = [
      {
        backColor: solidColor(ctx.tableAccent),
        fontColor: solidColor('#FFFFFF'),
        fontFamily: ctx.fontFace,
        fontSize: ctx.labelSize,
        rowSubtotals: true,
        columnSubtotals: true,
      },
    ]
    cards.rowTotal = cards.total
    cards.columnTotal = cards.total
  }

  return cards
}

function slicerCards(ctx: MapperContext): VisualStyleCards {
  return {
    general: [
      {
        responsive: true,
        outlineColor: solidColor(ctx.borderColor),
        outlineWeight: numOf(ctx.fp, 'general.border.width', 1),
      },
    ],
    header: [
      cleanObject({
        show: boolOf(ctx.fp, 'slicer.header.show', true),
        text: optionalStr(ctx.fp, 'slicer.header.text'),
        fontColor: solidColor(firstColor(ctx.fp, ['slicer.header.fontColor'], ctx.titleColor)),
        background: solidColor(firstColor(ctx.fp, ['slicer.header.background'], ctx.visualBackground)),
        fontFamily: ctx.fontFace,
        textSize: ctx.headerSize,
        bold: true,
        outlineStyle: normalizeOutlineStyle(ctx.fp['slicer.header.outlineStyle']),
      }),
    ],
    items: [
      {
        fontColor: solidColor(firstColor(ctx.fp, ['slicer.items.fontColor'], ctx.fg)),
        background: solidColor(firstColor(ctx.fp, ['slicer.items.background'], ctx.visualBackground)),
        fontFamily: ctx.fontFace,
        textSize: ctx.labelSize,
        outlineStyle: normalizeOutlineStyle(ctx.fp['slicer.items.outlineStyle']),
      },
    ],
    selection: [
      {
        selectAllCheckboxEnabled: true,
        singleSelect: false,
      },
    ],
  }
}

function wrap(cards: VisualStyleCards): Record<string, VisualStyleCards> {
  return { '*': cards }
}

function mergeCards(base: VisualStyleCards, specific: VisualStyleCards): VisualStyleCards {
  return { ...base, ...specific }
}

export function buildVisualStyles(state: ThemeState): PowerBITheme['visualStyles'] {
  const ctx = buildContext(state)
  const globalCards = generalCards(ctx)
  const horizontal = mergeCards(globalCards, cartesianCards(ctx, 'horizontal'))
  const vertical = mergeCards(globalCards, cartesianCards(ctx, 'vertical'))
  const line = mergeCards(globalCards, lineCards(ctx))

  return {
    page: wrap(pageCards(ctx)),
    '*': wrap(globalCards),

    barChart: wrap(horizontal),
    clusteredBarChart: wrap(horizontal),
    hundredPercentStackedBarChart: wrap(horizontal),

    columnChart: wrap(vertical),
    clusteredColumnChart: wrap(vertical),
    hundredPercentStackedColumnChart: wrap(vertical),
    waterfallChart: wrap(mergeCards(globalCards, waterfallCards(ctx))),

    lineChart: wrap(line),
    areaChart: wrap(line),
    stackedAreaChart: wrap(line),
    hundredPercentStackedAreaChart: wrap(line),
    scatterChart: wrap(mergeCards(globalCards, scatterCards(ctx))),
    lineClusteredColumnComboChart: wrap(mergeCards(globalCards, comboLineCards(ctx))),
    lineStackedColumnComboChart: wrap(mergeCards(globalCards, comboLineCards(ctx))),
    ribbonChart: wrap(vertical),

    funnel: wrap(mergeCards(globalCards, funnelCards(ctx))),
    pieChart: wrap(mergeCards(globalCards, pieCards('pie', ctx))),
    donutChart: wrap(mergeCards(globalCards, pieCards('donut', ctx))),
    treemap: wrap(mergeCards(globalCards, treemapCards(ctx))),

    card: wrap(mergeCards(globalCards, cardCards(ctx))),
    cardVisual: wrap(mergeCards(globalCards, cardVisualCards(ctx))),
    multiRowCard: wrap(mergeCards(globalCards, multiRowCardCards(ctx))),
    tableEx: wrap(mergeCards(globalCards, tableCards(ctx, false))),
    pivotTable: wrap(mergeCards(globalCards, tableCards(ctx, true))),
    slicer: wrap(mergeCards(globalCards, slicerCards(ctx))),
  }
}
