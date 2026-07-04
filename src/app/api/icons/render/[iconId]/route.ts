/**
 * Public icon render endpoint — GET /api/icons/render/[iconId].svg
 *
 * Returns the rendered icon as standalone SVG (Content-Type: image/svg+xml),
 * so the Icon Studio "Copy URL" action yields a REAL absolute URL that opens
 * directly in a browser or Power BI Image URL field.
 *
 * Safe query parameters (all optional, all sanitized):
 *   mode      mono | multicolor       (business icons only)
 *   color     hex, mono icon color    (ignored for multicolor + flags)
 *   weight    thin|regular|medium|bold (mono only)
 *   bg        none | solid
 *   bgColor   hex background color
 *   bgOpacity 0–100
 *   shape     none|softtile|rounded|capsule|circle
 *   padding   0–24 (Icon Studio slider units)
 *   size      32–1024 output box in px (default 256)
 *
 * Fixed-color content is protected here, not just in the UI:
 *  - country flags keep official colors (recoloring params are ignored)
 *  - original multicolor geometry is never recolored (no part overrides)
 */
import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse, type NextRequest } from 'next/server'
import { getV2ConceptById } from '@/lib/icon-library/registry'
import { outlineDataUri } from '@/lib/icon-library/variantRenderer'
import { buildSingleSvg, type BgShape, type IconColorMode, type IconWeight, type SheetOptions } from '@/lib/iconRenderer'
import { sanitizeHex } from '@/lib/colorUtils'
import { isFlagIcon } from '@/lib/flagLibrary'

const WEIGHTS: readonly IconWeight[] = ['thin', 'regular', 'medium', 'bold']
const SHAPES: readonly BgShape[] = ['none', 'softtile', 'rounded', 'capsule', 'circle']

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Number.parseInt(raw ?? '', 10)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(max, n))
}

function pick<T extends string>(raw: string | null, allowed: readonly T[], fallback: T): T {
  return allowed.includes((raw ?? '') as T) ? (raw as T) : fallback
}

/** Decode the registry data-URI back to raw SVG text (same bytes the client
 *  Studio fetches, so URL renders stay byte-consistent with the preview). */
function decodeDataUri(uri: string): string {
  return decodeURIComponent(uri.replace(/^data:image\/svg\+xml;utf8,/, ''))
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ iconId: string }> },
) {
  const { iconId: rawId } = await context.params
  const iconId = decodeURIComponent(rawId).replace(/\.svg$/i, '')
  const params = request.nextUrl.searchParams

  const flag = isFlagIcon(iconId)
  let svgText: string | null = null

  if (flag) {
    // flag-country-{iso} → public/icon-library/countries/{iso}.svg. The id is
    // validated to a strict [a-z]{2,3} slug so no path traversal is possible.
    const iso = iconId.slice('flag-country-'.length)
    if (!/^[a-z]{2,3}$/.test(iso)) {
      return NextResponse.json({ error: 'Unknown icon id.' }, { status: 404 })
    }
    try {
      svgText = await fs.readFile(
        path.join(process.cwd(), 'public', 'icon-library', 'countries', `${iso}.svg`),
        'utf8',
      )
    } catch {
      return NextResponse.json({ error: 'Unknown icon id.' }, { status: 404 })
    }
  }

  let fixedColors = false
  if (!flag) {
    const concept = getV2ConceptById(iconId)
    if (!concept) {
      return NextResponse.json({ error: 'Unknown icon id.' }, { status: 404 })
    }
    fixedColors = concept.fixedColors === true
    svgText = decodeDataUri(outlineDataUri(concept))
  }

  if (!svgText) {
    return NextResponse.json({ error: 'Unknown icon id.' }, { status: 404 })
  }

  // Fixed-color artwork always renders its original multicolor design.
  const mode: IconColorMode = fixedColors
    ? 'multicolor'
    : pick(params.get('mode'), ['mono', 'multicolor'] as const, 'multicolor')
  const size = clampInt(params.get('size'), 32, 1024, 256)
  const padding = clampInt(params.get('padding'), 0, 24, 0)
  const bgMode = pick(params.get('bg'), ['none', 'solid'] as const, 'none')
  const bgColorRaw = params.get('bgColor')
  const bgOpacity = clampInt(params.get('bgOpacity'), 0, 100, 100)
  const shape = pick(params.get('shape'), SHAPES, 'rounded')

  const bgFill = bgMode === 'solid' && bgColorRaw
    ? (() => {
        const c = sanitizeHex(bgColorRaw)
        const alpha = Math.max(0, Math.min(100, bgOpacity)) / 100
        return `rgba(${parseInt(c.slice(1, 3), 16)}, ${parseInt(c.slice(3, 5), 16)}, ${parseInt(c.slice(5, 7), 16)}, ${alpha})`
      })()
    : 'transparent'

  const opts: SheetOptions = {
    // Recoloring params are ignored for flags/multicolor inside the renderer;
    // flags are additionally short-circuited by isFlag.
    iconColor: sanitizeHex(params.get('color') ?? '#0D9488'),
    weight: pick(params.get('weight'), WEIGHTS, 'regular'),
    style: 'precision',
    isFlag: flag,
    colorMode: flag ? 'mono' : mode,
    bgFill,
    bgShape: bgMode === 'none' ? 'none' : shape,
    // Same padding scaling the Studio uses for its 256-box exports.
    padding: Math.round(padding * (size / 72)),
    gradient: null,
  }

  const svg = buildSingleSvg(svgText, size, opts)

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': `inline; filename="${iconId}.svg"`,
    },
  })
}
