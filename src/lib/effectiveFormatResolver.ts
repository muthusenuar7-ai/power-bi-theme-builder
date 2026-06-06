import type { CSSProperties } from 'react'
import type { FormatValue, ThemeColorMode, ThemeState } from '@/types'
import { normalizeHexColor } from '@/lib/paletteUtils'
import { getReadableTextColor, mixColor, withAlpha } from '@/lib/colorUtils'
import { getVisualAlias } from '@/lib/formatProps'
import { getVisualFormatSchema } from '@/lib/visualFormatSchema'
import { resolveThemeSurfaces } from '@/lib/themeSurfaceResolver'

export type EffectiveFormatInput = Pick<
  ThemeState,
  | 'dataColors'
  | 'paletteSize'
  | 'primary'
  | 'accent'
  | 'bg'
  | 'customCanvasBackground'
  | 'visualBackground'
  | 'cardBackground'
  | 'borderColor'
  | 'titleColor'
  | 'labelColor'
  | 'canvasBackgroundMode'
  | 'visualBackgroundMode'
  | 'fg'
  | 'good'
  | 'neutral'
  | 'bad'
  | 'tableAccent'
  | 'formatProps'
> & Partial<Pick<
  ThemeState,
  | 'gridlineColor'
  | 'dividerColor'
  | 'highlight'
  | 'tooltipBackground'
  | 'tableHeaderBackground'
  | 'tableRowAlt'
>>

export interface EffectiveFormat {
  canvasBackground: string
  effectiveCanvasBackground: string
  outspaceBackground: string
  visualBackground: string
  effectiveVisualBackground: string
  visualBackgroundColor: string
  cardBackground: string
  cardBackgroundColor: string
  titleBackground: string
  effectiveTitleBackground: string
  titleBackgroundColor: string
  borderColor: string
  effectiveBorderColor: string
  borderEnabled: boolean
  borderWidth: number
  effectiveBorderWidth: number
  borderRadius: number
  effectiveBorderRadius: number
  shadowEnabled: boolean
  shadowColor: string
  shadowCss: string
  effectiveShadow: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowOpacity: number
  shadowInset: boolean
  fontFamily: string
  effectiveFontFamily: string
  titleColor: string
  effectiveTitleColor: string
  subtitleColor: string
  effectiveSubtitleColor: string
  labelColor: string
  effectiveLabelColor: string
  foreground: string
  axisLabelColor: string
  axisTitleColor: string
  legendColor: string
  dataLabelColor: string
  gridlineColor: string
  tableHeaderBackground: string
  tableHeaderText: string
  tableRowAlt: string
  goodColor: string
  badColor: string
  neutralColor: string
  backgroundEnabled: boolean
  backgroundTransparency: number
  titleEnabled: boolean
  subtitleEnabled: boolean
  dividerEnabled: boolean
  titleFontSize: number
  effectiveTitleFontSize: number
  subtitleFontSize: number
  effectiveSubtitleFontSize: number
  labelFontSize: number
  effectiveLabelFontSize: number
  dataLabelFontSize: number
  effectiveDataLabelFontSize: number
  calloutFontSize: number
  effectiveCalloutFontSize: number
  headerFontSize: number
  effectiveHeaderFontSize: number
  titleFontWeight: number
  subtitleFontWeight: number
  titleFontStyle: CSSProperties['fontStyle']
  subtitleFontStyle: CSSProperties['fontStyle']
  titleTextDecoration: CSSProperties['textDecoration']
  subtitleTextDecoration: CSSProperties['textDecoration']
  titleAlignment: CSSProperties['textAlign']
  subtitleAlignment: CSSProperties['textAlign']
  titleWrap: boolean
  subtitleWrap: boolean
  titlePaddingTop: number
  titlePaddingRight: number
  titlePaddingBottom: number
  titlePaddingLeft: number
  titleSubtitleGap: number
  subtitleDividerGap: number
  titleAreaSpacing: number
  titleHeaderHeight: number
  dividerColor: string
  effectiveDividerColor: string
  dividerWidth: number
  dividerStyle: CSSProperties['borderTopStyle']
  primary: string
  accent: string
  source: {
    canvasBackground: 'theme' | 'custom'
    visualBackground: 'theme' | 'custom'
    titleBackground: 'theme' | 'custom'
    borderColor: 'theme' | 'custom'
    titleColor: 'theme' | 'custom'
    subtitleColor: 'theme' | 'custom'
    labelColor: 'theme' | 'custom'
    fontFamily: 'theme' | 'custom'
  }
}

function fpString(props: Record<string, FormatValue>, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function fpNumber(props: Record<string, FormatValue>, key: string, fallback: number): number {
  const value = props[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function firstNumberValue(props: Record<string, FormatValue>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = props[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return undefined
}

function firstNumber(props: Record<string, FormatValue>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = props[key]
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value)
      if (Number.isFinite(parsed)) return parsed
    }
  }
  return fallback
}

function fpBoolean(props: Record<string, FormatValue>, key: string, fallback: boolean): boolean {
  const value = props[key]
  return typeof value === 'boolean' ? value : fallback
}

function firstBoolean(props: Record<string, FormatValue>, keys: string[], fallback: boolean): boolean {
  for (const key of keys) {
    const value = props[key]
    if (typeof value === 'boolean') return value
  }
  return fallback
}

function firstString(props: Record<string, FormatValue>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = fpString(props, key)
    if (value) return value
  }
  return fallback
}

function stringValue(props: Record<string, FormatValue>, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function colorValue(props: Record<string, FormatValue>, key: string, fallback: string): string {
  return normalizeHexColor(props[key], fallback)
}

function firstColor(props: Record<string, FormatValue>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = fpString(props, key)
    if (value) return normalizeHexColor(value, fallback)
  }
  return normalizeHexColor(fallback)
}

function alphaColor(hex: string, transparency: number): string {
  return withAlpha(normalizeHexColor(hex), Math.max(0, Math.min(1, (100 - transparency) / 100)))
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function alignValue(value: string): CSSProperties['textAlign'] {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'center') return 'center'
  if (normalized === 'right') return 'right'
  return 'left'
}

function lineStyleValue(value: string): CSSProperties['borderTopStyle'] {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('dash')) return 'dashed'
  if (normalized.includes('dot')) return 'dotted'
  return 'solid'
}

function headingSize(base: number, heading: string | undefined, role: 'title' | 'subtitle'): number {
  if (!heading) return base
  const normalized = heading.trim().toLowerCase()
  const delta = role === 'title'
    ? normalized.includes('1') ? 6 : normalized.includes('2') ? 3 : normalized.includes('4') ? -1 : 0
    : normalized.includes('1') ? 4 : normalized.includes('2') ? 2 : normalized.includes('4') ? -1 : 0
  return clampNumber(base + delta, role === 'title' ? 10 : 8, role === 'title' ? 30 : 22)
}

function shadowOffsets(position: string): { x: number; y: number } {
  const normalized = position.trim().toLowerCase()
  if (normalized.includes('top') && normalized.includes('left')) return { x: -4, y: -4 }
  if (normalized.includes('top') && normalized.includes('right')) return { x: 4, y: -4 }
  if (normalized.includes('bottom') && normalized.includes('left')) return { x: -4, y: 4 }
  if (normalized.includes('bottom') && normalized.includes('right')) return { x: 4, y: 4 }
  if (normalized === 'top') return { x: 0, y: -4 }
  if (normalized === 'bottom' || normalized === 'outside') return { x: 0, y: 4 }
  if (normalized === 'left') return { x: -4, y: 0 }
  if (normalized === 'right') return { x: 4, y: 0 }
  return { x: 0, y: 0 }
}

function visualScope(visualId?: string | null): string | null {
  if (!visualId) return null
  const schema = getVisualFormatSchema(visualId)
  if (schema && schema.id !== 'unsupported') return schema.stateScope
  return getVisualAlias(visualId)
}

function dataLabelScope(scope: string | null): string | null {
  if (!scope) return null
  if (scope === 'pie' || scope === 'donut') return `${scope}.detailLabels`
  if (scope === 'funnel') return 'bar.dataLabels'
  return `${scope}.dataLabels`
}

function shadowCss(enabled: boolean, color: string, props: Record<string, FormatValue>): {
  css: string
  offsetX: number
  offsetY: number
  blur: number
  opacity: number
  inset: boolean
} {
  const position = firstString(props, ['general.shadow.position', 'general.shadow.placement'], 'Bottom right')
  const offset = firstString(props, ['general.shadow.offset'], 'Outside')
  const auto = shadowOffsets(position)
  const offsetX = firstNumberValue(props, ['general.shadow.offsetX']) ?? auto.x
  const offsetY = firstNumberValue(props, ['general.shadow.offsetY']) ?? auto.y
  const blur = Math.max(0, fpNumber(props, 'general.shadow.blur', 14))
  const transparency = clampNumber(fpNumber(props, 'general.shadow.transparency', 78), 0, 100)
  const opacity = clampNumber((100 - transparency) / 100, 0, 1)
  const inset = offset.trim().toLowerCase() === 'inside' || position.trim().toLowerCase() === 'center'
  if (!enabled) {
    return { css: 'none', offsetX, offsetY, blur, opacity, inset }
  }
  return {
    css: `${inset ? 'inset ' : ''}${offsetX}px ${offsetY}px ${blur}px ${alphaColor(color, transparency)}`,
    offsetX,
    offsetY,
    blur,
    opacity,
    inset,
  }
}

export function resolveEffectiveFormat(state: EffectiveFormatInput, visualId?: string | null): EffectiveFormat {
  const props = state.formatProps
  const palette = state.dataColors.length ? state.dataColors : ['#0D9488']
  const primary = normalizeHexColor(state.primary, palette[0] ?? '#0D9488')
  const accent = normalizeHexColor(state.accent, palette[1] ?? primary)
  const surfaces = resolveThemeSurfaces(state)
  const scope = visualScope(visualId)
  const labelsScope = dataLabelScope(scope)

  const backgroundEnabled = fpBoolean(props, 'general.background.show', true)
  const backgroundTransparency = fpNumber(props, 'general.background.transparency', 0)
  const visualBackgroundColor = normalizeHexColor(surfaces.effectiveVisualBackground)
  const visualBackground = backgroundEnabled ? alphaColor(visualBackgroundColor, backgroundTransparency) : 'transparent'
  const titleBackgroundColor = normalizeHexColor(surfaces.effectiveTitleBackground, visualBackgroundColor)
  const titleBackground = alphaColor(titleBackgroundColor, 0)
  const foreground = normalizeHexColor(surfaces.effectiveForeground, getReadableTextColor(visualBackgroundColor))
  const titleColor = normalizeHexColor(surfaces.effectiveTitleColor, foreground)
  const labelColor = normalizeHexColor(surfaces.effectiveLabelColor, foreground)
  const subtitleColor = firstColor(props, ['general.subtitle.fontColor', 'general.title.subtitle.fontColor'], labelColor)
  const borderColor = normalizeHexColor(surfaces.effectiveBorderColor, mixColor(visualBackgroundColor, '#000000', 0.14))
  const borderEnabled = fpBoolean(props, 'general.border.show', true)
  const borderWidth = Math.max(0, fpNumber(props, 'general.border.width', 1))
  const borderRadius = Math.max(0, fpNumber(props, 'general.border.radius', 10))
  const shadowEnabled = fpBoolean(props, 'general.shadow.show', false)
  const shadowColor = colorValue(props, 'general.shadow.color', '#000000')
  const fontFamily = firstString(props, ['general.typography.fontFace', 'general.title.fontFamily'], 'Segoe UI')
  const titleEnabled = fpBoolean(props, 'general.title.show', true)
  const subtitleEnabled = titleEnabled && firstBoolean(props, ['general.subtitle.show', 'general.title.subtitle.show'], true)
  const dividerEnabled = titleEnabled && firstBoolean(props, ['general.title.divider.show'], true)
  const titleHeading = firstString(props, ['general.title.heading', 'general.title.title.heading'], '')
  const subtitleHeading = firstString(props, ['general.subtitle.heading', 'general.title.subtitle.heading'], '')
  const titleFontSize = headingSize(firstNumber(props, ['general.title.fontSize'], 14), titleHeading, 'title')
  const subtitleFontSize = headingSize(firstNumber(props, ['general.subtitle.fontSize', 'general.title.subtitle.font.size', 'general.title.subtitle.fontSize'], 10), subtitleHeading, 'subtitle')
  const labelFontSize = clampNumber(firstNumber(props, ['general.label.fontSize'], 10), 7, 28)
  const dataLabelFontSize = clampNumber(firstNumber(props, ['general.dataLabels.fontSize', 'general.dataLabel.fontSize'], labelFontSize), 7, 28)
  const calloutFontSize = clampNumber(firstNumber(props, ['general.callout.fontSize'], 36), 12, 72)
  const headerFontSize = clampNumber(firstNumber(props, ['general.header.fontSize'], 11), 8, 36)
  const titleFontWeight = fpBoolean(props, 'general.title.fontBold', true) ? 700 : 500
  const subtitleFontWeight = firstBoolean(props, ['general.subtitle.fontBold', 'general.title.subtitle.fontStyle.bold'], false) ? 700 : 500
  const titleFontStyle: CSSProperties['fontStyle'] = fpBoolean(props, 'general.title.fontItalic', false) ? 'italic' : 'normal'
  const subtitleFontStyle: CSSProperties['fontStyle'] = firstBoolean(props, ['general.subtitle.fontItalic', 'general.title.subtitle.fontStyle.italic'], false) ? 'italic' : 'normal'
  const titleTextDecoration: CSSProperties['textDecoration'] = fpBoolean(props, 'general.title.fontUnderline', false) ? 'underline' : 'none'
  const subtitleTextDecoration: CSSProperties['textDecoration'] = firstBoolean(props, ['general.subtitle.fontUnderline', 'general.title.subtitle.fontStyle.underline'], false) ? 'underline' : 'none'
  const titleAlignment = alignValue(firstString(props, ['general.title.alignment'], 'Left'))
  const subtitleAlignment = alignValue(firstString(props, ['general.subtitle.alignment', 'general.title.subtitle.alignment'], 'Left'))
  const titleWrap = firstBoolean(props, ['general.title.textWrap', 'general.title.title.textWrap'], true)
  const subtitleWrap = firstBoolean(props, ['general.subtitle.textWrap', 'general.title.subtitle.textWrap'], true)
  const titlePaddingTop = Math.max(0, firstNumber(props, ['general.padding.top'], 8))
  const titlePaddingRight = Math.max(0, firstNumber(props, ['general.padding.right'], 10))
  const titlePaddingBottom = Math.max(0, firstNumber(props, ['general.padding.bottom'], 8))
  const titlePaddingLeft = Math.max(0, firstNumber(props, ['general.padding.left'], 10))
  const titleSubtitleGap = Math.max(0, firstNumber(props, ['general.title.spacing.spaceBelowTitle'], 3))
  const subtitleDividerGap = Math.max(0, firstNumber(props, ['general.title.spacing.spaceBelowSubtitle'], 4))
  const titleAreaSpacing = Math.max(0, firstNumber(props, ['general.title.spacing.spaceBelowTitleArea'], 8))
  const titleHeaderHeight = Math.max(0, firstNumber(props, ['general.title.height', 'general.title.title.height', 'general.title.spacing.titleHeaderHeight'], 0))
  const dividerColor = firstColor(props, ['general.title.divider.color'], normalizeHexColor(state.dividerColor, borderColor))
  const dividerWidth = Math.max(0, firstNumber(props, ['general.title.divider.width'], 1))
  const dividerStyle = lineStyleValue(firstString(props, ['general.title.divider.lineStyle'], 'Solid'))
  const shadow = shadowCss(shadowEnabled, shadowColor, props)
  const themeGridline = normalizeHexColor(state.gridlineColor, mixColor(borderColor, surfaces.effectiveCanvasBackground, 0.44))
  const themeTableHeader = normalizeHexColor(state.tableHeaderBackground, normalizeHexColor(state.tableAccent, primary))
  const themeTableRowAlt = normalizeHexColor(state.tableRowAlt, visualBackgroundColor)

  const axisLabelColor = scope
    ? firstColor(props, [`${scope}.xAxis.color`, `${scope}.yAxis.color`], labelColor)
    : labelColor
  const axisTitleColor = scope
    ? firstColor(props, [`${scope}.xAxis.title.color`, `${scope}.yAxis.title.color`, `${scope}.xAxis.color`, `${scope}.yAxis.color`], axisLabelColor)
    : labelColor
  const legendColor = scope
    ? firstColor(props, [`${scope}.legend.text.color`, `${scope}.legend.title.color`], labelColor)
    : labelColor
  const dataLabelColor = labelsScope
    ? firstColor(props, [`${labelsScope}.color`, `${labelsScope}.values.color`, `${labelsScope}.value.color`], foreground)
    : foreground
  const gridlineColor = scope
    ? firstColor(props, [`${scope}.plotArea.gridColor`, `${scope}.gridlines.vertical.color`, `${scope}.gridlines.horizontal.color`], themeGridline)
    : themeGridline

  return {
    canvasBackground: surfaces.effectiveCanvasBackground,
    effectiveCanvasBackground: surfaces.effectiveCanvasBackground,
    outspaceBackground: surfaces.effectiveOutspaceBackground,
    visualBackground,
    effectiveVisualBackground: visualBackgroundColor,
    visualBackgroundColor,
    cardBackground: visualBackground,
    cardBackgroundColor: visualBackgroundColor,
    titleBackground,
    effectiveTitleBackground: titleBackgroundColor,
    titleBackgroundColor,
    borderColor,
    effectiveBorderColor: borderColor,
    borderEnabled,
    borderWidth,
    effectiveBorderWidth: borderWidth,
    borderRadius,
    effectiveBorderRadius: borderRadius,
    shadowEnabled,
    shadowColor,
    shadowCss: shadow.css,
    effectiveShadow: shadow.css,
    shadowOffsetX: shadow.offsetX,
    shadowOffsetY: shadow.offsetY,
    shadowBlur: shadow.blur,
    shadowOpacity: shadow.opacity,
    shadowInset: shadow.inset,
    fontFamily,
    effectiveFontFamily: fontFamily,
    titleColor,
    effectiveTitleColor: titleColor,
    subtitleColor,
    effectiveSubtitleColor: subtitleColor,
    labelColor,
    effectiveLabelColor: labelColor,
    foreground,
    axisLabelColor,
    axisTitleColor,
    legendColor,
    dataLabelColor,
    gridlineColor,
    tableHeaderBackground: themeTableHeader,
    tableHeaderText: getReadableTextColor(themeTableHeader),
    tableRowAlt: themeTableRowAlt,
    goodColor: normalizeHexColor(state.good, '#10B981'),
    badColor: normalizeHexColor(state.bad, '#EF4444'),
    neutralColor: normalizeHexColor(state.neutral, '#F59E0B'),
    backgroundEnabled,
    backgroundTransparency,
    titleEnabled,
    subtitleEnabled,
    dividerEnabled,
    titleFontSize,
    effectiveTitleFontSize: titleFontSize,
    subtitleFontSize,
    effectiveSubtitleFontSize: subtitleFontSize,
    labelFontSize,
    effectiveLabelFontSize: labelFontSize,
    dataLabelFontSize,
    effectiveDataLabelFontSize: dataLabelFontSize,
    calloutFontSize,
    effectiveCalloutFontSize: calloutFontSize,
    headerFontSize,
    effectiveHeaderFontSize: headerFontSize,
    titleFontWeight,
    subtitleFontWeight,
    titleFontStyle,
    subtitleFontStyle,
    titleTextDecoration,
    subtitleTextDecoration,
    titleAlignment,
    subtitleAlignment,
    titleWrap,
    subtitleWrap,
    titlePaddingTop,
    titlePaddingRight,
    titlePaddingBottom,
    titlePaddingLeft,
    titleSubtitleGap,
    subtitleDividerGap,
    titleAreaSpacing,
    titleHeaderHeight,
    dividerColor,
    effectiveDividerColor: dividerColor,
    dividerWidth,
    dividerStyle,
    primary,
    accent,
    source: {
      canvasBackground: surfaces.source.canvasBackground,
      visualBackground: surfaces.source.visualBackground,
      titleBackground: surfaces.source.titleBackground,
      borderColor: surfaces.source.borderColor,
      titleColor: surfaces.source.titleColor,
      subtitleColor: fpString(props, 'general.subtitle.fontColor') || fpString(props, 'general.title.subtitle.fontColor') ? 'custom' : 'theme',
      labelColor: surfaces.source.labelColor,
      fontFamily: fpString(props, 'general.typography.fontFace') || fpString(props, 'general.title.fontFamily') ? 'custom' : 'theme',
    },
  }
}

export function getEffectiveCardStyle(format: EffectiveFormat): CSSProperties {
  return {
    background: format.visualBackground,
    border: format.borderEnabled ? `${format.borderWidth}px solid ${format.borderColor}` : '1px solid transparent',
    borderRadius: format.borderRadius,
    boxShadow: format.shadowCss,
  }
}
