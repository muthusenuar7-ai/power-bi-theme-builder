import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(rootDir, 'src/data/datacense_398_theme_studio_ready_v5_compact.json')
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'))
const themes = Array.isArray(source.themes) ? source.themes : []

const norm = (value) => String(value ?? '').trim().toUpperCase()
const paletteSig = (theme) => (Array.isArray(theme.dataColors) ? theme.dataColors : [])
  .map(norm)
  .join('|')

function duplicateGroups(keyFn) {
  const groups = new Map()
  for (const theme of themes) {
    const key = keyFn(theme)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(theme)
  }
  return [...groups.values()].filter((group) => group.length > 1)
}

const duplicateIds = duplicateGroups((theme) => norm(theme.themeId))
const duplicateNames = duplicateGroups((theme) => norm(theme.themeName))
const duplicatePalettes = duplicateGroups(paletteSig)
const lengthCounts = new Map()
const categories = new Map()

for (const theme of themes) {
  const len = Array.isArray(theme.dataColors) ? theme.dataColors.length : 0
  lengthCounts.set(len, (lengthCounts.get(len) ?? 0) + 1)
  categories.set(theme.category, (categories.get(theme.category) ?? 0) + 1)
}

console.log('Datacense 398 theme source audit')
console.log('--------------------------------')
console.log(`Source: ${path.relative(rootDir, sourcePath)}`)
console.log(`Declared themes: ${source.themeCount}`)
console.log(`Loaded themes: ${themes.length}`)
console.log(`Duplicate ids: ${duplicateIds.length}`)
console.log(`Duplicate names: ${duplicateNames.length}`)
console.log(`Duplicate dataColor palettes: ${duplicatePalettes.length}`)
console.log(`Data color lengths: ${JSON.stringify(Object.fromEntries([...lengthCounts].sort((a, b) => a[0] - b[0])))}`)
console.log(`Categories: ${JSON.stringify(Object.fromEntries([...categories].sort((a, b) => String(a[0]).localeCompare(String(b[0])))))}`)

if (themes.length !== 398 || source.themeCount !== 398) {
  console.warn('\nWarning: expected exactly 398 Datacense compact themes.')
}

if (duplicateIds.length) {
  console.warn('\nDuplicate theme ids found:')
  duplicateIds.slice(0, 10).forEach((group, index) => {
    console.warn(`  ${index + 1}. ${group.map((theme) => theme.themeId).join(', ')}`)
  })
}
