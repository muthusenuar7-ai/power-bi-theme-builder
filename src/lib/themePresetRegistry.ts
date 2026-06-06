/**
 * Theme preset registry
 * ---------------------
 * Runtime Theme Builder presets come only from:
 * `src/data/datacense_398_theme_studio_ready_v5_compact.json`.
 *
 * The public API is intentionally stable so the Themes panel and admin import
 * tools do not need to know about the compact source-file shape.
 */

import { THEME_PRESETS, THEME_TIERS } from '@/lib/datacense398ThemePresets'
import {
  mapPremiumThemePresets,
  validatePremiumThemeJson,
  type PremiumThemeImportReport,
} from '@/lib/premiumThemePresetMapper'
import { normalizeHexColor } from '@/lib/paletteUtils'
import type { PresetTheme } from '@/types'

export const THEME_PRESET_CATEGORIES: readonly string[] = ['All', ...THEME_TIERS]
export type ThemePresetRegistryCategory = string

export interface ThemePresetImportResult {
  presets: PresetTheme[]
  report: PremiumThemeImportReport
}

function paletteSignature(preset: PresetTheme): string {
  return (preset.dataColorsFull?.length ? preset.dataColorsFull : preset.colors)
    .map((color) => normalizeHexColor(color))
    .join('|')
}

/** Generic preset de-duplication used only by the admin import utility. The
 * runtime Datacense 398 library is not de-duped here; it is the authoritative
 * Theme Builder source. */
export function dedupeThemePresets(presets: readonly PresetTheme[]): PresetTheme[] {
  const seenIds = new Set<string>()
  const seenPalettes = new Set<string>()
  const unique: PresetTheme[] = []

  for (const preset of presets) {
    const idKey = preset.id.trim().toLowerCase()
    const paletteKey = paletteSignature(preset)
    if (seenIds.has(idKey) || seenPalettes.has(paletteKey)) continue
    seenIds.add(idKey)
    seenPalettes.add(paletteKey)
    unique.push(preset)
  }

  return unique
}

export function getAllThemePresets(): PresetTheme[] {
  return THEME_PRESETS
}

export function getThemePresetById(id: string): PresetTheme | undefined {
  return THEME_PRESETS.find((preset) => preset.id === id)
}

export function getThemePresetCategories(): readonly string[] {
  return THEME_PRESET_CATEGORIES
}

export function getThemePresetsByCategory(category: string): PresetTheme[] {
  if (category === 'All') return THEME_PRESETS
  return THEME_PRESETS.filter((preset) => (preset.categories ?? [preset.category]).includes(category))
}

export function validateThemePresetImport(json: unknown): ThemePresetImportResult {
  const result = validatePremiumThemeJson(json)
  const deduped = dedupeThemePresets(result.presets)
  return {
    presets: deduped,
    report: {
      ...result.report,
      duplicate: Math.max(0, result.presets.length - deduped.length),
      valid: deduped.length,
    },
  }
}

export function importThemePresetsFromJson(json: unknown): ThemePresetImportResult {
  return validateThemePresetImport(json)
}

export { mapPremiumThemePresets }
