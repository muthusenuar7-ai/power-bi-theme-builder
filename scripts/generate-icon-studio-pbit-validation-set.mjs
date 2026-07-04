/**
 * Generates the Phase 8 staged validation set for the migrated (adm-zip
 * based) Icon Studio PBIT exporter. Each stage must be opened manually in
 * Power BI Desktop, in order, before the next is trusted:
 *
 *   1. stage1-exact-copy.pbit              - byte-for-byte copy of the base
 *   2. stage2-resource-replaced-only.pbit   - existing visual, resource bytes swapped only
 *   3. stage3-two-icons.pbit                - two independent icon visuals, one page
 *   4. stage4-five-icons.pbit
 *   5. stage5-thirty-icons.pbit
 *   6. stage6-ninety-one-icons.pbit         - exactly fills one page (13x7)
 *   7. stage7-ninety-two-icons.pbit         - spills onto a second page
 *   8. stage8-one-hundred-eighty-three-icons.pbit - three pages
 *
 * A stage is only "passed" once it opens without a corruption error in Power
 * BI Desktop, shows every icon, allows selecting each independently, and
 * preserves customization. This script does not and cannot make that
 * determination — it only produces the files for manual verification.
 *
 * Run: node scripts/generate-icon-studio-pbit-validation-set.mjs
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

const { buildIconLibraryPbit, buildResourceReplacedOnlyPbit } = require('../src/lib/icon-studio/server/iconPbitService.ts')

const ICON_BASE_PATH = path.join(rootDir, 'public', 'templates', 'icon-studio', 'icon-library-base.pbit')
const OUT_DIR = path.join(rootDir, 'diagnostics', 'icon-studio-pbit')

fs.mkdirSync(OUT_DIR, { recursive: true })

const PALETTE = ['#2563EB', '#0D9488', '#DB2777', '#EA580C', '#7C3AED', '#16A34A', '#0EA5E9', '#CA8A04']

function makeIcon(index) {
  const color = PALETTE[index % PALETTE.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="24" fill="${color}"/><text x="50%" y="55%" font-size="48" fill="#ffffff" text-anchor="middle" font-family="Segoe UI, sans-serif">${index + 1}</text></svg>`
  return { id: `validation-icon-${index}`, name: `Validation Icon ${index + 1}`, svg }
}

function writeStage(filename, buffer) {
  const outPath = path.join(OUT_DIR, filename)
  fs.writeFileSync(outPath, buffer)
  console.log(`  wrote ${path.relative(rootDir, outPath)} (${buffer.length.toLocaleString()} bytes)`)
}

console.log('Generating Icon Studio PBIT manual validation set...')

// Stage 1: exact byte-for-byte copy of the genuine base template.
writeStage('stage1-exact-copy.pbit', fs.readFileSync(ICON_BASE_PATH))

// Stage 2: existing visual untouched, only the resource bytes behind it swapped.
writeStage('stage2-resource-replaced-only.pbit', buildResourceReplacedOnlyPbit(makeIcon(0).svg))

// Stages 3-8: the real grid/page export pipeline at increasing scale.
const stageCounts = [
  { file: 'stage3-two-icons.pbit', count: 2 },
  { file: 'stage4-five-icons.pbit', count: 5 },
  { file: 'stage5-thirty-icons.pbit', count: 30 },
  { file: 'stage6-ninety-one-icons.pbit', count: 91 },
  { file: 'stage7-ninety-two-icons.pbit', count: 92 },
  { file: 'stage8-one-hundred-eighty-three-icons.pbit', count: 183 },
]

for (const { file, count } of stageCounts) {
  const icons = Array.from({ length: count }, (_, i) => makeIcon(i))
  writeStage(file, buildIconLibraryPbit(icons))
}

console.log(`\nAll staged files written to ${path.relative(rootDir, OUT_DIR)}/`)
console.log('Open them in Power BI Desktop in order (stage1 -> stage8). Do not skip ahead.')
