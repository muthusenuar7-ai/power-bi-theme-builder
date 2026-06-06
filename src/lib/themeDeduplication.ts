import { normalizeHexColor } from './paletteUtils'
import type { PresetTheme } from '@/types'

export type ThemeDuplicateLevel = 'exact' | 'palette' | 'near'

export interface ThemeSignature {
  paletteSignature: string
  semanticSignature: string
  exactSignature: string
}

export interface ThemeDuplicateGroup {
  level: ThemeDuplicateLevel
  signature: string
  themeIds: string[]
  themeNames: string[]
  keptThemeId: string
  removedThemeIds: string[]
}

export interface ThemeDuplicateReport {
  totalThemes: number
  uniqueThemes: number
  exactGroups: ThemeDuplicateGroup[]
  paletteGroups: ThemeDuplicateGroup[]
  nearGroups: ThemeDuplicateGroup[]
  exactDuplicateCount: number
  paletteDuplicateCount: number
  nearDuplicateCount: number
  removedThemeIds: string[]
}

const SIGNATURE_COLOR_FIELDS = [
  'background',
  'foreground',
  'tableAccent',
  'good',
  'neutral',
  'bad',
  'visualBackground',
  'borderColor',
  'titleColor',
  'labelColor',
] as const

function normalizedPalette(theme: PresetTheme): string[] {
  return theme.dataColorsFull.slice(0, 10).map((color) => normalizeHexColor(color))
}

function normalizedSemanticColors(theme: PresetTheme): string[] {
  return SIGNATURE_COLOR_FIELDS.map((field) => normalizeHexColor(theme[field]))
}

export function normalizeThemeSignature(theme: PresetTheme): ThemeSignature {
  const paletteSignature = normalizedPalette(theme).join('|')
  const semanticSignature = normalizedSemanticColors(theme).join('|')

  return {
    paletteSignature,
    semanticSignature,
    exactSignature: `${paletteSignature}::${semanticSignature}`,
  }
}

function makeGroup(
  level: ThemeDuplicateLevel,
  signature: string,
  themes: PresetTheme[],
): ThemeDuplicateGroup {
  const [kept] = themes

  return {
    level,
    signature,
    themeIds: themes.map((theme) => theme.id),
    themeNames: themes.map((theme) => theme.name),
    keptThemeId: kept?.id ?? '',
    removedThemeIds: themes.slice(1).map((theme) => theme.id),
  }
}

function paletteOverlapScore(a: string[], b: string[]): number {
  const remaining = [...b]
  let score = 0

  for (const color of a) {
    const matchIndex = remaining.indexOf(color)
    if (matchIndex >= 0) {
      score += 1
      remaining.splice(matchIndex, 1)
    }
  }

  return score
}

function countRemoved(groups: ThemeDuplicateGroup[]): number {
  return groups.reduce((total, group) => total + group.removedThemeIds.length, 0)
}

export function findDuplicateThemes(themes: readonly PresetTheme[]): ThemeDuplicateReport {
  const exactMap = new Map<string, PresetTheme[]>()
  const paletteMap = new Map<string, PresetTheme[]>()

  for (const theme of themes) {
    const signature = normalizeThemeSignature(theme)
    exactMap.set(signature.exactSignature, [...(exactMap.get(signature.exactSignature) ?? []), theme])
    paletteMap.set(signature.paletteSignature, [...(paletteMap.get(signature.paletteSignature) ?? []), theme])
  }

  const exactGroups = Array.from(exactMap.entries())
    .filter(([, group]) => group.length > 1)
    .map(([signature, group]) => makeGroup('exact', signature, group))

  const exactDuplicateIds = new Set(exactGroups.flatMap((group) => group.removedThemeIds))

  const paletteGroups = Array.from(paletteMap.entries())
    .filter(([, group]) => group.length > 1)
    .map(([signature, group]) => {
      const compactGroup = group.filter((theme) => !exactDuplicateIds.has(theme.id))
      return compactGroup.length > 1 ? makeGroup('palette', signature, compactGroup) : null
    })
    .filter((group): group is ThemeDuplicateGroup => Boolean(group))

  const paletteDuplicateIds = new Set(paletteGroups.flatMap((group) => group.removedThemeIds))
  const removedThemeIds = new Set([...exactDuplicateIds, ...paletteDuplicateIds])
  const nearGroups: ThemeDuplicateGroup[] = []
  const themesForNearCheck = themes.filter((theme) => !removedThemeIds.has(theme.id))
  const seenNearPairs = new Set<string>()

  for (let i = 0; i < themesForNearCheck.length; i += 1) {
    for (let j = i + 1; j < themesForNearCheck.length; j += 1) {
      const first = themesForNearCheck[i]
      const second = themesForNearCheck[j]
      if (!first || !second) continue

      const firstSignature = normalizeThemeSignature(first)
      const secondSignature = normalizeThemeSignature(second)
      if (firstSignature.paletteSignature === secondSignature.paletteSignature) continue

      const overlap = paletteOverlapScore(normalizedPalette(first), normalizedPalette(second))
      if (overlap >= 8) {
        const key = [first.id, second.id].sort().join('|')
        if (!seenNearPairs.has(key)) {
          nearGroups.push(makeGroup('near', `overlap-${overlap}`, [first, second]))
          seenNearPairs.add(key)
        }
      }
    }
  }

  const finalRemovedThemeIds = Array.from(removedThemeIds)

  return {
    totalThemes: themes.length,
    uniqueThemes: themes.length - finalRemovedThemeIds.length,
    exactGroups,
    paletteGroups,
    nearGroups,
    exactDuplicateCount: countRemoved(exactGroups),
    paletteDuplicateCount: countRemoved(paletteGroups),
    nearDuplicateCount: nearGroups.length,
    removedThemeIds: finalRemovedThemeIds,
  }
}

export function getUniqueThemes(themes: readonly PresetTheme[]): PresetTheme[] {
  const report = findDuplicateThemes(themes)
  const removedThemeIds = new Set(report.removedThemeIds)
  return themes.filter((theme) => !removedThemeIds.has(theme.id))
}
