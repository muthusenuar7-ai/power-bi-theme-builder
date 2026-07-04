/**
 * Icon Library V2 — canonical concept registry.
 *
 * Aggregates the per-domain data files (src/data/icon-library-v2/*) into one
 * deduplicated, id-indexed registry. The gallery consumes canonical concepts
 * only — variants are generated on demand by variantRenderer.
 */
import type { IconConcept } from './types'
import { buildSearchIndex, type V2SearchIndex } from './searchIndex'

import { ANALYTICS_3D_CONCEPTS } from '@/data/icon-library/analytics3d'
import { ANALYTICS_CONCEPTS } from '@/data/icon-library/analytics'
import { FINANCE_CONCEPTS } from '@/data/icon-library/finance'
import { CURRENCY_CONCEPTS } from '@/data/icon-library/currency'
import { SALES_CONCEPTS } from '@/data/icon-library/sales'
import { HR_CONCEPTS } from '@/data/icon-library/hr'
import { RETAIL_CONCEPTS } from '@/data/icon-library/retail'
import { OPERATIONS_CONCEPTS } from '@/data/icon-library/operations'
import { LOGISTICS_CONCEPTS } from '@/data/icon-library/logistics'
import { MANUFACTURING_CONCEPTS } from '@/data/icon-library/manufacturing'
import { TECHNOLOGY_CONCEPTS } from '@/data/icon-library/technology'
import { PROJECT_MANAGEMENT_CONCEPTS } from '@/data/icon-library/projectManagement'
import { NAVIGATION_CONCEPTS } from '@/data/icon-library/navigation'
import { STATUS_CONCEPTS } from '@/data/icon-library/status'
import { GENERAL_CONCEPTS } from '@/data/icon-library/general'

const ALL: readonly IconConcept[] = [
  ...ANALYTICS_3D_CONCEPTS,
  ...ANALYTICS_CONCEPTS,
  ...FINANCE_CONCEPTS,
  ...CURRENCY_CONCEPTS,
  ...SALES_CONCEPTS,
  ...HR_CONCEPTS,
  ...RETAIL_CONCEPTS,
  ...OPERATIONS_CONCEPTS,
  ...LOGISTICS_CONCEPTS,
  ...MANUFACTURING_CONCEPTS,
  ...TECHNOLOGY_CONCEPTS,
  ...PROJECT_MANAGEMENT_CONCEPTS,
  ...NAVIGATION_CONCEPTS,
  ...STATUS_CONCEPTS,
  ...GENERAL_CONCEPTS,
]

/**
 * Cross-library duplicates removed from the gallery (found by
 * npm run audit:icon-duplicates — identical color-stripped geometry across
 * the two reference libraries). Key = removed duplicate id, value = retained
 * canonical id. getV2ConceptById transparently redirects removed ids so
 * persisted favorites/bundles keep resolving; the removed concept's name and
 * keywords are merged into the canonical entry's aliases for search.
 */
export const DUPLICATE_ID_REDIRECTS: Record<string, string> = {
  'v2-task': 'v2-scorecard',
  'v2-forex': 'v2-financial-ratio',
  'v2-budget-govt': 'v2-credit-score',
  'v2-resolution': 'v2-win-rate',
  'v2-recommendation': 'v2-social-media',
  'v2-status-failure': 'v2-defect-rate',
  'v2-container': 'v2-shipment',
  'v2-risk-management': 'v2-incident',
}

let registryCache: Map<string, IconConcept> | null = null
let searchCache: V2SearchIndex | null = null

function buildRegistry(): Map<string, IconConcept> {
  if (registryCache) return registryCache
  const map = new Map<string, IconConcept>()
  const absorbed = new Map<string, IconConcept>()
  for (const concept of ALL) {
    if (concept.id in DUPLICATE_ID_REDIRECTS) {
      if (!absorbed.has(concept.id)) absorbed.set(concept.id, concept)
      continue
    }
    // Last-write-wins would hide authoring mistakes — first entry is canonical
    // and collisions are surfaced by the duplicate audit script instead.
    if (!map.has(concept.id)) map.set(concept.id, concept)
  }
  // Merge removed duplicates' names/keywords into the canonical concepts so
  // searching for the removed concept still finds the retained shape.
  for (const [removedId, canonicalId] of Object.entries(DUPLICATE_ID_REDIRECTS)) {
    const removed = absorbed.get(removedId)
    const canonical = map.get(canonicalId)
    if (!removed || !canonical) continue
    map.set(canonicalId, {
      ...canonical,
      aliases: [...new Set([...canonical.aliases, removed.name, ...removed.aliases])],
      keywords: [...new Set([...canonical.keywords, ...removed.keywords])],
    })
  }
  registryCache = map
  return map
}

export function getAllV2Concepts(): IconConcept[] {
  return [...buildRegistry().values()]
}

export function getV2ConceptById(id: string): IconConcept | undefined {
  const registry = buildRegistry()
  return registry.get(id) ?? registry.get(DUPLICATE_ID_REDIRECTS[id] ?? '')
}

export function getV2ConceptsByCategory(categoryId: string): IconConcept[] {
  return getAllV2Concepts().filter((c) => c.primaryCategory === categoryId)
}

export function getV2SearchIndex(): V2SearchIndex {
  if (!searchCache) searchCache = buildSearchIndex(getAllV2Concepts())
  return searchCache
}

export function v2ConceptCount(): number {
  return buildRegistry().size
}
