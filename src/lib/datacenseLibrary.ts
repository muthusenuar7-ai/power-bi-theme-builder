/**
 * datacenseLibrary
 * ----------------
 * Single source of truth for the three Datacense data files:
 *   - `datacense_398_theme_studio_ready_v5_compact.json` → legacy-compatible preset exports
 *   - `colors.json`                        → preset colour library
 *   - `gradient_library.json`              → gradient library
 *
 * Everything is parsed defensively (missing/invalid JSON never throws — it just
 * yields an empty list) and de-duplicated. The old hardcoded preset seeds and
 * the removed `premium_10_colors.json` registry are no longer used.
 */

import paletteData from '@/data/datacense_398_theme_studio_ready_v5_compact.json'
import colorData from '@/data/colors.json'
import gradientData from '@/data/gradient_library.json'
import { normalizeHexColor } from '@/lib/paletteUtils'
import { getReadableTextColor, isDarkColor, lighten, mixColor } from '@/lib/colorUtils'
import type { PresetTheme, ThemeCategory } from '@/types'

/* ─── safe primitives ───────────────────────────────────────────────── */

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

const HEX_RE = /^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/

function isHex(value: unknown): value is string {
  return typeof value === 'string' && HEX_RE.test(value.trim())
}

function hexOf(value: unknown, fallback: string): string {
  return normalizeHexColor(isHex(value) ? value : fallback, fallback)
}

/* ─── legacy-compatible theme preset exports (Datacense 398 compact file) ─── */

/**
 * Detect the theme array regardless of wrapper shape:
 *   - a bare array at the top level, or
 *   - an object with `themes` / `palettes` / `data` / `items` (first array found).
 */
function getThemeSourceArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data
  const root = rec(data)
  for (const key of ['themes', 'palettes', 'data', 'items']) {
    if (Array.isArray(root[key])) return root[key] as unknown[]
  }
  return []
}

/** Read a hex from a string field OR a nested `{ hex }` object field. */
function hexFromValue(value: unknown): string | null {
  if (isHex(value)) return normalizeHexColor(value, '#000000')
  const nested = rec(value).hex
  if (isHex(nested)) return normalizeHexColor(nested, '#000000')
  return null
}

/** First valid hex among candidate keys, else fallback. */
function pickHex(source: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const hex = hexFromValue(source[key])
    if (hex) return hex
  }
  return fallback
}

/** First non-empty hex array among candidate keys. */
function pickHexArray(source: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const arr = source[key]
    if (Array.isArray(arr)) {
      const hexes = arr.map(hexFromValue).filter((h): h is string => h !== null)
      if (hexes.length) return hexes
    }
  }
  return []
}

/** First non-empty string among candidate keys, else fallback. */
function pickStr(source: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return fallback
}

/** Map a source category/tier label onto the app's strict ThemeCategory union
 *  (the original label is preserved separately in `categories[]` for display). */
const CATEGORY_TO_THEME_CATEGORY: Record<string, ThemeCategory> = {
  Corporate: 'Corporate', Finance: 'Finance', Healthcare: 'Healthcare', Retail: 'Retail',
  Industrial: 'Industrial', Premium: 'Premium', Pastel: 'Pastel', Minimal: 'Minimal',
  Modern: 'Modern', Technology: 'Technology', Monochrome: 'Monochrome', Editorial: 'Editorial',
  Vibrant: 'Vibrant', Earthy: 'Earthy', Dark: 'Dark',
  'Premium Dark': 'Premium Dark', 'India & Gulf': 'India & Gulf',
  // Current master-library categories → nearest supported bucket
  'Modern SaaS': 'Modern', 'AI Digital': 'Modern', 'AI Product': 'Modern',
  Executive: 'Premium', Boardroom: 'Premium',
  Logistics: 'Industrial', 'Supply Chain': 'Industrial', 'HR Analytics': 'Corporate',
  Marketing: 'Vibrant', Nature: 'Earthy', Sustainability: 'Earthy',
  // Older tier names (backward compatible)
  'Nature & Earth': 'Earthy', 'Pastel & Soft': 'Pastel', 'Vivid & Neon': 'Vibrant',
  'Monochrome & Minimal': 'Monochrome',
}

function toThemeCategory(label: string): ThemeCategory {
  return CATEGORY_TO_THEME_CATEGORY[label] ?? 'Modern'
}

/**
 * Map ONE theme/palette entry into the app's PresetTheme — schema-agnostic.
 * Supports the current master-library shape (flat `dataColors` / `primary` /
 * `background` / `visualBackground` / `fontPrimary` / …) AND the older palette
 * shape (`data_series` / `primary_color.hex` / `background_color` / …). Missing
 * fields are derived safely from the data/brand colours so a sparse theme still
 * renders without crashing.
 */
function mapThemeToPreset(raw: unknown): PresetTheme | null {
  const o = rec(raw)
  // Merge the role objects so `semanticColors` and `powerBITheme` fields are
  // reachable by their flat keys (semanticColors wins, then powerBITheme, then
  // any top-level fields). Meta (name/category/collection/tags) is read from the
  // raw object so it isn't shadowed by powerBITheme.name etc.
  const merged = { ...o, ...rec(o.powerBITheme), ...rec(o.semanticColors) }

  let series = pickHexArray(merged, ['dataColors', 'colors', 'data_series', 'palette'])
  const primary = pickHex(merged, ['primary', 'primaryColor', 'primary_color'], series[0] ?? '#0D9488')
  const secondary = pickHex(merged, ['secondary', 'secondaryColor', 'secondary_color'], series[1] ?? primary)
  const accent = pickHex(merged, ['accent', 'accentColor', 'accent_color'], series[2] ?? secondary)
  // Derive a palette from the brand colours when no data-colour array exists.
  if (series.length === 0) series = Array.from(new Set([primary, secondary, accent]))
  if (series.length === 0) return null

  const bg = pickHex(merged, ['background', 'background_color', 'bg', 'dashboardBackground', 'pageBackground'], '#FFFFFF')
  const dark = isDarkColor(bg)
  const foreground = pickHex(merged, ['foreground', 'fontPrimary', 'font_primary', 'fg', 'titleColor'], getReadableTextColor(bg))

  // Roles NOT present in the source file are derived safely from bg/foreground.
  const visualBg = pickHex(merged, ['visualBackground', 'visual_bg_color', 'cardBackground', 'card_background'], dark ? lighten(bg, 8) : '#FFFFFF')
  const labelColor = pickHex(merged, ['fontSecondary', 'font_secondary', 'labelColor', 'muted'], mixColor(foreground, bg, 0.32))
  const border = pickHex(merged, ['border', 'border_color', 'borderColor', 'gridlineColor'], dark ? mixColor(bg, '#FFFFFF', 0.2) : mixColor(bg, '#000000', 0.12))
  const tableAccent = pickHex(merged, ['tableAccent', 'table_accent'], primary)
  const tableHeader = pickHex(merged, ['tableHeader', 'table_header_bg', 'tableHeaderBackground'], dark ? lighten(bg, 12) : mixColor(bg, '#000000', 0.06))
  const tableRowAlt = pickHex(merged, ['tableRowAlt', 'table_row_alt'], dark ? lighten(bg, 4) : mixColor(visualBg, '#000000', 0.03))
  const good = pickHex(merged, ['good', 'kpiGood', 'kpi_good'], '#16A34A')
  const bad = pickHex(merged, ['bad', 'kpiBad', 'kpi_bad'], '#DC2626')
  const neutral = pickHex(merged, ['neutral', 'kpiNeutral', 'kpi_neutral'], '#F59E0B')

  const name = pickStr(o, ['displayName', 'themeName', 'palette_name', 'name'], pickStr(o, ['id', 'themeId', 'palette_id'], 'Untitled Theme'))
  const id = pickStr(o, ['id', 'themeId', 'palette_id'], name)
  const rawCategory = pickStr(o, ['category', 'tier'], pickStr(o, ['family', 'color_family'], 'Modern'))
  const collectionClass = pickStr(o, ['collectionClass', 'collection_class', 'collection'], '')
  const tags = asArray(o.tags).length ? asArray(o.tags).map((t) => str(t)).filter(Boolean) : asArray(o.usage_tags).map((t) => str(t)).filter(Boolean)
  const recommended = asArray(o.recommendedFor).map((t) => str(t)).filter(Boolean)
  const family = pickStr(o, ['family', 'color_family'], '')
  const mode = pickStr(o, ['mode'], dark ? 'dark' : 'light')
  const profile = pickStr(o, ['themeType', 'style', 'profile'], collectionClass)
  const gradientFamily = pickStr(rec(o.gradientPreview), ['family'], pickStr(o, ['gradient_family', 'gradientType'], ''))
  const description = [collectionClass, recommended.slice(0, 2).join(', ')].filter(Boolean).join(' · ') || tags.join(', ')

  return {
    id,
    name,
    category: toThemeCategory(rawCategory),
    categories: [rawCategory],
    collectionClass: collectionClass || undefined,
    tags,
    recommendedFor: recommended,
    description,

    dataColorsFull: series,
    dataColors: series,
    colors: series,
    paletteSizeDefault: 10,

    background: bg,
    bg,
    dashboardBackground: bg,
    pageBackground: bg,
    foreground,
    fg: foreground,
    muted: labelColor,

    visualBackground: visualBg,
    cardBackground: visualBg,
    tooltipBackground: visualBg,
    tableRowAlt,
    tableHeaderBackground: tableHeader,

    borderColor: border,
    gridlineColor: border,
    dividerColor: border,

    titleColor: foreground,
    labelColor,
    primaryColor: primary,
    accentColor: accent,
    highlight: accent,
    tableAccent,

    good,
    neutral,
    bad,

    fontFamily: 'Segoe UI',
    titleFontSize: 14,
    labelFontSize: 10,

    // Searchable / filterable facets for the Themes panel dropdowns.
    mode,
    theme: mode,
    profile,
    hue: family,
    harmony: gradientFamily,
    gradientType: gradientFamily,
    source: 'premium',
    cat: toThemeCategory(rawCategory),
  }
}

function dedupePresets(list: PresetTheme[]): PresetTheme[] {
  const seenId = new Set<string>()
  const seenSig = new Set<string>()
  const out: PresetTheme[] = []
  for (const preset of list) {
    const id = preset.id.trim().toLowerCase()
    const sig = `${preset.dataColorsFull.join('|')}::${preset.background}::${preset.foreground}::${preset.visualBackground}`.toLowerCase()
    if (seenId.has(id) || seenSig.has(sig)) continue
    seenId.add(id)
    seenSig.add(sig)
    out.push(preset)
  }
  return out
}

export const THEME_PRESETS: PresetTheme[] = dedupePresets(
  getThemeSourceArray(paletteData)
    .map(mapThemeToPreset)
    .filter((p): p is PresetTheme => p !== null),
)

/** Category labels present across the loaded themes (declared tiers first, then
 *  any category seen on a theme). Works whether the file declares `tiers` or not. */
export const THEME_TIERS: string[] = (() => {
  const declared = asArray(rec(paletteData).tiers)
    .map((t) => str(rec(t).tier_name))
    .filter(Boolean)
  const present = new Set(THEME_PRESETS.flatMap((p) => p.categories ?? [p.category]))
  const ordered = declared.filter((t) => present.has(t))
  for (const t of present) if (!ordered.includes(t)) ordered.push(t)
  return ordered
})()

/* ─── colour library (colors.json) ──────────────────────────────────── */

export interface LibraryColor {
  id: string
  name: string
  hex: string
  family: string
}

export const COLOR_LIBRARY: LibraryColor[] = (() => {
  const seen = new Set<string>()
  const out: LibraryColor[] = []
  for (const raw of asArray(rec(colorData).colors)) {
    const c = rec(raw)
    if (!isHex(c.hex)) continue
    const hex = normalizeHexColor(c.hex, '#000000')
    if (seen.has(hex)) continue
    seen.add(hex)
    out.push({
      id: str(c.id, hex),
      name: str(c.name, hex),
      hex,
      family: str(c.family, 'Other'),
    })
  }
  return out
})()

export const COLOR_FAMILIES: string[] = (() => {
  const declared = asArray(rec(colorData).families).map((f) => str(f)).filter(Boolean)
  const present = new Set(COLOR_LIBRARY.map((c) => c.family))
  const ordered = declared.filter((f) => present.has(f))
  for (const f of present) if (!ordered.includes(f)) ordered.push(f)
  return ordered
})()

/* ─── gradient library (gradient_library.json) ──────────────────────── */

export interface LibraryGradient {
  code: string
  name: string
  family: string
  category: string
  tone: string
  stops: string[]
  /** CSS gradient for web preview (135deg). */
  css: string
  /** Solid fallback colour used for Power BI export (gradients aren't exported). */
  solid: string
  textColor: string
}

function gradientCss(stops: string[], angle = 135): string {
  return `linear-gradient(${angle}deg, ${stops.join(', ')})`
}

export const GRADIENT_LIBRARY: LibraryGradient[] = (() => {
  const seen = new Set<string>()
  const out: LibraryGradient[] = []
  for (const raw of asArray(rec(gradientData).gradients)) {
    const g = rec(raw)
    const stops = [g.stop1, g.stop2, g.stop3, g.stop4].filter(isHex).map((s) => normalizeHexColor(s, '#000000'))
    if (stops.length < 2) continue
    const sig = stops.join('|')
    if (seen.has(sig)) continue
    seen.add(sig)
    out.push({
      code: str(g.code, sig),
      name: str(g.name, sig),
      family: str(g.family, 'Other'),
      category: str(g.category, 'Other'),
      tone: str(g.tone),
      stops,
      css: str(g.css135, gradientCss(stops, 135)),
      solid: stops[0],
      textColor: hexOf(g.textColor, '#FFFFFF'),
    })
  }
  return out
})()

export const GRADIENT_FAMILIES: string[] = (() => {
  const declared = asArray(rec(gradientData).families).map((f) => str(f)).filter(Boolean)
  const present = new Set(GRADIENT_LIBRARY.map((g) => g.family))
  const ordered = declared.filter((f) => present.has(f))
  for (const f of present) if (!ordered.includes(f)) ordered.push(f)
  return ordered
})()

/** Solid fallback colour for a gradient — used wherever Power BI export needs a
 *  single colour instead of a CSS gradient. */
export function gradientSolidFallback(gradient: LibraryGradient): string {
  return gradient.solid
}
