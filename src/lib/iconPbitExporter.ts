/**
 * Icon Studio -> Power BI template (.pbit) export.
 *
 * Opens the base template shipped at public/templates/pbit/icon-library-base.pbit
 * (one "Icon Library 01" page with a single sample image visual), then rebuilds
 * its Report/Layout so every selected icon becomes its own image visual placed
 * on a 13x7 grid, paging automatically once a page's 91 slots are full. The base
 * file on disk is only ever read, never written back to.
 */
import type { IconLibraryItem } from '@/types'
import { isFlagIcon } from '@/lib/flagLibrary'
import { buildSingleSvg, type SheetOptions } from '@/lib/iconRenderer'
import { slugifyFilePart } from '@/lib/exportUtils'
import { createZip, strToBytes, type ZipEntry } from '@/lib/zipWriter'
import { decodeUtf16le, encodeUtf16le, readZipEntries } from '@/lib/zipReader'

export const GRID_COLS = 13
export const GRID_ROWS = 7
export const PAGE_CAPACITY = GRID_COLS * GRID_ROWS // 91

const MARGIN = 20
const GUTTER = 8
const FALLBACK_PAGE_WIDTH = 1280
const FALLBACK_PAGE_HEIGHT = 720
const BASE_PBIT_URL = '/templates/pbit/icon-library-base.pbit'

export function computePageCount(iconCount: number): number {
  return Math.ceil(iconCount / PAGE_CAPACITY)
}

interface RawResourcePackageItem { type: number; path: string; name: string }
interface RawResourcePackage { resourcePackage: { name: string; type: number; items: RawResourcePackageItem[]; disabled: boolean } }
interface RawVisualContainer { x: number; y: number; z: number; width: number; height: number; config: string; filters: string }
interface RawSection {
  id: number
  name: string
  displayName: string
  filters: string
  ordinal: number
  visualContainers: RawVisualContainer[]
  config: string
  displayOption: number
  width: number
  height: number
}
interface RawLayout {
  id: number
  resourcePackages: RawResourcePackage[]
  sections: RawSection[]
  config: string
  layoutOptimization: number
}

interface GridGeometry { cellW: number; cellH: number; boxSize: number }
interface CellPosition { x: number; y: number; width: number; height: number; tabOrder: number }

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** Derives uniform square icon tiles from the page size, 13x7 grid and outer
 *  margin — every tile is centred within its grid cell so spacing stays even
 *  in both directions even when the page isn't a perfect 13:7 ratio. */
export function computeGridGeometry(pageWidth: number, pageHeight: number): GridGeometry {
  const usableW = pageWidth - MARGIN * 2
  const usableH = pageHeight - MARGIN * 2
  const cellW = usableW / GRID_COLS
  const cellH = usableH / GRID_ROWS
  const boxSize = Math.max(8, Math.min(cellW, cellH) - GUTTER)
  return { cellW, cellH, boxSize }
}

export function cellPosition(indexOnPage: number, geo: GridGeometry): CellPosition {
  const col = indexOnPage % GRID_COLS
  const row = Math.floor(indexOnPage / GRID_COLS)
  const x = MARGIN + col * geo.cellW + (geo.cellW - geo.boxSize) / 2
  const y = MARGIN + row * geo.cellH + (geo.cellH - geo.boxSize) / 2
  return { x: round2(x), y: round2(y), width: round2(geo.boxSize), height: round2(geo.boxSize), tabOrder: indexOnPage }
}

function uniqueToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID().replace(/-/g, '')
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`.slice(0, 24)
}

function buildVisualConfig(visualName: string, label: string, resourceItemName: string, pos: CellPosition): string {
  return JSON.stringify({
    name: visualName,
    layouts: [{ id: 0, position: { x: pos.x, y: pos.y, z: 0, width: pos.width, height: pos.height, tabOrder: pos.tabOrder } }],
    singleVisual: {
      visualType: 'image',
      drillFilterOtherVisuals: true,
      objects: {
        image: [{
          properties: {
            sourceFile: {
              image: {
                name: { expr: { Literal: { Value: `'${label}'` } } },
                url: { expr: { ResourcePackageItem: { PackageName: 'RegisteredResources', PackageType: 1, ItemName: resourceItemName } } },
                scaling: { expr: { Literal: { Value: "'Normal'" } } },
              },
            },
          },
        }],
      },
    },
  })
}

async function defaultLoadBasePbit(): Promise<ArrayBuffer> {
  const res = await fetch(BASE_PBIT_URL)
  if (!res.ok) throw new Error(`Could not load the base Power BI template (HTTP ${res.status}).`)
  return res.arrayBuffer()
}

export interface PbitSourceIcon {
  icon: IconLibraryItem
  svgText: string
}

/**
 * Builds the exported .pbit Blob. `sourceIcons` must already carry each icon's
 * raw (unstyled) SVG source text — fetched and cached by the caller, the same
 * way Download SVG/PNG do it — so customization renders identically everywhere.
 */
export async function exportIconsAsPbitTemplate(
  sourceIcons: PbitSourceIcon[],
  sheetOptionsFor: (isFlag: boolean) => SheetOptions,
  loadBasePbit: () => Promise<ArrayBuffer> = defaultLoadBasePbit,
): Promise<Blob> {
  if (sourceIcons.length === 0) throw new Error('No icons selected for Power BI template export.')

  const baseBuffer = await loadBasePbit()
  const baseEntries = await readZipEntries(baseBuffer)
  const layoutBytes = baseEntries.get('Report/Layout')
  if (!layoutBytes) throw new Error('Base Power BI template is missing Report/Layout.')
  const baseLayout = JSON.parse(decodeUtf16le(layoutBytes)) as RawLayout

  const pageWidth = baseLayout.sections[0]?.width ?? FALLBACK_PAGE_WIDTH
  const pageHeight = baseLayout.sections[0]?.height ?? FALLBACK_PAGE_HEIGHT
  const geometry = computeGridGeometry(pageWidth, pageHeight)

  const sharedResourcesPkg = baseLayout.resourcePackages.find((p) => p.resourcePackage.name === 'SharedResources')
  const resourceItems: RawResourcePackageItem[] = []
  const sections: RawSection[] = []
  const newSvgEntries: ZipEntry[] = []

  sourceIcons.forEach(({ icon, svgText }, globalIndex) => {
    const pageIndex = Math.floor(globalIndex / PAGE_CAPACITY)
    const indexOnPage = globalIndex % PAGE_CAPACITY
    const slugName = slugifyFilePart(icon.name, 'icon')
    const resourceItemName = `${slugName}-${globalIndex}.svg`
    const rendered = buildSingleSvg(svgText, 256, sheetOptionsFor(isFlagIcon(icon.id)))

    resourceItems.push({ type: 100, path: resourceItemName, name: resourceItemName })
    newSvgEntries.push({ name: `Report/StaticResources/RegisteredResources/${resourceItemName}`, data: strToBytes(rendered) })

    let section = sections[pageIndex]
    if (!section) {
      const pageNumber = pageIndex + 1
      section = {
        id: pageIndex,
        name: uniqueToken(),
        displayName: `Icon Library ${String(pageNumber).padStart(2, '0')}`,
        filters: '[]',
        ordinal: pageIndex,
        visualContainers: [],
        config: '{}',
        displayOption: 1,
        width: pageWidth,
        height: pageHeight,
      }
      sections[pageIndex] = section
    }

    const pos = cellPosition(indexOnPage, geometry)
    const visualName = uniqueToken()
    const config = buildVisualConfig(visualName, `${slugName}.svg`, resourceItemName, pos)
    section.visualContainers.push({ x: pos.x, y: pos.y, z: 0, width: pos.width, height: pos.height, config, filters: '[]' })
  })

  const resourcePackages: RawResourcePackage[] = []
  if (sharedResourcesPkg) resourcePackages.push(sharedResourcesPkg)
  resourcePackages.push({ resourcePackage: { name: 'RegisteredResources', type: 1, items: resourceItems, disabled: false } })

  const finalLayout: RawLayout = {
    id: 0,
    resourcePackages,
    sections,
    config: baseLayout.config,
    layoutOptimization: 0,
  }

  const layoutEntry: ZipEntry = { name: 'Report/Layout', data: encodeUtf16le(JSON.stringify(finalLayout)) }

  // Carry over every other base part untouched (Version, Settings, Metadata,
  // DataModelSchema, SecurityBindings, [Content_Types].xml, the shared theme
  // JSON, ...). The old placeholder image under RegisteredResources is dropped
  // since nothing in the rebuilt layout references it any more.
  const passthroughEntries: ZipEntry[] = []
  for (const [name, data] of baseEntries) {
    if (name === 'Report/Layout') continue
    if (name.startsWith('Report/StaticResources/RegisteredResources/')) continue
    passthroughEntries.push({ name, data })
  }

  return createZip([...passthroughEntries, layoutEntry, ...newSvgEntries])
}
