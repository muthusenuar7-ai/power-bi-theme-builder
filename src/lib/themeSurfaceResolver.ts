import type { FormatValue, PaletteSize, ThemeColorMode } from '@/types'
import { darken, isDarkColor, mixColor } from '@/lib/colorUtils'
import { normalizeHexColor } from '@/lib/paletteUtils'
import { resolveSurfaceSet, type SurfaceLocks } from '@/lib/themeSurfaceFormula'

export interface ThemeSurfaceInput {
  dataColors?: string[]
  paletteSize?: PaletteSize
  primary?: string
  accent?: string
  bg?: string
  customCanvasBackground?: string | null
  canvasBackgroundMode?: ThemeColorMode
  visualBackground?: string
  cardBackground?: string
  visualBackgroundMode?: ThemeColorMode
  borderColor?: string
  gridlineColor?: string
  tableHeaderBackground?: string
  tableRowAlt?: string
  tableAccent?: string
  good?: string
  neutral?: string
  bad?: string
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
  effectiveGridlineColor: string
  effectiveTableHeaderBackground: string
  effectiveTableRowAlt: string
  effectiveForeground: string
  effectiveTitleColor: string
  effectiveLabelColor: string
  effectiveKpiGood: string
  effectiveKpiBad: string
  effectiveKpiNeutral: string
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

function deriveOutspaceBackground(canvasBackground: string): string {
  return isDarkColor(canvasBackground)
    ? darken(canvasBackground, 18)
    : mixColor(canvasBackground, '#CBD5E1', 0.22)
}

/**
 * Resolves the theme's effective surfaces through the ONE standard colour
 * formula (themeSurfaceFormula): palette-aware canvas tint, guaranteed
 * canvas↔visual separation, soft borders/gridlines, table surfaces, readable
 * text and visible KPI colours. Explicit user picks ("custom" modes and
 * format-pane colours) are locked and pass through verbatim. Every consumer —
 * dashboard preview, visuals preview, general property defaults and the
 * Power BI JSON export — reads these same resolved values.
 */
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

  const explicitVisualBackground = formatString(props, 'general.background.color')
  const visualBackgroundSource = state.visualBackgroundMode === 'custom' && explicitVisualBackground
    ? 'custom'
    : 'theme'
  const rawVisualBackground = visualBackgroundSource === 'custom'
    ? resolveHex(explicitVisualBackground, '#FFFFFF')
    : resolveHex(state.visualBackground, resolveHex(state.cardBackground, baseCanvas))

  const explicitTitleBackground = formatString(props, 'general.title.background')
  const titleBackgroundSource = explicitTitleBackground && !isDefaultWhite(explicitTitleBackground)
    ? 'custom'
    : 'theme'
  const explicitBorder = formatString(props, 'general.border.color')
  const explicitTitleColor = formatString(props, 'general.title.fontColor')
  const explicitLabelColor = formatString(props, 'general.label.fontColor')

  const locks: SurfaceLocks = {
    canvasBackground: canvasBackgroundSource === 'custom',
    visualBackground: visualBackgroundSource === 'custom',
    titleBackground: titleBackgroundSource === 'custom',
    borderColor: Boolean(explicitBorder),
    titleColor: Boolean(explicitTitleColor),
    labelColor: Boolean(explicitLabelColor),
  }

  const set = resolveSurfaceSet(
    {
      canvasBackground: baseCanvas,
      visualBackground: rawVisualBackground,
      titleBackground: titleBackgroundSource === 'custom' ? resolveHex(explicitTitleBackground, rawVisualBackground) : undefined,
      borderColor: explicitBorder ?? state.borderColor,
      gridlineColor: state.gridlineColor,
      tableHeaderBackground: state.tableHeaderBackground ?? state.tableAccent,
      tableRowAlt: state.tableRowAlt,
      foreground: state.fg,
      titleColor: explicitTitleColor ?? state.titleColor,
      labelColor: explicitLabelColor ?? state.labelColor,
      kpiGood: state.good,
      kpiBad: state.bad,
      kpiNeutral: state.neutral,
    },
    { primary, accent: state.accent },
    locks,
  )

  const effectiveOutspaceBackground = deriveOutspaceBackground(set.canvasBackground)

  return {
    rawVisualBackground: resolveHex(rawVisualBackground, '#FFFFFF'),
    effectiveCanvasBackground: set.canvasBackground,
    effectiveOutspaceBackground: resolveHex(effectiveOutspaceBackground, set.canvasBackground),
    effectiveVisualBackground: set.visualBackground,
    effectiveTitleBackground: set.titleBackground,
    effectiveBorderColor: set.borderColor,
    effectiveGridlineColor: set.gridlineColor,
    effectiveTableHeaderBackground: set.tableHeaderBackground,
    effectiveTableRowAlt: set.tableRowAlt,
    effectiveForeground: set.foreground,
    effectiveTitleColor: set.titleColor,
    effectiveLabelColor: set.labelColor,
    effectiveKpiGood: set.kpiGood,
    effectiveKpiBad: set.kpiBad,
    effectiveKpiNeutral: set.kpiNeutral,
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
