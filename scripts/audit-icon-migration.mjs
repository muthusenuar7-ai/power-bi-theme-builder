/**
 * Icon-library MIGRATION audit — verifies the legacy Tabler/generated library
 * is completely removed and the production gallery is exactly:
 *
 *     curated business icons (src/lib/icon-library) + ISO country flags
 *
 * Checks:
 *  1. No source file imports the removed modules (generatedIconLibrary,
 *     iconCuration) and no old runtime fallback exists.
 *  2. Old asset folders (public/icon-library/tabler, /custom) are gone;
 *     country-flag assets remain and every registered flag file exists.
 *  3. @tabler/icons is no longer a dependency.
 *  4. Production loader output contains only v2- and flag-country- ids —
 *     no legacy tabler-/custom- id appears.
 *  5. Every business icon has a valid category, keywords, description and
 *     declared color modes; flags are fixed-color 'Countries' entries.
 *  6. Gallery counts: business concepts + flags = total.
 *
 * Run: node scripts/audit-icon-migration.mjs   (npm run audit:icon-migration)
 * Exits non-zero on any failure.
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
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.json`, path.join(base, 'index.ts')]
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

let failures = 0
const check = (label, ok) => { if (!ok) { failures++; console.log(`FAIL: ${label}`) } }

/* ── 1. dead-reference scan across src + scripts ── */
const BANNED_PATTERNS = [
  /@\/lib\/generatedIconLibrary/,
  /@\/lib\/iconCuration/,
  /icon-library\/tabler/,
  /getTablerIconIndex/,
  /@tabler\/icons/,
]
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(ts|tsx|mjs|js|json)$/.test(entry.name)) yield full
  }
}
let bannedHits = 0
for (const dir of ['src', 'scripts']) {
  for (const file of walk(path.join(rootDir, dir))) {
    if (file.endsWith('audit-icon-migration.mjs')) continue
    const text = fs.readFileSync(file, 'utf8')
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(text)) {
        bannedHits++
        console.log(`  LEGACY REF ${path.relative(rootDir, file)}: ${pattern}`)
      }
    }
  }
}
check('zero legacy imports/references in src + scripts', bannedHits === 0)
check('generatedIconLibrary.ts deleted', !fs.existsSync(path.join(rootDir, 'src/lib/generatedIconLibrary.ts')))
check('iconCuration.ts deleted', !fs.existsSync(path.join(rootDir, 'src/lib/iconCuration.ts')))
check('IconLibraryPanel.tsx deleted', !fs.existsSync(path.join(rootDir, 'src/components/icons/IconLibraryPanel.tsx')))

/* ── 2. assets ── */
check('public/icon-library/tabler removed', !fs.existsSync(path.join(rootDir, 'public/icon-library/tabler')))
check('public/icon-library/custom removed', !fs.existsSync(path.join(rootDir, 'public/icon-library/custom')))
check('country flag assets present', fs.existsSync(path.join(rootDir, 'public/icon-library/countries')))

/* ── 3. dependency ── */
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'))
check('@tabler/icons removed from dependencies',
  !(pkg.dependencies?.['@tabler/icons'] || pkg.devDependencies?.['@tabler/icons']))
check('flag-icons dependency retained', Boolean(pkg.dependencies?.['flag-icons']))

/* ── 4-6. production loader contents ── */
const { loadGeneratedIconLibrary, ICON_LIBRARY_COUNT, ICON_LIBRARY_CATEGORIES } = require('../src/lib/iconLibrary.ts')
const { v2ConceptCount, getAllV2Concepts } = require('../src/lib/icon-library/registry.ts')
const { COUNTRY_FLAG_COUNT, getFlagIcons } = require('../src/lib/flagLibrary.ts')

const icons = await loadGeneratedIconLibrary()
const businessCount = v2ConceptCount()

console.log(`Gallery: ${icons.length} icons = ${businessCount} business + ${COUNTRY_FLAG_COUNT} flags`)
check('total = business + flags', icons.length === businessCount + COUNTRY_FLAG_COUNT)
check('ICON_LIBRARY_COUNT matches', ICON_LIBRARY_COUNT === icons.length)

let legacyIds = 0
let badCategory = 0
const categorySet = new Set(ICON_LIBRARY_CATEGORIES)
for (const icon of icons) {
  const isFlag = icon.id.startsWith('flag-country-')
  const isBusiness = icon.id.startsWith('v2-')
  if (!isFlag && !isBusiness) { legacyIds++; console.log(`  LEGACY ID in gallery: ${icon.id}`) }
  if (!categorySet.has(icon.primaryCategory ?? icon.category)) { badCategory++; console.log(`  BAD CATEGORY ${icon.id}: ${icon.primaryCategory}`) }
  if (isFlag) {
    check(`${icon.id} categorised as Countries`, (icon.primaryCategory ?? icon.category) === 'Countries')
    const filePath = path.join(rootDir, 'public', icon.url.replace(/^\//, ''))
    check(`${icon.id} asset exists`, fs.existsSync(filePath))
  }
}
check('zero legacy ids in gallery', legacyIds === 0)
check('every gallery icon has a valid category', badCategory === 0)
check(`flag count preserved (${COUNTRY_FLAG_COUNT})`, getFlagIcons().length === COUNTRY_FLAG_COUNT)

for (const concept of getAllV2Concepts()) {
  if (!concept.keywords?.length) check(`${concept.id} has keywords`, false)
  if (!concept.description) check(`${concept.id} has description`, false)
  if (!concept.monochromeSvg) check(`${concept.id} has monochrome geometry`, false)
  // multicolorSvg is optional — present only when the reference supplies it.
}

if (failures > 0) { console.log(`\n${failures} migration check(s) FAILED`); process.exit(1) }
console.log('\nAll icon-migration checks PASSED')
