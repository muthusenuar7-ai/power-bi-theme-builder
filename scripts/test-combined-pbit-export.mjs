/**
 * Validates the combined "Layout + Icons" PBIT exporter
 * (src/lib/layout-builder/server/combinedPbitService.ts) — the integration
 * feature that appends Icon Studio pages after Layout Builder pages in a
 * single .pbit, reusing the proven Layout Builder adm-zip methodology and
 * the genuine base_visual_library.pbit Image visual for icon tiles.
 *
 * Covers the spec's required workflows:
 *   C: 2 layout pages + 30 icons + theme  -> 3 total pages
 *   D: 2 layout pages + 92 icons          -> 4 total pages (2 layout + Icons 01/02)
 * plus base structural checks (unique names, in-bounds placement, theme part
 * present, SecurityBindings removed, base file untouched).
 *
 * Run: node scripts/test-combined-pbit-export.mjs
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

const { buildCombinedPbit } = require('../src/lib/layout-builder/server/combinedPbitService.ts')
const VISUAL_LIBRARY_PATH = path.join(rootDir, 'public', 'templates', 'layout-builder', 'base_visual_library.pbit')

// Genuinely distinct, resolvable icon ids (the combined exporter looks icons
// up by id against the production registry, so synthetic/suffixed ids would
// fail to resolve) — large enough pool to exercise multi-page overflow.
const { getAllV2Concepts } = require('../src/lib/icon-library/registry.ts')
const REAL_ICON_IDS = getAllV2Concepts().map((concept) => concept.id)

let failures = 0
function check(label, condition) {
  if (!condition) { failures++; console.log(`FAIL: ${label}`) }
  return condition
}

function makeLayoutPage(pageIndex, pageName) {
  return {
    pageIndex,
    pageName,
    canvasWidth: 1280,
    canvasHeight: 720,
    zones: [
      { id: `title-${pageIndex}`, type: 'title', x: 0, y: 0, width: 1280, height: 60, fields: [], text: pageName },
      { id: `chart-${pageIndex}`, type: 'chart', visualType: 'barChart', x: 0, y: 60, width: 1280, height: 660, fields: [] },
    ],
  }
}

function makeIconBundle(count, overrides) {
  // Use real, existing icon ids so the renderer can resolve actual SVG sources.
  const realIds = ['v2-bar-chart', 'v2-revenue', 'v2-invoice', 'v2-target', 'flag-country-us', 'flag-country-gb']
  const ids = Array.from({ length: count }, (_, i) => realIds[i % realIds.length] + (i >= realIds.length ? `#${i}` : ''))
  // Dedupe-by-id is exercised by the service itself; for distinct counts here we
  // need genuinely distinct ids, so suffix uniquely while keeping a resolvable base id.
  return {
    iconIds: count <= realIds.length ? realIds.slice(0, count) : ids.map((_, i) => realIds[i % realIds.length]),
    customization: {
      iconColor: '#2563EB',
      weight: 'bold',
      style: 'softline',
      backgroundMode: 'solid',
      solidBackgroundColor: '#FFFFFF',
      bgOpacity: 100,
      bgShape: 'rounded',
      gradient: null,
      padding: 10,
      size: 28,
      ...overrides,
    },
  }
}

function decodeLayout(buffer) {
  const layoutEntry = new AdmZip(buffer).getEntry('Report/Layout')
  const buf = layoutEntry.getData()
  const hasBom = buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe
  const text = (hasBom ? buf.slice(2).toString('utf16le') : buf.toString('utf16le')).replace(/^﻿/, '')
  return JSON.parse(text)
}

// Real Tabler/flag icon ids cycled deterministically, so totals are computed
// from the number of UNIQUE ids actually used (icon counts beyond the id pool
// size legitimately dedupe down — that itself is part of what's verified).
function runCleanWorkflow(label, layoutPageCount, iconCount, withTheme) {
  console.log(`\n=== ${label}: ${layoutPageCount} layout page(s) + ${iconCount} icon(s)${withTheme ? ' + theme' : ''} ===`)
  const pages = Array.from({ length: layoutPageCount }, (_, i) => makeLayoutPage(i, `Page ${i + 1}`))
  const iconIds = REAL_ICON_IDS.slice(0, iconCount)
  const uniqueExpected = new Set(iconIds).size

  const result = buildCombinedPbit({
    pages,
    iconBundle: { iconIds, customization: makeIconBundle(1).customization },
    themeJSON: withTheme ? { name: 'Workflow Theme', dataColors: ['#2563EB', '#0D9488', '#F59E0B'] } : undefined,
  })

  const expectedIconPages = Math.ceil(uniqueExpected / 91)
  const expectedTotal = layoutPageCount + expectedIconPages

  check(`${label}: layoutPageCount === ${layoutPageCount}`, result.layoutPageCount === layoutPageCount)
  check(`${label}: iconPageCount === ${expectedIconPages}`, result.iconPageCount === expectedIconPages)
  check(`${label}: totalPageCount === ${expectedTotal}`, result.totalPageCount === expectedTotal)

  const layout = decodeLayout(result.buffer)
  check(`${label}: layout.sections.length === totalPageCount`, layout.sections.length === expectedTotal)

  const layoutSections = layout.sections.slice(0, layoutPageCount)
  const iconSections = layout.sections.slice(layoutPageCount)

  layoutSections.forEach((section, i) => {
    check(`${label}: layout page ${i} displayName "Page ${i + 1}"`, section.displayName === `Page ${i + 1}`)
  })
  iconSections.forEach((section, i) => {
    const expectedName = `Icons ${String(i + 1).padStart(2, '0')}`
    check(`${label}: icon page ${i} displayName "${expectedName}"`, section.displayName === expectedName)
  })

  const totalIconVisuals = iconSections.reduce((sum, s) => sum + s.visualContainers.length, 0)
  check(`${label}: total icon visuals === ${uniqueExpected} (deduped)`, totalIconVisuals === uniqueExpected)

  for (const section of iconSections) {
    for (const vc of section.visualContainers) {
      check(`${label}: icon visual within page bounds`, vc.x >= 0 && vc.y >= 0 && vc.x + vc.width <= section.width && vc.y + vc.height <= section.height)
      const config = JSON.parse(vc.config)
      check(`${label}: icon visual is an image visual`, config.singleVisual.visualType === 'image')
    }
  }

  const allVisualNames = layout.sections.flatMap((s) => s.visualContainers.map((vc) => JSON.parse(vc.config).name))
  check(`${label}: all visual names unique`, new Set(allVisualNames).size === allVisualNames.length)
  const allSectionNames = layout.sections.map((s) => s.name)
  check(`${label}: all section names unique`, new Set(allSectionNames).size === allSectionNames.length)

  if (uniqueExpected > 0) {
    const registered = layout.resourcePackages.find((p) => p.resourcePackage.name === 'RegisteredResources')
    check(`${label}: RegisteredResources present with ${uniqueExpected} items`, registered?.resourcePackage.items.length === uniqueExpected)
  }

  const zip = new AdmZip(result.buffer)
  check(`${label}: SecurityBindings removed`, !zip.getEntry('SecurityBindings'))
  if (withTheme) {
    check(`${label}: CustomTheme.json present`, Boolean(zip.getEntry('Report/StaticResources/CustomTheme.json')))
  }

  console.log(`  layoutPages=${result.layoutPageCount} iconPages=${result.iconPageCount} total=${result.totalPageCount}`)
}

runCleanWorkflow('Workflow C', 2, 30, true)
runCleanWorkflow('Workflow D', 2, 92, false)
runCleanWorkflow('Layout only (no icons)', 2, 0, false)

// ─── Base template + error handling ────────────────────────────────────────
console.log('\n=== Base template integrity + error handling ===')
{
  const before = fs.readFileSync(VISUAL_LIBRARY_PATH)
  const hashBefore = crypto.createHash('md5').update(before).digest('hex')

  let threw = false
  let message = ''
  try {
    buildCombinedPbit({
      pages: [makeLayoutPage(0, 'Page 1')],
      iconBundle: { iconIds: ['v2-this-icon-does-not-exist'], customization: makeIconBundle(1).customization },
    })
  } catch (error) {
    threw = true
    message = error instanceof Error ? error.message : String(error)
  }
  check('unknown icon id throws a clear, named error', threw && message.includes('v2-this-icon-does-not-exist'))

  const after = fs.readFileSync(VISUAL_LIBRARY_PATH)
  check('base_visual_library.pbit unchanged on disk after all runs', crypto.createHash('md5').update(after).digest('hex') === hashBefore && after.length === before.length)
}

console.log(`\n${failures === 0 ? 'All' : failures} combined PBIT export checks ${failures === 0 ? 'PASSED' : 'FAILED'}`)
if (failures > 0) process.exit(1)
