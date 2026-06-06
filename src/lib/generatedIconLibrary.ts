import type { IconLibraryItem } from '@/types'

export const ICON_LIBRARY_METADATA_URL = '/icon-library/tabler/icon-library.json'
export const ICON_LIBRARY_COUNT = 6146

export const ICON_LIBRARY_OUTLINE_COUNT = 5093
export const ICON_LIBRARY_FILLED_COUNT = 1053

let cachedIcons: IconLibraryItem[] | null = null

export async function loadGeneratedIconLibrary(): Promise<IconLibraryItem[]> {
  if (cachedIcons) return cachedIcons
  const response = await fetch(ICON_LIBRARY_METADATA_URL)
  if (!response.ok) throw new Error('Unable to load the generated icon library metadata.')
  cachedIcons = await response.json() as IconLibraryItem[]
  return cachedIcons
}
