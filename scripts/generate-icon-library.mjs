import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageRoot = path.join(rootDir, 'node_modules', '@tabler', 'icons')
const outlineDir = path.join(packageRoot, 'icons', 'outline')
const filledDir = path.join(packageRoot, 'icons', 'filled')
const iconsJsonPath = path.join(packageRoot, 'icons.json')
const publicRoot = path.join(rootDir, 'public', 'icon-library', 'tabler')
const publicMetadataPath = path.join(publicRoot, 'icon-library.json')
const metadataPath = path.join(rootDir, 'src', 'lib', 'generatedIconLibrary.ts')
const checkOnly = process.argv.includes('--check')

const CATEGORY_KEYWORDS = [
  ['Analytics', ['chart', 'graph', 'dashboard', 'report', 'analytics', 'presentation', 'activity', 'trend', 'timeline', 'database', 'data', 'sql', 'table', 'chartpie', 'stats']],
  ['Finance', ['cash', 'coin', 'wallet', 'receipt', 'credit', 'card', 'currency', 'bank', 'building-bank', 'money', 'dollar', 'euro', 'rupee', 'bitcoin', 'tax', 'invoice', 'chart-dots-dollar']],
  ['Supply Chain', ['truck', 'package', 'route', 'warehouse', 'forklift', 'shipping', 'delivery', 'container', 'box', 'pallet', 'road', 'map-route', 'plane', 'ship', 'train']],
  ['Healthcare', ['heart', 'medical', 'pill', 'hospital', 'stethoscope', 'vaccine', 'ambulance', 'nurse', 'health', 'medicine', 'first-aid', 'activity-heartbeat', 'dental', 'microscope']],
  ['HR', ['user', 'users', 'employee', 'id', 'face', 'man', 'woman', 'person', 'friends', 'address-book', 'contact', 'body', 'mood', 'passport', 'recruit', 'resume', 'interview', 'hiring', 'onboard', 'payroll']],
  ['Sales', ['shopping', 'cart', 'basket', 'store', 'tag', 'discount', 'barcode', 'ticket', 'building-store', 'receipt', 'brand', 'sale', 'cash-register']],
  ['Marketing', ['ad', 'speakerphone', 'megaphone', 'target', 'brand', 'palette', 'campaign', 'social', 'share', 'seo', 'chart-arrows', 'bulb']],
  ['Operations', ['settings', 'adjustments', 'tool', 'tools', 'wrench', 'cog', 'calendar', 'clock', 'progress', 'task', 'checklist', 'clipboard', 'briefcase', 'assembly']],
  ['Education', ['school', 'book', 'certificate', 'graduation', 'pencil', 'notebook', 'abc', 'language', 'writing', 'teacher', 'math', 'abacus']],
  ['Admin', ['admin', 'user-cog', 'database-cog', 'shield-cog', 'lock-cog', 'manage', 'management', 'sliders']],
  ['Application', ['app', 'apps', 'window', 'browser', 'layout', 'template', 'panel', 'sidebar', 'form', 'input', 'grid', 'list', 'component', 'widget', 'screen']],
  ['Cloud', ['cloud', 'server', 'hosting', 'deploy', 'sync', 'backup', 'webhook', 'world-www']],
  ['Development', ['code', 'git', 'terminal', 'api', 'bug', 'binary', 'brackets', 'command', 'console', 'source', 'branch', 'json', 'html', 'css', 'regex']],
  ['Technology', ['device', 'computer', 'cpu', 'chip', 'wifi', 'bluetooth', 'robot', 'ai', 'database', 'automation', 'network']],
  ['Communication', ['mail', 'message', 'phone', 'chat', 'send', 'inbox', 'bell', 'notification', 'microphone', 'video', 'broadcast', 'antenna']],
  ['Maps', ['map', 'compass', 'location', 'pin', 'map-pin', 'gps', 'route', 'world', 'globe', 'directions', 'road']],
  ['Buttons', ['button', 'click', 'toggle', 'switch', 'play', 'pause', 'stop', 'power', 'circle-plus', 'square-plus', 'circle-minus', 'square-minus', 'player']],
  ['Navigation', ['arrow', 'chevron', 'caret', 'corner', 'direction', 'left', 'right', 'up', 'down', 'menu', 'nav', 'home']],
  ['Files', ['file', 'folder', 'archive', 'paperclip', 'download', 'upload', 'copy', 'clipboard', 'notes', 'paper', 'document', 'pdf']],
  ['Security', ['lock', 'shield', 'key', 'fingerprint', 'password', 'scan', 'eye', 'face-id', 'secure', 'vpn', 'auth', 'certificate']],
  ['Alerts', ['alert', 'check', 'x', 'warning', 'info', 'circle-check', 'circle-x', 'ban', 'exclamation', 'progress', 'loader', 'thumb', 'mood']],
  ['Business', ['briefcase', 'building', 'office', 'business', 'chart', 'target', 'award', 'license', 'building-factory', 'affiliate', 'hierarchy']],
]

const TABLER_CATEGORY_HINTS = new Map([
  ['Charts', 'Analytics'],
  ['Money', 'Finance'],
  ['E-commerce', 'Sales'],
  ['Health', 'Healthcare'],
  ['Users', 'HR'],
  ['Communication', 'Communication'],
  ['Development', 'Development'],
  ['Devices', 'Technology'],
  ['System', 'Operations'],
  ['Map', 'Navigation'],
  ['Arrows', 'Navigation'],
  ['Files', 'Files'],
  ['Security', 'Security'],
  ['Education', 'Education'],
  ['Buildings', 'Business'],
  ['Vehicles', 'Supply Chain'],
])

function titleCase(name) {
  return name
    .split('-')
    .filter(Boolean)
    .map((word) => (/^\d+$/.test(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

function normalizeTag(tag) {
  return String(tag).trim().toLowerCase().replace(/\s+/g, '-')
}

export function inferIconCategory(iconName, baseTags = [], tablerCategory = '') {
  const words = new Set([
    ...iconName.split('-').map(normalizeTag),
    ...baseTags.map(normalizeTag),
    normalizeTag(tablerCategory),
  ].filter(Boolean))
  const joined = Array.from(words).join(' ')

  let bestCategory = TABLER_CATEGORY_HINTS.get(tablerCategory) ?? 'Essentials'
  let bestScore = bestCategory === 'Essentials' ? 0 : 1

  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    let score = 0
    for (const keyword of keywords) {
      const normalized = normalizeTag(keyword)
      if (words.has(normalized)) score += 3
      else if (joined.includes(normalized)) score += 1
    }
    if (score > bestScore) {
      bestCategory = category
      bestScore = score
    }
  }

  return bestCategory
}

function tagsFor(iconName, iconMeta, category, variant) {
  const tags = new Set([
    ...iconName.split('-').map(normalizeTag),
    ...(iconMeta?.tags ?? []).map(normalizeTag),
    normalizeTag(iconMeta?.category ?? ''),
    normalizeTag(category),
    'dashboard',
    'business',
    'icon',
    'svg',
    'tabler',
  ].filter(Boolean))
  if (variant === 'filled') tags.add('filled')
  return Array.from(tags).sort()
}

async function listSvgFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.svg'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b))
}

async function copyIcons(files, sourceDir, targetDir) {
  await fs.mkdir(targetDir, { recursive: true })
  await Promise.all(files.map(async (file) => {
    const source = path.join(sourceDir, file)
    const target = path.join(targetDir, file)
    const svg = await fs.readFile(source, 'utf8')
    await fs.writeFile(target, svg.trim() + '\n', 'utf8')
  }))
}

function buildItems(files, variant, iconsMeta) {
  return files.map((file) => {
    const slug = file.replace(/\.svg$/, '')
    const iconMeta = iconsMeta[slug]
    const category = inferIconCategory(slug, iconMeta?.tags ?? [], iconMeta?.category ?? '')
    const isFilled = variant === 'filled'
    return {
      id: isFilled ? `tabler-filled-${slug}` : `tabler-${slug}`,
      name: isFilled ? `${titleCase(slug)} Filled` : titleCase(slug),
      category,
      source: 'tabler',
      url: isFilled ? `/icon-library/tabler/filled/${file}` : `/icon-library/tabler/${file}`,
      tags: tagsFor(slug, iconMeta, category, variant),
      license: 'MIT',
    }
  })
}

function metadataSource(items, outlineCount, filledCount) {
  return `import type { IconLibraryItem } from '@/types'\n\n` +
    `export const ICON_LIBRARY_METADATA_URL = '/icon-library/tabler/icon-library.json'\n` +
    `export const ICON_LIBRARY_COUNT = ${items.length}\n\n` +
    `export const ICON_LIBRARY_OUTLINE_COUNT = ${outlineCount}\n` +
    `export const ICON_LIBRARY_FILLED_COUNT = ${filledCount}\n\n` +
    `let cachedIcons: IconLibraryItem[] | null = null\n\n` +
    `export async function loadGeneratedIconLibrary(): Promise<IconLibraryItem[]> {\n` +
    `  if (cachedIcons) return cachedIcons\n` +
    `  const response = await fetch(ICON_LIBRARY_METADATA_URL)\n` +
    `  if (!response.ok) throw new Error('Unable to load the generated icon library metadata.')\n` +
    `  cachedIcons = await response.json() as IconLibraryItem[]\n` +
    `  return cachedIcons\n` +
    `}\n`
}

function summarize(items) {
  const byCategory = new Map()
  for (const item of items) byCategory.set(item.category, (byCategory.get(item.category) ?? 0) + 1)
  const duplicateIds = items
    .map((item) => item.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index)
  return {
    total: items.length,
    categories: Object.fromEntries(Array.from(byCategory.entries()).sort((a, b) => a[0].localeCompare(b[0]))),
    duplicateIds,
  }
}

async function main() {
  const iconsMeta = JSON.parse(await fs.readFile(iconsJsonPath, 'utf8'))
  const outlineFiles = await listSvgFiles(outlineDir)
  const filledFiles = await listSvgFiles(filledDir)
  const items = [
    ...buildItems(outlineFiles, 'outline', iconsMeta),
    ...buildItems(filledFiles, 'filled', iconsMeta),
  ]
  const summary = summarize(items)

  if (summary.duplicateIds.length) {
    console.error(`Duplicate icon ids found: ${summary.duplicateIds.slice(0, 10).join(', ')}`)
    process.exitCode = 1
    return
  }

  if (checkOnly) {
    const metadataExists = await fs.access(metadataPath).then(() => true).catch(() => false)
    const publicMetadataExists = await fs.access(publicMetadataPath).then(() => true).catch(() => false)
    const outlineTargetExists = await fs.access(path.join(publicRoot, 'chart-bar.svg')).then(() => true).catch(() => false)
    const filledTargetExists = await fs.access(path.join(publicRoot, 'filled')).then(() => true).catch(() => false)
    console.log(JSON.stringify({ ...summary, metadataExists, publicMetadataExists, outlineTargetExists, filledTargetExists }, null, 2))
    return
  }

  await fs.rm(publicRoot, { recursive: true, force: true })
  await copyIcons(outlineFiles, outlineDir, publicRoot)
  await copyIcons(filledFiles, filledDir, path.join(publicRoot, 'filled'))
  await fs.writeFile(publicMetadataPath, JSON.stringify(items), 'utf8')
  await fs.writeFile(metadataPath, metadataSource(items, outlineFiles.length, filledFiles.length), 'utf8')

  console.log(JSON.stringify(summary, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
