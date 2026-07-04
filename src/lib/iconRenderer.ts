/**
 * Icon Studio SVG rendering — shared between the live preview/download path
 * (IconLibraryStudio) and the Power BI template exporters, so a customized
 * icon renders byte-identical wherever it is produced.
 *
 * Color modes (final): 'mono' (one editable color) and 'multicolor' (the
 * reference library's ORIGINAL multicolor geometry, never recolored). The
 * earlier duotone/tritone/color-slot engine was removed deliberately.
 */
import type { LibraryGradient } from '@/lib/datacenseLibrary'
import { sanitizeHex } from '@/lib/colorUtils'
import { applyV2MarkerGeometry } from '@/lib/icon-library/variantRenderer'

export type IconStyle = 'precision' | 'softline' | 'framework' | 'heritage'
export type BgShape = 'none' | 'softtile' | 'rounded' | 'capsule' | 'circle'
export type IconWeight = 'thin' | 'regular' | 'medium' | 'bold'
export type IconColorMode = 'mono' | 'multicolor'

/** 'regular' = 1.6, the reference libraries' designed stroke weight. */
export const WEIGHT_STROKE: Record<IconWeight, number> = { thin: 1.2, regular: 1.6, medium: 2.0, bold: 2.5 }

export interface StyleOpts {
  iconColor: string
  weight: IconWeight
  style: IconStyle
  isFlag: boolean
  /** 'mono' (default) recolors via one color; 'multicolor' swaps in the
   *  ORIGINAL reference multicolor geometry untouched. */
  colorMode?: IconColorMode
}
export interface SheetOptions extends StyleOpts { bgFill: string; bgShape: BgShape; padding: number; gradient: LibraryGradient | null }

export function shapeRadiusCss(shape: BgShape): string {
  if (shape === 'softtile') return '8px'
  if (shape === 'rounded') return '16px'
  if (shape === 'capsule') return '999px'
  if (shape === 'circle') return '50%'
  return '0'
}

export function shapeRadiusExport(shape: BgShape, size: number): number {
  if (shape === 'softtile') return 8
  if (shape === 'rounded') return 16
  if (shape === 'capsule' || shape === 'circle') return size / 2
  return 0
}

export function rgbaFromHex(hex: string, opacityPct: number): string {
  if (!hex || hex === 'transparent') return 'transparent'
  const c = sanitizeHex(hex)
  return `rgba(${parseInt(c.slice(1, 3), 16)}, ${parseInt(c.slice(3, 5), 16)}, ${parseInt(c.slice(5, 7), 16)}, ${Math.max(0, Math.min(100, opacityPct)) / 100})`
}

function setSvgAttr(svg: string, attr: string, value: string): string {
  const re = new RegExp(`${attr}="[^"]*"`, 'i')
  if (re.test(svg)) return svg.replace(re, `${attr}="${value}"`)
  return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => `<svg${attrs} ${attr}="${value}">`)
}

function setSize(svg: string, size: number): string {
  return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${size}" height="${size}">`)
}

/** Whether an icon SVG (fetched data-URI text) carries an ORIGINAL reference
 *  multicolor variant — the only case where multicolor mode is available. */
export function hasOriginalMulticolor(svgText: string): boolean {
  return /\bdata-v2-multi="1"/.test(svgText)
}

/**
 * Render an icon SVG for preview/export.
 * - Flags: returned with original colors — only sized (never recolored).
 * - Multicolor: the ORIGINAL reference geometry — only sized. No color,
 *   weight or style attributes are applied, preserving the designed look.
 * - Mono: recolored via one color; weight/style applied at the SVG root.
 */
export function styleSvg(text: string, size: number, opts: StyleOpts): string {
  let s = text.replace(/<\?xml[^>]*\?>/i, '').trim()
  if (opts.isFlag) return setSize(s, size)

  const mode: IconColorMode = opts.colorMode === 'multicolor' ? 'multicolor' : 'mono'

  if (/\bdata-v2="1"/.test(s)) {
    const result = applyV2MarkerGeometry(s, mode)
    s = result.svg
    if (result.isOriginalMulticolor) {
      // Original multicolor: strip the mono root defaults so nothing bleeds
      // into the self-contained reference geometry, then size and return.
      s = s.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) =>
        `<svg${attrs.replace(/\s(fill|stroke|stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"/g, '')}>`)
      return setSize(s, size)
    }
  }

  const styleAttrs: Record<IconStyle, { cap: string; join: string; rendering: string; miter: string }> = {
    precision: { cap: 'butt', join: 'miter', rendering: 'geometricPrecision', miter: '4' },
    softline: { cap: 'round', join: 'round', rendering: 'auto', miter: '2' },
    framework: { cap: 'square', join: 'miter', rendering: 'crispEdges', miter: '2' },
    heritage: { cap: 'round', join: 'bevel', rendering: 'auto', miter: '1' },
  }
  const attrs = styleAttrs[opts.style]
  s = s.replace(/currentColor/g, opts.iconColor)
  s = setSvgAttr(s, 'stroke-width', String(WEIGHT_STROKE[opts.weight]))
  s = setSvgAttr(s, 'stroke-linecap', attrs.cap)
  s = setSvgAttr(s, 'stroke-linejoin', attrs.join)
  s = setSvgAttr(s, 'stroke-miterlimit', attrs.miter)
  s = setSvgAttr(s, 'shape-rendering', attrs.rendering)
  return setSize(s, size)
}

function gradientDefs(g: LibraryGradient, id: string): string {
  const stops = g.stops.map((c, i) => `<stop offset="${((i / Math.max(1, g.stops.length - 1)) * 100).toFixed(1)}%" stop-color="${c}"/>`).join('')
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>`
}

/** Renders one icon onto a square box, background + padding applied. Color/
 *  weight/style apply to mono icons only — multicolor and flags keep their
 *  original colors regardless of background or padding changes. */
export function buildSingleSvg(text: string, boxSize: number, opts: SheetOptions, gid = 'dcg'): string {
  const pad = Math.min(opts.padding, boxSize / 2 - 4)
  const iconSize = Math.max(8, boxSize - pad * 2)
  const useGrad = !!opts.gradient && opts.bgShape !== 'none'
  const showBg = opts.bgShape !== 'none' && (useGrad || opts.bgFill !== 'transparent')
  const defs = useGrad && opts.gradient ? gradientDefs(opts.gradient, gid) : ''
  const fill = useGrad ? `url(#${gid})` : opts.bgFill
  const bg = showBg
    ? `<rect x="0" y="0" width="${boxSize}" height="${boxSize}" rx="${shapeRadiusExport(opts.bgShape, boxSize)}" ry="${shapeRadiusExport(opts.bgShape, boxSize)}" fill="${fill}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boxSize}" height="${boxSize}" viewBox="0 0 ${boxSize} ${boxSize}">${defs}${bg}<g transform="translate(${pad}, ${pad})">${styleSvg(text, iconSize, opts)}</g></svg>`
}
