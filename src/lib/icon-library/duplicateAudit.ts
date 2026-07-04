/**
 * Icon Library V2 — duplicate validation.
 *
 * Detects duplicates across canonical concepts by:
 *  - id collision
 *  - normalized-name collision within a category (cross-category same names
 *    are reported too, since one concept must live in exactly one category)
 *  - alias colliding with another concept's canonical name
 *  - normalized outline-markup / path-data hash collision (visual dupes)
 *
 * Country flags are excluded by contract (V2 ships none; the ISO registry is
 * separate), so no false-positive color-similarity handling is needed here.
 */
import type { IconConcept } from './types'

export interface DuplicateFinding {
  kind: 'id' | 'name' | 'alias' | 'markup'
  detail: string
  conceptIds: string[]
}

export function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Whitespace/precision-insensitive geometry hash (djb2 over normalized markup). */
export function markupHash(markup: string): string {
  const normalized = markup.replace(/\s+/g, ' ').replace(/(\d)\.0+(\D)/g, '$1$2').trim()
  let h = 5381
  for (let i = 0; i < normalized.length; i++) h = ((h << 5) + h + normalized.charCodeAt(i)) | 0
  return (h >>> 0).toString(36)
}

/**
 * Canonicalized geometry for cross-library duplicate detection:
 *  - keeps only drawing elements (path/rect/circle/ellipse/line/polyline/polygon)
 *  - strips ALL paint + presentation attributes (fill/stroke/opacity/ids/…)
 *    so the same monochrome shape with different colors hashes identically
 *  - normalizes numeric precision (2 decimals), whitespace and attribute order
 *  - sorts elements so authoring order / generated ids don't matter
 */
export function canonicalGeometry(markup: string): string {
  const GEOMETRY_ATTRS = new Set([
    'd', 'x', 'y', 'width', 'height', 'rx', 'ry', 'cx', 'cy', 'r',
    'x1', 'y1', 'x2', 'y2', 'points', 'transform',
  ])
  const elements: string[] = []
  const tagRe = /<(path|rect|circle|ellipse|line|polyline|polygon)\b([^>]*?)\/?>/gi
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(markup)) !== null) {
    const tag = m[1].toLowerCase()
    const attrs: string[] = []
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*"([^"]*)"/g
    let a: RegExpExecArray | null
    while ((a = attrRe.exec(m[2])) !== null) {
      const name = a[1].toLowerCase()
      if (!GEOMETRY_ATTRS.has(name)) continue
      const value = a[2]
        .replace(/\s+/g, ' ')
        .replace(/-?\d*\.?\d+(?:e-?\d+)?/gi, (n) => {
          const num = Number(n)
          if (!Number.isFinite(num)) return n
          return String(Math.round(num * 100) / 100)
        })
        .trim()
      attrs.push(`${name}=${value}`)
    }
    attrs.sort()
    elements.push(`${tag}|${attrs.join('|')}`)
  }
  elements.sort()
  return elements.join('\n')
}

/** Hash of the color-stripped, normalized geometry. */
export function geometryHash(markup: string): string {
  return markupHash(canonicalGeometry(markup))
}

/**
 * Coarse 12×12 occupancy signature of all coordinates appearing in the
 * geometry, for near-identical visual detection (report-only heuristic).
 */
export function gridSignature(markup: string, viewBox = '0 0 24 24'): boolean[] {
  const [vx, vy, vw, vh] = viewBox.split(/\s+/).map(Number)
  const N = 12
  const grid = new Array<boolean>(N * N).fill(false)
  const geo = canonicalGeometry(markup)
  const numRe = /-?\d*\.?\d+/g
  const nums = geo.match(numRe)?.map(Number) ?? []
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const gx = Math.floor(((nums[i] - (vx || 0)) / (vw || 24)) * N)
    const gy = Math.floor(((nums[i + 1] - (vy || 0)) / (vh || 24)) * N)
    if (gx >= 0 && gx < N && gy >= 0 && gy < N) grid[gy * N + gx] = true
  }
  return grid
}

export function signatureDistance(a: boolean[], b: boolean[]): number {
  let d = 0
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) d++
  return d
}

export function auditDuplicates(concepts: readonly IconConcept[]): DuplicateFinding[] {
  const findings: DuplicateFinding[] = []

  const byId = new Map<string, string[]>()
  const byName = new Map<string, string[]>()
  const byMarkup = new Map<string, string[]>()
  const canonicalNames = new Map<string, string>()

  for (const c of concepts) {
    if (c.isCountryFlag) continue
    const push = (m: Map<string, string[]>, k: string) => {
      const list = m.get(k) ?? []
      list.push(c.id)
      m.set(k, list)
    }
    push(byId, c.id.toLowerCase())
    push(byName, normalizeName(c.name))
    push(byMarkup, markupHash(c.monochromeSvg))
    canonicalNames.set(normalizeName(c.name), c.id)
  }

  for (const [key, ids] of byId) if (ids.length > 1) findings.push({ kind: 'id', detail: key, conceptIds: ids })
  for (const [key, ids] of byName) if (ids.length > 1) findings.push({ kind: 'name', detail: key, conceptIds: ids })
  for (const [key, ids] of byMarkup) if (ids.length > 1) findings.push({ kind: 'markup', detail: `hash:${key}`, conceptIds: ids })

  for (const c of concepts) {
    if (c.isCountryFlag) continue
    for (const alias of c.aliases) {
      const owner = canonicalNames.get(normalizeName(alias))
      if (owner && owner !== c.id) {
        findings.push({ kind: 'alias', detail: `"${alias}" on ${c.id} collides with canonical name of ${owner}`, conceptIds: [c.id, owner] })
      }
    }
  }

  return findings
}
