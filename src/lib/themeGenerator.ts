import type { PaletteSize, PowerBIColorObject, PowerBITheme, ThemeImportPatch, ThemeState, ValidationResult } from '@/types'
import { getPaletteBySize, inferPaletteSizeFromDataColors } from '@/lib/paletteUtils'
import { buildVisualStyles, normalizeHex } from '@/lib/powerBIVisualStylesMapper'
import { validatePowerBITheme } from '@/lib/validatePowerBITheme'
import { resolveThemeSurfaces } from '@/lib/themeSurfaceResolver'
import { resolveEffectiveFormat } from '@/lib/effectiveFormatResolver'
import { typographyDefaultsFromTextClasses } from '@/lib/typographyDefaults'

const FALLBACK_COLORS = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#10B981', '#F97316', '#EC4899', '#2563EB', '#64748B',
]

const HEX_3 = /^#?([0-9a-fA-F]{3})$/
const HEX_6 = /^#?([0-9a-fA-F]{6})$/

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isValidHex(value: unknown): value is string {
  return typeof value === 'string' && (HEX_3.test(value.trim()) || HEX_6.test(value.trim()))
}

function normalizeRootHex(value: unknown, fallback = '#000000'): string {
  return normalizeHex(value, fallback)
}

function solidColor(color: string): PowerBIColorObject {
  return { solid: { color: normalizeRootHex(color) } }
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function formatString(state: ThemeState, key: string, fallback: string): string {
  return stringValue(state.formatProps[key], fallback)
}

function formatNumber(state: ThemeState, key: string, fallback: number): number {
  return numberValue(state.formatProps[key], fallback)
}

function formatColor(state: ThemeState, key: string, fallback: string): string {
  return normalizeRootHex(state.formatProps[key], fallback)
}

function activePalette(state: ThemeState): string[] {
  return state.dataColors.length
    ? state.dataColors.map((color, index) => normalizeRootHex(color, FALLBACK_COLORS[index % FALLBACK_COLORS.length]))
    : [...FALLBACK_COLORS]
}

function extractColor(value: unknown): string | undefined {
  if (isValidHex(value)) return normalizeRootHex(value)

  if (isRecord(value) && isRecord(value.solid) && isValidHex(value.solid.color)) {
    return normalizeRootHex(value.solid.color)
  }

  return undefined
}

function extractVisualStyleColor(theme: UnknownRecord, visualType: string, objectName: string): string | undefined {
  const visualStyles = theme.visualStyles
  if (!isRecord(visualStyles)) return undefined

  const visual = visualStyles[visualType]
  if (!isRecord(visual)) return undefined

  const wildcard = visual['*']
  if (!isRecord(wildcard)) return undefined

  const cards = wildcard[objectName]
  if (!Array.isArray(cards)) return undefined

  const firstCard = cards[0]
  return isRecord(firstCard) ? extractColor(firstCard.color) : undefined
}

function extractPageBackground(theme: UnknownRecord): string | undefined {
  return extractVisualStyleColor(theme, 'page', 'background') ?? extractColor(theme.background)
}

async function parseThemeInput(input: File | string | unknown): Promise<unknown> {
  if (typeof File !== 'undefined' && input instanceof File) {
    return JSON.parse(await input.text()) as unknown
  }

  if (typeof input === 'string') {
    return JSON.parse(input) as unknown
  }

  return input
}

export function generateThemeJSON(state: ThemeState): PowerBITheme {
  const colors = activePalette(state)
  const surfaces = resolveThemeSurfaces(state)
  const effective = resolveEffectiveFormat(state)
  const bg = effective.canvasBackground
  const fg = effective.foreground
  const primary = normalizeRootHex(state.primary, colors[0] ?? FALLBACK_COLORS[0])
  const tableAccent = normalizeRootHex(state.tableAccent, primary)
  const good = normalizeRootHex(state.good, '#10B981')
  const neutral = normalizeRootHex(state.neutral, '#F59E0B')
  const bad = normalizeRootHex(state.bad, '#EF4444')
  const visualBackground = effective.visualBackgroundColor
  const borderColor = effective.borderColor
  const titleColor = effective.titleColor
  const labelColor = effective.labelColor
  const fontFace = formatString(
    state,
    'general.typography.fontFace',
    formatString(state, 'general.title.fontFamily', 'Segoe UI'),
  )
  const titleSize = formatNumber(state, 'general.title.fontSize', 12)
  const headerSize = formatNumber(state, 'general.header.fontSize', 12)
  const labelSize = formatNumber(state, 'general.label.fontSize', 10)
  const calloutSize = formatNumber(state, 'general.callout.fontSize', 36)

  return {
    name: state.themeName.trim() || 'Datacense Power BI Theme',
    dataColors: colors,
    // Root structural `background` = the report page/canvas surface (the slot
    // Power BI uses for page background); the visual/card surface is carried in
    // `secondaryBackground` and the per-visual `background` card.
    background: bg,
    foreground: fg,
    tableAccent,
    good,
    neutral,
    bad,
    firstLevelElements: fg,
    secondLevelElements: labelColor,
    thirdLevelElements: borderColor,
    fourthLevelElements: labelColor,
    secondaryBackground: visualBackground,
    textClasses: {
      callout: { fontFace, fontSize: calloutSize, color: primary },
      title:   { fontFace, fontSize: titleSize, color: titleColor },
      header:  { fontFace, fontSize: headerSize, color: fg },
      label:   { fontFace, fontSize: labelSize, color: labelColor },
    },
    visualStyles: buildVisualStyles(state),
  }
}

export function downloadThemeJSON(state: ThemeState): void {
  if (typeof document === 'undefined') return

  const theme = generateThemeJSON(state)
  const surfaces = resolveThemeSurfaces(state)
  const validation = validatePowerBITheme(theme, {
    expectedCanvasBackground: surfaces.effectiveCanvasBackground,
    expectedOutspaceBackground: surfaces.effectiveOutspaceBackground,
    expectedVisualBackground: surfaces.effectiveVisualBackground,
    expectedTitleBackground: surfaces.effectiveTitleBackground,
  })

  if (!validation.isValid) {
    console.error('Power BI theme export validation failed:', validation.errors)
    window.alert(`Power BI theme export failed validation:\n\n${validation.errors.slice(0, 5).join('\n')}`)
    return
  }

  const json = JSON.stringify(theme, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const slug = (theme.name || 'datacense-power-bi-theme')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const filenameBase = slug.endsWith('-theme') ? slug : `${slug}-theme`

  anchor.href = url
  anchor.download = `${filenameBase}.json`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export async function parseImportedThemeJSON(input: File | string | unknown): Promise<ThemeImportPatch> {
  const parsed = await parseThemeInput(input)
  if (!isRecord(parsed)) throw new Error('Imported theme JSON must be an object.')

  const patch: ThemeImportPatch = {}
  const warnings: string[] = []

  if (typeof parsed.name === 'string' && parsed.name.trim()) patch.themeName = parsed.name.trim()
  const importedTypography = typographyDefaultsFromTextClasses(parsed.textClasses)
  if (importedTypography) patch.typographyDefaults = importedTypography

  if (Array.isArray(parsed.dataColors)) {
    const dataColors = parsed.dataColors.map(extractColor).filter((color): color is string => Boolean(color)).slice(0, 10)
    if (dataColors.length > 0) {
      patch.dataColors = dataColors
      patch.primary = dataColors[0]
      patch.accent = dataColors[1] ?? dataColors[0]
      patch.paletteSize = inferPaletteSizeFromDataColors(dataColors)
    } else {
      warnings.push('No valid dataColors were found.')
    }
  }

  const background = extractPageBackground(parsed)
  const visualBackground = extractVisualStyleColor(parsed, '*', 'background')
    ?? extractVisualStyleColor(parsed, 'barChart', 'background')
    ?? extractColor(parsed.background)
  const foreground = extractColor(parsed.foreground)
  const tableAccent = extractColor(parsed.tableAccent)
  const good = extractColor(parsed.good)
  const neutral = extractColor(parsed.neutral)
  const bad = extractColor(parsed.bad)

  if (background) patch.bg = background
  if (visualBackground) {
    patch.visualBackground = visualBackground
    patch.cardBackground = visualBackground
  }
  if (foreground) patch.fg = foreground
  if (tableAccent) patch.tableAccent = tableAccent
  if (good) patch.good = good
  if (neutral) patch.neutral = neutral
  if (bad) patch.bad = bad

  if (Object.keys(patch).length === 0) {
    warnings.push('The file was valid JSON, but no supported Power BI theme values were found.')
  }

  if (warnings.length) patch.warnings = warnings
  return patch
}

export function validateThemeJSON(themeObject: unknown, expectedPaletteSize?: PaletteSize): ValidationResult {
  return validatePowerBITheme(themeObject, { expectedPaletteSize })
}

export { solidColor }
