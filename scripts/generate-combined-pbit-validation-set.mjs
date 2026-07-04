/**
 * Generates manual-verification files for the combined "Layout + Icons" PBIT
 * exporter, covering the spec's required workflows:
 *   C: 2 layout pages + 30 icons + theme  -> 3 total pages
 *   D: 2 layout pages + 92 icons          -> 4 total pages (2 layout + Icons 01/02)
 *
 * These must be opened manually in Power BI Desktop — this script only
 * produces the files. Do not report the combined export as production-ready
 * until they open successfully.
 *
 * Run: node scripts/generate-combined-pbit-validation-set.mjs
 */
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true },
    fileName: filename,
  }).outputText
  module._compile(output, filename)
}

const { buildCombinedPbit } = require('../src/lib/layout-builder/server/combinedPbitService.ts')

const { getAllV2Concepts } = require('../src/lib/icon-library/registry.ts')
const REAL_ICON_IDS = getAllV2Concepts().map((concept) => concept.id)
const OUT_DIR = path.join(rootDir, 'diagnostics', 'combined-pbit')
fs.mkdirSync(OUT_DIR, { recursive: true })

function makeLayoutPage(pageIndex, pageName) {
  return {
    pageIndex,
    pageName,
    canvasWidth: 1280,
    canvasHeight: 720,
    zones: [
      { id: `title-${pageIndex}`, type: 'title', x: 0, y: 0, width: 1280, height: 60, fields: [], text: pageName },
      { id: `chart-${pageIndex}`, type: 'chart', visualType: 'barChart', x: 40, y: 80, width: 1200, height: 600, fields: [] },
    ],
  }
}

const customization = {
  iconColor: '#2563EB',
  weight: 'bold',
  style: 'softline',
  backgroundMode: 'solid',
  solidBackgroundColor: '#EFF6FF',
  bgOpacity: 100,
  bgShape: 'rounded',
  gradient: null,
  padding: 10,
  size: 28,
}

function writeStage(filename, result) {
  const outPath = path.join(OUT_DIR, filename)
  fs.writeFileSync(outPath, result.buffer)
  console.log(`  wrote ${path.relative(rootDir, outPath)} (${result.buffer.length.toLocaleString()} bytes; ${result.layoutPageCount} layout + ${result.iconPageCount} icon = ${result.totalPageCount} total pages)`)
}

console.log('Generating combined Layout+Icons PBIT manual validation set...')

// Workflow C: 2 layout pages + 30 icons + theme -> 3 total pages
writeStage('workflow-c-2layout-30icons-theme.pbit', buildCombinedPbit({
  pages: [makeLayoutPage(0, 'Overview'), makeLayoutPage(1, 'Details')],
  iconBundle: { iconIds: REAL_ICON_IDS.slice(0, 30), customization },
  themeJSON: { name: 'Workflow C Theme', dataColors: ['#2563EB', '#0D9488', '#F59E0B', '#DC2626'] },
}))

// Workflow D: 2 layout pages + 92 icons -> 4 total pages (2 layout + Icons 01/02)
writeStage('workflow-d-2layout-92icons.pbit', buildCombinedPbit({
  pages: [makeLayoutPage(0, 'Overview'), makeLayoutPage(1, 'Details')],
  iconBundle: { iconIds: REAL_ICON_IDS.slice(0, 92), customization },
}))

console.log(`\nFiles written to ${path.relative(rootDir, OUT_DIR)}/`)
console.log('Open both in Power BI Desktop and confirm the page counts/names match the comments above.')
