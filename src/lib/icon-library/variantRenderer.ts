/**
 * Icon Library — variant renderer (production).
 *
 * Two modes only:
 *  - MONOCHROME: reference monochrome geometry, colored via a single color
 *    (currentColor contract). Weight is a root-level stroke-width; the
 *    reference default is 1.6 with round caps/joins.
 *  - ORIGINAL MULTICOLOR: the reference multicolor geometry emitted EXACTLY
 *    as designed — original colors, opacities, per-element strokes and fills.
 *    It is never recolored, substituted or theme-mapped.
 *
 * Output is standalone Power BI-safe SVG (no scripts, fonts, foreignObject,
 * filters or external references).
 */
import type { IconConcept } from './types'

/** Reference stroke weight — the imported geometry's designed line weight. */
export const V2_BASE_STROKE = 1.6

function strokeSvgOpen(viewBox: string, size: number, color: string, strokeWidth: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">`
}

/** Standalone monochrome SVG in one color (currentColor resolved). */
export function renderMonochromeSvg(concept: IconConcept, size: number, color: string, strokeWidth = V2_BASE_STROKE): string {
  const body = concept.monochromeSvg.replace(/currentColor/g, color)
  return strokeSvgOpen(concept.viewBox, Math.max(8, Math.round(size)), color, strokeWidth) + body + '</svg>'
}

/**
 * Standalone ORIGINAL multicolor SVG — the reference geometry byte-preserved
 * (only sized). Returns null when the concept has no reference multicolor
 * variant; a fake multicolor version is never generated.
 */
export function renderOriginalMulticolorSvg(concept: IconConcept, size: number): string | null {
  if (!concept.multicolorSvg) return null
  const s = Math.max(8, Math.round(size))
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${concept.viewBox}" width="${s}" height="${s}">${concept.multicolorSvg}</svg>`
}

/**
 * Bridge for the shared Studio renderer (iconRenderer.styleSvg).
 *
 * Icon data-URIs carry `data-v2="1"` plus (when the reference provides one) a
 * hidden `data-v2-multi` group holding the ORIGINAL multicolor geometry:
 *  - mono → the hidden group is stripped; outline renders as usual
 *  - multicolor → the original group replaces the outline EXACTLY; the caller
 *    must not recolor it or override its stroke attributes
 */
export function applyV2MarkerGeometry(
  svgText: string,
  mode: 'mono' | 'multicolor',
): { svg: string; handled: boolean; isOriginalMulticolor: boolean } {
  const MULTI_GROUP_RE = /<g data-v2-multi="1"[^>]*>([\s\S]*)<\/g><\/svg>\s*$/

  if (mode === 'mono') {
    return { svg: svgText.replace(MULTI_GROUP_RE, '</svg>'), handled: true, isOriginalMulticolor: false }
  }
  const match = MULTI_GROUP_RE.exec(svgText)
  if (!match) return { svg: svgText, handled: false, isOriginalMulticolor: false }

  // Original multicolor geometry is fully self-contained (explicit fills,
  // strokes, opacities). The stroke="none" wrapper stops the root stroke
  // leaking into filled shapes; nothing inside is modified.
  const svg = svgText
    .replace(/<g data-v2-outline="1">[\s\S]*?<\/g><g data-v2-multi=/, '<g data-v2-multi=')
    .replace(MULTI_GROUP_RE, `<g stroke="none">${match[1]}</g></svg>`)
  return { svg, handled: true, isOriginalMulticolor: true }
}

/**
 * Standalone monochrome SVG with `currentColor`, encoded as a `data:` URI —
 * the adapter feeds this to the Studio pipeline, which fetches it exactly
 * like a static SVG asset and applies its own color/weight/style. When the
 * concept has an ORIGINAL multicolor variant, it is embedded as a hidden,
 * marker-tagged group so the shared renderer can swap to it verbatim in
 * multicolor mode and strip it entirely from monochrome output.
 */
export function outlineDataUri(concept: IconConcept): string {
  const multiGroup = concept.multicolorSvg
    ? `<g data-v2-multi="1" visibility="hidden" stroke="none">${concept.multicolorSvg}</g>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${concept.viewBox}" width="24" height="24" fill="none" stroke="currentColor" stroke-width="${V2_BASE_STROKE}" stroke-linecap="round" stroke-linejoin="round" data-v2="1"><g data-v2-outline="1">${concept.monochromeSvg}</g>${multiGroup}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
