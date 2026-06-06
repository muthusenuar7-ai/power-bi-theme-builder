import type { IconLibraryCategory, IconLibraryItem } from '@/types'
import { COUNTRY_FLAG_COUNT } from '@/lib/flagLibrary'
import { ICON_LIBRARY_OUTLINE_COUNT, loadGeneratedIconLibrary as loadRawGeneratedIconLibrary } from '@/lib/generatedIconLibrary'

export const ICON_LIBRARY_CATEGORIES = [
  'All',
  'Power BI Visuals',
  'Power BI Actions',
  'Analytics',
  'Metrics/KPI',
  'Finance',
  'Currency Signs',
  'Sales',
  'Marketing',
  'Supply Chain',
  'Operations',
  'HR',
  'Healthcare',
  'Education',
  'Business',
  'Application',
  'Technology',
  'Cloud',
  'Development',
  'Communication',
  'Files',
  'Admin',
  'Security',
  'Alerts',
  'Maps',
  'Navigation',
  'Directions & Arrows',
  'Toggle & Controls',
  'Shapes',
  'Buttons',
  'Countries',
  'Flags',
  'Essentials',
] as const

export type IconLibraryCategoryFilter = (typeof ICON_LIBRARY_CATEGORIES)[number]

export const ICON_LIBRARY_COUNT = ICON_LIBRARY_OUTLINE_COUNT + COUNTRY_FLAG_COUNT

const ICON_CATEGORY_SET = new Set<string>(ICON_LIBRARY_CATEGORIES.filter((c) => c !== 'All'))

const PBI_VISUAL_SLUGS = new Set([
  'chart-bar',
  'chart-bar-popular',
  'chart-column',
  'chart-line',
  'chart-area',
  'chart-area-line',
  'chart-pie',
  'chart-pie-2',
  'chart-pie-3',
  'chart-pie-4',
  'chart-donut',
  'chart-donut-2',
  'chart-donut-3',
  'chart-donut-4',
  'chart-treemap',
  'chart-funnel',
  'chart-scatter',
  'chart-scatter-3d',
  'chart-bubble',
  'chart-dots',
  'chart-dots-2',
  'chart-dots-3',
  'chart-grid-dots',
  'gauge',
  'dashboard',
  'layout-dashboard',
  'table',
  'table-column',
  'table-row',
  'matrix',
  'map',
  'map-2',
  'world-map',
  'hierarchy',
  'hierarchy-2',
  'hierarchy-3',
])

/** Power BI report ACTIONS (slicer / filter / drill / bookmark / refresh /
 *  report / dataset) — kept out of Power BI Visuals so each category is clean. */
const PBI_ACTION_SLUGS = new Set([
  'bookmark', 'bookmarks', 'bookmark-edit',
  'filter', 'filters', 'filter-edit', 'filter-cog', 'filter-search',
  'report', 'report-analytics', 'report-search', 'file-report',
  'database', 'database-export', 'database-import', 'database-search',
  'refresh', 'reload', 'refresh-dot',
  'arrows-sort', 'sort-ascending', 'sort-descending',
  'focus', 'focus-2', 'focus-centered',
  'click', 'hand-click', 'pointer',
  'toggle-left', 'toggle-right',
])

/**
 * High-precision SLUG rules for the structural icon families. These are matched
 * against the clean icon slug only (never the noisy auto-tags) so each family is
 * exact: Currency Signs, Directions & Arrows, Toggle & Controls, Shapes.
 */
function isCurrencySlug(slug: string): boolean {
  return /^(currency-|coins?(-|$)|cash(-|$)|credit-card(-|$)|wallet(-|$)|bitcoin$|banknote(-|$))/.test(slug)
}
function isArrowSlug(slug: string): boolean {
  return /^(arrows?(-|$)|chevrons?(-|$)|caret(-|$)|corner(-|$)|sort-(ascending|descending)$|directions?(-|$)|circle-(arrow|chevron|caret)|square-(arrow|chevron|caret))/.test(slug)
}
function isToggleSlug(slug: string): boolean {
  if (PBI_ACTION_SLUGS.has(slug)) return false // keep toggle-left/right as PBI actions
  return /^(toggle(-|$)|switch(-|$)|circuit-switch|checkbox(-|$|es)|square-check(-|$)|radio(-|$)|sliders?(-|$)|adjustments(-|$)|eye($|-)|power$)/.test(slug)
}
function isShapeSlug(slug: string): boolean {
  if (slug === 'triangle-square-circle' || /^shape($|-)/.test(slug)) return true
  // exclude lettered / numbered badge variants and decorated combos
  if (/-letter-|-number-|-check|-x$|-plus|-minus|-question|-exclamation|-asterisk|-bolt|-heart|-star|-dollar|-search/.test(slug)) return false
  return /^(circle|square|rectangle|triangle|diamond|diamonds|hexagon|hexagons|hexagonal-prism|pentagon|octagon|heptagon|nonagon|decagon|oval|polygon|capsule|rhombus|cone|cylinder|cube|sphere|pyramid|prism|line|point|points|slash|separator|baseline)(-(dot|dotted|dashed|half|half-vertical|half-horizontal|rounded|rotated|square|rectangle|triangle|circle|vertical|horizontal|2|3|3d|inverted|filled))*$/.test(slug)
}

/**
 * Curated keyword rules for the business / domain categories. Matched against the
 * clean slug + display name ONLY (not the verbose auto-tags), in priority order —
 * the first match wins, so each icon resolves to exactly one primaryCategory.
 * Anything that matches nothing falls through to "Essentials" (the catch-all for
 * decorative / non-dashboard icons). This keeps every domain category practical.
 */
const CATEGORY_RULES: Array<[IconLibraryCategory, RegExp]> = [
  ['Analytics', /\b(chart|charts|graph|graphs|analytics|analyze|analytic|histogram|statistic|statistics|diagram|plot|infographic|sankey|radar|candle|sparkline|pivot)\b/],
  ['Metrics/KPI', /\b(kpi|metric|metrics|target|goal|gauge|speedometer|trophy|award|medal|scorecard|benchmark|ranking|growth|trending|trend|percentage|percent)\b/],
  ['Healthcare', /\b(health|medical|medicine|hospital|clinic|heartbeat|heart-rate|pulse|pill|pills|pharmacy|prescription|stethoscope|ambulance|dna|virus|vaccine|syringe|nurse|doctor|patient|first-aid|dental|tooth|lungs|kidney|brain|bone|blood|oxygen|wheelchair|cardiology|emergency)\b/],
  ['Finance', /\b(finance|financial|bank|banking|money|moneybag|receipt|payment|billing|businessplan|atm|mortgage|accounting|budget|fund|pig)\b/],
  ['Sales', /\b(cart|shopping|basket|store|shop|discount|barcode|ticket|sale|sales|coupon|gift|tag|tags|checkout)\b/],
  ['Marketing', /\b(marketing|campaign|megaphone|speakerphone|loudspeaker|advertising|ad|ads|seo|bullhorn|promotion|affiliate|bulb|confetti|social|hashtag|rosette)\b/],
  ['Supply Chain', /\b(truck|package|packages|forklift|warehouse|container|pallet|shipping|delivery|cargo|crane|logistics|trolley|barrel|conveyor)\b/],
  ['HR', /\b(user|users|people|person|team|group|employee|friend|friends|profile|contact|woman|man|account|members)\b/],
  ['Education', /\b(school|book|books|certificate|diploma|graduation|pencil|notebook|abc|language|math|abacus|teacher|student|backpack|ruler|library|writing)\b/],
  ['Communication', /\b(mail|message|messages|messenger|chat|inbox|phone|call|comment|comments|microphone|broadcast|rss|envelope|notification)\b/],
  ['Files', /\b(file|files|folder|folders|document|documents|page|copy|archive|pdf|paperclip|clipboard|note|notes|book-2)\b/],
  ['Development', /\b(code|git|terminal|bug|api|binary|brackets|command|console|branch|json|html|css|regex|source|sql|function|variable|webhook|database|server-2|cpu)\b/],
  ['Cloud', /\b(cloud|hosting|backup|sync)\b/],
  ['Technology', /\b(device|computer|laptop|chip|wifi|bluetooth|robot|network|antenna|monitor|keyboard|mouse|printer|usb|router|satellite|battery|plug|cable|signal)\b/],
  ['Application', /\b(app|apps|window|browser|layout|widget|component|template|plugin|extension|module|integration|login|sitemap|dashboard)\b/],
  ['Admin', /\b(admin|settings|adjustments|management|manage)\b/],
  ['Operations', /\b(tool|tools|wrench|hammer|calendar|clock|hourglass|timeline|checklist|task|progress|workflow|process|stopwatch|alarm|gear|cog|settings-2)\b/],
  ['Business', /\b(briefcase|building|buildings|office|company|presentation|handshake|contract|license|factory|meeting|partnership|businessplan)\b/],
  ['Security', /\b(lock|unlock|shield|key|keys|fingerprint|password|scan|secure|vpn|certificate|verified|protect|guard)\b/],
  ['Alerts', /\b(alert|warning|bell|notification|error|exclamation|urgent|info|ban|circle-check|circle-x|status)\b/],
  ['Maps', /\b(map|maps|location|pin|world|globe|gps|compass|route|road|navigation|milestone|signpost|destination|street|mappin)\b/],
  ['Navigation', /\b(menu|home|nav|breadcrumb|dots|grip|link|external-link|anchor|hamburger|sidebar)\b/],
  ['Buttons', /\b(player|circle-plus|circle-plus-2|square-plus|square-plus-2|circle-minus|circle-minus-2|square-minus|square-minus-2|circle-plus-minus|button)\b/],
]

function unique(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    const normalized = value.trim()
    if (!normalized) continue
    const key = normalized.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(normalized)
  }
  return out
}

function slugFromIcon(icon: IconLibraryItem): string {
  return icon.id
    .replace(/^tabler-filled-/, '')
    .replace(/^tabler-/, '')
    .replace(/^flag-country-/, '')
    .replace(/^flag-/, '')
    .toLowerCase()
}

function normalizeNameForDedupe(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bfilled\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function normalizedSearchText(icon: IconLibraryItem): string {
  return [
    icon.id,
    icon.name,
    icon.primaryCategory,
    icon.category,
    icon.source,
    icon.domain,
    icon.countryName,
    icon.isoCode,
    ...(icon.tags ?? []),
    ...(icon.keywords ?? []),
  ].filter(Boolean).join(' ').toLowerCase()
}

function isPbiVisualSlug(slug: string): boolean {
  if (slug.endsWith('-off')) return false
  return PBI_VISUAL_SLUGS.has(slug)
}

function isPbiActionSlug(slug: string): boolean {
  if (slug.endsWith('-off')) return false
  return PBI_ACTION_SLUGS.has(slug)
}

function inferPrimaryCategory(icon: IconLibraryItem): IconLibraryCategory {
  if (icon.source === 'flag' || icon.id.startsWith('flag-country-')) return 'Countries'

  const slug = slugFromIcon(icon)
  // Match on the icon's clean identity (slug + display name) only. The verbose
  // auto-generated tags (e.g. "business", "dashboard", "navigation") are NOT used
  // here because they wrongly pull unrelated icons into domain categories.
  const spacedSlug = ` ${slug} `
  const text = `${slug.replace(/-/g, ' ')} ${icon.name}`.toLowerCase()
  const matches = (re: RegExp) => re.test(spacedSlug) || re.test(text)

  if (/\bflag\b/.test(text) || slug.startsWith('flag')) return 'Flags'
  if (isPbiVisualSlug(slug)) return 'Power BI Visuals'
  if (isPbiActionSlug(slug)) return 'Power BI Actions'

  // High-precision structural families (slug-anchored).
  if (isCurrencySlug(slug)) return 'Currency Signs'
  if (isArrowSlug(slug)) return 'Directions & Arrows'
  if (isToggleSlug(slug)) return 'Toggle & Controls'
  if (isShapeSlug(slug)) return 'Shapes'

  // Curated domain keyword rules (first match wins).
  for (const [category, pattern] of CATEGORY_RULES) {
    if (matches(pattern)) return category
  }

  return 'Essentials'
}

function normalizeIcon(icon: IconLibraryItem): IconLibraryItem | null {
  // The Studio already exposes style + weight controls; keeping filled variants
  // makes apparent duplicates and prevents weight from visibly affecting icons.
  if (icon.id.startsWith('tabler-filled-')) return null

  const primaryCategory = inferPrimaryCategory(icon)
  const slug = slugFromIcon(icon)
  const baseTags = [
    ...(icon.tags ?? []),
    icon.category,
    primaryCategory,
    slug,
    ...slug.split('-'),
  ]
  const countryName = icon.countryName ?? (icon.source === 'flag' ? icon.name.replace(/\s+Flag$/i, '') : undefined)
  const isoCode = icon.isoCode ?? (icon.source === 'flag' ? icon.id.replace(/^flag-country-/, '').toUpperCase() : undefined)
  const tags = unique([
    ...baseTags,
    countryName ?? '',
    isoCode ?? '',
    isoCode?.toLowerCase() ?? '',
  ])

  return {
    ...icon,
    name: icon.name.replace(/\s+Filled$/i, ''),
    primaryCategory,
    category: primaryCategory,
    tags,
    keywords: unique([...(icon.keywords ?? []), ...tags, primaryCategory]),
    domain: icon.domain ?? primaryCategory,
    countryName,
    isoCode,
  }
}

export function getUniqueIcons(icons: readonly IconLibraryItem[]): IconLibraryItem[] {
  const seenIds = new Set<string>()
  const seenUrls = new Set<string>()
  const seenNames = new Set<string>()
  const out: IconLibraryItem[] = []

  for (const rawIcon of icons) {
    const icon = normalizeIcon(rawIcon)
    if (!icon) continue

    const normalizedId = icon.id.toLowerCase()
    const normalizedUrl = icon.url.toLowerCase()
    const normalizedName = `${icon.source}:${normalizeNameForDedupe(icon.name)}`

    if (seenIds.has(normalizedId) || seenUrls.has(normalizedUrl) || seenNames.has(normalizedName)) continue
    seenIds.add(normalizedId)
    seenUrls.add(normalizedUrl)
    seenNames.add(normalizedName)
    out.push(icon)
  }

  return out
}

let canonicalCache: IconLibraryItem[] | null = null

export async function loadGeneratedIconLibrary(): Promise<IconLibraryItem[]> {
  if (canonicalCache) return canonicalCache
  canonicalCache = getUniqueIcons(await loadRawGeneratedIconLibrary())
  return canonicalCache
}

export function isIconLibraryCategory(value: string): value is IconLibraryCategory {
  return ICON_CATEGORY_SET.has(value)
}

export function findIconById(icons: readonly IconLibraryItem[], id: string | null): IconLibraryItem | undefined {
  if (!id) return undefined
  return icons.find((icon) => icon.id === id)
}

export function searchIcons(
  icons: readonly IconLibraryItem[],
  query: string,
  category: IconLibraryCategoryFilter,
): IconLibraryItem[] {
  const q = query.trim().toLowerCase()
  const requestedCategory = category === 'All' ? null : category

  return icons.filter((icon) => {
    const primaryCategory = icon.primaryCategory ?? icon.category
    if (requestedCategory && primaryCategory !== requestedCategory) return false
    if (!q) return true
    return normalizedSearchText(icon).includes(q)
  })
}
