/**
 * Icon Library V2 — token search index.
 *
 * Prebuilt (memoized) token → concept-id index over name, category, keywords,
 * aliases and description, so gallery search stays O(query tokens) instead of
 * scanning every concept's metadata on each keystroke.
 */
import type { IconConcept } from './types'
import { getV2Category } from './categories'

export interface V2SearchIndex {
  query: (q: string) => IconConcept[]
  all: readonly IconConcept[]
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 1)
}

export function buildSearchIndex(concepts: readonly IconConcept[]): V2SearchIndex {
  const index = new Map<string, Set<string>>()
  const byId = new Map<string, IconConcept>()

  for (const c of concepts) {
    byId.set(c.id, c)
    const catLabel = getV2Category(c.primaryCategory)?.label ?? c.primaryCategory
    const corpus = [
      c.name, c.id, c.primaryCategory, catLabel, c.subcategory ?? '',
      ...c.keywords, ...c.aliases, c.description, ...c.recommendedUses,
    ].join(' ')
    for (const token of new Set(tokenize(corpus))) {
      const set = index.get(token) ?? new Set<string>()
      set.add(c.id)
      index.set(token, set)
    }
  }

  return {
    all: concepts,
    query(q: string): IconConcept[] {
      const tokens = tokenize(q)
      if (tokens.length === 0) return [...concepts]
      // Every query token must match (prefix match against index tokens).
      let ids: Set<string> | null = null
      for (const token of tokens) {
        const matched = new Set<string>()
        for (const [key, set] of index) {
          if (key.startsWith(token)) for (const id of set) matched.add(id)
        }
        if (ids === null) {
          ids = matched
        } else {
          const current: Set<string> = ids
          ids = new Set([...current].filter((id) => matched.has(id)))
        }
        if (ids.size === 0) return []
      }
      return [...(ids ?? [])].map((id) => byId.get(id)!).filter(Boolean)
    },
  }
}
