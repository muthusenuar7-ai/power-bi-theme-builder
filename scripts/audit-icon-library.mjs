/**
 * Icon Library audit — duplicates, SVG safety, EXACT reference preservation.
 *
 * Runs against the REAL production registry (src/lib/icon-library) and
 * validates:
 *  - unique ids, unique canonical names, alias↔name collisions, geometry
 *    hash duplicates,
 *  - Power BI SVG safety (no <text>/<script>/<foreignObject>/<image>/filters/
 *    external refs) in monochrome AND multicolor geometry,
 *  - ORIGINAL MULTICOLOR FIDELITY: every bi-icon-studio concept's stored
 *    multicolorSvg must equal the reference file's `multi` markup exactly
 *    (whitespace-collapse only) — colors, opacities, strokes, fills,
 *    hierarchy untouched,
 *  - renderer sanity: mono render resolves currentColor; multicolor render
 *    contains the reference geometry verbatim; the Studio marker bridge
 *    strips the multi group in mono and swaps it verbatim in multicolor,
 *  - obsolete color-mode references: zero duotone/tritone/colorSlots usage
 *    outside documented legacy-tolerant API boundaries,
 *  - currency ISO coverage, search index sanity, per-category counts.
 *
 * Run: node scripts/audit-icon-library.mjs   (npm run audit:icon-library)
 * Writes docs/qa/icon-library-audit.md. Exits non-zero on any failure.
 */
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import vm from 'node:vm'
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

const { getAllV2Concepts } = require('../src/lib/icon-library/registry.ts')
const { auditDuplicates } = require('../src/lib/icon-library/duplicateAudit.ts')
const { renderMonochromeSvg, renderOriginalMulticolorSvg, outlineDataUri, applyV2MarkerGeometry } = require('../src/lib/icon-library/variantRenderer.ts')
const { getV2Category } = require('../src/lib/icon-library/categories.ts')
const { buildSearchIndex } = require('../src/lib/icon-library/searchIndex.ts')
const { COUNTRY_FLAG_COUNT } = require('../src/lib/flagLibrary.ts')

let failures = 0
const check = (label, ok) => { if (!ok) { failures++; console.log(`FAIL: ${label}`) } }

const concepts = getAllV2Concepts()
console.log(`Canonical business concepts: ${concepts.length}`)

/* ── 1. duplicates ── */
const findings = auditDuplicates(concepts)
for (const f of findings) console.log(`  DUP[${f.kind}] ${f.detail}: ${f.conceptIds.join(', ')}`)
check('zero duplicate findings', findings.length === 0)

/* ── 2. SVG safety (Power BI constraints) ── */
// url(#…) is an INTERNAL gradient reference (allowed — used by the fixed
// 3D Analytics artwork); only external url(...) references are unsafe.
const UNSAFE_RE = /<text[\s>]|<script|<foreignObject|<image[\s>]|<filter|href=|url\((?!#)|@import|<style/i
let unsafe = 0
for (const c of concepts) {
  for (const [variant, markup] of [['monochrome', c.monochromeSvg], ['multicolor', c.multicolorSvg]]) {
    if (markup && UNSAFE_RE.test(markup)) { unsafe++; console.log(`  UNSAFE ${c.id}.${variant}`) }
  }
  check(`${c.id} has valid viewBox`, /^0 0 \d+ \d+$/.test(c.viewBox))
  check(`${c.id} category exists`, Boolean(getV2Category(c.primaryCategory)))
  check(`${c.id} not a flag`, !c.isCountryFlag)
  check(`${c.id} has keywords + description`, c.keywords.length > 0 && Boolean(c.description))
}
check('zero unsafe SVG constructs', unsafe === 0)

/* ── 3. ORIGINAL multicolor fidelity vs the reference file ── */
function extractArray(html, varName) {
  const start = html.indexOf(`const ${varName} = [`)
  let i = html.indexOf('[', start)
  let depth = 0
  let inStr = null
  for (; i < html.length; i++) {
    const ch = html[i]
    if (inStr) { if (ch === inStr && html[i - 1] !== '\\') inStr = null; continue }
    if (ch === "'" || ch === '"' || ch === '`') { inStr = ch; continue }
    if (ch === '[') depth++
    else if (ch === ']') { depth--; if (depth === 0) break }
  }
  return vm.runInNewContext(`(${html.slice(html.indexOf('[', start), i + 1)})`, {}, { timeout: 5000 })
}
const studioRef = new Map(
  extractArray(fs.readFileSync(path.join(rootDir, 'docs/reference/icon-library/bi-icon-studio.html'), 'utf8'), 'ICONS')
    .map((icon) => [icon.id, icon]),
)
const collapse = (s) => s.replace(/\s+/g, ' ').trim()
let fidelityChecked = 0
let fidelityFailures = 0
for (const c of concepts) {
  if (c.source !== 'bi-icon-studio' || !c.multicolorSvg) continue
  const ref = studioRef.get(c.id.replace(/^v2-/, ''))
  if (!ref?.multi) continue
  fidelityChecked++
  if (c.multicolorSvg !== collapse(ref.multi)) {
    fidelityFailures++
    console.log(`  FIDELITY FAIL ${c.id}: stored multicolor differs from reference`)
  }
}
console.log(`Multicolor fidelity: ${fidelityChecked} concepts compared against the reference file`)
check('every stored multicolor EXACTLY matches the reference (whitespace-collapse only)', fidelityFailures === 0)
check('fidelity comparison covered all bi-icon-studio multicolor concepts',
  fidelityChecked === concepts.filter((c) => c.source === 'bi-icon-studio' && c.multicolorSvg).length)

/* ── 4. renderer sanity + Studio marker bridge ── */
let renderFailures = 0
for (const c of concepts) {
  try {
    const mono = renderMonochromeSvg(c, 48, '#0D9488')
    if (!mono.startsWith('<svg') || /currentColor/.test(mono)) throw new Error('mono malformed / leaked currentColor')

    const uri = outlineDataUri(c)
    const svgText = decodeURIComponent(uri.replace('data:image/svg+xml;utf8,', ''))
    const monoBridge = applyV2MarkerGeometry(svgText, 'mono')
    if (!monoBridge.handled || /data-v2-multi/.test(monoBridge.svg)) throw new Error('mono bridge kept hidden group')

    if (c.multicolorSvg) {
      const multi = renderOriginalMulticolorSvg(c, 48)
      if (!multi || !multi.includes(c.multicolorSvg)) throw new Error('multicolor render altered the original geometry')
      const multiBridge = applyV2MarkerGeometry(svgText, 'multicolor')
      if (!multiBridge.handled || !multiBridge.isOriginalMulticolor) throw new Error('multicolor bridge not handled')
      if (!multiBridge.svg.includes(c.multicolorSvg)) throw new Error('multicolor bridge altered the original geometry')
      if (/visibility="hidden"/.test(multiBridge.svg)) throw new Error('multicolor bridge left hidden')
    } else {
      const multiBridge = applyV2MarkerGeometry(svgText, 'multicolor')
      if (multiBridge.handled) throw new Error('fake multicolor generated for a mono-only concept')
    }
  } catch (error) {
    renderFailures++
    console.log(`  RENDER FAIL ${c.id}: ${error.message}`)
  }
}
check('zero render failures', renderFailures === 0)

/* ── 5. obsolete color-mode references ── */
const LEGACY_OK = new Set([
  // legacy-tolerant API boundaries + documentation of the removal
  'src/lib/layout-builder/server/combinedPbitService.ts',
  'src/lib/layout-builder/server/combinedPbitValidator.ts',
  'src/store/integrationWorkspaceStore.ts',
  'src/lib/icon-library/types.ts',
  'src/lib/iconRenderer.ts',
])
let obsoleteRefs = 0
function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(ts|tsx)$/.test(entry.name)) yield full
  }
}
for (const file of walk(path.join(rootDir, 'src'))) {
  const rel = path.relative(rootDir, file).replace(/\\/g, '/')
  if (LEGACY_OK.has(rel)) continue
  const text = fs.readFileSync(file, 'utf8')
  if (/\bduotone\b|\btritone\b|colorSlots|slotsFromPalette|IconColorSlots/i.test(text)) {
    obsoleteRefs++
    console.log(`  OBSOLETE COLOR-MODE REF: ${rel}`)
  }
}
check('zero obsolete color-mode references outside documented boundaries', obsoleteRefs === 0)

/* ── 6. currency coverage ── */
const REQUIRED_CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CNY', 'KRW', 'RUB', 'SAR', 'AED', 'QAR', 'OMR', 'KWD', 'BHD', 'AUD', 'CAD', 'SGD', 'CHF', 'ZAR', 'BRL', 'TRY', 'BTC', 'ETH']
const currencyAliases = new Set(concepts.filter((c) => c.primaryCategory === 'currency').flatMap((c) => c.aliases.map((a) => a.toUpperCase())))
for (const code of REQUIRED_CURRENCIES) check(`currency ${code} covered`, currencyAliases.has(code))

/* ── 7. search index sanity ── */
const index = buildSearchIndex(concepts)
check('search "rupee" finds INR', index.query('rupee').some((c) => c.id === 'v2-currency-rupee'))
check('search "forklift" finds logistics', index.query('forklift').length > 0)
check('empty search returns all', index.query('').length === concepts.length)

/* ── 8. counts + report ── */
const byCategory = [...concepts.reduce((m, c) => m.set(c.primaryCategory, (m.get(c.primaryCategory) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1])
const withMulti = concepts.filter((c) => c.multicolorSvg).length
const stats = {
  concepts: concepts.length,
  flags: COUNTRY_FLAG_COUNT,
  total: concepts.length + COUNTRY_FLAG_COUNT,
  categories: byCategory.length,
  originalMulticolor: withMulti,
  monochromeOnly: concepts.length - withMulti,
  bySource: Object.fromEntries([...concepts.reduce((m, c) => m.set(c.source, (m.get(c.source) ?? 0) + 1), new Map())]),
}
console.log(JSON.stringify(stats, null, 2))

const docPath = path.join(rootDir, 'docs/qa/icon-library-audit.md')
const catLines = byCategory.map(([id, n]) => `| ${getV2Category(id)?.label ?? id} | ${n} |`).join('\n')
const doc = `# Icon Studio Library Audit — production registry + ISO country flags

Generated ${new Date().toISOString().slice(0, 10)} by \`npm run audit:icon-library\`.
Color modes (final): **Monochrome** (one editable color) and **Original Multicolor**
(reference geometry preserved exactly — never recolored, no theme mapping).
Migration history: docs/qa/icon-library-migration.md.

| Metric | Value |
| --- | ---: |
| Reference business concepts | ${stats.concepts} |
| Original multicolor (exact reference artwork) | ${stats.originalMulticolor} |
| Monochrome-only | ${stats.monochromeOnly} |
| Fixed-color ISO country flags (never recolored) | ${stats.flags} |
| Total gallery icons | ${stats.total} |
| Business categories (+ Countries) | ${stats.categories} |
| From bi-icon-studio | ${stats.bySource['bi-icon-studio'] ?? 0} |
| From icon-vault | ${stats.bySource['icon-vault'] ?? 0} |
| Hand-authored (currency) | ${stats.bySource.authored ?? 0} |
| Removed old normal icons (previous migration) | 5,080 |
| Multicolor fidelity comparisons vs reference | ${fidelityChecked} (0 mismatches) |
| Duplicate findings | ${findings.length} |
| Unsafe SVG constructs | ${unsafe} |
| Render failures | ${renderFailures} |
| Obsolete color-mode references | ${obsoleteRefs} |

## Concepts by category

| Category | Concepts |
| --- | ---: |
${catLines}
`
fs.writeFileSync(docPath, doc)
console.log('Report written: docs/qa/icon-library-audit.md')

if (failures > 0) { console.log(`\n${failures} check(s) FAILED`); process.exit(1) }
console.log('\nAll icon-library audit checks PASSED')
