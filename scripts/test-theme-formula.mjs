/**
 * Verifies the standard colour-surface formula across the FULL preset library:
 *  - canvas vs visual background clearly separated
 *  - title/label text readable on the card
 *  - at least 3 chart colours clearly visible on the card
 *  - exported Power BI JSON carries the same corrected surfaces
 * Run: node scripts/test-theme-formula.mjs
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
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText
  module._compile(output, filename)
}

const { THEME_PRESETS } = require('../src/lib/themeSurfaceFormula.ts') && require('../src/lib/datacense398ThemePresets.ts')
const { refineChartColors, isSurfaceSeparated, scoreSurfaceQuality } = require('../src/lib/themeSurfaceFormula.ts')
const { resolveThemeSurfaces } = require('../src/lib/themeSurfaceResolver.ts')
const { resolveEffectiveFormat } = require('../src/lib/effectiveFormatResolver.ts')
const { generateThemeJSON } = require('../src/lib/themeGenerator.ts')
const { getContrastRatio } = require('../src/lib/colorUtils.ts')

const CHART_FLOOR = 1.55

/** Replays applyPreset's colour handling, then resolves surfaces like the app. */
function stateFromPreset(preset) {
  const declared = preset.dataColorsFull?.length ? preset.dataColorsFull : preset.colors
  const visualBackground = preset.visualBackground
  const colors = refineChartColors(declared, visualBackground).colors
  return {
    themeName: preset.name,
    dataColors: colors,
    paletteSize: 5,
    primary: preset.primaryColor ?? colors[0],
    accent: preset.accentColor ?? colors[1] ?? colors[0],
    bg: preset.dashboardBackground ?? preset.pageBackground ?? preset.background ?? preset.bg,
    customCanvasBackground: null,
    canvasBackgroundMode: 'theme',
    visualBackground,
    cardBackground: preset.cardBackground ?? visualBackground,
    visualBackgroundMode: 'theme',
    borderColor: preset.borderColor,
    gridlineColor: preset.gridlineColor,
    tableHeaderBackground: preset.tableHeaderBackground,
    tableRowAlt: preset.tableRowAlt,
    titleColor: preset.titleColor,
    labelColor: preset.labelColor,
    fg: preset.foreground ?? preset.fg,
    good: preset.good,
    neutral: preset.neutral,
    bad: preset.bad,
    tableAccent: preset.tableAccent ?? preset.primaryColor,
    formatProps: { 'general.typography.fontFace': 'Segoe UI' },
  }
}

let failures = 0
let separationFails = 0, titleFails = 0, labelFails = 0, chartFails = 0, exportFails = 0
let scoreSum = 0, minScore = 101, worst = ''
const sampleCorrections = []

for (const preset of THEME_PRESETS) {
  const state = stateFromPreset(preset)
  const surfaces = resolveThemeSurfaces(state)
  const effective = resolveEffectiveFormat(state)

  const sep = isSurfaceSeparated(surfaces.effectiveCanvasBackground, surfaces.effectiveVisualBackground)
  if (!sep) {
    separationFails++
    if (separationFails <= 5) console.log(`SEPARATION FAIL ${preset.id}: canvas=${surfaces.effectiveCanvasBackground} visual=${surfaces.effectiveVisualBackground}`)
  }

  const titleRatio = getContrastRatio(surfaces.effectiveTitleColor, surfaces.effectiveTitleBackground)
  if (titleRatio < 4.5) { titleFails++; if (titleFails <= 5) console.log(`TITLE FAIL ${preset.id}: ${surfaces.effectiveTitleColor} on ${surfaces.effectiveTitleBackground} = ${titleRatio.toFixed(2)}`) }

  const labelRatio = getContrastRatio(surfaces.effectiveLabelColor, surfaces.effectiveVisualBackground)
  if (labelRatio < 3.5) { labelFails++; if (labelFails <= 5) console.log(`LABEL FAIL ${preset.id}: ${labelRatio.toFixed(2)}`) }

  const visible = state.dataColors.filter((c) => getContrastRatio(c, surfaces.effectiveVisualBackground) >= CHART_FLOOR).length
  if (visible < Math.min(3, state.dataColors.length)) {
    chartFails++
    if (chartFails <= 5) console.log(`CHART FAIL ${preset.id}: only ${visible} visible of ${state.dataColors.join(',')}`)
  }

  // Export must carry the SAME corrected surfaces.
  const json = generateThemeJSON(state)
  if (json.background !== surfaces.effectiveCanvasBackground || json.secondaryBackground !== surfaces.effectiveVisualBackground) {
    exportFails++
    if (exportFails <= 5) console.log(`EXPORT MISMATCH ${preset.id}: json.bg=${json.background} vs ${surfaces.effectiveCanvasBackground}; json.secondary=${json.secondaryBackground} vs ${surfaces.effectiveVisualBackground}`)
  }
  if (JSON.stringify(json.dataColors) !== JSON.stringify(state.dataColors)) {
    exportFails++
    if (exportFails <= 5) console.log(`EXPORT PALETTE MISMATCH ${preset.id}`)
  }

  const quality = scoreSurfaceQuality({
    mode: 'light',
    canvasBackground: surfaces.effectiveCanvasBackground,
    visualBackground: surfaces.effectiveVisualBackground,
    titleBackground: surfaces.effectiveTitleBackground,
    borderColor: surfaces.effectiveBorderColor,
    gridlineColor: surfaces.effectiveGridlineColor,
    tableHeaderBackground: surfaces.effectiveTableHeaderBackground,
    tableRowAlt: surfaces.effectiveTableRowAlt,
    foreground: surfaces.effectiveForeground,
    titleColor: surfaces.effectiveTitleColor,
    labelColor: surfaces.effectiveLabelColor,
    kpiGood: surfaces.effectiveKpiGood,
    kpiBad: surfaces.effectiveKpiBad,
    kpiNeutral: surfaces.effectiveKpiNeutral,
    adjusted: [],
  }, state.dataColors)
  scoreSum += quality.score
  if (quality.score < minScore) { minScore = quality.score; worst = preset.id }

  // Collect a few before/after examples for the report.
  if (sampleCorrections.length < 4) {
    const declaredVisual = preset.visualBackground
    if (declaredVisual && declaredVisual.toUpperCase() !== surfaces.effectiveVisualBackground.toUpperCase()) {
      sampleCorrections.push(`${preset.id}: canvas ${state.bg} | visual ${declaredVisual} → ${surfaces.effectiveVisualBackground}`)
    }
  }
}

failures = separationFails + titleFails + labelFails + chartFails + exportFails
console.log(`\nPresets tested: ${THEME_PRESETS.length}`)
console.log(`Separation failures: ${separationFails}`)
console.log(`Title contrast failures: ${titleFails}`)
console.log(`Label contrast failures: ${labelFails}`)
console.log(`Chart visibility failures: ${chartFails}`)
console.log(`Export consistency failures: ${exportFails}`)
console.log(`Average quality score: ${(scoreSum / THEME_PRESETS.length).toFixed(1)} (min ${minScore} @ ${worst})`)
console.log('\nSample corrections:')
sampleCorrections.forEach((s) => console.log(' ', s))

if (failures > 0) { console.error(`\nFAILED with ${failures} issues`); process.exit(1) }
console.log('\nAll surface-formula checks PASSED')
