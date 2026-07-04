/**
 * Icon Library → Icon Studio adapter (production).
 *
 * Surfaces the canonical business-icon concepts as IconLibraryItem entries so
 * the Studio (search, categories, favorites, multi-select, preview, color/
 * weight/style controls, SVG/PNG/bulk export, copy formats, PBIT rendering)
 * consumes them exactly like static assets. Outline geometry ships as a
 * data: URI; concepts with meaningful multicolor roles embed that geometry as
 * a hidden marker group the shared renderer swaps in for duo/tri/multicolor
 * modes (see iconRenderer.styleSvg + variantRenderer.applyV2MarkerGeometry).
 *
 * The production gallery = these concepts + the ISO country-flag registry
 * (flagLibrary.ts). There is no other icon source and no legacy fallback.
 */
import type { IconLibraryItem } from '@/types'
import type { IconConcept } from './types'
import { getAllV2Concepts, getV2ConceptById } from './registry'
import { outlineDataUri } from './variantRenderer'
import { categoryLabelFor } from './categories'

let cache: IconLibraryItem[] | null = null

export function getBusinessIconItems(): IconLibraryItem[] {
  if (cache) return cache
  cache = getAllV2Concepts().map((concept) => {
    const label = categoryLabelFor(concept.primaryCategory)
    return {
      id: concept.id,
      name: concept.name,
      primaryCategory: label,
      category: label,
      source: 'v2' as const,
      fixedColors: concept.fixedColors === true,
      url: outlineDataUri(concept),
      tags: [...new Set([
        ...concept.keywords,
        ...concept.aliases,
        concept.primaryCategory,
        label,
        concept.subcategory ?? '',
      ])].filter(Boolean),
      keywords: concept.keywords,
      domain: label,
      license: 'Datacense curated (adapted from project reference libraries)',
    }
  })
  return cache
}

export function isBusinessIconId(id: string): boolean {
  return id.startsWith('v2-')
}

export interface IconDetails {
  name: string
  aliases: string[]
  usage: string
  recommendedUse: string
  subcategory?: string
  supportedColorModes?: string[]
}

const FLAG_DETAILS: Omit<IconDetails, 'name' | 'aliases'> = {
  usage: 'Official ISO country flag (original colours and proportions preserved — never recolored).',
  recommendedUse: 'Geo slicers, country tables, regional report headers.',
}

/** Details panel content: concept metadata for business icons, fixed copy for flags. */
export function getIconDetails(icon: Pick<IconLibraryItem, 'id' | 'name'>): IconDetails {
  const concept: IconConcept | undefined = getV2ConceptById(icon.id)
  if (concept) {
    return {
      name: concept.name,
      aliases: concept.aliases,
      usage: concept.description,
      recommendedUse: concept.recommendedUses.join(', '),
      subcategory: concept.subcategory,
      supportedColorModes: concept.multicolorSvg ? ['Monochrome', 'Original Multicolor'] : ['Monochrome'],
    }
  }
  if (icon.id.startsWith('flag-country-')) {
    return { name: icon.name, aliases: [], ...FLAG_DETAILS }
  }
  return {
    name: icon.name,
    aliases: [],
    usage: 'Business icon for dashboards and report navigation.',
    recommendedUse: 'Buttons, navigation panes, tooltips, KPI cards.',
  }
}

/* Backward-compatible alias for pre-switch imports. */
export const getV2LibraryItems = getBusinessIconItems
