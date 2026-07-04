/**
 * Icon Studio runtime library (production).
 *
 * The gallery is composed of exactly two sources:
 *   1. Curated business-icon concepts (src/lib/icon-library + src/data/icon-library)
 *   2. The complete ISO country-flag registry (src/lib/flagLibrary)
 *
 * The legacy Tabler/generated icon library has been removed (see
 * docs/qa/icon-library-migration.md). There is intentionally NO fallback to
 * any old registry — do not reintroduce one.
 */
import type { IconLibraryCategory, IconLibraryItem } from '@/types'
import { COUNTRY_FLAG_COUNT, getFlagIcons } from '@/lib/flagLibrary'
import { getBusinessIconItems } from '@/lib/icon-library/adapter'
import { ICON_CATEGORIES } from '@/lib/icon-library/categories'
import { v2ConceptCount } from '@/lib/icon-library/registry'

/** Gallery category chips: All + business categories + Countries. */
export const ICON_LIBRARY_CATEGORIES = [
  'All',
  ...Array.from(new Set(ICON_CATEGORIES.map((c) => c.label))),
  'Countries',
] as const

export type IconLibraryCategoryFilter = (typeof ICON_LIBRARY_CATEGORIES)[number]

export const ICON_LIBRARY_COUNT = v2ConceptCount() + COUNTRY_FLAG_COUNT

const ICON_CATEGORY_SET = new Set<string>(ICON_LIBRARY_CATEGORIES.filter((c) => c !== 'All'))

function normalizedSearchText(icon: IconLibraryItem): string {
  return [
    icon.id,
    icon.name,
    icon.primaryCategory,
    icon.category,
    icon.source,
    icon.domain,
    icon.countryName,
    icon.isoCode,
    ...(icon.tags ?? []),
    ...(icon.keywords ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

/** Safety dedupe by id (registry + flags are already canonical). */
export function getUniqueIcons(icons: readonly IconLibraryItem[]): IconLibraryItem[] {
  const seen = new Set<string>()
  const out: IconLibraryItem[] = []
  for (const icon of icons) {
    const key = icon.id.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(icon)
  }
  return out
}

let canonicalCache: IconLibraryItem[] | null = null

/**
 * Production icon set = curated business icons + ISO country flags.
 * (Kept async for API compatibility with the previous fetch-based loader.)
 */
export async function loadGeneratedIconLibrary(): Promise<IconLibraryItem[]> {
  if (canonicalCache) return canonicalCache
  canonicalCache = getUniqueIcons([...getBusinessIconItems(), ...getFlagIcons()])
  return canonicalCache
}

export function isIconLibraryCategory(value: string): value is IconLibraryCategory {
  return ICON_CATEGORY_SET.has(value)
}

export function findIconById(icons: readonly IconLibraryItem[], id: string | null): IconLibraryItem | undefined {
  if (!id) return undefined
  return icons.find((icon) => icon.id === id)
}

export function searchIcons(
  icons: readonly IconLibraryItem[],
  query: string,
  category: IconLibraryCategoryFilter,
): IconLibraryItem[] {
  const q = query.trim().toLowerCase()
  const requestedCategory = category === 'All' ? null : category

  return icons.filter((icon) => {
    const primaryCategory = icon.primaryCategory ?? icon.category
    if (requestedCategory && primaryCategory !== requestedCategory) return false
    if (!q) return true
    return normalizedSearchText(icon).includes(q)
  })
}
