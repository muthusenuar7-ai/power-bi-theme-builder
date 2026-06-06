import type { FormatValue, PaletteSize, ThemeColorMode } from '@/types'
import { darken, getReadableTextColor, getRelativeLuminance, hexToRgb, lighten, mixColor } from '@/lib/colorUtils'
import { normalizeHexColor } from '@/lib/paletteUtils'

export interface ThemeSurfaceInput {
  dataColors?: string[]
  paletteSize?: PaletteSize
  primary?: string
  bg?: string
  customCanvasBackground?: string | null
  canvasBackgroundMode?: ThemeColorMode
  visualBackground?: string
  cardBackground?: string
  visualBackgroundMode?: ThemeColorMode
  borderColor?: string
  fg?: string
  titleColor?: string
  labelColor?: string
  formatProps: Record<string, FormatValue>
}

export interface ThemeSurfaces {
  rawVisualBackground: string
  effectiveCanvasBackground: string
  effectiveOutspaceBackground: string
  effectiveVisualBackground: string
  effectiveTitleBackground: string
  effectiveBorderColor: string
  effectiveForeground: string
  effectiveTitleColor: string
  effectiveLabelColor: string
  primary: string
  source: {
    canvasBackground: 'theme' | 'custom'
    visualBackground: 'theme' | 'custom'
    titleBackground: 'theme' | 'custom'
    borderColor: 'theme' | 'custom'
    titleColor: 'theme' | 'custom'
    labelColor: 'theme' | 'custom'
  }
}

function formatString(props: Record<string, FormatValue>, key: string): string | undefined {
  const value = props[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function resolveHex(value: unknown, fallback: string): string {
  return normalizeHexColor(value, fallback)
}

function isDefaultWhite(value: string | undefined): boolean {
  return Boolean(value && resolveHex(value, '#FFFFFF') === '#FFFFFF')
}

function isTooNeutralVisualSurface(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturationApprox = max === 0 ? 0 : (max - min) / max
  return getRelativeLuminance(hex) > 0.82 && saturationApprox < 0.08
}

function deriveCanvasBackground(baseCanvas: string, primary: string, source: 'theme' | 'custom'): string {
  // Custom backgrounds (and any dark canvas) are used verbatim.
  if (source !== 'theme') return baseCanvas
  const lum = getRelativeLuminance(baseCanvas)
  // A theme with a real, distinct background keeps it EXACTLY — no darkening.
  // Only a near-white canvas (flat-white corporate themes) gets a faint hue
  // tint so it still reads as themed, and we tint toward a LIGHTENED primary so
  // the page never darkens even when the brand colour is very dark.
  if (lum < 0.92) return baseCanvas
  return mixColor(baseCanvas, lighten(primary, 60), 0.06)
}

function deriveOutspaceBackground(canvasBackground: string): string {
  const isDarkCanvas = getRelativeLuminance(canvasBackground) < 0.35
  return isDarkCanvas
    ? darken(canvasBackground, 18)
    : mixColor(canvasBackground, '#CBD5E1', 0.22)
}

function deriveVisualBackground(rawVisualBackground: string, primary: string, source: 'theme' | 'custom'): string {
  if (source === 'custom') return rawVisualBackground
  return isTooNeutralVisualSurface(rawVisualBackground)
    ? mixColor(rawVisualBackground, primary, 0.04)
    : rawVisualBackground
}

export function resolveThemeSurfaces(state: ThemeSurfaceInput): ThemeSurfaces {
  const props = state.formatProps
  const activePalette = state.dataColors ?? []
  const primary = resolveHex(state.primary, activePalette[0] ?? '#0D9488')

  const canvasBackgroundSource = state.canvasBackgroundMode === 'custom' && state.customCanvasBackground
    ? 'custom'
    : 'theme'
  const baseCanvas = canvasBackgroundSource === 'custom'
    ? resolveHex(state.customCanvasBackground, '#FFFFFF')
    : resolveHex(state.bg, '#FFFFFF')
  const effectiveCanvasBackground = deriveCanvasBackground(baseCanvas, primary, canvasBackgroundSource)
  const effectiveOutspaceBackground = deriveOutspaceBackground(effectiveCanvasBackground)

  const explicitVisualBackground = formatString(props, 'general.background.color')
  const visualBackgroundSource = state.visualBackgroundMode === 'custom' && explicitVisualBackground
    ? 'custom'
    : 'theme'
  const rawVisualBackground = visualBackgroundSource === 'custom'
    ? resolveHex(explicitVisualBackground, '#FFFFFF')
    : resolveHex(state.visualBackground, resolveHex(state.cardBackground, effectiveCanvasBackground))
  const effectiveVisualBackground = deriveVisualBackground(rawVisualBackground, primary, visualBackgroundSource)

  const explicitTitleBackground = formatString(props, 'general.title.background')
  const titleBackgroundSource = explicitTitleBackground && !isDefaultWhite(explicitTitleBackground)
    ? 'custom'
    : 'theme'
  const effectiveTitleBackground = titleBackgroundSource === 'custom'
    ? resolveHex(explicitTitleBackground, effectiveVisualBackground)
    : effectiveVisualBackground

  const explicitBorder = formatString(props, 'general.border.color')
  const effectiveBorderColor = resolveHex(explicitBorder ?? state.borderColor, mixColor(effectiveVisualBackground, '#000000', 0.12))
  const effectiveForeground = resolveHex(state.fg, getReadableTextColor(effectiveVisualBackground))
  const explicitTitleColor = formatString(props, 'general.title.fontColor')
  const explicitLabelColor = formatString(props, 'general.label.fontColor')
  const effectiveTitleColor = resolveHex(explicitTitleColor ?? state.titleColor, effectiveForeground)
  const effectiveLabelColor = resolveHex(explicitLabelColor ?? state.labelColor, effectiveForeground)

  return {
    rawVisualBackground: resolveHex(rawVisualBackground, '#FFFFFF'),
    effectiveCanvasBackground: resolveHex(effectiveCanvasBackground, '#FFFFFF'),
    effectiveOutspaceBackground: resolveHex(effectiveOutspaceBackground, effectiveCanvasBackground),
    effectiveVisualBackground: resolveHex(effectiveVisualBackground, rawVisualBackground),
    effectiveTitleBackground: resolveHex(effectiveTitleBackground, effectiveVisualBackground),
    effectiveBorderColor: resolveHex(effectiveBorderColor, '#E2E8F0'),
    effectiveForeground: resolveHex(effectiveForeground, '#252423'),
    effectiveTitleColor: resolveHex(effectiveTitleColor, effectiveForeground),
    effectiveLabelColor: resolveHex(effectiveLabelColor, effectiveForeground),
    primary,
    source: {
      canvasBackground: canvasBackgroundSource,
      visualBackground: visualBackgroundSource,
      titleBackground: titleBackgroundSource,
      borderColor: explicitBorder ? 'custom' : 'theme',
      titleColor: explicitTitleColor ? 'custom' : 'theme',
      labelColor: explicitLabelColor ? 'custom' : 'theme',
    },
  }
}
