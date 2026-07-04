/**
 * Icon Library V2 generator.
 *
 * Reads the two reference libraries preserved under
 * docs/reference/icon-library/ and emits curated, deduplicated canonical
 * concept data files into src/data/icon-library/.
 *
 *   node scripts/generate-icon-library.mjs
 *
 * - bi-icon-studio.html  → mono + multicolor geometry (all four color modes)
 * - icon-vault_3.html    → mono geometry gap-fillers (flags + <text> icons excluded)
 * - currency.ts is HAND-AUTHORED and never touched by this script.
 *
 * Curation applied here (documented in docs/qa/icon-library-v2-audit.md (historical)):
 * exact-geometry duplicates and same-concept duplicates collapse to one
 * canonical concept; the dropped names become aliases/keywords.
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(root, 'src', 'data', 'icon-library')

/* ── extraction ── */
function extractArray(html, varName) {
  const start = html.indexOf(`const ${varName} = [`)
  if (start === -1) throw new Error(`${varName} not found`)
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

const studioRaw = extractArray(fs.readFileSync(path.join(root, 'docs/reference/icon-library/bi-icon-studio.html'), 'utf8'), 'ICONS')
const vaultRaw = extractArray(fs.readFileSync(path.join(root, 'docs/reference/icon-library/icon-vault_3.html'), 'utf8'), 'ICONS')

/* ── curation maps ──
   DROP: dropped id → canonical id that absorbs its name as alias.
   Reasons: exact-geometry dupes, same-name dupes, same-concept different
   drawing (repeated shapes under different names are not allowed). */
const STUDIO_DROP = {
  'threat-alert': 'status-warning',   // exact geometry dup + name dup with threat
  'package': 'shipment',              // exact geometry dup (IT package = logistics box)
  'public-health': 'wellness',        // exact geometry dup
  'grading': 'compliance',            // exact geometry dup
  'npa': 'defect-rate',               // exact geometry dup
  'research': 'sourcing',             // exact geometry dup
  'competitive-intel': 'sourcing',    // exact geometry dup
  'funnel-sales': 'sales-funnel',     // same-name dup
  'inventory-box': 'inventory',       // same-name dup
  'firewall-net': 'firewall',         // same-name dup
  'neural-net': 'neural-network',     // same-name dup
  'courthouse': 'government',         // same-name dup
  'scatter-plot': 'scatter-chart',    // same concept
  'waterfall2': 'waterfall-chart',    // same concept
  'gauge': 'gauge-chart',             // gauge shape family → one canonical
  'airplane': 'flight',               // same concept (transportation)
  'onboarding-cx': 'kyc',             // exact geometry dup (ID-check drawing)
  'execution': 'okr',                 // exact geometry dup with net-zero; okr absorbs
}

/* Vault → canonical studio concept merges (name becomes alias). Name-level
   overlaps (32 ids) are dropped automatically; these are concept-level. */
const VAULT_MERGE = {
  'coin-stack': 'coins', 'trending-up': 'trend-up', 'gauge-kpi': 'gauge-chart',
  'magnifier-analytics': 'drill-down', 'filter-data': 'filter', 'clock-kpi': 'time-clock',
  'dashboard-grid': 'dashboard', 'forecast-trend': 'forecast', 'flag-milestone': 'milestone',
  'box': 'shipping-box', 'gear': 'settings', 'pin': 'location-pin', 'spanner': 'maintenance',
  'shield-lock': 'shield', 'bot': 'chatbot', 'api-network': 'integration',
  'returns-arrow': 'returns', 'package-check': 'fulfillment', 'tracking-pin': 'tracking',
  'customs-stamp': 'customs', 'cargo-ship': 'container-ship', 'shopping-trolley': 'shopping-cart',
  'net-profit': 'profit', 'variance-bars': 'variance', 'user': 'employee',
  'handshake': 'deal', 'headset': 'chat-support', 'email': 'email-marketing',
  'customer-heart': 'loyalty', 'thumbs-up': 'csat', 'star': 'rating-star',
  'pos-terminal': 'pos', 'returns-exchange': 'returns-mgmt', 'aisle-shelf': 'shelf-stock',
  'clipboard-check': 'quality-check', 'pallet-load': 'pallet', 'delivery-route': 'route',
  'assembly-line': 'conveyor', 'speed-gauge': 'gauge-chart', 'lightbulb': 'innovation',
  'rocket': 'product-launch', 'chat-bubble': 'feedback', 'bell': 'notification',
  'checklist': 'task', 'share-network': 'share', 'compound-growth': 'cagr',
  'document-file': 'policy-document', 'ev-battery': 'ev-charge',
  'product-catalog': 'clipboard-list', 'calendar-hr': 'calendar',
  'airplane': 'flight',
}

/* Vault icons excluded outright: text-glyph geometry (currency set is
   hand-authored as pure paths in currency.ts) and reference-page flags. */
const VAULT_EXCLUDE = new Set([
  'money-bag', 'currency-usd', 'currency-eur', 'currency-gbp', 'currency-jpy',
  'currency-inr', 'currency-cny', 'currency-bitcoin', 'delta-change',
])

/* Vault category → V2 category (studio categories already match V2 ids). */
const VAULT_CAT = {
  finance: 'finance', currency: 'finance', hr: 'hr', sales: 'sales', retail: 'retail',
  fmcg: 'fmcg', ops: 'operations', logistics: 'logistics', auto: 'automotive',
  travel: 'travel', tech: 'it', products: 'procurement', analytics: 'analytics',
  general: 'general', metrics: 'variance',
}

/* Vault renames for clarity in a business library. */
const VAULT_RENAME = {
  'double-gear': ['machinery', 'Machinery'],
  'calendar-check': ['expiry-date', 'Expiry Date'],
  'shelf-stock': ['shelf-stock', 'Shelf Stock'],
  'scale': ['balance-scale', 'Balance Scale'],
  'ruler': ['measurement', 'Measurement'],
  'layers': ['stock-layers', 'Stock Layers'],
  'clipboard-list': ['stock-list', 'Stock List'],
}

/* Studio category → V2 category id (identity except aliases). */
const STUDIO_CAT = { 'project': 'project', 'real-estate': 'real-estate' }

/* ── geometry normalization ──
   MONOCHROME: per-element widths/caps/joins are stripped so the root-level
   weight applied by the renderer takes effect — the root default (1.6, round
   caps/joins) reproduces the reference appearance exactly at regular weight.
   Stroke color / fills are kept (currentColor mono contract).
   MULTICOLOR: imported AS IS — whitespace collapse ONLY. Original colors,
   opacities, per-element stroke widths, fills and hierarchy are preserved. */
function normalizeOutline(markup) {
  return markup
    .replace(/\s(stroke-width|stroke-linecap|stroke-linejoin)="[^"]*"/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}
function normalizeMulti(markup) {
  return markup.replace(/\s+/g, ' ').trim()
}

/* ── metadata templates per category ── */
const CATEGORY_META = {
  analytics: { blurb: 'analytics and reporting', uses: ['Report visuals and headers', 'Bookmark navigation', 'Visual titles'] },
  kpi: { blurb: 'KPI and performance tracking', uses: ['KPI cards', 'Scorecards', 'Conditional formatting icons'] },
  variance: { blurb: 'growth, variance and financial metrics', uses: ['Variance columns', 'KPI trend indicators', 'Finance tables'] },
  finance: { blurb: 'finance and accounting', uses: ['Financial dashboards', 'P&L report headers', 'KPI cards'] },
  banking: { blurb: 'banking and insurance', uses: ['Banking dashboards', 'Risk reports', 'Product KPIs'] },
  currency: { blurb: 'currency and foreign exchange', uses: ['Currency KPI cards', 'FX dashboards', 'Regional revenue reports'] },
  sales: { blurb: 'sales and marketing', uses: ['Sales dashboards', 'Funnel reports', 'Campaign scorecards'] },
  cx: { blurb: 'customer experience and support', uses: ['CX dashboards', 'NPS/CSAT cards', 'Support queue reports'] },
  hr: { blurb: 'human resources and people analytics', uses: ['HR dashboards', 'Headcount cards', 'Attrition reports'] },
  retail: { blurb: 'retail and e-commerce', uses: ['Retail dashboards', 'Store scorecards', 'Sales floor reports'] },
  fmcg: { blurb: 'FMCG and consumer goods', uses: ['Category dashboards', 'Shelf reports', 'Distribution KPIs'] },
  operations: { blurb: 'operations and manufacturing', uses: ['Ops dashboards', 'OEE scorecards', 'Shift reports'] },
  procurement: { blurb: 'procurement and inventory', uses: ['Inventory dashboards', 'Supplier scorecards', 'PO trackers'] },
  logistics: { blurb: 'supply chain and logistics', uses: ['Logistics dashboards', 'Shipment trackers', 'OTIF scorecards'] },
  transportation: { blurb: 'transportation and fleet', uses: ['Fleet dashboards', 'Route reports', 'Delivery KPIs'] },
  travel: { blurb: 'airline and travel', uses: ['Travel dashboards', 'Route maps', 'Load-factor KPIs'] },
  automotive: { blurb: 'automobile and manufacturing', uses: ['Plant dashboards', 'Production KPIs', 'Quality reports'] },
  it: { blurb: 'IT and software delivery', uses: ['Engineering dashboards', 'Uptime scorecards', 'DevOps reports'] },
  cloud: { blurb: 'cloud and data platforms', uses: ['Data-platform dashboards', 'Pipeline monitors', 'Capacity KPIs'] },
  cybersecurity: { blurb: 'cybersecurity and compliance', uses: ['Security dashboards', 'Incident reports', 'Compliance scorecards'] },
  ai: { blurb: 'AI and automation', uses: ['ML monitoring dashboards', 'Model scorecards', 'Automation KPIs'] },
  telecom: { blurb: 'telecom networks', uses: ['Network dashboards', 'Coverage maps', 'ARPU scorecards'] },
  project: { blurb: 'project and portfolio management', uses: ['Project dashboards', 'Sprint boards', 'Milestone timelines'] },
  strategy: { blurb: 'strategy and planning', uses: ['Executive dashboards', 'OKR scorecards', 'Board decks'] },
  product: { blurb: 'product management', uses: ['Product dashboards', 'Adoption funnels', 'Release trackers'] },
  navigation: { blurb: 'report navigation and actions', uses: ['Navigation buttons', 'Page tabs', 'Action toolbars'] },
  status: { blurb: 'status and alerting', uses: ['Status indicators', 'Conditional formatting icons', 'Alert banners'] },
  healthcare: { blurb: 'healthcare and clinical analytics', uses: ['Clinical dashboards', 'Bed-occupancy KPIs', 'Patient-flow reports'] },
  education: { blurb: 'education and learning analytics', uses: ['LMS dashboards', 'Enrollment reports', 'Progress scorecards'] },
  energy: { blurb: 'energy and utilities', uses: ['Energy dashboards', 'Grid monitors', 'Consumption KPIs'] },
  esg: { blurb: 'sustainability and ESG', uses: ['ESG dashboards', 'Emission trackers', 'Sustainability scorecards'] },
  'real-estate': { blurb: 'real estate and property', uses: ['Portfolio dashboards', 'Occupancy KPIs', 'Valuation reports'] },
  government: { blurb: 'government and public sector', uses: ['Public dashboards', 'Program scorecards', 'Budget reports'] },
  general: { blurb: 'general business', uses: ['Executive dashboards', 'Report headers', 'Navigation buttons'] },
}

function titleCase(s) {
  return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function buildConcept({ id, name, category, keywords, aliases, outline, multi, source, subcategory }) {
  const cat = CATEGORY_META[category] ?? CATEGORY_META.general
  const kw = [...new Set([
    ...String(keywords ?? '').split(/[\s,]+/).filter(Boolean),
    ...id.split('-'),
    ...name.toLowerCase().split(/[^a-z0-9]+/),
    category,
  ].map((t) => t.toLowerCase()).filter((t) => t.length > 1))]
  const outlineNorm = normalizeOutline(outline)
  const multiNorm = multi ? normalizeMulti(multi) : null

  return {
    id: `v2-${id}`,
    name,
    primaryCategory: category,
    ...(subcategory ? { subcategory } : {}),
    keywords: kw,
    aliases: [...new Set(aliases)].filter((a) => a.toLowerCase() !== name.toLowerCase()),
    description: `${name} — professional ${cat.blurb} icon for Power BI dashboards.`,
    recommendedUses: cat.uses,
    viewBox: '0 0 24 24',
    monochromeSvg: outlineNorm,
    ...(multiNorm ? { multicolorSvg: multiNorm } : {}),
    source,
  }
}

/* ── build concepts ── */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const aliasBucket = new Map() // canonical raw id → Set<alias>
const addAlias = (canonicalId, ...names) => {
  const set = aliasBucket.get(canonicalId) ?? new Set()
  for (const n of names) if (n) set.add(n)
  aliasBucket.set(canonicalId, set)
}

const studioById = new Map(studioRaw.map((i) => [i.id, i]))
let droppedStudio = 0
for (const [dropId, target] of Object.entries(STUDIO_DROP)) {
  const dropped = studioById.get(dropId)
  if (!dropped) continue
  addAlias(target, dropped.name, titleCase(dropId))
  studioById.delete(dropId)
  droppedStudio++
}

const studioNames = new Set([...studioById.values()].map((i) => norm(i.name)))
let mergedVault = 0
let excludedVault = 0
const vaultKept = []
for (const icon of vaultRaw) {
  if (icon.flag) { excludedVault++; continue }
  if (VAULT_EXCLUDE.has(icon.id)) { excludedVault++; continue }
  if (VAULT_MERGE[icon.id]) { addAlias(VAULT_MERGE[icon.id], icon.name); mergedVault++; continue }
  if (studioNames.has(norm(icon.name))) { mergedVault++; continue } // exact name overlap → studio wins
  vaultKept.push(icon)
}

const concepts = []
for (const icon of studioById.values()) {
  const category = STUDIO_CAT[icon.category] ?? icon.category
  concepts.push(buildConcept({
    id: icon.id, name: icon.name, category,
    keywords: icon.keywords, aliases: [...(aliasBucket.get(icon.id) ?? [])],
    outline: icon.mono, multi: icon.multi, source: 'bi-icon-studio',
  }))
}
for (const icon of vaultKept) {
  const [newId, newName] = VAULT_RENAME[icon.id] ?? [icon.id, icon.name]
  concepts.push(buildConcept({
    id: newId, name: newName, category: VAULT_CAT[icon.cat] ?? 'general',
    keywords: '', aliases: newName !== icon.name ? [icon.name] : [],
    outline: icon.svg, multi: null, source: 'icon-vault',
  }))
}

/* ── final safety dedupe by id + name ── */
const seenIds = new Set()
const seenNames = new Set()
const final = []
for (const c of concepts) {
  if (seenIds.has(c.id) || seenNames.has(norm(c.name))) { droppedStudio++; continue }
  seenIds.add(c.id)
  seenNames.add(norm(c.name))
  final.push(c)
}

/* An alias must never equal another concept's canonical name — the canonical
   concept owns that search term. */
for (const c of final) {
  c.aliases = c.aliases.filter((a) => norm(a) === norm(c.name) || !seenNames.has(norm(a)))
    .filter((a) => norm(a) !== norm(c.name))
}

/* ── emit data files ── */
const FILES = {
  analytics: { cats: ['analytics', 'kpi', 'variance'], exportName: 'ANALYTICS_CONCEPTS' },
  finance: { cats: ['finance', 'banking'], exportName: 'FINANCE_CONCEPTS' },
  sales: { cats: ['sales', 'cx'], exportName: 'SALES_CONCEPTS' },
  hr: { cats: ['hr'], exportName: 'HR_CONCEPTS' },
  retail: { cats: ['retail', 'fmcg'], exportName: 'RETAIL_CONCEPTS' },
  operations: { cats: ['operations', 'procurement'], exportName: 'OPERATIONS_CONCEPTS' },
  logistics: { cats: ['logistics', 'transportation', 'travel'], exportName: 'LOGISTICS_CONCEPTS' },
  manufacturing: { cats: ['automotive'], exportName: 'MANUFACTURING_CONCEPTS' },
  technology: { cats: ['it', 'cloud', 'cybersecurity', 'ai', 'telecom'], exportName: 'TECHNOLOGY_CONCEPTS' },
  projectManagement: { cats: ['project', 'strategy', 'product'], exportName: 'PROJECT_MANAGEMENT_CONCEPTS' },
  navigation: { cats: ['navigation'], exportName: 'NAVIGATION_CONCEPTS' },
  status: { cats: ['status'], exportName: 'STATUS_CONCEPTS' },
  general: { cats: ['healthcare', 'education', 'energy', 'esg', 'real-estate', 'government', 'general'], exportName: 'GENERAL_CONCEPTS' },
}

/* bi-icon-studio "status" category mixes true status icons with navigation
   actions — split them here. */
const NAV_IDS = new Set(['v2-search', 'v2-arrow-navigation', 'v2-menu', 'v2-add-create', 'v2-pin', 'v2-share', 'v2-link', 'v2-drag', 'v2-expand', 'v2-collapse'])
for (const c of final) {
  if (c.primaryCategory === 'status' && NAV_IDS.has(c.id)) c.primaryCategory = 'navigation'
}

fs.mkdirSync(OUT_DIR, { recursive: true })
let written = 0
for (const [file, def] of Object.entries(FILES)) {
  const list = final.filter((c) => def.cats.includes(c.primaryCategory))
  const body = list.map((c) => JSON.stringify(c, null, 2).replace(/^/gm, '  ').trimStart()).join(',\n  ')
  const content = `// GENERATED by scripts/generate-icon-library.mjs — do not edit by hand.
// Source geometry adapted from docs/reference/icon-library/ (curated + deduplicated).
import type { IconConcept } from '@/lib/icon-library/types'

export const ${def.exportName}: IconConcept[] = [
  ${body},
]
`
  fs.writeFileSync(path.join(OUT_DIR, `${file}.ts`), content)
  written += list.length
}

const summary = {
  studioSource: studioRaw.length,
  vaultSource: vaultRaw.length,
  studioDropped: Object.keys(STUDIO_DROP).length,
  vaultMergedOrOverlap: mergedVault,
  vaultExcluded: excludedVault,
  generatedConcepts: written,
  withMulticolor: final.filter((c) => c.multicolorSvg).length,
  byCategory: Object.fromEntries([...final.reduce((m, c) => m.set(c.primaryCategory, (m.get(c.primaryCategory) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1])),
}
console.log(JSON.stringify(summary, null, 2))
