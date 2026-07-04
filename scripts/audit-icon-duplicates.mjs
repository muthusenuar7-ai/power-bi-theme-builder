/**
 * Icon duplicate audit — name + shape (Phase 2E).
 *
 * Because the production library merged two reference libraries
 * (bi-icon-studio + icon-vault), duplicates are checked on BOTH metadata and
 * geometry:
 *   1. duplicate id
 *   2. normalized duplicate name
 *   3. duplicate aliases (alias colliding with a canonical name)
 *   4. exact normalized SVG geometry (whitespace/precision/attr-order/ids
 *      normalized)
 *   5. same monochrome shape with different colors (colors stripped before
 *      hashing, so mono vs multicolor recolors of one shape collide)
 *   6. near-identical visual geometry (coarse 12×12 occupancy signature,
 *      report-only heuristic)
 *
 * Country flags are excluded from geometry comparisons (identical flag
 * proportions are not duplicates by design).
 *
 * Run: npm run audit:icon-duplicates
 * Writes reports/icon-duplicate-audit.json. Exits non-zero when hard
 * duplicates (kinds 1–5) exist.
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

const { getAllV2Concepts, getV2ConceptById, DUPLICATE_ID_REDIRECTS } = require('../src/lib/icon-library/registry.ts')
const {
  normalizeName, markupHash, canonicalGeometry, geometryHash, gridSignature, signatureDistance,
} = require('../src/lib/icon-library/duplicateAudit.ts')

const concepts = getAllV2Concepts().filter((c) => !c.isCountryFlag)

const groups = []

function addGroup(reason, kind, members, extras = {}) {
  const [canonical, ...removed] = members
  groups.push({
    kind,
    similarityReason: reason,
    matchingIds: members.map((c) => c.id),
    matchingNames: members.map((c) => c.name),
    retainedCanonicalIcon: { id: canonical.id, name: canonical.name },
    removedDuplicateIcons: removed.map((c) => ({ id: c.id, name: c.name })),
    ...extras,
  })
}

// 1. duplicate id (registry keeps first — collisions inside data files)
const byId = new Map()
for (const c of concepts) {
  const list = byId.get(c.id.toLowerCase()) ?? []
  list.push(c)
  byId.set(c.id.toLowerCase(), list)
}
for (const [, list] of byId) if (list.length > 1) addGroup('duplicate id', 'id', list)

// 2. normalized duplicate name
const byName = new Map()
for (const c of concepts) {
  const key = normalizeName(c.name)
  const list = byName.get(key) ?? []
  list.push(c)
  byName.set(key, list)
}
for (const [key, list] of byName) if (list.length > 1) addGroup(`normalized name "${key}"`, 'name', list)

// 3. alias collisions
const canonicalByName = new Map()
for (const c of concepts) canonicalByName.set(normalizeName(c.name), c)
for (const c of concepts) {
  for (const alias of c.aliases ?? []) {
    const owner = canonicalByName.get(normalizeName(alias))
    if (owner && owner.id !== c.id) addGroup(`alias "${alias}" collides with canonical name`, 'alias', [owner, c])
  }
}

// 4 + 5. geometry hash on color-stripped canonical geometry — exact markup
// duplicates AND recolored copies of the same shape collide here.
const byGeometry = new Map()
for (const c of concepts) {
  const sources = [c.monochromeSvg, c.multicolorSvg].filter(Boolean)
  const hashes = new Set(sources.map((s) => geometryHash(s)))
  for (const h of hashes) {
    if (!canonicalGeometry(c.monochromeSvg)) continue // no drawable geometry
    const list = byGeometry.get(h) ?? []
    if (!list.some((x) => x.id === c.id)) list.push(c)
    byGeometry.set(h, list)
  }
}
for (const [hash, list] of byGeometry) {
  if (list.length > 1) {
    addGroup('identical color-stripped geometry (exact shape, colors ignored)', 'geometry', list, { exactGeometryHash: hash })
  }
}

// 6. near-identical visual geometry — coarse occupancy signature (report-only).
const nearMatches = []
const sigs = concepts.map((c) => ({
  c,
  sig: gridSignature(c.monochromeSvg, c.viewBox),
  hash: geometryHash(c.monochromeSvg),
}))
const NEAR_THRESHOLD = 2 // out of 144 cells — extremely similar coverage
for (let i = 0; i < sigs.length; i++) {
  for (let j = i + 1; j < sigs.length; j++) {
    if (sigs[i].hash === sigs[j].hash) continue // already a hard duplicate
    const d = signatureDistance(sigs[i].sig, sigs[j].sig)
    if (d <= NEAR_THRESHOLD) {
      nearMatches.push({
        similarityReason: `near-identical occupancy signature (distance ${d}/144)`,
        matchingIds: [sigs[i].c.id, sigs[j].c.id],
        matchingNames: [sigs[i].c.name, sigs[j].c.name],
      })
    }
  }
}

// Duplicates already resolved by the registry's curated redirect list — the
// removed icons no longer appear in the gallery; their ids still resolve to
// the retained canonical icon.
const resolvedDuplicateGroups = Object.entries(DUPLICATE_ID_REDIRECTS).map(([removedId, canonicalId]) => {
  const canonical = getV2ConceptById(canonicalId)
  return {
    similarityReason: 'identical color-stripped geometry across reference libraries (resolved)',
    exactGeometryHash: canonical ? geometryHash(canonical.monochromeSvg) : null,
    matchingIds: [canonicalId, removedId],
    retainedCanonicalIcon: { id: canonicalId, name: canonical?.name ?? canonicalId },
    removedDuplicateIcon: { id: removedId },
  }
})

const report = {
  generatedAt: new Date().toISOString(),
  conceptCount: concepts.length,
  countryFlagsExcluded: true,
  resolvedDuplicateGroups,
  hardDuplicateGroups: groups,
  nearIdenticalCandidates: nearMatches,
  summary: {
    hardDuplicates: groups.length,
    nearIdenticalCandidates: nearMatches.length,
  },
}

const outDir = path.join(rootDir, 'reports')
fs.mkdirSync(outDir, { recursive: true })
const outFile = path.join(outDir, 'icon-duplicate-audit.json')
fs.writeFileSync(outFile, JSON.stringify(report, null, 2))

console.log(`Icon duplicate audit — ${concepts.length} concepts (flags excluded)`)
console.log(`  hard duplicate groups: ${groups.length}`)
console.log(`  near-identical candidates (heuristic): ${nearMatches.length}`)
console.log(`  report: ${path.relative(rootDir, outFile)}`)

if (groups.length > 0) {
  for (const g of groups) {
    console.error(`  DUPLICATE [${g.kind}] ${g.matchingIds.join(', ')} — ${g.similarityReason}`)
  }
  process.exitCode = 1
}
