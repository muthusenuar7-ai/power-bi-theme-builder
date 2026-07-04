/**
 * Validates the Icon Studio -> Power BI template (.pbit) export across the
 * required test cases (1, 30, 91, 92, 183 icons): correct page count, every
 * icon present as its own visual, unique names/ids, in-bounds grid placement,
 * customization carried through, and the base template file on disk left
 * byte-for-byte untouched.
 * Run: node scripts/test-icon-pbit-export.mjs
 */
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import crypto from 'node:crypto'
import ts from 'typescript'

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
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText
  module._compile(output, filename)
}

const {
  exportIconsAsPbitTemplate, computePageCount, GRID_COLS, GRID_ROWS, PAGE_CAPACITY,
} = require('../src/lib/iconPbitExporter.ts')
const { readZipEntries, decodeUtf16le } = require('../src/lib/zipReader.ts')

const BASE_PBIT_PATH = path.join(rootDir, 'public', 'templates', 'pbit', 'icon-library-base.pbit')
const { getAllV2Concepts } = require('../src/lib/icon-library/registry.ts')
const { outlineDataUri } = require('../src/lib/icon-library/variantRenderer.ts')

function toArrayBuffer(buf) {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

function md5(buf) {
  return crypto.createHash('md5').update(buf).digest('hex')
}

async function loadBasePbitFromDisk() {
  return toArrayBuffer(fs.readFileSync(BASE_PBIT_PATH))
}

const iconMetadata = getAllV2Concepts().map((concept) => ({
  id: concept.id,
  name: concept.name,
  svgText: decodeURIComponent(outlineDataUri(concept).replace('data:image/svg+xml;utf8,', '')),
}))
console.log(`Loaded ${iconMetadata.length.toLocaleString()} production registry concepts.`)

function buildSourceIcons(count) {
  const icons = []
  for (let i = 0; i < count; i++) {
    const icon = iconMetadata[i % iconMetadata.length]
    // Disambiguate repeated source icons (count > registry slice) so resource
    // names stay unique even when cycling, mirroring real distinct selections.
    icons.push({ icon: { id: `${icon.id}-${i}`, name: `${icon.name} #${i}` }, svgText: icon.svgText })
  }
  return icons
}

// A deliberately non-default customization, exercising colour/background/
// gradient/shape/padding/weight/style all at once, same as the live UI would.
function sheetOptionsFor(isFlag) {
  return {
    iconColor: '#2563EB',
    weight: 'bold',
    style: 'softline',
    isFlag,
    bgFill: 'rgba(37, 99, 235, 0.12)',
    bgShape: 'rounded',
    padding: Math.round(12 * (256 / 72)),
    gradient: null,
  }
}

let failures = 0
function check(label, condition) {
  if (!condition) { failures++; console.log(`FAIL: ${label}`) }
}

async function runCase(count) {
  console.log(`\n=== Test case: ${count} icon(s) ===`)
  const sourceIcons = buildSourceIcons(count)
  const blob = await exportIconsAsPbitTemplate(sourceIcons, sheetOptionsFor, loadBasePbitFromDisk)
  const outBuffer = await blob.arrayBuffer()
  const entries = await readZipEntries(outBuffer)

  const layoutBytes = entries.get('Report/Layout')
  check('Report/Layout present', Boolean(layoutBytes))
  const layout = JSON.parse(decodeUtf16le(layoutBytes))

  const expectedPages = computePageCount(count)
  check(`page count === Math.ceil(${count}/${PAGE_CAPACITY}) = ${expectedPages}`, layout.sections.length === expectedPages)

  const totalVisuals = layout.sections.reduce((sum, s) => sum + s.visualContainers.length, 0)
  check(`total visuals === ${count}`, totalVisuals === count)

  layout.sections.forEach((section, pageIdx) => {
    const expectedName = `Icon Library ${String(pageIdx + 1).padStart(2, '0')}`
    check(`section ${pageIdx} displayName "${expectedName}"`, section.displayName === expectedName)
    const expectedOnPage = pageIdx < layout.sections.length - 1
      ? PAGE_CAPACITY
      : count - PAGE_CAPACITY * (layout.sections.length - 1)
    check(`section ${pageIdx} has ${expectedOnPage} visuals`, section.visualContainers.length === expectedOnPage)

    section.visualContainers.forEach((vc, i) => {
      check(`section ${pageIdx} visual ${i} within page bounds`,
        vc.x >= 0 && vc.y >= 0 && vc.x + vc.width <= section.width && vc.y + vc.height <= section.height)
      const config = JSON.parse(vc.config)
      check(`section ${pageIdx} visual ${i} tabOrder === ${i}`, config.layouts[0].position.tabOrder === i)
      check(`section ${pageIdx} visual ${i} is an image visual`, config.singleVisual.visualType === 'image')
    })
  })

  // Uniqueness across the whole file.
  const sectionNames = layout.sections.map((s) => s.name)
  check('section names unique', new Set(sectionNames).size === sectionNames.length)
  const visualNames = layout.sections.flatMap((s) => s.visualContainers.map((vc) => JSON.parse(vc.config).name))
  check('visual names unique', new Set(visualNames).size === visualNames.length)

  const registered = layout.resourcePackages.find((p) => p.resourcePackage.name === 'RegisteredResources').resourcePackage
  check(`RegisteredResources item count === ${count}`, registered.items.length === count)
  const itemNames = registered.items.map((it) => it.name)
  check('resource item names unique', new Set(itemNames).size === itemNames.length)

  const shared = layout.resourcePackages.find((p) => p.resourcePackage.name === 'SharedResources')
  check('SharedResources package carried over from base', Boolean(shared))

  const svgEntryCount = [...entries.keys()].filter((n) => n.startsWith('Report/StaticResources/RegisteredResources/')).length
  check(`zip contains ${count} registered SVG resource files`, svgEntryCount === count)

  // Customization should be baked into the rendered SVG (colour + weight chosen above).
  const firstResourceName = registered.items[0].name
  const firstSvg = new TextDecoder().decode(entries.get(`Report/StaticResources/RegisteredResources/${firstResourceName}`))
  check('rendered SVG carries the chosen icon colour', firstSvg.includes('#2563EB'))
  check('rendered SVG carries the chosen stroke weight', firstSvg.includes('stroke-width="2.5"'))

  // Passthrough parts must still be present, base placeholder dropped.
  for (const part of ['Version', '[Content_Types].xml', 'DataModelSchema', 'Settings', 'Metadata', 'SecurityBindings']) {
    check(`passthrough part "${part}" present`, entries.has(part))
  }
  check('old placeholder currency-dollar SVG dropped', ![...entries.keys()].some((n) => n.includes('currency-dollar')))

  console.log(`  pages=${layout.sections.length} visuals=${totalVisuals} resourceItems=${registered.items.length}`)
}

async function main() {
  const baseBefore = fs.readFileSync(BASE_PBIT_PATH)
  const hashBefore = md5(baseBefore)

  for (const count of [1, 30, 91, 92, 183]) {
    await runCase(count)
  }

  const baseAfter = fs.readFileSync(BASE_PBIT_PATH)
  check('base .pbit file on disk is byte-for-byte unchanged', md5(baseAfter) === hashBefore && baseAfter.length === baseBefore.length)
  check('grid is 13 x 7', GRID_COLS === 13 && GRID_ROWS === 7 && PAGE_CAPACITY === 91)

  console.log(`\n${failures === 0 ? 'All' : failures} icon-PBIT export checks ${failures === 0 ? 'PASSED' : 'FAILED'}`)
  if (failures > 0) process.exit(1)
}

main()
