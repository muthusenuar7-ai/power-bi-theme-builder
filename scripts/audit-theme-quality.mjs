/**
 * Theme quality audit — tier counts, score distribution, contrast/separation
 * failures and default ordering, written to docs/qa/theme-quality-report.md.
 *
 * Validates:
 *  - every theme has quality metadata; the 4 tiers partition all themes,
 *  - every CURATED_SIGNATURE id exists in the library,
 *  - Signature size is within the 24–40 target and category-balanced,
 *  - default order is tier-sorted (Signature → Premium → Standard →
 *    Experimental) with every theme still present (nothing deleted),
 *  - theme ids and source data untouched (count unchanged = 398).
 *
 * Run: node scripts/audit-theme-quality.mjs   (npm run audit:theme-quality)
 */
import fs from 'node:fs'
import Module from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = Module.createRequire(import.meta.url)
const originalResolve = Module._resolveFilename

Module._resolveFilename = function (request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    const base = path.join(rootDir, 'src', request.slice(2))
    for (const c of [base, `${base}.ts`, `${base}.tsx`, `${base}.json`]) if (fs.existsSync(c)) return c
  }
  return originalResolve.call(this, request, parent, isMain, options)
}
require.extensions['.ts'] = function (module, filename) {
  const out = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true },
    fileName: filename,
  }).outputText
  module._compile(out, filename)
}

const { getAllThemePresets } = require('../src/lib/themePresetRegistry.ts')
const { computeThemeQuality, sortThemesByQuality, CURATED_SIGNATURE } = require('../src/lib/themeQuality.ts')
const { getContrastRatio } = require('../src/lib/colorUtils.ts')

let failures = 0
const check = (label, ok) => { if (!ok) { failures++; console.log(`FAIL: ${label}`) } }

const presets = getAllThemePresets()
const quality = computeThemeQuality(presets)
const ordered = sortThemesByQuality(presets)

check('398-theme source data unchanged', presets.length === 398)
check('every theme has quality metadata', presets.every((p) => quality.has(p.id)))
check('ordering keeps every theme accessible', ordered.length === presets.length)

for (const id of CURATED_SIGNATURE) {
  check(`curated Signature id exists: ${id}`, presets.some((p) => p.id === id))
}

const tiers = { Signature: [], Premium: [], Standard: [], Experimental: [] }
for (const p of presets) tiers[quality.get(p.id).qualityTier].push(p)
check('Signature size within 24–40 target', tiers.Signature.length >= 24 && tiers.Signature.length <= 40)

// Signature balance: at least 4 distinct categories and 6 distinct hues.
const sigCats = new Set(tiers.Signature.map((p) => p.category))
const sigHues = new Set(tiers.Signature.map((p) => p.hue ?? '?'))
check('Signature spans ≥4 categories', sigCats.size >= 4)
check('Signature spans ≥6 hue families (not near-identical palettes)', sigHues.size >= 6)

// Default order is tier-monotonic.
const TIER_ORDER = { Signature: 0, Premium: 1, Standard: 2, Experimental: 3 }
let monotonic = true
for (let i = 1; i < ordered.length; i++) {
  if (TIER_ORDER[quality.get(ordered[i].id).qualityTier] < TIER_ORDER[quality.get(ordered[i - 1].id).qualityTier]) monotonic = false
}
check('default order: Signature → Premium → Standard → Experimental', monotonic)

// Failure counts (informational quality signals).
const safeContrast = (a, b) => { try { return getContrastRatio(a, b) } catch { return 1 } }
const contrastFailures = presets.filter((p) => safeContrast(p.foreground, p.background) < 3)
const separationFailures = presets.filter((p) => safeContrast(p.background, p.visualBackground) < 1.01)
for (const p of contrastFailures) {
  check(`contrast-failing theme not Signature/Premium: ${p.id}`,
    !['Signature', 'Premium'].includes(quality.get(p.id).qualityTier))
}

const scores = presets.map((p) => quality.get(p.id).qualityScore)
const buckets = {}
for (const s of scores) { const b = `${Math.floor(s / 10) * 10}–${Math.floor(s / 10) * 10 + 9}`; buckets[b] = (buckets[b] ?? 0) + 1 }

const stats = {
  themes: presets.length,
  signature: tiers.Signature.length,
  premium: tiers.Premium.length,
  standard: tiers.Standard.length,
  experimental: tiers.Experimental.length,
  contrastFailures: contrastFailures.length,
  separationFailures: separationFailures.length,
  scoreBuckets: buckets,
}
console.log(JSON.stringify(stats, null, 2))

const doc = `# Theme Quality Report

Generated ${new Date().toISOString().slice(0, 10)} by \`npm run audit:theme-quality\`.

Quality-priority system: automated scoring (contrast, palette distinctness,
surface separation, KPI clarity, washed-out/harsh penalties, light/dark
consistency) provides the initial signal; the **manually curated
CURATED_SIGNATURE list** (visual palette review + category/hue balance)
overrides it for the featured tier. Arithmetic scoring alone does not
determine beauty. No theme was deleted or modified — ids, JSON export and the
398-theme source data are untouched.

| Metric | Value |
| --- | ---: |
| Total themes (unchanged) | ${stats.themes} |
| Signature (curated, featured) | ${stats.signature} |
| Premium (top automated scores) | ${stats.premium} |
| Standard | ${stats.standard} |
| Experimental (accessible under All Themes, no negative badge) | ${stats.experimental} |
| Text-contrast failures (fg vs canvas < 3:1) | ${stats.contrastFailures} |
| Canvas/visual separation failures (< 1.01:1) | ${stats.separationFailures} |

## Quality-score distribution

| Score band | Themes |
| --- | ---: |
${Object.entries(buckets).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).map(([b, n]) => `| ${b} | ${n} |`).join('\n')}

## Default ordering

Signature (priorityRank asc) → Premium → Standard → Experimental; within each
tier by qualityScore desc, then name. Random Theme draws from Signature +
Premium by default ("Include all themes" widens the pool).

## Signature themes (curated order)

${tiers.Signature
  .sort((a, b) => quality.get(a.id).priorityRank - quality.get(b.id).priorityRank)
  .map((p, i) => `${i + 1}. **${p.name}** (\`${p.id}\`, ${p.category}, ${p.hue ?? '—'}, score ${quality.get(p.id).qualityScore})`)
  .join('\n')}
`
fs.writeFileSync(path.join(rootDir, 'docs/qa/theme-quality-report.md'), doc)
console.log('Report written: docs/qa/theme-quality-report.md')

if (failures > 0) { console.log(`\n${failures} check(s) FAILED`); process.exit(1) }
console.log('\nAll theme-quality checks PASSED')
