/**
 * Theme quality-priority system.
 *
 * Ranks the 398-theme library so the most beautiful, production-ready themes
 * surface first WITHOUT deleting or modifying any theme (ids, JSON export and
 * source data untouched).
 *
 * Two signals combine:
 *  1. AUTOMATED SCORE (0–100) from measurable Power BI dashboard criteria —
 *     text contrast, canvas/visual separation, data-series distinctness, KPI
 *     good/bad clarity, washed-out and harsh-combination penalties, and
 *     light/dark surface consistency. Arithmetic is an initial signal only —
 *     it cannot measure beauty by itself.
 *  2. CURATED_SIGNATURE — a manually curated, ordered list (visual review of
 *     palette composition + category/hue balance) that overrides scoring.
 *     Its order IS the priorityRank of the Signature tier.
 *
 * Tiers: Signature (curated) → Premium (top automated scores) → Standard →
 * Experimental (lowest scores / hard contrast failures). Experimental themes
 * stay fully accessible under "All Themes" and carry no negative badge.
 */
import { getContrastRatio } from '@/lib/colorUtils'
import type { PresetTheme } from '@/types'

export type ThemeQualityTier = 'Signature' | 'Premium' | 'Standard' | 'Experimental'

export interface ThemeQualityMetadata {
  qualityScore: number
  priorityRank: number
  isFeatured: boolean
  qualityTier: ThemeQualityTier
}

/* ── color helpers ── */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return { h: 0, s: 0, l: 0.5 }
  const r = parseInt(m[1].slice(0, 2), 16) / 255
  const g = parseInt(m[1].slice(2, 4), 16) / 255
  const b = parseInt(m[1].slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
  else if (max === g) h = ((b - r) / d + 2) * 60
  else h = ((r - g) / d + 4) * 60
  return { h, s, l }
}

function safeContrast(a: string, b: string): number {
  try { return getContrastRatio(a, b) } catch { return 1 }
}

function clamp01(v: number): number { return Math.max(0, Math.min(1, v)) }

/**
 * Automated quality score, 0–100. Sub-scores map to the quality criteria:
 * text contrast (25), canvas/visual separation (10), data-series distinction
 * (25), KPI clarity (10), washed-out avoidance (10), harshness avoidance
 * (10), light/dark surface consistency (10).
 */
export function scoreThemeQuality(preset: PresetTheme): number {
  const palette = (preset.dataColorsFull ?? []).slice(0, 8)
  const bg = preset.background
  const visualBg = preset.visualBackground
  let score = 0

  // 1. Text contrast (25): foreground vs canvas, title + label vs visual bg.
  const fgC = safeContrast(preset.foreground, bg)
  const titleC = safeContrast(preset.titleColor, visualBg)
  const labelC = safeContrast(preset.labelColor, visualBg)
  score += 12 * clamp01((fgC - 3) / 6)
  score += 7 * clamp01((titleC - 3) / 6)
  score += 6 * clamp01((labelC - 3) / 6)

  // 2. Canvas/visual separation (10): distinguishable but not jarring.
  const sep = safeContrast(bg, visualBg)
  score += sep >= 1.04 && sep <= 2.2 ? 10 : sep > 1.01 ? 5 : 0

  // 3. Data-series distinction (25): min + mean adjacent-pair separation and
  //    series visibility against the visual background.
  if (palette.length >= 2) {
    const pair: number[] = []
    for (let i = 1; i < palette.length; i++) pair.push(safeContrast(palette[i - 1], palette[i]))
    const minPair = Math.min(...pair)
    const meanPair = pair.reduce((a, b) => a + b, 0) / pair.length
    score += 10 * clamp01((minPair - 1.05) / 0.55)
    score += 8 * clamp01((meanPair - 1.15) / 1.1)
    const visible = palette.filter((c) => safeContrast(c, visualBg) >= 1.7).length / palette.length
    score += 7 * visible
  }

  // 4. KPI good/bad/neutral clarity (10).
  const goodBad = safeContrast(preset.good, preset.bad)
  const goodVis = safeContrast(preset.good, visualBg)
  const badVis = safeContrast(preset.bad, visualBg)
  score += 4 * clamp01((goodBad - 1.1) / 1.4)
  score += 3 * clamp01((goodVis - 1.5) / 2)
  score += 3 * clamp01((badVis - 1.5) / 2)

  // 5. Washed-out avoidance (10): penalize palettes that are all pale/gray.
  const hsl = palette.map(hexToHsl)
  if (hsl.length) {
    const meanSat = hsl.reduce((a, c) => a + c.s, 0) / hsl.length
    const paleShare = hsl.filter((c) => c.l > 0.82 || c.s < 0.12).length / hsl.length
    score += 6 * clamp01((meanSat - 0.15) / 0.35)
    score += 4 * (1 - paleShare)
  }

  // 6. Harshness avoidance (10): too many maximally saturated mid-tones reads
  //    as neon; a couple is fine (vivid themes stay competitive).
  if (hsl.length) {
    const neon = hsl.filter((c) => c.s > 0.92 && c.l > 0.42 && c.l < 0.62).length
    score += neon <= 1 ? 10 : neon === 2 ? 7 : neon === 3 ? 4 : 1
  }

  // 7. Light/dark surface consistency (10): canvas and visual background on
  //    the same side of mid-lightness (coherent light or dark theme).
  const bgL = hexToHsl(bg).l
  const visL = hexToHsl(visualBg).l
  score += (bgL - 0.5) * (visL - 0.5) >= 0 ? 10 : 3

  return Math.round(clamp01(score / 100) * 100)
}

/**
 * Manually curated Signature list (ordered — index = priorityRank).
 * Selected from the automated top scorers with deliberate BALANCE review:
 * corporate / executive-finance / vivid / pastel / nature / minimal-dark
 * coverage and distinct hue families, so the featured section is not a wall
 * of near-identical palettes. Curation overrides the arithmetic score.
 */
export const CURATED_SIGNATURE: readonly string[] = [
  'DTC-V4-101', // Navy Gold — classic executive navy + warm gold
  'DTC-V4-145', // Corporate Blue — deep ink-to-sage corporate gradient
  'DTC-V4-228', // Vivid Gold — rich gold/teal/burgundy statement
  'DTC-V4-186', // Blue pastels — clean layered blues
  'DTC-V4-022', // Green Earth — forest green with warm peach accents
  'DTC-V4-131', // Navy Gold — royal blue, camel and gold
  'DTC-V4-375', // Soft Blue — calm steel-blue corporate
  'DTC-V4-038', // Vivid Red — plum/red/amber energetic executive
  'DTC-V4-010', // Sand/navy/red — warm editorial finance
  'DTC-V4-069', // Terracotta + sage — friendly earthy dashboard
  'DTC-V4-086', // Dark navy, sage + gold with red KPI accents
  'DTC-V4-200', // Slate violet — muted modern corporate
  'DTC-V4-208', // Teal family — cohesive coastal teals
  'DTC-V4-157', // White/navy/cyan — crisp tech blues
  'DTC-V4-026', // Green scale + cream/red — nature with clear KPIs
  'DTC-V4-192', // Deep navy + sage/tan — quiet executive
  'DTC-V4-121', // Navy + coral on neutrals — confident minimal
  'DTC-V4-068', // Red/orange/indigo/teal — balanced vivid
  'DTC-V4-013', // Brown/gold/cream — warm heritage finance
  'DTC-V4-174', // Deep greens — high-contrast sustainability
  'DTC-V4-379', // Cyan/slate/amber — modern analytics
  'DTC-V4-232', // Black/navy/amber — bold dark-anchor corporate
  'DTC-V4-148', // Warm reds + gold — assertive vivid
  'DTC-V4-355', // Soft rose — pastel with dark-text clarity
  'DTC-V4-046', // Violet gradient — elegant purple range
  'DTC-V4-206', // Amber/teal/navy — bright executive
  'DTC-V4-002', // Dusty plum neutrals — soft minimal
  'DTC-V4-190', // Sage/gold/terracotta — modern warm
  'DTC-V4-124', // Blue mono dark-anchor — minimal analytics
  'DTC-V4-063', // Navy blues — deep monochrome blue
]

const HARD_FAIL_TEXT_CONTRAST = 3

let cache: Map<string, ThemeQualityMetadata> | null = null
let orderCache: PresetTheme[] | null = null

export function computeThemeQuality(presets: readonly PresetTheme[]): Map<string, ThemeQualityMetadata> {
  if (cache) return cache
  const scores = new Map(presets.map((p) => [p.id, scoreThemeQuality(p)]))
  const signature = new Set(CURATED_SIGNATURE)

  const nonSignature = presets.filter((p) => !signature.has(p.id))
  const sortedByScore = [...nonSignature].sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0))
  const premiumCount = Math.round(presets.length * 0.2)
  const premium = new Set(sortedByScore.slice(0, premiumCount).map((p) => p.id))
  const experimentalFloor = sortedByScore.length - Math.round(presets.length * 0.1)

  const experimental = new Set<string>()
  sortedByScore.forEach((p, i) => {
    const hardFail = safeContrast(p.foreground, p.background) < HARD_FAIL_TEXT_CONTRAST
    if (!premium.has(p.id) && (i >= experimentalFloor || hardFail)) experimental.add(p.id)
  })

  cache = new Map(presets.map((p) => {
    const tier: ThemeQualityTier = signature.has(p.id)
      ? 'Signature'
      : premium.has(p.id) ? 'Premium' : experimental.has(p.id) ? 'Experimental' : 'Standard'
    return [p.id, {
      qualityScore: scores.get(p.id) ?? 0,
      priorityRank: tier === 'Signature' ? CURATED_SIGNATURE.indexOf(p.id) : 999,
      isFeatured: tier === 'Signature',
      qualityTier: tier,
    }]
  }))
  return cache
}

const TIER_ORDER: Record<ThemeQualityTier, number> = { Signature: 0, Premium: 1, Standard: 2, Experimental: 3 }

/** Default library order: tier → priorityRank asc → qualityScore desc → name. */
export function sortThemesByQuality(presets: readonly PresetTheme[]): PresetTheme[] {
  if (orderCache && orderCache.length === presets.length) return orderCache
  const quality = computeThemeQuality(presets)
  orderCache = [...presets].sort((a, b) => {
    const qa = quality.get(a.id)!
    const qb = quality.get(b.id)!
    return TIER_ORDER[qa.qualityTier] - TIER_ORDER[qb.qualityTier]
      || qa.priorityRank - qb.priorityRank
      || qb.qualityScore - qa.qualityScore
      || a.name.localeCompare(b.name)
  })
  return orderCache
}

export function getThemeQuality(presets: readonly PresetTheme[], id: string): ThemeQualityMetadata | undefined {
  return computeThemeQuality(presets).get(id)
}

/** Random Theme pool: Signature + Premium (attractive, production-ready). */
export function isInDefaultRandomPool(presets: readonly PresetTheme[], id: string): boolean {
  const tier = computeThemeQuality(presets).get(id)?.qualityTier
  return tier === 'Signature' || tier === 'Premium'
}
