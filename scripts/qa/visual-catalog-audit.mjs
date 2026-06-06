import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, '..', '..')

const files = {
  catalog: path.join(root, 'src/lib/visualCatalog.ts'),
  chartPool: path.join(root, 'src/lib/chartPool.ts'),
  renderer: path.join(root, 'src/components/charts/ChartRenderer.tsx'),
  schema: path.join(root, 'src/lib/visualFormatSchema.ts'),
  themeGenerator: path.join(root, 'src/lib/themeGenerator.ts'),
  chartsDir: path.join(root, 'src/components/charts'),
}

function read(file) {
  return readFileSync(file, 'utf8')
}

function between(source, startToken, endToken) {
  const start = source.indexOf(startToken)
  if (start === -1) return ''
  const bodyStart = source.indexOf('[', start)
  const end = source.indexOf(endToken, bodyStart)
  if (bodyStart === -1 || end === -1) return ''
  return source.slice(bodyStart + 1, end)
}

function objectBlocks(arrayBody) {
  const blocks = []
  let depth = 0
  let start = -1
  for (let index = 0; index < arrayBody.length; index += 1) {
    const char = arrayBody[index]
    if (char === '{') {
      if (depth === 0) start = index
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0 && start >= 0) {
        blocks.push(arrayBody.slice(start, index + 1))
        start = -1
      }
    }
  }
  return blocks
}

function pickString(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*'([^']*)'`))
  return match?.[1] ?? ''
}

function pickBoolean(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*(true|false)`))
  return match ? match[1] === 'true' : false
}

function pickStringArray(block, key) {
  const match = block.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, 's'))
  if (!match) return []
  return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
}

function duplicates(values) {
  const seen = new Set()
  const dupes = new Set()
  values.forEach((value) => {
    if (seen.has(value)) dupes.add(value)
    seen.add(value)
  })
  return [...dupes]
}

function parseCatalog() {
  const source = read(files.catalog)
  const body = between(source, 'VISUAL_CATALOG', '] as const')
  return objectBlocks(body).map((block) => ({
    id: pickString(block, 'id'),
    displayName: pickString(block, 'displayName'),
    family: pickString(block, 'family'),
    previewComponentId: pickString(block, 'previewComponentId') || null,
    existsInSelector: pickBoolean(block, 'existsInSelector'),
    formatSchema: pickString(block, 'formatSchema'),
    livePreviewBinding: pickString(block, 'livePreviewBinding'),
    jsonExportMapping: pickString(block, 'jsonExportMapping'),
    implementationStatus: pickString(block, 'implementationStatus'),
    powerBiVisualStyleKeys: pickStringArray(block, 'powerBiVisualStyleKeys'),
  }))
}

function parseRendererRegistry() {
  const source = read(files.renderer)
  const start = source.indexOf('const REGISTRY')
  const bodyStart = start >= 0 ? source.indexOf('{', start) : -1
  let bodyEnd = -1
  if (bodyStart >= 0) {
    let depth = 0
    for (let index = bodyStart; index < source.length; index += 1) {
      const char = source[index]
      if (char === '{') depth += 1
      if (char === '}') {
        depth -= 1
        if (depth === 0) {
          bodyEnd = index
          break
        }
      }
    }
  }
  const body = bodyStart >= 0 && bodyEnd >= 0 ? source.slice(bodyStart, bodyEnd + 1) : ''
  const entries = [...body.matchAll(/^\s*([A-Za-z0-9_]+):\s*([A-Za-z0-9_]+),/gm)]
  return entries.map((match) => ({ id: match[1], component: match[2] }))
}

function parseFormatSchemas() {
  const source = read(files.schema)
  const start = source.indexOf('export const visualFormatSchemas')
  const end = source.indexOf('export const fallbackVisualFormatSchema', start)
  const body = start >= 0 && end >= 0 ? source.slice(start, end) : ''
  const ids = new Set()
  for (const line of body.split(/\r?\n/)) {
    const keyed = line.match(/^\s*([A-Za-z0-9_]+):/)
    const shorthand = line.match(/^\s*([A-Za-z0-9_]+),\s*$/)
    if (keyed) ids.add(keyed[1])
    if (shorthand) ids.add(shorthand[1])
  }
  return [...ids]
}

function parseSelectorIds(catalog) {
  const chartPool = read(files.chartPool)
  if (chartPool.includes('SELECTOR_VISUAL_CATALOG')) {
    return catalog.filter((entry) => entry.existsInSelector).map((entry) => entry.id)
  }

  return [...chartPool.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1])
}

function findComponentFile(componentName) {
  const chartFiles = readdirSync(files.chartsDir).filter((file) => file.endsWith('.tsx'))
  return chartFiles.find((file) => read(path.join(files.chartsDir, file)).includes(`export function ${componentName}`))
}

function componentBindingStatus(componentName) {
  const file = findComponentFile(componentName)
  if (!file) return { file: null, usesPreviewBinding: false }
  const source = read(path.join(files.chartsDir, file))
  return {
    file,
    usesPreviewBinding: /format\?|--preview-|showLegend|showDataLabels|showMarkers/.test(source),
  }
}

function statusIcon(value) {
  if (value === 'full' || value === 'implemented') return 'OK'
  if (value === 'partial') return 'PARTIAL'
  if (value === 'planned') return 'PLANNED'
  if (value === 'needs-review') return 'REVIEW'
  return 'NO'
}

function main() {
  const requiredFiles = Object.values(files).filter((file) => file !== files.chartsDir)
  const missingFiles = requiredFiles.filter((file) => !existsSync(file))
  if (missingFiles.length) {
    console.error('Missing required audit files:')
    missingFiles.forEach((file) => console.error(`- ${path.relative(root, file)}`))
    process.exitCode = 1
    return
  }

  const catalog = parseCatalog()
  const catalogIds = catalog.map((entry) => entry.id)
  const selectorIds = parseSelectorIds(catalog)
  const renderer = parseRendererRegistry()
  const rendererIds = renderer.map((entry) => entry.id)
  const schemaIds = parseFormatSchemas()
  const themeGenerator = read(files.themeGenerator)

  const catalogIdSet = new Set(catalogIds)
  const previewIdSet = new Set(catalog.map((entry) => entry.previewComponentId).filter(Boolean))
  const rendererIdSet = new Set(rendererIds)
  const selectorIdSet = new Set(selectorIds)
  const schemaIdSet = new Set(schemaIds)

  const errors = []
  const warnings = []

  const duplicateCatalogIds = duplicates(catalogIds)
  const duplicateSelectorIds = duplicates(selectorIds)
  const duplicateRendererIds = duplicates(rendererIds)
  if (duplicateCatalogIds.length) errors.push(`Duplicate catalog ids: ${duplicateCatalogIds.join(', ')}`)
  if (duplicateSelectorIds.length) errors.push(`Duplicate selector ids: ${duplicateSelectorIds.join(', ')}`)
  if (duplicateRendererIds.length) errors.push(`Duplicate renderer ids: ${duplicateRendererIds.join(', ')}`)

  const selectorOrphans = selectorIds.filter((id) => !catalogIdSet.has(id))
  const rendererOrphans = rendererIds.filter((id) => !previewIdSet.has(id) && !catalogIdSet.has(id))
  const schemaOrphans = schemaIds.filter((id) => !catalogIdSet.has(id))
  if (selectorOrphans.length) errors.push(`Selector ids missing from catalog: ${selectorOrphans.join(', ')}`)
  if (rendererOrphans.length) errors.push(`Renderer ids missing from catalog: ${rendererOrphans.join(', ')}`)
  if (schemaOrphans.length) warnings.push(`Format schema ids missing from catalog: ${schemaOrphans.join(', ')}`)

  const rows = catalog.map((entry) => {
    const rendererEntry = entry.previewComponentId
      ? renderer.find((candidate) => candidate.id === entry.previewComponentId)
      : null
    const component = rendererEntry ? componentBindingStatus(rendererEntry.component) : { file: null, usesPreviewBinding: false }
    const exportKeys = entry.powerBiVisualStyleKeys ?? []
    const exportKeysFound = exportKeys.filter((key) => themeGenerator.includes(`${key}:`) || themeGenerator.includes(`${key}'`) || themeGenerator.includes(`${key}"`))
    return {
      ...entry,
      selectorFound: selectorIdSet.has(entry.id),
      rendererFound: entry.previewComponentId ? rendererIdSet.has(entry.previewComponentId) : false,
      schemaFound: schemaIdSet.has(entry.id),
      exportFound: exportKeys.length > 0 && exportKeysFound.length === exportKeys.length,
      componentFile: component.file,
      componentUsesPreviewBinding: component.usesPreviewBinding,
    }
  })

  console.log('Datacense Power BI Theme Studio visual catalog audit')
  console.log('---------------------------------------------------')
  console.log(`Catalog visuals: ${catalog.length}`)
  console.log(`Selector visuals: ${selectorIds.length}`)
  console.log(`Renderer entries: ${rendererIds.length}`)
  console.log(`Format schemas: ${schemaIds.length}`)
  console.log('')

  console.log('Coverage matrix')
  for (const row of rows) {
    console.log(
      [
        row.id.padEnd(22),
        row.displayName.padEnd(34),
        `selector=${row.selectorFound ? 'yes' : 'no'}`.padEnd(13),
        `renderer=${row.rendererFound ? 'yes' : 'no'}`.padEnd(12),
        `schema=${row.schemaFound ? 'yes' : 'no'}`.padEnd(10),
        `binding=${statusIcon(row.livePreviewBinding)}`.padEnd(16),
        `json=${statusIcon(row.jsonExportMapping)}`,
      ].join(' '),
    )
  }

  const plannedMissing = rows.filter((row) => row.implementationStatus === 'planned').map((row) => row.id)
  const catalogWithoutRenderer = rows
    .filter((row) => row.existsInSelector && !row.rendererFound)
    .map((row) => row.id)
  const schemasWithoutPreview = schemaIds.filter((id) => {
    const entry = catalog.find((candidate) => candidate.id === id)
    return entry && !entry.previewComponentId
  })
  const previewWithoutSchema = rows
    .filter((row) => row.rendererFound && !row.schemaFound && row.formatSchema !== 'none')
    .map((row) => row.id)

  console.log('')
  console.log('Summary')
  console.log(`- Planned/missing implementation ids: ${plannedMissing.length ? plannedMissing.join(', ') : 'none'}`)
  console.log(`- Selector visuals without renderer support: ${catalogWithoutRenderer.length ? catalogWithoutRenderer.join(', ') : 'none'}`)
  console.log(`- Schemas without preview component: ${schemasWithoutPreview.length ? schemasWithoutPreview.join(', ') : 'none'}`)
  console.log(`- Preview entries with expected schema missing: ${previewWithoutSchema.length ? previewWithoutSchema.join(', ') : 'none'}`)

  const componentNoBinding = rows
    .filter((row) => row.rendererFound && !row.componentUsesPreviewBinding)
    .map((row) => row.id)
  console.log(`- Preview components with no detected live-binding hooks: ${componentNoBinding.length ? componentNoBinding.join(', ') : 'none'}`)

  if (warnings.length) {
    console.log('')
    console.log('Warnings')
    warnings.forEach((warning) => console.log(`- ${warning}`))
  }

  if (errors.length) {
    console.log('')
    console.log('Errors')
    errors.forEach((error) => console.log(`- ${error}`))
    process.exitCode = 1
  }
}

main()
