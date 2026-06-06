import type { CSSProperties } from 'react'
import type { FormatValue, ThemeState } from '@/types'
import { normalizeHexColor } from '@/lib/paletteUtils'
import { darken, getReadableTextColor, isDarkColor, lighten, mixColor, withAlpha } from '@/lib/colorUtils'
import { resolveEffectiveFormat } from '@/lib/effectiveFormatResolver'

type DashboardThemeState = Pick<
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

export interface DashboardTheme {
  pageBackground: string
  canvasBackground: string
  visualBackground: string
  visualBackgroundAlt: string
  foreground: string
  titleColor: string
  titleBackground: string
  subtitleColor: string
  labelColor: string
  titleEnabled: boolean
  subtitleEnabled: boolean
  dividerEnabled: boolean
  titleFontSize: number
  subtitleFontSize: number
  labelFontSize: number
  dataLabelFontSize: number
  calloutFontSize: number
  headerFontSize: number
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
  dividerWidth: number
  dividerStyle: CSSProperties['borderTopStyle']
  mutedText: string
  borderColor: string
  borderEnabled: boolean
  borderWidth: number
  borderRadius: number
  shadowEnabled: boolean
  shadowColor: string
  shadowOffsetX: number
  shadowOffsetY: number
  shadowBlur: number
  shadowOpacity: number
  shadowInset: boolean
  fontFamily: string
  gridlineColor: string
  tableAccent: string
  tableHeaderBackground: string
  tableHeaderText: string
  tableRowAlt: string
  good: string
  bad: string
  neutral: string
  dataColors: string[]
  primary: string
  secondary: string
  accent: string
  shadow: string
  chipBackground: string
  chipActiveBackground: string
  chipActiveText: string
  cardBackground: string
  dataLabelColor: string
  legendColor: string
  axisLabelColor: string
  axisTitleColor: string
  plotBackground: string
  plotBackgroundAlt: string
  positiveBackground: string
  negativeBackground: string
  neutralBackground: string
  pageDot: string
  canvasShadow: string
  effectiveCanvasBackground: string
  effectiveVisualBackground: string
  canvasBackgroundSource: 'theme' | 'custom'
  visualBackgroundSource: 'theme' | 'custom'
}

function formatString(props: Record<string, FormatValue>, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function formatBoolean(props: Record<string, FormatValue>, key: string, fallback: boolean): boolean {
  const value = props[key]
  return typeof value === 'boolean' ? value : fallback
}

function formatNumber(props: Record<string, FormatValue>, key: string, fallback: number): number {
  const value = props[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function resolveHex(value: unknown, fallback: string): string {
  return normalizeHexColor(value, fallback)
}

function transparentize(hex: string, transparency: number): string {
  return withAlpha(hex, Math.max(0, Math.min(1, (100 - transparency) / 100)))
}

function softFill(color: string, isDark: boolean, strength = 0.14): string {
  return withAlpha(color, isDark ? Math.min(0.28, strength + 0.1) : strength)
}

export function resolveDashboardTheme(state: DashboardThemeState): DashboardTheme {
  const props = state.formatProps
  const effective = resolveEffectiveFormat(state)
  const dataColors = state.dataColors.length ? state.dataColors : ['#0D9488']
  const primary = resolveHex(state.primary, dataColors[0] ?? '#0D9488')
  const accent = resolveHex(state.accent, dataColors[1] ?? primary)
  // The user's "Background" control. On dark themes the report page uses it
  // directly. On light themes the page is rendered as a soft, gently-tinted
  // surface derived from it, so bright/elevated visual cards read as layered
  // "paper on a desk" instead of white-on-white — keeping the theme effect
  // visible (Power BI shows a light page with brighter visuals on top).
  const explicitVisualBackground = formatString(props, 'general.background.color')
  const canvasBackgroundSource = state.canvasBackgroundMode === 'custom' && state.customCanvasBackground
    ? 'custom'
    : 'theme'
  const visualBackgroundSource = state.visualBackgroundMode === 'custom' && explicitVisualBackground
    ? 'custom'
    : 'theme'
  const baseSurface = canvasBackgroundSource === 'custom'
    ? resolveHex(state.customCanvasBackground, '#FFFFFF')
    : resolveHex(state.bg, '#FFFFFF')
  const isDark = isDarkColor(baseSurface)
  // Light report page: wash the user's background toward the theme PRIMARY (not a
  // fixed grey) so switching presets visibly re-tints the canvas — Deloitte's
  // green page reads differently from Microsoft's blue page, etc. Dark themes use
  // their background directly (already high-contrast and theme-distinct), and an
  // explicit custom background is honoured verbatim (no wash) so a manually
  // picked colour applies exactly.
  const canvasBackground = effective.canvasBackground
  const baseForeground = resolveHex(state.fg, getReadableTextColor(canvasBackground))
  const readableOnCanvas = getReadableTextColor(canvasBackground)
  const foreground = baseForeground || readableOnCanvas

  const backgroundTransparency = formatNumber(props, 'general.background.transparency', 0)
  const themeVisualBackground = resolveHex(state.visualBackground, resolveHex(state.cardBackground, canvasBackground))
  // On light themes, a neutral white-ish card surface (the universal preset
  // default) gets a faint primary wash — lighter than the canvas tint, so the
  // card still reads as bright "paper" elevated above the themed page, but now
  // visibly carries the preset's hue. An explicit coloured background is kept
  // verbatim so manual visual-background changes apply exactly.
  const tintedVisualBackground = visualBackgroundSource === 'theme' && !isDark
    ? mixColor(themeVisualBackground, primary, 0.035)
    : themeVisualBackground
  const visualBase = effective.visualBackgroundColor || (visualBackgroundSource === 'custom'
    ? resolveHex(explicitVisualBackground, themeVisualBackground)
    : tintedVisualBackground)
  const visualBackground = effective.visualBackground
  const visualBackgroundAltBase = isDark ? lighten(visualBase, 5) : darken(visualBase, 3)

  const titleColor = effective.titleColor
  const labelColor = effective.labelColor
  const mutedText = isDark ? mixColor(labelColor, '#FFFFFF', 0.16) : mixColor(labelColor, '#000000', 0.08)
  const borderColor = effective.borderColor
  const gridlineColor = effective.gridlineColor
  const tableAccent = resolveHex(state.tableAccent, primary)
  const tableHeaderBackground = effective.tableHeaderBackground
  const good = effective.goodColor
  const neutral = effective.neutralColor
  const bad = effective.badColor
  const pageBackground = isDark ? darken(canvasBackground, 18) : mixColor(canvasBackground, '#CBD5E1', 0.22)
  const pageDot = isDark ? withAlpha(lighten(canvasBackground, 38), 0.24) : withAlpha(darken(canvasBackground, 22), 0.18)
  const shadow = effective.shadowCss

  return {
    pageBackground,
    canvasBackground,
    visualBackground,
    visualBackgroundAlt: transparentize(visualBackgroundAltBase, Math.min(85, backgroundTransparency + 10)),
    foreground,
    titleColor,
    titleBackground: effective.titleBackground,
    subtitleColor: effective.subtitleColor,
    labelColor,
    titleEnabled: effective.titleEnabled,
    subtitleEnabled: effective.subtitleEnabled,
    dividerEnabled: effective.dividerEnabled,
    titleFontSize: effective.titleFontSize,
    subtitleFontSize: effective.subtitleFontSize,
    labelFontSize: effective.labelFontSize,
    dataLabelFontSize: effective.dataLabelFontSize,
    calloutFontSize: effective.calloutFontSize,
    headerFontSize: effective.headerFontSize,
    titleFontWeight: effective.titleFontWeight,
    subtitleFontWeight: effective.subtitleFontWeight,
    titleFontStyle: effective.titleFontStyle,
    subtitleFontStyle: effective.subtitleFontStyle,
    titleTextDecoration: effective.titleTextDecoration,
    subtitleTextDecoration: effective.subtitleTextDecoration,
    titleAlignment: effective.titleAlignment,
    subtitleAlignment: effective.subtitleAlignment,
    titleWrap: effective.titleWrap,
    subtitleWrap: effective.subtitleWrap,
    titlePaddingTop: effective.titlePaddingTop,
    titlePaddingRight: effective.titlePaddingRight,
    titlePaddingBottom: effective.titlePaddingBottom,
    titlePaddingLeft: effective.titlePaddingLeft,
    titleSubtitleGap: effective.titleSubtitleGap,
    subtitleDividerGap: effective.subtitleDividerGap,
    titleAreaSpacing: effective.titleAreaSpacing,
    titleHeaderHeight: effective.titleHeaderHeight,
    dividerColor: effective.dividerColor,
    dividerWidth: effective.dividerWidth,
    dividerStyle: effective.dividerStyle,
    mutedText,
    borderColor,
    borderEnabled: effective.borderEnabled,
    borderWidth: effective.borderWidth,
    borderRadius: effective.borderRadius,
    shadowEnabled: effective.shadowEnabled,
    shadowColor: effective.shadowColor,
    shadowOffsetX: effective.shadowOffsetX,
    shadowOffsetY: effective.shadowOffsetY,
    shadowBlur: effective.shadowBlur,
    shadowOpacity: effective.shadowOpacity,
    shadowInset: effective.shadowInset,
    fontFamily: effective.fontFamily,
    gridlineColor,
    tableAccent,
    tableHeaderBackground,
    tableHeaderText: effective.tableHeaderText,
    tableRowAlt: effective.tableRowAlt,
    good,
    bad,
    neutral,
    dataColors,
    primary,
    secondary: dataColors[1] ?? accent,
    accent,
    shadow,
    chipBackground: isDark ? withAlpha(lighten(canvasBackground, 16), 0.22) : withAlpha(darken(canvasBackground, 12), 0.08),
    chipActiveBackground: primary,
    chipActiveText: getReadableTextColor(primary),
    cardBackground: visualBackground,
    dataLabelColor: effective.dataLabelColor,
    legendColor: effective.legendColor,
    axisLabelColor: effective.axisLabelColor,
    axisTitleColor: effective.axisTitleColor,
    plotBackground: transparentize(isDark ? mixColor(visualBase, '#000000', 0.16) : mixColor(visualBase, '#FFFFFF', 0.42), backgroundTransparency),
    plotBackgroundAlt: transparentize(isDark ? lighten(visualBase, 4) : darken(visualBase, 2), Math.min(90, backgroundTransparency + 8)),
    positiveBackground: softFill(good, isDark, 0.16),
    negativeBackground: softFill(bad, isDark, 0.14),
    neutralBackground: softFill(neutral, isDark, 0.16),
    pageDot,
    canvasShadow: isDark
      ? `0 16px 44px ${withAlpha('#000000', 0.28)}`
      : `0 12px 36px ${withAlpha(darken(canvasBackground, 60), 0.18)}, 0 2px 6px ${withAlpha(darken(canvasBackground, 60), 0.08)}`,
    effectiveCanvasBackground: canvasBackground,
    effectiveVisualBackground: visualBackground,
    canvasBackgroundSource,
    visualBackgroundSource,
  }
}

export function getDashboardThemeCssVars(theme: DashboardTheme): CSSProperties & Record<string, string | number> {
  return {
    '--workspace-bg': theme.pageBackground,
    '--workspace-dot': theme.pageDot,
    '--canvas-bg': theme.canvasBackground,
    '--dashboard-page-bg': theme.pageBackground,
    '--dashboard-card-bg': theme.cardBackground,
    '--dashboard-card-bg-alt': theme.visualBackgroundAlt,
    '--dashboard-plot-bg': theme.plotBackground,
    '--dashboard-plot-bg-alt': theme.plotBackgroundAlt,
    '--dashboard-chip-bg': theme.chipBackground,
    '--dashboard-chip-active-bg': theme.chipActiveBackground,
    '--dashboard-chip-active-text': theme.chipActiveText,
    '--dashboard-gridline': theme.gridlineColor,
    '--dashboard-positive-bg': theme.positiveBackground,
    '--dashboard-negative-bg': theme.negativeBackground,
    '--dashboard-neutral-bg': theme.neutralBackground,
    '--theme-fg': theme.foreground,
    '--theme-title': theme.titleColor,
    '--theme-title-bg': theme.titleBackground,
    '--theme-subtitle': theme.subtitleColor,
    '--theme-title-size': `${theme.titleFontSize}px`,
    '--theme-subtitle-size': `${theme.subtitleFontSize}px`,
    '--theme-label-size': `${theme.labelFontSize}px`,
    '--theme-data-label-size': `${theme.dataLabelFontSize}px`,
    '--theme-callout-size': `${theme.calloutFontSize}px`,
    '--theme-header-size': `${theme.headerFontSize}px`,
    '--theme-divider': theme.dividerColor,
    '--theme-divider-width': `${theme.dividerWidth}px`,
    '--theme-fg-muted': theme.mutedText,
    '--theme-label': theme.labelColor,
    '--theme-primary': theme.primary,
    '--theme-secondary': theme.secondary,
    '--theme-accent': theme.accent,
    '--card-bg': theme.cardBackground,
    '--card-border': theme.borderColor,
    '--card-border-width': theme.borderWidth,
    '--card-radius': `${theme.borderRadius}px`,
    '--card-shadow': theme.shadow,
    '--preview-font-family': `'${theme.fontFamily}', 'Segoe UI', sans-serif`,
    '--table-accent': theme.tableAccent,
    '--dashboard-table-header-bg': theme.tableHeaderBackground,
    '--dashboard-table-header-text': theme.tableHeaderText,
    '--dashboard-table-row-alt': theme.tableRowAlt,
    '--good': theme.good,
    '--bad': theme.bad,
    '--neutral': theme.neutral,
    '--preview-gridline-color': theme.gridlineColor,
    '--preview-axis-line': theme.borderColor,
    '--preview-axis-label-color': theme.axisLabelColor,
    '--preview-axis-title-color': theme.axisTitleColor,
    '--preview-legend-color': theme.legendColor,
    '--preview-data-label-color': theme.dataLabelColor,
  }
}
