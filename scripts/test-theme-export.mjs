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
  const candidates = [base, `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, path.join(base, 'index.ts')]
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
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  }).outputText
  module._compile(output, filename)
}

const { generateThemeJSON, parseImportedThemeJSON, validateThemeJSON } = require('../src/lib/themeGenerator.ts')
const { EXPORTED_VISUAL_TYPES } = require('../src/lib/powerBIVisualStylesMapper.ts')
const { resolveThemeSurfaces } = require('../src/lib/themeSurfaceResolver.ts')

const sampleState = {
  themeName: 'Datacense Export Test',
  dataColors: ['#DC2626', '#F97316', '#0D9488', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#2563EB', '#64748B'],
  paletteSize: 5,
  primary: '#DC2626',
  accent: '#F97316',
  bg: '#FFF5F5',
  customCanvasBackground: null,
  canvasBackgroundMode: 'theme',
  visualBackground: '#FFFFFF',
  cardBackground: '#FFFFFF',
  visualBackgroundMode: 'theme',
  borderColor: '#F1B7B7',
  titleColor: '#7F1D1D',
  labelColor: '#991B1B',
  fg: '#0F172A',
  good: '#10B981',
  neutral: '#F59E0B',
  bad: '#EF4444',
  tableAccent: '#0D9488',
  formatProps: {
    'general.typography.fontFace': 'Segoe UI',
    'general.background.show': true,
    'general.background.transparency': 0,
    'general.border.show': true,
    'general.border.color': '#F1B7B7',
    'general.border.width': 1,
    'general.border.radius': 4,
    'general.shadow.show': true,
    'general.shadow.position': 'Bottom right',
    'general.title.show': true,
    'general.title.fontColor': '#7F1D1D',
    'general.title.fontSize': 14,
    'general.label.fontColor': '#991B1B',
    'general.label.fontSize': 10,
    'bar.legend.show': true,
    'bar.legend.position': 'Bottom center',
    'bar.legend.text.color': '#334155',
    'bar.legend.text.font.size': 10,
    'bar.xAxis.show': true,
    'bar.xAxis.color': '#475569',
    'bar.xAxis.values.font.size': 10,
    'bar.xAxis.title.show': true,
    'bar.xAxis.titleText': 'Sum of Sales',
    'bar.xAxis.title.color': '#0F172A',
    'bar.yAxis.show': true,
    'bar.yAxis.color': '#475569',
    'bar.yAxis.values.font.size': 10,
    'bar.yAxis.title.show': true,
    'bar.yAxis.titleText': 'Country',
    'bar.yAxis.title.color': '#0F172A',
    'bar.plotArea.gridColor': '#E2E8F0',
    'bar.gridlines.vertical.show': true,
    'bar.gridlines.vertical.lineStyle': 'Dotted',
    'bar.gridlines.vertical.transparency': 20,
    'bar.dataLabels.show': true,
    'bar.dataLabels.color': '#0F172A',
    'bar.dataLabels.fontSize': 10,
    'pie.legend.show': true,
    'pie.detailLabels.show': true,
    'pie.detailLabels.color': '#0F172A',
    'pie.detailLabels.position': 'Prefer outside',
    'donut.legend.show': true,
    'donut.detailLabels.show': true,
    'donut.detailLabels.color': '#0F172A',
    'donut.detailLabels.position': 'Outside',
    'donut.donutShape.innerRadius': 0.6,
    'treemap.legend.show': true,
    'treemap.dataLabels.show': true,
    'treemap.layout.layout.tilingMethod': 'Squarified',
    'slicer.header.outlineStyle': 'None',
    'slicer.items.outlineStyle': 'None',
  },
}

const theme = generateThemeJSON(sampleState)
const exportBackgrounds = resolveThemeSurfaces(sampleState)
const validation = validateThemeJSON(theme, theme.dataColors.length)
const importPatch = await parseImportedThemeJSON(theme)

const requiredVisuals = [
  'barChart',
  'clusteredBarChart',
  'columnChart',
  'clusteredColumnChart',
  'lineChart',
  'areaChart',
  'pieChart',
  'donutChart',
  'treemap',
  'waterfallChart',
  'scatterChart',
  'funnel',
  'card',
  'cardVisual',
  'multiRowCard',
  'tableEx',
  'pivotTable',
  'slicer',
]

const missingVisuals = requiredVisuals.filter((visual) => !theme.visualStyles?.[visual])
const missingFromRegistry = requiredVisuals.filter((visual) => !EXPORTED_VISUAL_TYPES.includes(visual))
const enumErrors = []
const backgroundErrors = []
const dropShadowPosition = theme.visualStyles?.['*']?.['*']?.dropShadow?.[0]?.position
const barGridlineStyle = theme.visualStyles?.barChart?.['*']?.valueAxis?.[0]?.gridlineStyle
const pieLabelPosition = theme.visualStyles?.pieChart?.['*']?.labels?.[0]?.position
const donutLabelPosition = theme.visualStyles?.donutChart?.['*']?.labels?.[0]?.position
const donutInnerRadiusRatio = theme.visualStyles?.donutChart?.['*']?.slices?.[0]?.innerRadiusRatio
const treemapTilingMethod = theme.visualStyles?.treemap?.['*']?.layout?.[0]?.tilingMethod
const slicerHeaderOutlineStyle = theme.visualStyles?.slicer?.['*']?.header?.[0]?.outlineStyle
const slicerItemsOutlineStyle = theme.visualStyles?.slicer?.['*']?.items?.[0]?.outlineStyle
const pageBackground = theme.visualStyles?.page?.['*']?.background?.[0]
const pageOutspace = theme.visualStyles?.page?.['*']?.outspace?.[0]
const commonBackground = theme.visualStyles?.['*']?.['*']?.background?.[0]
const commonBorder = theme.visualStyles?.['*']?.['*']?.border?.[0]
const commonTitle = theme.visualStyles?.['*']?.['*']?.title?.[0]
const barBackground = theme.visualStyles?.barChart?.['*']?.background?.[0]
const columnBackground = theme.visualStyles?.columnChart?.['*']?.background?.[0]
const cardBackground = theme.visualStyles?.card?.['*']?.background?.[0]
const tableBackground = theme.visualStyles?.tableEx?.['*']?.background?.[0]
const slicerBackground = theme.visualStyles?.slicer?.['*']?.background?.[0]

function isSolidColorObject(value) {
  return Boolean(value?.solid?.color && /^#[0-9A-F]{6}$/i.test(value.solid.color))
}

function assertBackground(card, label, requireShow) {
  if (!card) {
    backgroundErrors.push(`${label} is missing`)
    return
  }
  if (requireShow && card.show !== true) {
    backgroundErrors.push(`${label}.show was ${JSON.stringify(card.show)}`)
  }
  if (!isSolidColorObject(card.color)) {
    backgroundErrors.push(`${label}.color is not a solid #RRGGBB object`)
  }
  if (card.transparency !== 0) {
    backgroundErrors.push(`${label}.transparency was ${JSON.stringify(card.transparency)}`)
  }
}

function assertBorder(card, label) {
  if (!card) {
    backgroundErrors.push(`${label} is missing`)
    return
  }
  if (typeof card.show !== 'boolean') {
    backgroundErrors.push(`${label}.show was ${JSON.stringify(card.show)}`)
  }
  if (!isSolidColorObject(card.color)) {
    backgroundErrors.push(`${label}.color is not a solid #RRGGBB object`)
  }
}

if (!['Outer', 'Inner'].includes(dropShadowPosition)) {
  enumErrors.push(`dropShadow.position was ${JSON.stringify(dropShadowPosition)}`)
}
if (!['solid', 'dashed', 'dotted', 'custom'].includes(barGridlineStyle)) {
  enumErrors.push(`valueAxis.gridlineStyle was ${JSON.stringify(barGridlineStyle)}`)
}
if (!['outside', 'inside', 'preferOutside', 'preferInside'].includes(pieLabelPosition)) {
  enumErrors.push(`pieChart labels.position was ${JSON.stringify(pieLabelPosition)}`)
}
if (!['outside', 'inside', 'preferOutside', 'preferInside'].includes(donutLabelPosition)) {
  enumErrors.push(`donutChart labels.position was ${JSON.stringify(donutLabelPosition)}`)
}
if (!Number.isInteger(donutInnerRadiusRatio)) {
  enumErrors.push(`donutChart slices.innerRadiusRatio was ${JSON.stringify(donutInnerRadiusRatio)}`)
}
if (!['stableSquarified', 'binary', 'alternating'].includes(treemapTilingMethod)) {
  enumErrors.push(`treemap layout.tilingMethod was ${JSON.stringify(treemapTilingMethod)}`)
}
if (!Number.isInteger(slicerHeaderOutlineStyle)) {
  enumErrors.push(`slicer header.outlineStyle was ${JSON.stringify(slicerHeaderOutlineStyle)}`)
}
if (!Number.isInteger(slicerItemsOutlineStyle)) {
  enumErrors.push(`slicer items.outlineStyle was ${JSON.stringify(slicerItemsOutlineStyle)}`)
}
if (importPatch.bg !== exportBackgrounds.effectiveCanvasBackground) {
  enumErrors.push(`round-trip imported page background was ${JSON.stringify(importPatch.bg)}`)
}

assertBackground(pageBackground, 'page background', false)
assertBackground(pageOutspace, 'page outspace', false)
assertBackground(commonBackground, 'common visual background', true)
assertBorder(commonBorder, 'common visual border')

if (theme.background !== exportBackgrounds.effectiveCanvasBackground) {
  backgroundErrors.push(`root background ${theme.background} did not match effective canvas background ${exportBackgrounds.effectiveCanvasBackground}`)
}
if (pageBackground?.color?.solid?.color !== exportBackgrounds.effectiveCanvasBackground) {
  backgroundErrors.push(`page background ${JSON.stringify(pageBackground?.color?.solid?.color)} did not match effective canvas background ${exportBackgrounds.effectiveCanvasBackground}`)
}
if (pageOutspace?.color?.solid?.color !== exportBackgrounds.effectiveOutspaceBackground) {
  backgroundErrors.push(`page outspace ${JSON.stringify(pageOutspace?.color?.solid?.color)} did not match effective outspace background ${exportBackgrounds.effectiveOutspaceBackground}`)
}
if (commonBackground?.color?.solid?.color !== exportBackgrounds.effectiveVisualBackground) {
  backgroundErrors.push(`common visual background ${JSON.stringify(commonBackground?.color?.solid?.color)} did not match effective visual background ${exportBackgrounds.effectiveVisualBackground}`)
}
if (commonTitle?.background?.solid?.color !== exportBackgrounds.effectiveTitleBackground) {
  backgroundErrors.push(`common title background ${JSON.stringify(commonTitle?.background?.solid?.color)} did not match effective title background ${exportBackgrounds.effectiveTitleBackground}`)
}
if (sampleState.visualBackground === '#FFFFFF' && exportBackgrounds.effectiveVisualBackground === '#FFFFFF') {
  backgroundErrors.push('theme-mode white visualBackground was not converted to a palette-tinted effective visual background')
}

requiredVisuals.forEach((visual) => {
  assertBackground(theme.visualStyles?.[visual]?.['*']?.background?.[0], `${visual} background`, true)
  assertBorder(theme.visualStyles?.[visual]?.['*']?.border?.[0], `${visual} border`)
})

if (!validation.isValid || missingVisuals.length || missingFromRegistry.length || enumErrors.length || backgroundErrors.length) {
  console.error(JSON.stringify({
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    missingVisuals,
    missingFromRegistry,
    enumErrors,
    backgroundErrors,
  }, null, 2))
  process.exitCode = 1
} else {
  console.log(JSON.stringify({
    isValid: true,
    name: theme.name,
    dataColors: theme.dataColors.length,
    visualStyleCount: Object.keys(theme.visualStyles).length,
    checkedVisuals: requiredVisuals.length,
    schemaValues: {
      dropShadowPosition,
      barGridlineStyle,
      pieLabelPosition,
      donutLabelPosition,
      donutInnerRadiusRatio,
      treemapTilingMethod,
      slicerHeaderOutlineStyle,
      slicerItemsOutlineStyle,
    },
    backgroundDefaults: {
      rawThemeVisualBackground: sampleState.visualBackground,
      effectiveCanvasBackground: exportBackgrounds.effectiveCanvasBackground,
      effectiveVisualBackground: exportBackgrounds.effectiveVisualBackground,
      effectiveTitleBackground: exportBackgrounds.effectiveTitleBackground,
      effectiveOutspaceBackground: exportBackgrounds.effectiveOutspaceBackground,
      formatPaneBackgroundValue: exportBackgrounds.effectiveVisualBackground,
      exportedRootBackground: theme.background,
      exportedRootForeground: theme.foreground,
      exportedPageBackgroundColor: pageBackground.color.solid.color,
      exportedPageOutspaceColor: pageOutspace.color.solid.color,
      commonVisualBackgroundShow: commonBackground.show,
      exportedCommonVisualBackgroundColor: commonBackground.color.solid.color,
      commonVisualBackgroundTransparency: commonBackground.transparency,
      barChartBackgroundColor: barBackground.color.solid.color,
      exportedTitleBackground: commonTitle.background.solid.color,
      columnChartBackgroundColor: columnBackground.color.solid.color,
      cardBackgroundColor: cardBackground.color.solid.color,
      tableBackgroundColor: tableBackground.color.solid.color,
      slicerBackgroundColor: slicerBackground.color.solid.color,
      borderShow: commonBorder.show,
      borderColor: commonBorder.color.solid.color,
    },
  }, null, 2))
}
