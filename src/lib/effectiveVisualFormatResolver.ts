import type { FormatValue, ThemeState } from '@/types'
import { normalizeHexColor } from '@/lib/paletteUtils'
import { getReadableTextColor } from '@/lib/colorUtils'
import { resolveEffectiveFormat } from '@/lib/effectiveFormatResolver'
import { resolveThemeSurfaces } from '@/lib/themeSurfaceResolver'

/**
 * effectiveVisualFormatResolver
 * -----------------------------
 * One central place that answers: "what colour/font should a visual element
 * use right now?" The rule for every property is:
 *
 *     effective value = explicit user value (formatProps) if set, else theme value.
 *
 * The theme value is derived from the theme-level store fields the preset
 * system writes (`visualBackground`, `titleColor`, `labelColor`, `borderColor`,
 * `fg`, `tableAccent`, …) — never a hardcoded white/grey/black. Both the
 * Visuals-section preview (`ChartRenderer` → `formatPreview`) and the Power BI
 * export (`powerBIVisualStylesMapper`) consume this resolver so a selected
 * theme is reflected identically in the preview and the exported JSON, while
 * an explicit manual edit always wins.
 *
 * This resolver intentionally uses the RAW theme colours (no light-theme
 * "wash"); the Dashboard Preview keeps its own `dashboardThemeResolver` and is
 * untouched.
 */

export type VisualThemeInput = Pick<
  ThemeState,
  | 'dataColors'
  | 'paletteSize'
  | 'fg'
  | 'bg'
  | 'customCanvasBackground'
  | 'visualBackground'
  | 'cardBackground'
  | 'borderColor'
  | 'titleColor'
  | 'labelColor'
  | 'tableAccent'
  | 'primary'
  | 'accent'
  | 'good'
  | 'neutral'
  | 'bad'
  | 'canvasBackgroundMode'
  | 'visualBackgroundMode'
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

/** Theme-level effective default values for every visual element. */
export interface EffectiveVisualFormat {
  /** Effective visual/card background (custom override else theme). */
  background: string
  titleColor: string
  labelColor: string
  foreground: string
  axisLabelColor: string
  axisTitleColor: string
  legendColor: string
  dataLabelColor: string
  gridlineColor: string
  borderColor: string
  shapeBorderColor: string
  tableHeaderBackground: string
  tableHeaderText: string
  tableValueText: string
  cardCalloutColor: string
  cardCategoryColor: string
  fontFamily: string
  /** Per-property source flags — 'custom' when the user set an explicit value. */
  source: {
    background: 'theme' | 'custom'
    titleColor: 'theme' | 'custom'
    labelColor: 'theme' | 'custom'
    borderColor: 'theme' | 'custom'
    fontFamily: 'theme' | 'custom'
  }
}

function fpString(fp: Record<string, FormatValue>, key: string): string | undefined {
  const value = fp[key]
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Minimal slice needed to resolve the effective visual/card background. */
export type EffectiveVisualBackgroundInput = Pick<
  ThemeState,
  'visualBackground' | 'cardBackground' | 'visualBackgroundMode' | 'formatProps'
> & Partial<Pick<ThemeState, 'dataColors' | 'paletteSize' | 'primary' | 'bg' | 'customCanvasBackground' | 'canvasBackgroundMode'>>

export type EffectiveCanvasBackgroundInput = Pick<
  ThemeState,
  'bg' | 'customCanvasBackground' | 'canvasBackgroundMode' | 'formatProps'
> & Partial<Pick<ThemeState, 'dataColors' | 'paletteSize' | 'primary' | 'visualBackground' | 'cardBackground' | 'visualBackgroundMode'>>

/**
 * The effective report page/canvas background as a HEX string. In `theme` mode
 * it follows `theme.background` (`state.bg`); in `custom` mode it uses the
 * user's explicit canvas background. It never reads General > Effects >
 * Background, which is the visual/card background in Power BI.
 */
export function resolveEffectiveCanvasBackground(state: EffectiveCanvasBackgroundInput): string {
  return resolveThemeSurfaces(state).effectiveCanvasBackground
}

/**
 * The effective visual/card background as a HEX string (never rgba). In `theme`
 * mode it follows the theme's `visualBackground` (then `cardBackground`); a
 * `custom` mode means the user picked an explicit `general.background.color`.
 */
export function resolveEffectiveVisualBackground(state: EffectiveVisualBackgroundInput): string {
  return resolveThemeSurfaces(state).effectiveVisualBackground
}

/**
 * Compute the full set of theme-effective visual-format values. Every colour
 * resolves to an explicit user override when present, otherwise to the theme
 * value — never to a hardcoded literal.
 */
export function resolveEffectiveVisualFormat(state: VisualThemeInput, visualId?: string | null): EffectiveVisualFormat {
  const fp = state.formatProps

  const explicitFont = fpString(fp, 'general.typography.fontFace') ?? fpString(fp, 'general.title.fontFamily')
  const effective = resolveEffectiveFormat(state, visualId)

  const background = effective.visualBackground
  const titleColor = effective.titleColor
  const labelColor = effective.labelColor
  const borderColor = effective.borderColor
  const foreground = effective.foreground
  const tableAccent = normalizeHexColor(state.tableAccent, normalizeHexColor(state.primary, '#0D9488'))
  const primary = effective.primary
  const fontFamily = effective.fontFamily
  const gridlineColor = effective.gridlineColor
  const tableHeaderBackground = effective.tableHeaderBackground

  return {
    background,
    titleColor,
    labelColor,
    foreground,
    // Axis / legend labels follow the theme label colour; data values follow the
    // (more prominent) foreground. All theme-derived, no hardcoded grey.
    axisLabelColor: effective.axisLabelColor,
    axisTitleColor: effective.axisTitleColor,
    legendColor: effective.legendColor,
    dataLabelColor: effective.dataLabelColor,
    gridlineColor,
    borderColor,
    shapeBorderColor: borderColor,
    tableHeaderBackground,
    tableHeaderText: getReadableTextColor(tableHeaderBackground),
    tableValueText: foreground,
    cardCalloutColor: primary,
    cardCategoryColor: labelColor,
    fontFamily,
    source: {
      background: effective.source.visualBackground,
      titleColor: effective.source.titleColor,
      labelColor: effective.source.labelColor,
      borderColor: effective.source.borderColor,
      fontFamily: explicitFont ? 'custom' : 'theme',
    },
  }
}

/** Subset of theme-effective colours used as fallbacks by the preview resolver. */
export interface PreviewThemeDefaults {
  background: string
  axisLabelColor: string
  axisTitleColor: string
  legendColor: string
  dataLabelColor: string
  gridlineColor: string
  shapeBorderColor: string
  titleColor: string
  foreground: string
  fontFamily: string
  labelFontSize: number
  dataLabelFontSize: number
}

/** Build the preview fallback defaults from the theme-effective format. */
export function resolvePreviewThemeDefaults(state: VisualThemeInput, visualId?: string | null): PreviewThemeDefaults {
  const e = resolveEffectiveVisualFormat(state, visualId)
  const effective = resolveEffectiveFormat(state, visualId)
  return {
    background: e.background,
    axisLabelColor: e.axisLabelColor,
    axisTitleColor: e.axisTitleColor,
    legendColor: e.legendColor,
    dataLabelColor: e.dataLabelColor,
    gridlineColor: e.gridlineColor,
    shapeBorderColor: e.shapeBorderColor,
    titleColor: e.titleColor,
    foreground: e.foreground,
    fontFamily: e.fontFamily,
    labelFontSize: effective.labelFontSize,
    dataLabelFontSize: effective.dataLabelFontSize,
  }
}
