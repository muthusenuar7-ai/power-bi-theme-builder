'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  Check, CheckCheck, ChevronLeft, ChevronRight, Copy, Download, FileCode,
  Home, Image as ImageIcon, LayoutGrid, Link2, List, RotateCcw, Search, Star, Wand2, X,
} from 'lucide-react'
import type { IconLibraryItem } from '@/types'
import type { IconLibraryCategoryFilter } from '@/lib/iconLibrary'
import { findIconById, ICON_LIBRARY_CATEGORIES, ICON_LIBRARY_COUNT, isIconLibraryCategory, loadGeneratedIconLibrary, searchIcons } from '@/lib/iconLibrary'
import { getFlagIcons, isFlagIcon } from '@/lib/flagLibrary'
import { GRADIENT_LIBRARY, type LibraryGradient } from '@/lib/datacenseLibrary'
import { createZip, strToBytes, type ZipEntry } from '@/lib/zipWriter'
import { sanitizeHex } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'
import styles from './IconLibraryStudio.module.css'

const PAGE_SIZE = 48
const FAVORITES_KEY = 'dc-icon-favorites'

type SortOrder = 'name-asc' | 'name-desc' | 'category'
type ViewMode = 'grid' | 'list'
type IconStyle = 'precision' | 'softline' | 'framework' | 'heritage'
type BgShape = 'none' | 'softtile' | 'rounded' | 'capsule' | 'circle'
type IconWeight = 'thin' | 'regular' | 'medium' | 'bold'

const STYLE_CARDS: { key: IconStyle; label: string; hint: string }[] = [
  { key: 'precision', label: 'Precision', hint: 'Crisp outline' },
  { key: 'softline', label: 'Softline', hint: 'Soft rounded' },
  { key: 'framework', label: 'Framework', hint: 'Structured' },
  { key: 'heritage', label: 'Heritage', hint: 'Classic simple' },
]
const BG_SHAPES: { key: BgShape; label: string }[] = [
  { key: 'none', label: 'None' }, { key: 'softtile', label: 'Soft Tile' }, { key: 'rounded', label: 'Rounded' },
  { key: 'capsule', label: 'Capsule' }, { key: 'circle', label: 'Circle' },
]
const ICON_WEIGHTS: { key: IconWeight; label: string }[] = [
  { key: 'thin', label: 'Thin' }, { key: 'regular', label: 'Regular' }, { key: 'medium', label: 'Medium' }, { key: 'bold', label: 'Bold' },
]
const WEIGHT_STROKE: Record<IconWeight, number> = { thin: 1.1, regular: 1.75, medium: 2.4, bold: 3.2 }

const ICON_COLOR_SWATCHES = ['#0F172A', '#334155', '#2563EB', '#0EA5E9', '#0D9488', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#FFFFFF']
const BG_COLOR_SWATCHES = ['transparent', '#FFFFFF', '#F1F5F9', '#E2E8F0', '#0F172A', '#1E293B', '#2563EB', '#0EA5E9', '#DBEAFE', '#E0F2FE', '#FCE7F3', '#FEF3C7']
const CHECKER_BG = 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 14px 14px'
const GRADIENT_OPTIONS: LibraryGradient[] = GRADIENT_LIBRARY.slice(0, 24)

/* ── Category chips: scope chips + keyword-predicate chips ── */
const SCOPE_CHIPS = ['All', 'Favorites', 'Recently Used'] as const
const CATEGORY_CHIPS = ICON_LIBRARY_CATEGORIES.filter((c) => c !== 'All')
const ALL_CHIPS: string[] = [...SCOPE_CHIPS, ...CATEGORY_CHIPS]

function shapeRadiusCss(shape: BgShape): string {
  if (shape === 'softtile') return '8px'
  if (shape === 'rounded') return '16px'
  if (shape === 'capsule') return '999px'
  if (shape === 'circle') return '50%'
  return '0'
}
function shapeRadiusExport(shape: BgShape, size: number): number {
  if (shape === 'softtile') return 8
  if (shape === 'rounded') return 16
  if (shape === 'capsule' || shape === 'circle') return size / 2
  return 0
}
function rgbaFromHex(hex: string, opacityPct: number): string {
  if (!hex || hex === 'transparent') return 'transparent'
  const c = sanitizeHex(hex)
  return `rgba(${parseInt(c.slice(1, 3), 16)}, ${parseInt(c.slice(3, 5), 16)}, ${parseInt(c.slice(5, 7), 16)}, ${Math.max(0, Math.min(100, opacityPct)) / 100})`
}

/* ── SVG styling + export helpers ── */
interface StyleOpts { iconColor: string; weight: IconWeight; style: IconStyle; isFlag: boolean }

/** Recolour + apply weight/style to a tabler SVG and size it. Flags keep their
 *  own colours (no recolour, no stroke change). */
function styleSvg(text: string, size: number, opts: StyleOpts): string {
  let s = text.replace(/<\?xml[^>]*\?>/i, '').trim()
  if (!opts.isFlag) {
    const styleAttrs: Record<IconStyle, { cap: string; join: string; rendering: string; miter: string }> = {
      precision: { cap: 'butt', join: 'miter', rendering: 'geometricPrecision', miter: '4' },
      softline: { cap: 'round', join: 'round', rendering: 'auto', miter: '2' },
      framework: { cap: 'square', join: 'miter', rendering: 'crispEdges', miter: '2' },
      heritage: { cap: 'round', join: 'bevel', rendering: 'auto', miter: '1' },
    }
    const attrs = styleAttrs[opts.style]
    s = s.replace(/currentColor/g, opts.iconColor)
    s = setSvgAttr(s, 'stroke-width', String(WEIGHT_STROKE[opts.weight]))
    s = setSvgAttr(s, 'stroke-linecap', attrs.cap)
    s = setSvgAttr(s, 'stroke-linejoin', attrs.join)
    s = setSvgAttr(s, 'stroke-miterlimit', attrs.miter)
    s = setSvgAttr(s, 'shape-rendering', attrs.rendering)
  }
  s = s.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${size}" height="${size}">`)
  return s
}

function setSvgAttr(svg: string, attr: string, value: string): string {
  const re = new RegExp(`${attr}="[^"]*"`, 'i')
  if (re.test(svg)) return svg.replace(re, `${attr}="${value}"`)
  return svg.replace(/<svg\b([^>]*)>/i, (_m, attrs: string) => `<svg${attrs} ${attr}="${value}">`)
}

interface SheetOptions extends StyleOpts {
  bgFill: string
  bgShape: BgShape
  padding: number
  gradient: LibraryGradient | null
}

function gradientDefs(g: LibraryGradient, id: string): string {
  const stops = g.stops.map((c, i) => `<stop offset="${((i / Math.max(1, g.stops.length - 1)) * 100).toFixed(1)}%" stop-color="${c}"/>`).join('')
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">${stops}</linearGradient></defs>`
}

function buildSingleSvg(text: string, boxSize: number, opts: SheetOptions, gid = 'dcg'): string {
  const pad = Math.min(opts.padding, boxSize / 2 - 4)
  const iconSize = Math.max(8, boxSize - pad * 2)
  const useGrad = !!opts.gradient && opts.bgShape !== 'none'
  const showBg = opts.bgShape !== 'none' && (useGrad || opts.bgFill !== 'transparent')
  const defs = useGrad && opts.gradient ? gradientDefs(opts.gradient, gid) : ''
  const fill = useGrad ? `url(#${gid})` : opts.bgFill
  const bg = showBg
    ? `<rect x="0" y="0" width="${boxSize}" height="${boxSize}" rx="${shapeRadiusExport(opts.bgShape, boxSize)}" ry="${shapeRadiusExport(opts.bgShape, boxSize)}" fill="${fill}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boxSize}" height="${boxSize}" viewBox="0 0 ${boxSize} ${boxSize}">${defs}${bg}<g transform="translate(${pad}, ${pad})">${styleSvg(text, iconSize, opts)}</g></svg>`
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function svgToPngBytes(svg: string, size: number): Promise<Uint8Array | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }))
    const img = new Image()
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = size * scale
      canvas.height = size * scale
      const ctx = canvas.getContext('2d')
      if (!ctx) { URL.revokeObjectURL(url); resolve(null); return }
      ctx.scale(scale, scale)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(async (png) => {
        URL.revokeObjectURL(url)
        if (!png) { resolve(null); return }
        resolve(new Uint8Array(await png.arrayBuffer()))
      }, 'image/png')
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null) }
    img.src = url
  })
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'icon'
}

/* ── Live inline-styled icon (so colour/weight/style render in the grid) ── */
const SVG_CACHE = new Map<string, string>()
function useInlineSvg(url: string): string | null {
  const [text, setText] = useState<string | null>(() => SVG_CACHE.get(url) ?? null)
  useEffect(() => {
    let active = true
    const cached = SVG_CACHE.get(url)
    if (cached) {
      queueMicrotask(() => { if (active) setText(cached) })
      return () => { active = false }
    }
    fetch(url).then((r) => (r.ok ? r.text() : '')).then((t) => { if (t) SVG_CACHE.set(url, t); if (active) setText(t || null) }).catch(() => {})
    return () => { active = false }
  }, [url])
  return text
}

function InlineStyledIcon({ url, color, size, weight, style, flag }: { url: string; color: string; size: number; weight: IconWeight; style: IconStyle; flag: boolean }) {
  const text = useInlineSvg(url)
  const html = useMemo(() => (text ? styleSvg(text, size, { iconColor: color, weight, style, isFlag: flag }) : ''), [text, color, size, weight, style, flag])
  return <span style={{ width: size, height: size, display: 'inline-grid', placeItems: 'center', lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: html }} aria-hidden="true" />
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return <div className={styles.ctrlGroup}><div className={styles.fieldLabel}>{label}</div>{children}</div>
}

function Pager({ start, end, total, page, totalPages, onPrev, onNext }: { start: number; end: number; total: number; page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className={styles.pager}>
      <span className={styles.pagerLabel}>{start}–{end} of {total.toLocaleString()}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button type="button" className={styles.pagerBtn} onClick={onPrev} disabled={page === 0} aria-label="Previous page"><ChevronLeft size={16} /></button>
        <span className={styles.pagerLabel} style={{ minWidth: 70 }}>Page {page + 1} / {totalPages}</span>
        <button type="button" className={styles.pagerBtn} onClick={onNext} disabled={page >= totalPages - 1} aria-label="Next page"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}

export function IconLibraryStudio() {
  const [baseIcons, setBaseIcons] = useState<IconLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [activeChip, setActiveChip] = useState('All')
  const [sort, setSort] = useState<SortOrder>('name-asc')
  const [view, setView] = useState<ViewMode>('grid')
  const [page, setPage] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])

  const [multiSelect, setMultiSelect] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [iconStyle, setIconStyle] = useState<IconStyle>('framework')
  const [bgColor, setBgColor] = useState('transparent')
  const [bgOpacity, setBgOpacity] = useState(100)
  const [bgShape, setBgShape] = useState<BgShape>('none')
  const [gradient, setGradient] = useState<LibraryGradient | null>(null)
  const [iconWeight, setIconWeight] = useState<IconWeight>('regular')
  const [iconSize, setIconSize] = useState(28)
  const [iconPadding, setIconPadding] = useState(10)

  const [copied, setCopied] = useState<string | null>(null)
  const [exporting, setExporting] = useState<string | null>(null)

  const selectedIconId = useThemeStore((s) => s.selectedIconId)
  const selectedIconColor = useThemeStore((s) => s.selectedIconColor)
  const recentIds = useThemeStore((s) => s.recentIcons)
  const setSelectedIcon = useThemeStore((s) => s.setSelectedIcon)
  const setSelectedIconColor = useThemeStore((s) => s.setSelectedIconColor)
  const themePrimary = useThemeStore((s) => s.primary)

  const iconColor = selectedIconColor
  const setIconColorAll = useCallback((v: string) => setSelectedIconColor(v), [setSelectedIconColor])

  // Monochrome library + generated country flags merged into one searchable set.
  const icons = useMemo(() => [...baseIcons, ...getFlagIcons()], [baseIcons])

  useEffect(() => {
    let active = true
    loadGeneratedIconLibrary()
      .then((loaded) => { if (active) { setBaseIcons(loaded); setLoadError(null) } })
      .catch(() => { if (active) setLoadError('Unable to load icon metadata. Run npm run generate:icons and refresh.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      try { const raw = localStorage.getItem(FAVORITES_KEY); if (raw) setFavorites(JSON.parse(raw) as string[]) } catch { /* ignore */ }
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const byId = useMemo(() => new Map(icons.map((i) => [i.id, i])), [icons])
  const recentItems = useMemo(() => recentIds.map((id) => byId.get(id)).filter((x): x is IconLibraryItem => Boolean(x)), [recentIds, byId])
  const favoriteItems = useMemo(() => favorites.map((id) => byId.get(id)).filter((x): x is IconLibraryItem => Boolean(x)), [favorites, byId])

  const scope = activeChip === 'Favorites' ? 'favorites' : activeChip === 'Recently Used' ? 'recent' : 'all'
  const scopeSource = scope === 'recent' ? recentItems : scope === 'favorites' ? favoriteItems : icons

  const filtered = useMemo(() => {
    const categoryFilter: IconLibraryCategoryFilter = isIconLibraryCategory(activeChip) ? activeChip : 'All'
    let result = searchIcons(scopeSource, query, categoryFilter)
    if (sort === 'name-asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    else if (sort === 'name-desc') result = [...result].sort((a, b) => b.name.localeCompare(a.name))
    else if (sort === 'category') result = [...result].sort((a, b) => (a.primaryCategory ?? a.category).localeCompare(b.primaryCategory ?? b.category) || a.name.localeCompare(b.name))
    return result
  }, [scopeSource, query, activeChip, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageIcons = useMemo(() => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE), [filtered, safePage])
  const start = filtered.length ? safePage * PAGE_SIZE + 1 : 0
  const end = Math.min(filtered.length, (safePage + 1) * PAGE_SIZE)
  const goPrev = () => setPage((p) => Math.max(0, p - 1))
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1))

  const selectedIcon = findIconById(icons, selectedIconId) ?? findIconById(icons, 'tabler-chart-bar') ?? filtered[0]
  const relativeUrl = selectedIcon?.url ?? '/icon-library/tabler/chart-bar.svg'
  const fullUrl = typeof window === 'undefined' || relativeUrl.startsWith('data:') ? relativeUrl : `${window.location.origin}${relativeUrl}`
  const selectedCount = selectedIds.length
  const fullIconUrl = useCallback((url: string) => (
    typeof window === 'undefined' || url.startsWith('data:') ? url : `${window.location.origin}${url}`
  ), [])

  const flash = useCallback((key: string) => { setCopied(key); window.setTimeout(() => setCopied(null), 1700) }, [])
  const copyText = useCallback(async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text) } catch {
      try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) } catch { /* ignore */ }
    }
    flash(key)
  }, [flash])

  const sheetOptions = useCallback((isFlag: boolean): SheetOptions => ({
    iconColor: sanitizeHex(iconColor),
    weight: iconWeight,
    style: iconStyle,
    isFlag,
    bgFill: bgShape === 'none' ? 'transparent' : gradient ? gradient.solid : rgbaFromHex(bgColor, bgOpacity),
    bgShape,
    padding: Math.round(iconPadding * (256 / 72)),
    gradient,
  }), [iconColor, iconWeight, iconStyle, bgShape, gradient, bgColor, bgOpacity, iconPadding])

  const fetchText = useCallback(async (url: string) => {
    const cached = SVG_CACHE.get(url)
    if (cached) return cached
    try { const r = await fetch(url); const t = r.ok ? await r.text() : ''; if (t) SVG_CACHE.set(url, t); return t } catch { return '' }
  }, [])

  const downloadIconSvg = useCallback(async (icon: IconLibraryItem) => {
    const text = await fetchText(icon.url)
    if (text) downloadBlob(`${slug(icon.name)}.svg`, new Blob([buildSingleSvg(text, 256, sheetOptions(isFlagIcon(icon.id)))], { type: 'image/svg+xml' }))
  }, [fetchText, sheetOptions])

  const downloadIconPng = useCallback(async (icon: IconLibraryItem) => {
    const text = await fetchText(icon.url)
    if (!text) return
    const bytes = await svgToPngBytes(buildSingleSvg(text, 256, sheetOptions(isFlagIcon(icon.id))), 256)
    if (bytes) downloadBlob(`${slug(icon.name)}.png`, new Blob([bytes as unknown as BlobPart], { type: 'image/png' }))
  }, [fetchText, sheetOptions])

  const exportSvgZip = useCallback(async (list: IconLibraryItem[], filename: string) => {
    const entries: ZipEntry[] = []
    for (const icon of list) {
      const text = await fetchText(icon.url)
      if (text) entries.push({ name: `${slug(icon.name)}.svg`, data: strToBytes(buildSingleSvg(text, 256, sheetOptions(isFlagIcon(icon.id)))) })
    }
    if (entries.length) downloadBlob(filename, createZip(entries))
  }, [fetchText, sheetOptions])

  const exportPngZip = useCallback(async (list: IconLibraryItem[], filename: string) => {
    const entries: ZipEntry[] = []
    for (const icon of list) {
      const text = await fetchText(icon.url)
      if (!text) continue
      const bytes = await svgToPngBytes(buildSingleSvg(text, 256, sheetOptions(isFlagIcon(icon.id))), 256)
      if (bytes) entries.push({ name: `${slug(icon.name)}.png`, data: bytes })
    }
    if (entries.length) downloadBlob(filename, createZip(entries))
  }, [fetchText, sheetOptions])

  const selectedExportList = useCallback(() => (
    multiSelect && selectedCount > 0
      ? selectedIds.map((id) => byId.get(id)).filter((x): x is IconLibraryItem => Boolean(x))
      : selectedIcon ? [selectedIcon] : []
  ), [multiSelect, selectedCount, selectedIds, byId, selectedIcon])

  const handleDownloadSvg = useCallback(async () => {
    if (exporting) return
    setExporting('svg')
    try {
      const list = selectedExportList()
      if (list.length === 1) { await downloadIconSvg(list[0]); return }
      await exportSvgZip(list, 'datacense-selected-icons-svg.zip')
    } finally { setExporting(null) }
  }, [exporting, selectedExportList, downloadIconSvg, exportSvgZip])

  const handleDownloadPng = useCallback(async () => {
    if (exporting) return
    setExporting('png')
    try {
      const list = selectedExportList()
      if (list.length === 1) { await downloadIconPng(list[0]); return }
      await exportPngZip(list, 'datacense-selected-icons-png.zip')
    } finally { setExporting(null) }
  }, [exporting, selectedExportList, downloadIconPng, exportPngZip])

  const handleDownloadCategorySvg = useCallback(async () => {
    if (exporting || filtered.length === 0) return
    setExporting('category-svg')
    try { await exportSvgZip(filtered, `datacense-${slug(activeChip)}-svg.zip`) }
    finally { setExporting(null) }
  }, [exporting, filtered, activeChip, exportSvgZip])

  const handleDownloadCategoryPng = useCallback(async () => {
    if (exporting || filtered.length === 0) return
    setExporting('category-png')
    try { await exportPngZip(filtered, `datacense-${slug(activeChip)}-png.zip`) }
    finally { setExporting(null) }
  }, [exporting, filtered, activeChip, exportPngZip])

  const copySelectedSvg = useCallback(async () => {
    if (!selectedIcon) return
    const text = await fetchText(selectedIcon.url)
    if (text) await copyText(buildSingleSvg(text, 256, sheetOptions(isFlagIcon(selectedIcon.id))), 'svg')
  }, [selectedIcon, fetchText, sheetOptions, copyText])

  const copyUrls = useCallback((relative: boolean) => {
    if (multiSelect && selectedCount > 0) {
      const urls = selectedIds.map((id) => byId.get(id)).filter((x): x is IconLibraryItem => Boolean(x)).map((i) => (relative ? i.url : fullIconUrl(i.url)))
      void copyText(urls.join('\n'), relative ? 'rel' : 'url')
    } else {
      void copyText(relative ? relativeUrl : fullUrl, relative ? 'rel' : 'url')
    }
  }, [multiSelect, selectedCount, selectedIds, byId, fullIconUrl, relativeUrl, fullUrl, copyText])

  const selectAllVisible = useCallback(() => {
    if (!multiSelect) setMultiSelect(true)
    setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIcons.map((i) => i.id)])))
  }, [multiSelect, pageIcons])
  const selectCurrentCategory = useCallback(() => {
    if (!multiSelect) setMultiSelect(true)
    setSelectedIds(filtered.map((i) => i.id))
  }, [multiSelect, filtered])
  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const resetCustomization = useCallback(() => {
    setIconStyle('framework'); setBgColor('transparent'); setBgOpacity(100); setBgShape('none'); setGradient(null); setIconWeight('regular'); setIconSize(28); setIconPadding(10)
  }, [])

  const onIconClick = useCallback((icon: IconLibraryItem) => {
    if (multiSelect) setSelectedIds((prev) => (prev.includes(icon.id) ? prev.filter((x) => x !== icon.id) : [...prev, icon.id]))
    setSelectedIcon(icon)
  }, [multiSelect, setSelectedIcon])

  const iconBgStyle = useMemo(() => {
    const background = gradient ? gradient.css : bgShape === 'none' ? 'transparent' : rgbaFromHex(bgColor, bgOpacity)
    const padX = bgShape === 'capsule' ? iconPadding + 8 : iconPadding
    return { background, borderRadius: shapeRadiusCss(bgShape), padding: `${iconPadding}px ${padX}px` }
  }, [gradient, bgShape, bgColor, bgOpacity, iconPadding])

  const gridIconSize = Math.max(16, Math.min(iconSize, 40))

  const iconCell = (icon: IconLibraryItem, size: number) => (
    <span className={styles.iconBg} style={iconBgStyle}>
      {isFlagIcon(icon.id)
        ? // eslint-disable-next-line @next/next/no-img-element
          <img src={icon.url} width={size} height={size} alt={icon.name} style={{ objectFit: 'contain', display: 'block' }} />
        : <InlineStyledIcon url={icon.url} color={iconColor} size={size} weight={iconWeight} style={iconStyle} flag={false} />}
    </span>
  )

  const isMarked = (id: string) => (multiSelect ? selectedIds.includes(id) : id === selectedIconId)

  return (
    <div className={styles.shell}>
      <header className="top-nav">
        <Link href="/" className="nav-brand" title="Back to home" style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/datacense-logo.jpg" alt="Datacense" style={{ height: 28, width: 'auto', borderRadius: 4, objectFit: 'contain', flexShrink: 0 }} />
          <div><div className="nav-title">Icon Studio</div><div className="nav-sub">Datacense</div></div>
        </Link>
        <div className="nav-divider" />
        <div style={{ flex: 1 }} />
        <div className="nav-actions">
          <Link className={`nav-btn ${styles.lift}`} href="/" title="Back to home"><Home size={13} strokeWidth={2} /> Home</Link>
          <Link className={`nav-btn accent ${styles.lift}`} href="/editor" title="Open Theme Builder"><Wand2 size={13} strokeWidth={2} /> Theme Builder</Link>
        </div>
      </header>

      <div className={styles.body}>
        {/* LEFT — customization */}
        <aside className={styles.left} aria-label="Icon customization">
          <p className={styles.groupLabel}>Customize</p>

          <ControlGroup label="Icon color">
            <div className={styles.swatchRow}>
              {ICON_COLOR_SWATCHES.map((c) => (
                <button key={c} type="button" className={`${styles.swatch} ${sanitizeHex(iconColor) === sanitizeHex(c) ? styles.swatchActive : ''}`} style={{ background: c }} onClick={() => setIconColorAll(c.toUpperCase())} title={c} aria-label={`Icon colour ${c}`} />
              ))}
            </div>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorSwatch} value={sanitizeHex(iconColor)} onChange={(e) => setIconColorAll(e.target.value.toUpperCase())} aria-label="Icon colour picker" />
              <input className={styles.hexInput} value={iconColor} onChange={(e) => setIconColorAll(e.target.value)} onBlur={(e) => setIconColorAll(sanitizeHex(e.currentTarget.value).toUpperCase())} aria-label="Icon hex colour" spellCheck={false} />
            </div>
          </ControlGroup>

          <ControlGroup label="Background color">
            <div className={styles.swatchRow}>
              {BG_COLOR_SWATCHES.map((c) => (
                <button key={c} type="button" className={`${styles.swatch} ${!gradient && bgColor === c ? styles.swatchActive : ''}`} style={{ background: c === 'transparent' ? CHECKER_BG : c }} onClick={() => { setGradient(null); setBgColor(c) }} title={c === 'transparent' ? 'Transparent' : c} aria-label={`Background colour ${c}`} />
              ))}
            </div>
            <div className={styles.colorRow}>
              <input type="color" className={styles.colorSwatch} value={bgColor === 'transparent' ? '#FFFFFF' : sanitizeHex(bgColor)} onChange={(e) => { setGradient(null); setBgColor(e.target.value.toUpperCase()) }} aria-label="Background colour picker" />
              <input className={styles.hexInput} value={bgColor} onChange={(e) => setBgColor(e.target.value)} onBlur={(e) => { const v = e.currentTarget.value.trim(); setBgColor(v.toLowerCase() === 'transparent' ? 'transparent' : sanitizeHex(v).toUpperCase()) }} aria-label="Background hex colour" spellCheck={false} />
            </div>
          </ControlGroup>

          {GRADIENT_OPTIONS.length > 0 && (
            <ControlGroup label="Gradient background">
              <div className={styles.gradRow}>
                <button type="button" className={`${styles.gradChip} ${!gradient ? styles.gradChipActive : ''}`} style={{ background: CHECKER_BG }} onClick={() => setGradient(null)} title="No gradient" aria-label="No gradient" />
                {GRADIENT_OPTIONS.map((g) => (
                  <button key={g.code} type="button" className={`${styles.gradChip} ${gradient?.code === g.code ? styles.gradChipActive : ''}`} style={{ background: g.css }} onClick={() => { setGradient(g); if (bgShape === 'none') setBgShape('rounded') }} title={g.name} aria-label={`Gradient ${g.name}`} />
                ))}
              </div>
            </ControlGroup>
          )}

          <ControlGroup label={`Background opacity — ${bgOpacity}%`}>
            <input type="range" min={0} max={100} value={bgOpacity} onChange={(e) => setBgOpacity(Number(e.target.value))} className={styles.slider} aria-label="Background opacity" />
          </ControlGroup>

          <ControlGroup label="Background shape">
            <div className={styles.pillRow} role="group" aria-label="Background shape">
              {BG_SHAPES.map((s) => <button key={s.key} type="button" className={`${styles.pill} ${bgShape === s.key ? styles.pillActive : ''}`} onClick={() => setBgShape(s.key)} aria-pressed={bgShape === s.key}>{s.label}</button>)}
            </div>
          </ControlGroup>

          <ControlGroup label="Icon weight">
            <div className={styles.pillRow} role="group" aria-label="Icon weight">
              {ICON_WEIGHTS.map((w) => <button key={w.key} type="button" className={`${styles.pill} ${iconWeight === w.key ? styles.pillActive : ''}`} onClick={() => setIconWeight(w.key)} aria-pressed={iconWeight === w.key}>{w.label}</button>)}
            </div>
          </ControlGroup>

          <ControlGroup label={`Icon size — ${iconSize}px`}>
            <input type="range" min={16} max={48} value={iconSize} onChange={(e) => setIconSize(Number(e.target.value))} className={styles.slider} aria-label="Icon size" />
          </ControlGroup>

          <ControlGroup label={`Padding — ${iconPadding}px`}>
            <input type="range" min={0} max={24} value={iconPadding} onChange={(e) => setIconPadding(Number(e.target.value))} className={styles.slider} aria-label="Padding" />
          </ControlGroup>

          <button type="button" className={styles.resetBtn} onClick={resetCustomization}><RotateCcw size={14} strokeWidth={2} /> Reset customization</button>
        </aside>

        {/* CENTER — style + search + categories + grid */}
        <section className={styles.center} aria-label="Icon browser">
          <p className={styles.groupLabel}>Choose Style</p>
          <div className={styles.styleCards}>
            {STYLE_CARDS.map((s) => (
              <button key={s.key} type="button" className={`${styles.styleCard} ${iconStyle === s.key ? styles.styleCardActive : ''}`} onClick={() => setIconStyle(s.key)} aria-pressed={iconStyle === s.key}>
                <span className={styles.styleCardName}>{s.label}</span>
                <span className={styles.styleCardHint}>{s.hint}</span>
              </button>
            ))}
          </div>

          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} strokeWidth={2} />
              <input type="search" className={styles.searchInput} value={query} onChange={(e) => { setQuery(e.target.value); setPage(0) }} placeholder="Search by name, category, tag, or country…" aria-label="Search icons" spellCheck={false} />
            </div>
            <button type="button" className={`${styles.toolBtn} ${multiSelect ? styles.toolBtnActive : ''}`} onClick={() => { setMultiSelect((m) => !m); setSelectedIds([]) }} aria-pressed={multiSelect} title="Toggle multi-select"><CheckCheck size={15} strokeWidth={2} /> Multi</button>
            <select className={styles.sortSelect} value={sort} onChange={(e) => { setSort(e.target.value as SortOrder); setPage(0) }} aria-label="Sort icons">
              <option value="name-asc">A–Z</option><option value="name-desc">Z–A</option><option value="category">Category</option>
            </select>
            <button type="button" className={styles.exportBtn} disabled={!!exporting || filtered.length === 0} onClick={handleDownloadCategorySvg}><Download size={14} /> Category SVG ZIP</button>
            <button type="button" className={styles.exportBtn} disabled={!!exporting || filtered.length === 0} onClick={handleDownloadCategoryPng}><ImageIcon size={14} /> Category PNG ZIP</button>
            <div className={styles.viewToggle} role="group" aria-label="Layout">
              <button type="button" className={`${styles.viewBtn} ${view === 'grid' ? styles.viewBtnActive : ''}`} onClick={() => setView('grid')} aria-label="Grid view" aria-pressed={view === 'grid'}><LayoutGrid size={17} strokeWidth={2} /></button>
              <button type="button" className={`${styles.viewBtn} ${view === 'list' ? styles.viewBtnActive : ''}`} onClick={() => setView('list')} aria-label="List view" aria-pressed={view === 'list'}><List size={17} strokeWidth={2} /></button>
            </div>
          </div>

          {multiSelect && (
            <div className={styles.multiBar}>
              <button type="button" className={styles.miniBtn} onClick={selectAllVisible}><CheckCheck size={13} /> Select Visible Icons</button>
              <button type="button" className={styles.miniBtn} onClick={selectCurrentCategory}><CheckCheck size={13} /> Select All in Current Category</button>
              <button type="button" className={styles.miniBtn} onClick={clearSelection}><X size={13} /> Clear Selection</button>
              <span className={styles.multiCount}>{selectedCount} selected</span>
            </div>
          )}

          <div className={styles.catChips} role="group" aria-label="Categories">
            {ALL_CHIPS.map((label) => (
              <button key={label} type="button" className={`${styles.chip} ${activeChip === label ? styles.chipActive : ''}`} onClick={() => { setActiveChip(label); setPage(0) }} aria-pressed={activeChip === label}>{label}</button>
            ))}
          </div>

          <div className={styles.sectionTitle}>
            {activeChip}
            <span className={styles.muted}>{loading ? 'loading…' : `${filtered.length.toLocaleString()} of ${(icons.length || ICON_LIBRARY_COUNT).toLocaleString()}`}</span>
          </div>

          {!loading && !loadError && filtered.length > 0 && (
            <Pager start={start} end={end} total={filtered.length} page={safePage} totalPages={totalPages} onPrev={goPrev} onNext={goNext} />
          )}

          {loading ? (
            <div className={styles.empty}>Loading Icon Studio assets…</div>
          ) : loadError ? (
            <div className={styles.empty}>{loadError}</div>
          ) : pageIcons.length === 0 ? (
            <div className={styles.empty}>No icons match these filters.</div>
          ) : view === 'grid' ? (
            <div className={styles.grid}>
              {pageIcons.map((icon) => {
                const marked = isMarked(icon.id)
                const fav = favorites.includes(icon.id)
                return (
                  <div key={icon.id} className={`${styles.cardWrap} ${marked ? styles.cardSelected : ''}`}>
                    <button type="button" className={styles.cardSelectBtn} onClick={() => onIconClick(icon)} title={icon.name} aria-label={`Select ${icon.name}`} aria-pressed={marked}>
                      {iconCell(icon, gridIconSize)}
                      <span className={styles.cardName}>{icon.name}</span>
                    </button>
                    <button type="button" className={`${styles.favBtn} ${fav ? styles.favBtnActive : ''}`} onClick={() => toggleFavorite(icon.id)} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={fav}><Star size={13} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} /></button>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className={styles.list}>
              {pageIcons.map((icon) => {
                const marked = isMarked(icon.id)
                const fav = favorites.includes(icon.id)
                return (
                  <div key={icon.id} className={`${styles.listRow} ${marked ? styles.cardSelected : ''}`}>
                    <button type="button" className={styles.listSelectBtn} onClick={() => onIconClick(icon)} aria-label={`Select ${icon.name}`} aria-pressed={marked}>
                      {iconCell(icon, 22)}
                      <span style={{ minWidth: 0 }}><span className={styles.listName} style={{ display: 'block' }}>{icon.name}</span><span className={styles.listMeta}>{icon.primaryCategory ?? icon.category}</span></span>
                    </button>
                    <button type="button" className={`${styles.favBtn} ${fav ? styles.favBtnActive : ''}`} style={{ position: 'static', opacity: 1 }} onClick={() => toggleFavorite(icon.id)} aria-label={fav ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={fav}><Star size={14} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} /></button>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && !loadError && totalPages > 1 && (
            <Pager start={start} end={end} total={filtered.length} page={safePage} totalPages={totalPages} onPrev={goPrev} onNext={goNext} />
          )}
        </section>

        {/* RIGHT — preview + context + export */}
        <aside className={styles.right} aria-label="Selected icon preview">
          <div className={styles.inspector}>
            <div className={styles.inspectorScroll}>
              <div className={styles.inspectorHeader}>
                <span className={styles.inspectorEyebrow}>{multiSelect && selectedCount > 0 ? `${selectedCount} Selected` : 'Selected Icon'}</span>
                {selectedIcon && (
                  <button type="button" className={`${styles.favToggle} ${favorites.includes(selectedIcon.id) ? styles.favToggleActive : ''}`} onClick={() => toggleFavorite(selectedIcon.id)} aria-label="Toggle favorite" aria-pressed={favorites.includes(selectedIcon.id)}>
                    <Star size={13} strokeWidth={2} fill={favorites.includes(selectedIcon.id) ? 'currentColor' : 'none'} />{favorites.includes(selectedIcon.id) ? 'Favorited' : 'Favorite'}
                  </button>
                )}
              </div>

              <div className={styles.previewBox}>
                <span className={styles.iconBg} style={iconBgStyle}>
                  {selectedIcon && isFlagIcon(selectedIcon.id)
                    ? // eslint-disable-next-line @next/next/no-img-element
                      <img src={relativeUrl} width={Math.max(48, iconSize * 2.2)} height={Math.max(48, iconSize * 2.2)} alt={selectedIcon.name} style={{ objectFit: 'contain' }} />
                    : <InlineStyledIcon url={relativeUrl} color={iconColor} size={Math.max(44, iconSize * 2.4)} weight={iconWeight} style={iconStyle} flag={false} />}
                </span>
              </div>

              <div>
                <h2 className={styles.previewName}>{selectedIcon?.name ?? 'Chart Bar'}</h2>
                <p className={styles.previewMeta}>{STYLE_CARDS.find((s) => s.key === iconStyle)?.label} · {ICON_WEIGHTS.find((w) => w.key === iconWeight)?.label} · {iconSize}px</p>
              </div>

              <div>
                <div className={styles.fieldLabel}>Preview in Context</div>
                <div className={styles.contextStack}>
                  <div className={styles.kpiCard}>
                    <span className={styles.iconBg} style={iconBgStyle}>{selectedIcon && isFlagIcon(selectedIcon.id) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={relativeUrl} width={20} height={20} alt="" /> : <InlineStyledIcon url={relativeUrl} color={iconColor} size={20} weight={iconWeight} style={iconStyle} flag={false} />}</span>
                    <div style={{ minWidth: 0 }}><div className={styles.kpiValue}>$1.24M</div><div className={styles.kpiLabel}>Total Revenue</div></div>
                    <div className={styles.kpiDelta}>▲ 12.4%</div>
                  </div>
                  <div className={styles.kpiTile} style={{ background: sanitizeHex(themePrimary || '#2563EB') }}>
                    <span className={styles.iconBg} style={{ ...iconBgStyle, background: bgShape === 'none' && !gradient ? 'rgba(255,255,255,.18)' : iconBgStyle.background }}>{selectedIcon && isFlagIcon(selectedIcon.id) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={relativeUrl} width={20} height={20} alt="" /> : <InlineStyledIcon url={relativeUrl} color={bgShape === 'none' && !gradient ? '#FFFFFF' : iconColor} size={20} weight={iconWeight} style={iconStyle} flag={false} />}</span>
                    <div style={{ minWidth: 0 }}><div className={styles.tileValue}>847</div><div className={styles.tileLabel}>Active Users</div></div>
                  </div>
                  <div className={styles.sidebarItem}>
                    <span className={styles.iconBg} style={iconBgStyle}>{selectedIcon && isFlagIcon(selectedIcon.id) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={relativeUrl} width={16} height={16} alt="" /> : <InlineStyledIcon url={relativeUrl} color={iconColor} size={16} weight={iconWeight} style={iconStyle} flag={false} />}</span>
                    <span className={styles.sidebarText}>{selectedIcon?.name ?? 'Dashboard'}</span>
                  </div>
                </div>
              </div>

              {selectedIcon?.tags?.length ? (
                <div><div className={styles.fieldLabel}>Tags</div><div className={styles.tagWrap}>{selectedIcon.tags.slice(0, 14).map((tag) => <span key={tag} className={styles.tag}>{tag}</span>)}</div></div>
              ) : null}
            </div>

            <div className={styles.inspectorActions}>
              {multiSelect && selectedCount > 0 && <div className={styles.urlBox}>{selectedCount} icon{selectedCount === 1 ? '' : 's'} selected</div>}
              <div className={styles.actionRow}>
                <button type="button" className={`${styles.copyBtn} ${styles.copyBtnPrimary}`} disabled={!!exporting} onClick={handleDownloadSvg}><Download size={15} /> {exporting === 'svg' ? '…' : multiSelect && selectedCount > 1 ? 'SVG .zip' : 'SVG'}</button>
                <button type="button" className={styles.copyBtn} disabled={!!exporting} onClick={handleDownloadPng}><ImageIcon size={15} /> {exporting === 'png' ? '…' : multiSelect && selectedCount > 1 ? 'PNG .zip' : 'PNG'}</button>
              </div>
              <div className={styles.actionRow}>
                <button type="button" className={`${styles.copyBtn} ${copied === 'svg' ? styles.copyBtnDone : ''}`} onClick={copySelectedSvg}>{copied === 'svg' ? <Check size={15} /> : <FileCode size={15} />} {copied === 'svg' ? 'Copied' : 'Copy SVG'}</button>
                <button type="button" className={`${styles.copyBtn} ${copied === 'url' ? styles.copyBtnDone : ''}`} onClick={() => copyUrls(false)}>{copied === 'url' ? <Check size={15} /> : <Copy size={15} />} {copied === 'url' ? 'Copied' : multiSelect && selectedCount > 1 ? 'Copy URL List' : 'Copy URL'}</button>
              </div>
              <button type="button" className={`${styles.copyBtn} ${copied === 'rel' ? styles.copyBtnDone : ''}`} onClick={() => copyUrls(true)}>{copied === 'rel' ? <Check size={15} /> : <Link2 size={15} />} {copied === 'rel' ? 'Copied!' : multiSelect && selectedCount > 1 ? 'Copy Relative URL List' : 'Copy Relative URL'}</button>
              <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{copied ? 'Copied' : ''}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
