import type { CSSProperties } from 'react'
import { getVisualAlias } from '@/lib/formatProps'
import { getVisualAnatomy } from '@/lib/visualAnatomy'
import { getVisualFormatSchema } from '@/lib/visualFormatSchema'
import type { AxisAnatomy, AxisLabelType, AxisRole, GridlineDirection, ShapeRole, VisualOrientation } from '@/lib/visualAnatomy'
import type { ThemeState } from '@/types'

export type FormatProps = ThemeState['formatProps']

type CssVars = CSSProperties & Record<string, string | number>

const HEX_3 = /^#?([0-9a-fA-F]{3})$/
const HEX_6 = /^#?([0-9a-fA-F]{6})$/

export interface ResolvedTextPreview {
  show: boolean
  text: string
  color: string
  fontSize: number
  fontFamily: string
  fontWeight: number
  fontStyle: CSSProperties['fontStyle']
  textDecoration: CSSProperties['textDecoration']
  textAlign: CSSProperties['textAlign']
  background: string
}

export interface ResolvedGeneralPreviewFormat {
  cardStyle: CSSProperties
  titleStyle: CSSProperties
  subtitleStyle: CSSProperties
  title: ResolvedTextPreview
  subtitle: ResolvedTextPreview
  showTitle: boolean
  showSubtitle: boolean
}

export interface ResolvedAxisPreviewStyle {
  show: boolean
  visible: boolean
  role: AxisRole
  labelType: AxisLabelType
  labelVisible: boolean
  defaultTitle: string
  color: string
  fontSize: number
  fontFamily: string
  titleShow: boolean
  titleVisible: boolean
  titleText: string
  titleColor: string
  titleFontSize: number
}

export interface ResolvedLegendPreviewStyle {
  show: boolean
  color: string
  fontSize: number
  fontFamily: string
  position: string
  titleShow: boolean
  titleText: string
}

export interface ResolvedDataLabelPreviewStyle {
  show: boolean
  color: string
  fontSize: number
  background: string
}

export interface ResolvedGridlinePreviewStyle {
  show: boolean
  direction: GridlineDirection
  color: string
  width: number
  dasharray: string
}

export interface ResolvedShapePreviewStyle {
  role: ShapeRole
  color: string | null
  opacity: number
  borderShow: boolean
  borderColor: string
  borderWidth: number
}

export interface ResolvedVisualPreviewFormat {
  visualId: string
  scope: string
  orientation: VisualOrientation
  xAxis: ResolvedAxisPreviewStyle
  yAxis: ResolvedAxisPreviewStyle
  legend: ResolvedLegendPreviewStyle
  dataLabels: ResolvedDataLabelPreviewStyle
  gridlines: ResolvedGridlinePreviewStyle
  shape: ResolvedShapePreviewStyle
  markers: { show: boolean }
}

export function normalizeHex(value: unknown, fallback: string): string {
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

export function booleanValue(formatProps: FormatProps, key: string, fallback: boolean): boolean {
  const value = formatProps[key]
  return typeof value === 'boolean' ? value : fallback
}

export function numberValue(formatProps: FormatProps, key: string, fallback: number): number {
  const value = formatProps[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

export function stringValue(formatProps: FormatProps, key: string, fallback: string): string {
  const value = formatProps[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function colorValue(formatProps: FormatProps, key: string, fallback: string): string {
  return normalizeHex(formatProps[key], fallback)
}

function firstColorValue(formatProps: FormatProps, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = formatProps[key]
    if (typeof value === 'string' && value.trim()) return normalizeHex(value, fallback)
  }
  return fallback
}

function firstStringValue(formatProps: FormatProps, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = formatProps[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

function firstNumberValue(formatProps: FormatProps, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = formatProps[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

function firstBooleanValue(formatProps: FormatProps, keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const value = formatProps[key]
    if (typeof value === 'boolean') return value
  }
  return fallback
}

function alphaColor(hex: string, transparency: number): string {
  const normalized = normalizeHex(hex, '#000000')
  const alpha = Math.max(0, Math.min(1, (100 - transparency) / 100))
  const red = parseInt(normalized.slice(1, 3), 16)
  const green = parseInt(normalized.slice(3, 5), 16)
  const blue = parseInt(normalized.slice(5, 7), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function cssTextAlign(value: string): CSSProperties['textAlign'] {
  const normalized = value.toLowerCase()
  if (normalized === 'center' || normalized === 'right') return normalized
  return 'left'
}

function textAlignValue(formatProps: FormatProps, key: string, fallback = 'Left'): CSSProperties['textAlign'] {
  return cssTextAlign(stringValue(formatProps, key, fallback))
}

function lineStyleDasharray(style: string): string {
  const normalized = style.toLowerCase()
  if (normalized.includes('dash')) return '4 3'
  if (normalized.includes('dot')) return '1 3'
  return '0'
}

function visualScope(visualId: string | null | undefined): string {
  const schema = getVisualFormatSchema(visualId)
  if (schema && schema.id !== 'unsupported') return schema.stateScope
  return getVisualAlias(visualId)
}

function shapePrefix(scope: string, shapeRole: ShapeRole): string {
  if (shapeRole === 'slices') return `${scope}.slices`
  if (shapeRole === 'funnel') return 'funnel.colors.default'
  if (shapeRole === 'tiles') return 'treemap.colors.advanced'
  if (shapeRole === 'columns') return `${scope}.columns`
  if (shapeRole === 'line') return `${scope}.lines`
  if (shapeRole === 'area') return `${scope}.area`
  return `${scope}.bars`
}

function defaultDataLabelScope(scope: string): string {
  if (scope === 'funnel') return 'bar.dataLabels'
  return scope === 'pie' || scope === 'donut' ? `${scope}.detailLabels` : `${scope}.dataLabels`
}

function primaryGridlineDirection(direction: GridlineDirection): 'horizontal' | 'vertical' {
  return direction === 'vertical' ? 'vertical' : 'horizontal'
}

function resolvedAxisTitle(formatProps: FormatProps, scope: string, axisId: 'xAxis' | 'yAxis', fallback: string): string {
  const rawTitle = firstStringValue(formatProps, [`${scope}.${axisId}.titleText`, `${scope}.${axisId}.title.text`], '')
  if (!rawTitle || rawTitle.toLowerCase() === 'auto') return fallback
  return rawTitle
}

function resolveAxisPreview(
  formatProps: FormatProps,
  scope: string,
  axisId: 'xAxis' | 'yAxis',
  axis: AxisAnatomy,
  defaultFont: string,
): ResolvedAxisPreviewStyle {
  const hasAxis = axis.role !== 'none'
  const visible = hasAxis && booleanValue(formatProps, `${scope}.${axisId}.show`, true)
  const labelVisible = visible && booleanValue(formatProps, `${scope}.${axisId}.values.show`, true)
  const titleVisible = visible && booleanValue(formatProps, `${scope}.${axisId}.title.show`, true)

  return {
    show: visible,
    visible,
    role: axis.role,
    labelType: axis.labelType,
    labelVisible,
    defaultTitle: axis.defaultTitle,
    color: colorValue(formatProps, `${scope}.${axisId}.color`, '#605E5C'),
    fontSize: numberValue(formatProps, `${scope}.${axisId}.values.font.size`, 7.5),
    fontFamily: stringValue(formatProps, `${scope}.${axisId}.values.font.family`, defaultFont),
    titleShow: titleVisible,
    titleVisible,
    titleText: resolvedAxisTitle(formatProps, scope, axisId, axis.defaultTitle),
    titleColor: colorValue(formatProps, `${scope}.${axisId}.title.color`, '#605E5C'),
    titleFontSize: numberValue(formatProps, `${scope}.${axisId}.title.font.size`, 8),
  }
}

export function resolveGeneralPreviewFormat(
  formatProps: FormatProps,
  fallbacks: { background?: string; foreground?: string; border?: string; title?: string; subtitle?: string } = {},
): ResolvedGeneralPreviewFormat {
  const fallbackBackground = normalizeHex(fallbacks.background, '#FFFFFF')
  const fallbackForeground = normalizeHex(fallbacks.foreground, '#0F172A')
  const fallbackBorder = normalizeHex(fallbacks.border, '#E5E7EB')
  const showBackground = booleanValue(formatProps, 'general.background.show', true)
  const backgroundColor = colorValue(formatProps, 'general.background.color', fallbackBackground)
  const backgroundTransparency = numberValue(formatProps, 'general.background.transparency', 0)
  const showBorder = booleanValue(formatProps, 'general.border.show', false)
  const borderColor = colorValue(formatProps, 'general.border.color', fallbackBorder)
  const borderWidth = numberValue(formatProps, 'general.border.width', 1)
  const radius = numberValue(formatProps, 'general.border.radius', 6)
  const showShadow = booleanValue(formatProps, 'general.shadow.show', false)
  const shadowColor = colorValue(formatProps, 'general.shadow.color', '#000000')
  const shadowTransparency = numberValue(formatProps, 'general.shadow.transparency', 80)
  const shadowBlur = numberValue(formatProps, 'general.shadow.blur', 6)
  const shadowOffsetX = numberValue(formatProps, 'general.shadow.offsetX', 0)
  const shadowOffsetY = numberValue(formatProps, 'general.shadow.offsetY', 2)
  const paddingTop = numberValue(formatProps, 'general.padding.top', 12)
  const paddingRight = numberValue(formatProps, 'general.padding.right', 12)
  const paddingBottom = numberValue(formatProps, 'general.padding.bottom', 12)
  const paddingLeft = numberValue(formatProps, 'general.padding.left', 12)
  const titleBackground = colorValue(formatProps, 'general.title.background', '#FFFFFF')
  const titleTransparency = numberValue(formatProps, 'general.title.transparency', 100)
  const sharedFontFamily = stringValue(formatProps, 'general.typography.fontFace', 'Segoe UI')

  const title: ResolvedTextPreview = {
    show: booleanValue(formatProps, 'general.title.show', true),
    text: stringValue(formatProps, 'general.title.text', fallbacks.title ?? ''),
    color: colorValue(formatProps, 'general.title.fontColor', fallbackForeground),
    fontSize: numberValue(formatProps, 'general.title.fontSize', 12.5),
    fontFamily: stringValue(formatProps, 'general.title.fontFamily', sharedFontFamily),
    fontWeight: booleanValue(formatProps, 'general.title.fontBold', true) ? 700 : 500,
    fontStyle: booleanValue(formatProps, 'general.title.fontItalic', false) ? 'italic' : 'normal',
    textDecoration: booleanValue(formatProps, 'general.title.fontUnderline', false) ? 'underline' : 'none',
    textAlign: textAlignValue(formatProps, 'general.title.alignment'),
    background: titleTransparency < 100 ? alphaColor(titleBackground, titleTransparency) : 'transparent',
  }

  const subtitle: ResolvedTextPreview = {
    show: booleanValue(formatProps, 'general.subtitle.show', true),
    text: stringValue(formatProps, 'general.subtitle.text', fallbacks.subtitle ?? ''),
    color: firstColorValue(formatProps, ['general.subtitle.fontColor', 'general.title.subtitle.fontColor'], '#605E5C'),
    fontSize: firstNumberValue(formatProps, ['general.subtitle.fontSize', 'general.title.subtitle.font.size'], 10.5),
    fontFamily: firstStringValue(formatProps, ['general.subtitle.fontFamily', 'general.title.subtitle.font.family'], sharedFontFamily),
    fontWeight: firstBooleanValue(formatProps, ['general.subtitle.fontBold', 'general.title.subtitle.fontStyle.bold'], false) ? 700 : 400,
    fontStyle: firstBooleanValue(formatProps, ['general.subtitle.fontItalic', 'general.title.subtitle.fontStyle.italic'], false) ? 'italic' : 'normal',
    textDecoration: firstBooleanValue(formatProps, ['general.subtitle.fontUnderline', 'general.title.subtitle.fontStyle.underline'], false) ? 'underline' : 'none',
    textAlign: cssTextAlign(firstStringValue(formatProps, ['general.subtitle.alignment', 'general.title.subtitle.alignment'], 'Left')),
    background: 'transparent',
  }

  const cardStyle: CSSProperties = {
    background: showBackground ? alphaColor(backgroundColor, backgroundTransparency) : 'transparent',
    border: showBorder ? `${Math.max(0, borderWidth)}px solid ${borderColor}` : '1px solid transparent',
    borderRadius: radius,
    boxShadow: showShadow
      ? `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${alphaColor(shadowColor, shadowTransparency)}`
      : 'none',
    padding: `${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px`,
  }

  const titleStyle: CSSProperties = {
    color: title.color,
    fontSize: title.fontSize,
    fontFamily: title.fontFamily,
    fontWeight: title.fontWeight,
    fontStyle: title.fontStyle,
    textDecoration: title.textDecoration,
    textAlign: title.textAlign,
    background: title.background,
  }

  const subtitleStyle: CSSProperties = {
    color: subtitle.color,
    fontSize: subtitle.fontSize,
    fontFamily: subtitle.fontFamily,
    fontWeight: subtitle.fontWeight,
    fontStyle: subtitle.fontStyle,
    textDecoration: subtitle.textDecoration,
    textAlign: subtitle.textAlign,
  }

  return {
    cardStyle,
    titleStyle,
    subtitleStyle,
    title,
    subtitle,
    showTitle: title.show,
    showSubtitle: subtitle.show,
  }
}

export function getGeneralPreviewStyles(
  formatProps: FormatProps,
  fallbacks: { background?: string; foreground?: string; border?: string; title?: string; subtitle?: string } = {},
): ResolvedGeneralPreviewFormat {
  return resolveGeneralPreviewFormat(formatProps, fallbacks)
}

export function resolveVisualPreviewFormat(
  visualId: string,
  formatProps: FormatProps,
  dataColors: string[] = [],
): ResolvedVisualPreviewFormat {
  const scope = visualScope(visualId)
  const anatomy = getVisualAnatomy(visualId)
  const fallbackColor = normalizeHex(dataColors[0], '#0D9488')
  const defaultFont = stringValue(formatProps, 'general.typography.fontFace', 'Segoe UI')
  const labelScope = defaultDataLabelScope(scope)
  const shape = shapePrefix(scope, anatomy.shapeRole)
  const gridDirection = primaryGridlineDirection(anatomy.gridlineDirection)
  const fallbackGridDirection = gridDirection === 'horizontal' ? 'vertical' : 'horizontal'
  const isPieLike = scope === 'pie' || scope === 'donut'
  const isFunnel = scope === 'funnel'
  const isTreemap = scope === 'treemap'
  const shapeColor = isFunnel
    ? colorValue(formatProps, 'funnel.colors.default.default', fallbackColor)
    : isTreemap
      ? colorValue(formatProps, 'treemap.colors.advanced.usa', fallbackColor)
      : firstColorValue(formatProps, [`${shape}.color.color`, `${shape}.color.fill`], fallbackColor)
  const shapeTransparency = numberValue(formatProps, `${shape}.color.transparency`, 0)
  const gridColor = firstColorValue(formatProps, [
    `${scope}.plotArea.gridColor`,
    `${scope}.gridlines.${gridDirection}.color`,
    `${scope}.gridlines.${fallbackGridDirection}.color`,
  ], '#EDEBE9')
  const gridShow = anatomy.gridlineDirection !== 'none'
    && booleanValue(
      formatProps,
      `${scope}.gridlines.${gridDirection}.show`,
      booleanValue(formatProps, `${scope}.gridlines.${fallbackGridDirection}.show`, true),
    )
  const xAxis = resolveAxisPreview(formatProps, scope, 'xAxis', anatomy.xAxis, defaultFont)
  const yAxis = resolveAxisPreview(formatProps, scope, 'yAxis', anatomy.yAxis, defaultFont)

  return {
    visualId,
    scope,
    orientation: anatomy.orientation,
    xAxis,
    yAxis,
    legend: {
      show: booleanValue(formatProps, `${scope}.legend.show`, true),
      color: colorValue(formatProps, `${scope}.legend.text.color`, '#605E5C'),
      fontSize: numberValue(formatProps, `${scope}.legend.text.font.size`, 7.5),
      fontFamily: stringValue(formatProps, `${scope}.legend.text.font.family`, defaultFont),
      position: stringValue(formatProps, `${scope}.legend.position`, 'Top'),
      titleShow: booleanValue(formatProps, `${scope}.legend.title.show`, false),
      titleText: stringValue(formatProps, `${scope}.legend.titleText`, ''),
    },
    dataLabels: {
      show: booleanValue(formatProps, `${labelScope}.show`, true),
      color: firstColorValue(formatProps, [`${labelScope}.color`, `${labelScope}.values.color`], '#252423'),
      fontSize: numberValue(
        formatProps,
        `${labelScope}.values.font.size`,
        numberValue(formatProps, `${labelScope}.fontSize`, isPieLike ? 6.4 : 7.5),
      ),
      background: colorValue(formatProps, `${labelScope}.background`, '#FFFFFF'),
    },
    gridlines: {
      show: gridShow,
      direction: anatomy.gridlineDirection,
      color: gridColor,
      width: numberValue(
        formatProps,
        `${scope}.gridlines.${gridDirection}.width`,
        numberValue(formatProps, `${scope}.gridlines.${fallbackGridDirection}.width`, 0.5),
      ),
      dasharray: lineStyleDasharray(
        stringValue(
          formatProps,
          `${scope}.gridlines.${gridDirection}.lineStyle`,
          stringValue(formatProps, `${scope}.gridlines.${fallbackGridDirection}.lineStyle`, 'Solid'),
        ),
      ),
    },
    shape: {
      role: anatomy.shapeRole,
      color: shapeColor,
      opacity: Math.max(0, Math.min(1, (100 - shapeTransparency) / 100)),
      borderShow: booleanValue(formatProps, `${shape}.border.show`, false),
      borderColor: colorValue(formatProps, `${shape}.border.color`, '#C8C6C4'),
      borderWidth: numberValue(formatProps, `${shape}.border.width`, 1),
    },
    markers: {
      show: booleanValue(formatProps, `${scope}.markers.show`, true),
    },
  }
}

export function getChartCssVars(format: ResolvedVisualPreviewFormat): CssVars {
  const borderWidth = format.shape.borderShow ? Math.max(0, format.shape.borderWidth) : 0
  return {
    '--preview-font-family': format.xAxis.fontFamily,
    '--preview-axis-line': '#C8C6C4',
    '--preview-axis-label-color': format.xAxis.labelVisible || format.yAxis.labelVisible ? format.xAxis.color : 'transparent',
    '--preview-axis-label-size': `${format.xAxis.fontSize}px`,
    '--preview-x-axis-label-color': format.xAxis.labelVisible ? format.xAxis.color : 'transparent',
    '--preview-y-axis-label-color': format.yAxis.labelVisible ? format.yAxis.color : 'transparent',
    '--preview-x-axis-label-size': `${format.xAxis.fontSize}px`,
    '--preview-y-axis-label-size': `${format.yAxis.fontSize}px`,
    '--preview-x-axis-title-color': format.xAxis.titleVisible ? format.xAxis.titleColor : 'transparent',
    '--preview-y-axis-title-color': format.yAxis.titleVisible ? format.yAxis.titleColor : 'transparent',
    '--preview-x-axis-title-size': `${format.xAxis.titleFontSize}px`,
    '--preview-y-axis-title-size': `${format.yAxis.titleFontSize}px`,
    '--preview-axis-title-color': format.xAxis.titleColor,
    '--preview-axis-title-size': `${format.xAxis.titleFontSize}px`,
    '--preview-gridline-color': format.gridlines.show ? format.gridlines.color : 'transparent',
    '--preview-gridline-width': format.gridlines.show ? Math.max(0, format.gridlines.width) : 0,
    '--preview-gridline-dasharray': format.gridlines.show ? format.gridlines.dasharray : '0',
    '--preview-legend-color': format.legend.color,
    '--preview-legend-size': `${format.legend.fontSize}px`,
    '--preview-data-label-color': format.dataLabels.color,
    '--preview-data-label-size': `${format.dataLabels.fontSize}px`,
    '--preview-shape-color': format.shape.color ?? '',
    '--preview-shape-border-color': borderWidth > 0 ? format.shape.borderColor : 'none',
    '--preview-shape-border-width': borderWidth,
    '--preview-shape-opacity': format.shape.opacity,
    ...(format.shape.color ? { '--c1': format.shape.color } : {}),
  }
}
