/**
 * Icon Library — canonical concept model (production).
 *
 * Final color-mode decision: icons support exactly two modes —
 *   1. Monochrome — the reference monochrome SVG, one editable color via
 *      currentColor.
 *   2. Original Multicolor — the reference multicolor SVG imported AS IS
 *      (original geometry, colors, opacities, strokes and fills). It is never
 *      recolored: no color slots, no theme mapping, no generated palettes.
 *
 * One concept = one canonical gallery entry. Duotone/tritone and color-slot
 * fields were removed deliberately — do not reintroduce them.
 */

export interface IconConcept {
  /** Globally unique, `v2-` prefixed (e.g. `v2-bar-chart`). */
  id: string
  /** Canonical display name — unique per normal category. */
  name: string
  /** Exactly one normal category (category id from categories.ts). */
  primaryCategory: string
  subcategory?: string
  keywords: string[]
  /** Merged names of concepts this canonical entry absorbed + synonyms. */
  aliases: string[]
  description: string
  recommendedUses: string[]
  viewBox: string

  /** Reference monochrome geometry (currentColor stroke, no <svg> wrapper). */
  monochromeSvg: string
  /**
   * Reference multicolor geometry imported exactly as designed (fixed
   * professional palette, original opacities). Absent when the reference
   * library provides no multicolor variant — never synthesized.
   */
  multicolorSvg?: string

  /** True = never recolor (reserved for flags; the business library ships
   *  none — the ISO flag registry is the only fixed-color source). */
  fixedColors?: boolean
  isCountryFlag?: boolean

  source: 'bi-icon-studio' | 'icon-vault' | 'authored'
}
