/**
 * Validates the new adm-zip-based Icon Studio PBIT service
 * (src/lib/icon-studio/server/iconPbitService.ts) — the server-side migration
 * of the PBIT exporter onto the same proven methodology as the Layout
 * Builder exporter (src/lib/layout-builder/server/pbitService.ts).
 *
 * Covers: page/grid math across the required test cases (1, 2, 5, 30, 91, 92,
 * 183 icons), unique visual/resource names, in-bounds grid placement, base
 * file on disk left untouched, SecurityBindings removed (same rule as Layout
 * Builder), old placeholder resource dropped, and a side-by-side check that
 * both exporters produce archives openable by the same adm-zip library.
 *
 * Run: node scripts/test-icon-studio-pbit-service.mjs
 */
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import ts from 'typescript'
import AdmZip from 'adm-zip'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = Module.createRequire(import.meta.url)
const originalResolve = Module._resolveFilename

function resolveAlias(request) {
  if (!request.startsWith('@/')) return null
  const base = path.join(rootDir, 'src', request.slice(2))
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.json`, path.join(base, 'index.ts')]
  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null
}

Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  const aliasPath = resolveAlias(request)
  if (aliasPath) return aliasPath
  return originalResolve.call(this, request, parent, isMain, options)
}

require.extensions['.ts'] = function compileTs(module, filename) {
  const source = fs.readFileSync(filename, 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      resolveJsonModule: true,
    },
    fileName: filename,
  }).outputText
  module._compile(output, filename)
}

const {
  buildIconLibraryPbit, computeIconPageCount, GRID_COLS, GRID_ROWS, PAGE_CAPACITY,
} = require('../src/lib/icon-studio/server/iconPbitService.ts')
const { buildLayoutPbit } = require('../src/lib/layout-builder/server/pbitService.ts')

const ICON_BASE_PATH = path.join(rootDir, 'public', 'templates', 'icon-studio', 'icon-library-base.pbit')
const LAYOUT_BASE_PATH = path.join(rootDir, 'public', 'templates', 'layout-builder', 'base.pbit')

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex')
}

let failures = 0
function check(label, condition) {
  if (!condition) { failures++; console.log(`FAIL: ${label}`) }
  return condition
}

function makeIcon(index, colorHex = '#2563EB') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" fill="${colorHex}"/><text x="50%" y="50%" text-anchor="middle">icon-${index}</text></svg>`
  return { id: `icon-${index}`, name: `Icon ${index}`, svg }
}

function buildIcons(count) {
  return Array.from({ length: count }, (_, i) => makeIcon(i))
}

function runCase(count) {
  console.log(`\n=== Icon Studio service test case: ${count} icon(s) ===`)
  const icons = buildIcons(count)
  const pbitBuffer = buildIconLibraryPbit(icons)
  check('buildIconLibraryPbit returns a Buffer', Buffer.isBuffer(pbitBuffer))

  // Round-trip through adm-zip again — the same library Power BI's package
  // must also be able to open — proving the produced archive is well-formed.
  const zip = new AdmZip(pbitBuffer)
  const entries = zip.getEntries()
  check('re-opened archive has entries', entries.length > 0)

  const layoutEntry = zip.getEntry('Report/Layout')
  check('Report/Layout present', Boolean(layoutEntry))
  const buf = layoutEntry.getData()
  const hasBom = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe
  const text = (hasBom ? buf.slice(2).toString('utf16le') : buf.toString('utf16le')).replace(/^﻿/, '')
  const layout = JSON.parse(text)

  const expectedPages = computeIconPageCount(count)
  check(`page count === Math.ceil(${count}/${PAGE_CAPACITY}) = ${expectedPages}`, layout.sections.length === expectedPages)

  const totalVisuals = layout.sections.reduce((sum, s) => sum + s.visualContainers.length, 0)
  check(`total visuals === ${count}`, totalVisuals === count)

  layout.sections.forEach((section, pageIdx) => {
    const expectedName = `Icon Library ${String(pageIdx + 1).padStart(2, '0')}`
    check(`section ${pageIdx} displayName "${expectedName}"`, section.displayName === expectedName)

    section.visualContainers.forEach((vc) => {
      check(`section ${pageIdx} visual within page bounds`,
        vc.x >= 0 && vc.y >= 0 && vc.x + vc.width <= section.width && vc.y + vc.height <= section.height)
      const config = JSON.parse(vc.config)
      check(`section ${pageIdx} visual is an image visual`, config.singleVisual.visualType === 'image')
      check('cloned visual preserves genuine sourceFile.image schema',
        Boolean(config.singleVisual.objects?.image?.[0]?.properties?.sourceFile?.image))
    })
  })

  const sectionNames = layout.sections.map((s) => s.name)
  check('section names unique', new Set(sectionNames).size === sectionNames.length)
  const visualNames = layout.sections.flatMap((s) => s.visualContainers.map((vc) => JSON.parse(vc.config).name))
  check('visual names unique', new Set(visualNames).size === visualNames.length)

  const registered = layout.resourcePackages.find((p) => p.resourcePackage.name === 'RegisteredResources').resourcePackage
  check(`RegisteredResources item count === ${count}`, registered.items.length === count)
  check('resource item names unique', new Set(registered.items.map((it) => it.name)).size === registered.items.length)

  const shared = layout.resourcePackages.find((p) => p.resourcePackage.name === 'SharedResources')
  check('SharedResources package carried over from base', Boolean(shared))

  const resourceEntryCount = entries.filter((e) => e.entryName.startsWith('Report/StaticResources/RegisteredResources/')).length
  check(`zip contains ${count} registered resource files`, resourceEntryCount === count)

  check('old placeholder currency-dollar SVG dropped', !entries.some((e) => e.entryName.includes('currency-dollar')))
  check('SecurityBindings removed (same rule as Layout Builder)', !zip.getEntry('SecurityBindings'))

  for (const part of ['Version', '[Content_Types].xml', 'DataModelSchema', 'Settings', 'Metadata']) {
    check(`passthrough part "${part}" present`, Boolean(zip.getEntry(part)))
  }

  console.log(`  pages=${layout.sections.length} visuals=${totalVisuals} resourceItems=${registered.items.length}`)
}

function runLayoutBuilderComparison() {
  console.log('\n=== Side-by-side comparison with Layout Builder exporter ===')
  const layoutPbit = buildLayoutPbit({
    canvasWidth: 1280,
    canvasHeight: 720,
    reportName: 'Comparison Check',
    zones: [],
  })
  const layoutZip = new AdmZip(layoutPbit)
  check('Layout Builder output also has SecurityBindings removed', !layoutZip.getEntry('SecurityBindings'))
  check('Layout Builder output is a well-formed adm-zip archive', layoutZip.getEntries().length > 0)
  console.log('  Both exporters: adm-zip load/modify/save, SecurityBindings removed after mutation. Consistent.')
}

function main() {
  const baseBefore = fs.readFileSync(ICON_BASE_PATH)
  const hashBefore = md5(baseBefore)

  for (const count of [1, 2, 5, 30, 91, 92, 183]) {
    runCase(count)
  }

  const baseAfter = fs.readFileSync(ICON_BASE_PATH)
  check('icon-studio base .pbit file on disk is byte-for-byte unchanged', md5(baseAfter) === hashBefore && baseAfter.length === baseBefore.length)
  check('grid is 13 x 7', GRID_COLS === 13 && GRID_ROWS === 7 && PAGE_CAPACITY === 91)

  if (fs.existsSync(LAYOUT_BASE_PATH)) {
    runLayoutBuilderComparison()
  } else {
    console.log('\n(Skipped Layout Builder comparison: base.pbit not found.)')
  }

  console.log(`\n${failures === 0 ? 'All' : failures} Icon Studio PBIT service checks ${failures === 0 ? 'PASSED' : 'FAILED'}`)
  if (failures > 0) process.exit(1)
}

main()
