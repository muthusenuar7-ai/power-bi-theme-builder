import { getPaletteBySize, normalizeHexColor, normalizePaletteSize } from '@/lib/paletteUtils'
import type { PaletteSize, PresetTheme, ThemeCategory } from '@/types'

export const PREMIUM_THEME_CATEGORIES = [
  'Corporate',
  'Premium',
  'Modern',
  'Minimal',
  'Vibrant',
  'Pastel',
  'Earthy',
  'Dark',
  'Monochrome',
  'Editorial',
] as const

export type PremiumThemeCategory = (typeof PREMIUM_THEME_CATEGORIES)[number]

const CATEGORY_SET = new Set<string>(PREMIUM_THEME_CATEGORIES)
const HEX_COLOR = /^#([0-9A-F]{6})$/i

export const REQUIRED_POWERBI_ROLE_COLORS = [
  'dashboardBackground',
  'pageBackground',
  'visualBackground',
  'cardBackground',
  'primaryColor',
  'accentColor',
  'fontColorPrimary',
  'fontColorSecondary',
  'titleFontColor',
  'gridLineColor',
  'borderColor',
  'dividerColor',
  'kpiGood',
  'kpiBad',
  'kpiNeutral',
  'highlight',
  'tooltipBackground',
  'tableHeaderBackground',
  'tableRowAlt',
] as const

type RequiredPowerBIRole = (typeof REQUIRED_POWERBI_ROLE_COLORS)[number]

export interface PremiumPowerBIRoles extends Record<RequiredPowerBIRole, string> {
  fontColorOnPrimary?: string
}

export interface PremiumThemePalette {
  id: string
  name: string
  category: string
  categories: string[]
  dataColors: string[]
  powerbi: PremiumPowerBIRoles
  gradientType?: string
  harmony?: string
  hue?: string
  profile?: string
  theme?: string
  mode?: string
  size?: number
}

export interface PremiumThemeLibrary {
  version?: string
  paletteSize?: number
  count?: number
  categoryList?: string[]
  palettes?: unknown[]
}

export interface ThemeImportIssue {
  index: number
  id?: string
  name?: string
  errors: string[]
}

export interface PremiumThemeImportReport {
  total: number
  valid: number
  invalid: number
  duplicate: number
  categories: string[]
  paletteSize: number | null
  issues: ThemeImportIssue[]
}

export interface PremiumThemeImportResult {
  presets: PresetTheme[]
  report: PremiumThemeImportReport
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isValidHexColor(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const raw = value.trim()
  if (/^#?[0-9A-F]{3}$/i.test(raw)) return true
  return /^#?[0-9A-F]{6}$/i.test(raw)
}

function requiredString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
}

function normalizeCategory(value: unknown): PremiumThemeCategory {
  const category = requiredString(value)
  return category && CATEGORY_SET.has(category) ? (category as PremiumThemeCategory) : 'Modern'
}

function normalizeCategories(primaryCategory: PremiumThemeCategory, value: unknown): string[] {
  const categories = getStringArray(value)
    .map((category) => normalizeCategory(category))
    .filter((category, index, all) => all.indexOf(category) === index)
  return categories.length ? categories : [primaryCategory]
}

function extractPalettes(json: unknown): unknown[] {
  if (Array.isArray(json)) return json
  if (isRecord(json) && Array.isArray(json.palettes)) return json.palettes
  return []
}

function readPowerBIRoles(value: unknown): PremiumPowerBIRoles | null {
  if (!isRecord(value)) return null

  const roles: Partial<PremiumPowerBIRoles> = {}
  for (const key of REQUIRED_POWERBI_ROLE_COLORS) {
    const color = value[key]
    if (isValidHexColor(color)) roles[key] = normalizeHexColor(color)
  }

  const fontColorOnPrimary = value.fontColorOnPrimary
  if (isValidHexColor(fontColorOnPrimary)) roles.fontColorOnPrimary = normalizeHexColor(fontColorOnPrimary)

  return REQUIRED_POWERBI_ROLE_COLORS.every((key) => roles[key]) ? roles as PremiumPowerBIRoles : null
}

export function validatePremiumPalette(value: unknown, index: number): ThemeImportIssue | null {
  const errors: string[] = []

  if (!isRecord(value)) {
    return { index, errors: ['Palette entry must be an object.'] }
  }

  const id = requiredString(value.id)
  const name = requiredString(value.name)
  if (!id) errors.push('Missing id.')
  if (!name) errors.push('Missing name.')

  const category = requiredString(value.category)
  if (!category) errors.push('Missing category.')
  else if (!CATEGORY_SET.has(category)) errors.push(`Unsupported category "${category}".`)

  const categories = getStringArray(value.categories)
  if (!categories.length) errors.push('Missing categories array.')
  for (const entry of categories) {
    if (!CATEGORY_SET.has(entry)) errors.push(`Unsupported categories entry "${entry}".`)
  }

  const dataColors = Array.isArray(value.dataColors) ? value.dataColors : []
  if (!dataColors.length) errors.push('Missing dataColors array.')
  dataColors.forEach((color, colorIndex) => {
    if (!isValidHexColor(color)) errors.push(`Invalid dataColors[${colorIndex}] hex color.`)
  })

  const size = typeof value.size === 'number' ? value.size : undefined
  if (size !== undefined && size !== dataColors.length) {
    errors.push(`Size ${size} does not match dataColors length ${dataColors.length}.`)
  }

  if (!isRecord(value.powerbi)) {
    errors.push('Missing powerbi role object.')
  } else {
    for (const key of REQUIRED_POWERBI_ROLE_COLORS) {
      if (!isValidHexColor(value.powerbi[key])) errors.push(`Invalid powerbi.${key} hex color.`)
    }
  }

  return errors.length ? { index, id: id ?? undefined, name: name ?? undefined, errors } : null
}

export function mapPremiumPaletteToPreset(value: unknown, index: number, source: PresetTheme['source'] = 'premium'): PresetTheme | null {
  if (validatePremiumPalette(value, index) || !isRecord(value)) return null

  const powerbi = readPowerBIRoles(value.powerbi)
  if (!powerbi) return null

  const id = requiredString(value.id) ?? `premium-theme-${index + 1}`
  const name = requiredString(value.name) ?? `Premium Theme ${index + 1}`
  const category = normalizeCategory(value.category)
  const categories = normalizeCategories(category, value.categories)
  const dataColors = getPaletteBySize(getStringArray(value.dataColors), 10)
  const paletteSizeDefault = normalizePaletteSize(value.size, 10)
  const themeMode = requiredString(value.theme) ?? requiredString(value.mode) ?? undefined

  return {
    id,
    name,
    category: category as ThemeCategory,
    categories,
    description: [
      requiredString(value.profile),
      requiredString(value.harmony),
      requiredString(value.hue),
      themeMode,
    ].filter(Boolean).join(' ') || `${category} premium 10-color Power BI palette.`,
    dataColorsFull: dataColors,
    dataColors,
    paletteSize: dataColors.length,
    background: normalizeHexColor(powerbi.dashboardBackground),
    dashboardBackground: normalizeHexColor(powerbi.dashboardBackground),
    pageBackground: normalizeHexColor(powerbi.pageBackground),
    foreground: normalizeHexColor(powerbi.fontColorPrimary),
    muted: normalizeHexColor(powerbi.fontColorSecondary),
    tableAccent: normalizeHexColor(powerbi.primaryColor),
    good: normalizeHexColor(powerbi.kpiGood),
    neutral: normalizeHexColor(powerbi.kpiNeutral),
    bad: normalizeHexColor(powerbi.kpiBad),
    visualBackground: normalizeHexColor(powerbi.visualBackground),
    cardBackground: normalizeHexColor(powerbi.cardBackground),
    borderColor: normalizeHexColor(powerbi.borderColor),
    titleColor: normalizeHexColor(powerbi.titleFontColor),
    labelColor: normalizeHexColor(powerbi.fontColorPrimary),
    primaryColor: normalizeHexColor(powerbi.primaryColor),
    accentColor: normalizeHexColor(powerbi.accentColor),
    gridlineColor: normalizeHexColor(powerbi.gridLineColor),
    dividerColor: normalizeHexColor(powerbi.dividerColor),
    highlight: normalizeHexColor(powerbi.highlight),
    tooltipBackground: normalizeHexColor(powerbi.tooltipBackground),
    tableHeaderBackground: normalizeHexColor(powerbi.tableHeaderBackground),
    tableRowAlt: normalizeHexColor(powerbi.tableRowAlt),
    gradientType: requiredString(value.gradientType) ?? undefined,
    harmony: requiredString(value.harmony) ?? undefined,
    hue: requiredString(value.hue) ?? undefined,
    profile: requiredString(value.profile) ?? undefined,
    mode: themeMode,
    theme: themeMode,
    source,
    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,
    paletteSizeDefault: paletteSizeDefault as PaletteSize,
    cat: category as ThemeCategory,
    colors: dataColors,
    bg: normalizeHexColor(powerbi.dashboardBackground),
    fg: normalizeHexColor(powerbi.fontColorPrimary),
  }
}

export function validatePremiumThemeJson(json: unknown): PremiumThemeImportResult {
  const palettes = extractPalettes(json)
  const presets: PresetTheme[] = []
  const issues: ThemeImportIssue[] = palettes.length
    ? []
    : [{ index: -1, errors: ['Import JSON must be an array or an object with a palettes array.'] }]

  palettes.forEach((entry, index) => {
    const issue = validatePremiumPalette(entry, index)
    if (issue) {
      issues.push(issue)
      return
    }

    const preset = mapPremiumPaletteToPreset(entry, index, 'admin')
    if (preset) presets.push(preset)
  })

  const categories = Array.from(new Set(presets.flatMap((preset) => preset.categories ?? [preset.category]))).sort()
  const paletteSize = isRecord(json) && typeof json.paletteSize === 'number' ? json.paletteSize : null

  return {
    presets,
    report: {
      total: palettes.length,
      valid: presets.length,
      invalid: issues.length,
      duplicate: 0,
      categories,
      paletteSize,
      issues,
    },
  }
}

export function mapPremiumThemePresets(json: unknown): PresetTheme[] {
  return validatePremiumThemeJson(json).presets.map((preset) => ({ ...preset, source: 'premium' }))
}
