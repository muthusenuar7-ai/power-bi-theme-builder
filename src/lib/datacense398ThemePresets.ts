import themeLibrary from '@/data/datacense_398_theme_studio_ready_v5_compact.json'
import { normalizeHexColor } from '@/lib/paletteUtils'
import type { PresetTheme, ThemeCategory } from '@/types'

type UnknownRecord = Record<string, unknown>

type ModeSurface = {
  canvasBackground?: string
  visualBackground?: string
  titleBackground?: string
  fontPrimary?: string
  fontSecondary?: string
  border?: string
  tableHeader?: string
  tableRowAlt?: string
  kpiGood?: string
  kpiBad?: string
  kpiNeutral?: string
}

type Datacense398Theme = {
  themeId?: string
  themeName?: string
  category?: string
  filterTags?: string[]
  paletteProfile?: {
    dominantFamily?: string
    families?: string[]
  }
  paletteColors?: string[]
  dataColors?: string[]
  primary?: string
  secondary?: string
  accent?: string
  lightMode?: ModeSurface
  darkMode?: ModeSurface
  themeStudioSurfaces?: {
    light?: Partial<ModeSurface> & {
      panelBackground?: string
      tintBase?: string
    }
    dark?: Partial<ModeSurface> & {
      panelBackground?: string
      tintBase?: string
    }
  }
  gradientPreview?: {
    stops?: string[]
    css135?: string
  }
  powerbiThemeLight?: {
    tableAccent?: string
    name?: string
  }
  powerbiThemeDark?: {
    tableAccent?: string
    name?: string
  }
  recommendedDefaultMode?: 'light' | 'dark'
  patterns?: string[]
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getThemes(): Datacense398Theme[] {
  if (!isRecord(themeLibrary) || !Array.isArray(themeLibrary.themes)) return []
  return themeLibrary.themes.filter(isRecord) as Datacense398Theme[]
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function hex(value: unknown, fallback: string): string {
  return normalizeHexColor(value, fallback)
}

function hexArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((color): color is string => typeof color === 'string')
    .map((color) => normalizeHexColor(color, '#000000'))
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const clean = value?.trim()
    if (!clean) continue
    const key = clean.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(clean)
  }
  return out
}

const CATEGORY_TO_THEME_CATEGORY: Record<string, ThemeCategory> = {
  Corporate: 'Corporate',
  'Executive / Finance': 'Finance',
  'Minimal / Monochrome': 'Minimal',
  'Nature / Sustainability': 'Earthy',
  'Pastel Professional': 'Pastel',
  'Soft / Pastel': 'Pastel',
  'Vivid / Creative': 'Vibrant',
  General: 'Modern',
}

function toThemeCategory(category: string): ThemeCategory {
  return CATEGORY_TO_THEME_CATEGORY[category] ?? 'Modern'
}

const COLOR_FAMILIES = ['Blue', 'Orange', 'Red', 'Green', 'Neutral', 'Gold', 'Teal', 'Rose', 'Black', 'Violet'] as const

function dominantFamilyFor(theme: Datacense398Theme): string {
  const explicit = str(theme.paletteProfile?.dominantFamily)
  if (explicit) return explicit

  const haystack = [
    ...(theme.paletteProfile?.families ?? []),
    ...(theme.filterTags ?? []),
    ...(theme.patterns ?? []),
    str(theme.category),
  ].join(' ').toLowerCase()

  for (const family of COLOR_FAMILIES) {
    if (haystack.includes(family.toLowerCase())) return family
  }

  return 'Neutral'
}

function modeFor(theme: Datacense398Theme): 'light' | 'dark' {
  return theme.recommendedDefaultMode === 'dark' ? 'dark' : 'light'
}

function surfaceFor(theme: Datacense398Theme): ModeSurface {
  const mode = modeFor(theme)
  const modeSurface = mode === 'dark' ? theme.darkMode : theme.lightMode
  const studioSurface = mode === 'dark' ? theme.themeStudioSurfaces?.dark : theme.themeStudioSurfaces?.light
  return {
    ...modeSurface,
    ...studioSurface,
    visualBackground: studioSurface?.visualBackground ?? modeSurface?.visualBackground,
    titleBackground: studioSurface?.titleBackground ?? modeSurface?.titleBackground ?? modeSurface?.visualBackground,
    border: studioSurface?.border ?? modeSurface?.border,
    tableHeader: studioSurface?.tableHeader ?? modeSurface?.tableHeader,
    tableRowAlt: studioSurface?.tableRowAlt ?? modeSurface?.tableRowAlt,
  }
}

function mapDatacense398Theme(theme: Datacense398Theme): PresetTheme | null {
  const id = str(theme.themeId)
  const name = str(theme.themeName, id)
  const dataColors = hexArray(theme.dataColors)
  if (!id || !name || dataColors.length === 0) return null

  const paletteColors = hexArray(theme.paletteColors)
  const colors = dataColors
  const mode = modeFor(theme)
  const surface = surfaceFor(theme)
  const rawCategory = str(theme.category, 'General')
  const dominantFamily = dominantFamilyFor(theme)
  const category = toThemeCategory(rawCategory)
  const primary = hex(theme.primary, colors[0])
  const secondary = hex(theme.secondary, colors[1] ?? primary)
  const accent = hex(theme.accent, colors[2] ?? secondary)
  const canvasBackground = hex(surface.canvasBackground, mode === 'dark' ? '#111827' : '#F8FAFC')
  const visualBackground = hex(surface.visualBackground, canvasBackground)
  const titleBackground = hex(surface.titleBackground, visualBackground)
  const foreground = hex(surface.fontPrimary, mode === 'dark' ? '#F8FAFC' : '#111827')
  const labelColor = hex(surface.fontSecondary, mode === 'dark' ? '#CBD5E1' : '#64748B')
  const borderColor = hex(surface.border, mode === 'dark' ? '#334155' : '#E2E8F0')
  const tableHeader = hex(surface.tableHeader, titleBackground)
  const tableRowAlt = hex(surface.tableRowAlt, visualBackground)
  const tableAccent = hex(
    mode === 'dark' ? theme.powerbiThemeDark?.tableAccent : theme.powerbiThemeLight?.tableAccent,
    primary,
  )
  const tags = uniqueStrings([
    ...(theme.filterTags ?? []),
    ...(theme.patterns ?? []),
    rawCategory,
    dominantFamily,
    mode,
    ...colors,
    ...paletteColors,
  ])

  return {
    id,
    name,
    category,
    categories: [rawCategory],
    collectionClass: rawCategory,
    tags,
    recommendedFor: theme.filterTags ?? [],
    description: '',

    dataColorsFull: colors,
    dataColors: colors,
    colors,
    paletteSize: colors.length,
    paletteSizeDefault: colors.length >= 10 ? 10 : colors.length >= 7 ? 7 : 5,

    background: canvasBackground,
    bg: canvasBackground,
    dashboardBackground: canvasBackground,
    pageBackground: canvasBackground,
    foreground,
    fg: foreground,
    muted: labelColor,

    visualBackground,
    cardBackground: visualBackground,
    tooltipBackground: visualBackground,
    tableRowAlt,
    tableHeaderBackground: tableHeader,

    borderColor,
    gridlineColor: borderColor,
    dividerColor: borderColor,

    titleColor: foreground,
    labelColor,
    primaryColor: primary,
    accentColor: accent,
    highlight: accent,
    tableAccent,

    good: hex(surface.kpiGood, '#16A34A'),
    neutral: hex(surface.kpiNeutral, '#F59E0B'),
    bad: hex(surface.kpiBad, '#DC2626'),

    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,

    mode,
    theme: mode,
    profile: (theme.patterns ?? []).join(', ') || rawCategory,
    hue: dominantFamily,
    harmony: (theme.patterns ?? []).join(', '),
    gradientType: theme.gradientPreview?.css135 ?? '',
    source: 'premium',
    cat: category,
  }
}

export const DATACENSE_398_THEME_LIBRARY_INFO = {
  version: str((themeLibrary as UnknownRecord).version, 'unknown'),
  libraryName: str((themeLibrary as UnknownRecord).libraryName, 'Datacense 398 Theme Library'),
  declaredThemeCount: typeof (themeLibrary as UnknownRecord).themeCount === 'number'
    ? (themeLibrary as UnknownRecord).themeCount as number
    : 0,
}

export const THEME_PRESETS: PresetTheme[] = getThemes()
  .map(mapDatacense398Theme)
  .filter((preset): preset is PresetTheme => preset !== null)

export const THEME_TIERS: string[] = (() => {
  const ordered: string[] = []
  for (const theme of THEME_PRESETS) {
    const category = theme.categories?.[0] ?? theme.category
    if (!ordered.includes(category)) ordered.push(category)
  }
  return ordered
})()
