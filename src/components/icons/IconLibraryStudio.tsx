'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowUpRight, Check, CheckCheck, ChevronLeft, ChevronRight, Copy, Download,
  Home, Image as ImageIcon, LayoutGrid, List, RotateCcw, Search, Shuffle, Star, Wand2, X,
} from 'lucide-react'
import type { IconLibraryItem } from '@/types'
import type { IconLibraryCategoryFilter } from '@/lib/iconLibrary'
import { findIconById, ICON_LIBRARY_CATEGORIES, ICON_LIBRARY_COUNT, isIconLibraryCategory, loadGeneratedIconLibrary, searchIcons } from '@/lib/iconLibrary'
import { isFlagIcon } from '@/lib/flagLibrary'
import { GRADIENT_LIBRARY, type LibraryGradient } from '@/lib/datacenseLibrary'
import { createZip, strToBytes, type ZipEntry } from '@/lib/zipWriter'
import { sanitizeHex } from '@/lib/colorUtils'
import {
  buildSingleSvg, hasOriginalMulticolor, rgbaFromHex, shapeRadiusCss, styleSvg,
  type BgShape, type IconColorMode, type IconStyle, type IconWeight, type SheetOptions,
} from '@/lib/iconRenderer'
import { getIconDetails } from '@/lib/icon-library/adapter'
import { getContrastRatio } from '@/lib/colorUtils'
import { computePageCount } from '@/lib/iconPbitExporter'
import { useThemeStore } from '@/store/themeStore'
import { useIntegrationWorkspaceStore, type IconCustomization } from '@/store/integrationWorkspaceStore'
import styles from './IconLibraryStudio.module.css'

const PAGE_SIZE = 48
const FAVORITES_KEY = 'dc-icon-favorites'

type SortOrder = 'name-asc' | 'name-desc' | 'category'
type ViewMode = 'grid' | 'list'
type BackgroundMode = 'solid' | 'gradient' | 'none'

const DEFAULT_ICON_COLOR = '#0D9488'
/** Permanent professional geometry for normal business icons — the former
 *  Choose Style control was removed; Precision is the only rendered style. */
const ICON_STYLE: IconStyle = 'precision'
const DEFAULT_BG_MODE: BackgroundMode = 'none'
const DEFAULT_BG_COLOR = '#FFFFFF'
const DEFAULT_BG_OPACITY = 100
const DEFAULT_BG_SHAPE: BgShape = 'rounded'
const DEFAULT_WEIGHT: IconWeight = 'regular'
const DEFAULT_SIZE = 28
const DEFAULT_PADDING = 10

/**
 * Power BI template (.pbit) export is held in VALIDATION mode: the exporter
 * was migrated to the same adm-zip + genuine-visual-cloning methodology as
 * the (confirmed working) Layout Builder PBIT export — see
 * src/lib/icon-studio/server/iconPbitService.ts — but a generated,
 * non-identical icon-library template has not yet been manually confirmed to
 * open in Power BI Desktop. Until then the button is hidden in production and
 * shown only in development as a clearly-labelled diagnostic action, so
 * normal users are never handed a possibly-corrupt file. SVG/PNG export is
 * unaffected. Flip PBIT_EXPORT_VALIDATED to true once a generated file opens
 * successfully.
 */
const PBIT_EXPORT_VALIDATED = false
const PBIT_EXPORT_DEV_ONLY = process.env.NODE_ENV !== 'production'
const PBIT_EXPORT_VISIBLE = PBIT_EXPORT_VALIDATED || PBIT_EXPORT_DEV_ONLY

const BG_SHAPES: { key: BgShape; label: string }[] = [
  { key: 'none', label: 'None' }, { key: 'softtile', label: 'Soft Tile' }, { key: 'rounded', label: 'Rounded' },
  { key: 'capsule', label: 'Capsule' }, { key: 'circle', label: 'Circle' },
]
const ICON_WEIGHTS: { key: IconWeight; label: string }[] = [
  { key: 'thin', label: 'Thin' }, { key: 'regular', label: 'Regular' }, { key: 'medium', label: 'Medium' }, { key: 'bold', label: 'Bold' },
]
const COLOR_MODES: { key: IconColorMode; label: string }[] = [
  { key: 'mono', label: 'Monochrome' }, { key: 'multicolor', label: 'Multicolor' },
]
const COLOR_MODE_NAMES: Record<IconColorMode, string> = { mono: 'Monochrome', multicolor: 'Original Multicolor' }
const ICON_COLOR_SWATCHES = ['#0F172A', '#334155', '#2563EB', '#0EA5E9', '#0D9488', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#CA8A04', '#16A34A', '#FFFFFF']

/** Curated, dashboard-friendly Random Color palette — mid-tone members of the
 *  blue/teal/green/purple/indigo/orange/red/gold/charcoal families. No pure
 *  pastels (invisible on white) and no near-blacks (invisible on dark). */
const RANDOM_COLOR_PALETTE = [
  '#1D4ED8', '#2563EB', '#0369A1', // blue
  '#0D9488', '#0F766E',            // teal
  '#16A34A', '#15803D',            // green
  '#7C3AED', '#9333EA',            // purple
  '#4F46E5', '#4338CA',            // indigo
  '#EA580C', '#C2410C',            // orange
  '#DC2626', '#B91C1C',            // red
  '#CA8A04', '#B45309',            // gold
  '#334155', '#475569',            // charcoal
]
const BG_COLOR_SWATCHES = ['transparent', '#FFFFFF', '#F1F5F9', '#E2E8F0', '#0F172A', '#1E293B', '#2563EB', '#0EA5E9', '#DBEAFE', '#E0F2FE', '#FCE7F3', '#FEF3C7']
const CHECKER_BG = 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 14px 14px'
const GRADIENT_OPTIONS: LibraryGradient[] = GRADIENT_LIBRARY.slice(0, 24)

/* ── Category chips: scope chips + keyword-predicate chips ── */
const SCOPE_CHIPS = ['All', 'Favorites', 'Recently Used'] as const
const CATEGORY_CHIPS = ICON_LIBRARY_CATEGORIES.filter((c) => c !== 'All')
const ALL_CHIPS: string[] = [...SCOPE_CHIPS, ...CATEGORY_CHIPS]

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
  const [text, setText] = useState<string | null>(() => (url ? SVG_CACHE.get(url) ?? null : null))
  useEffect(() => {
    let active = true
    if (!url) { setText(null); return () => { active = false } }
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

function InlineStyledIcon({ url, color, size, weight, style, flag, colorMode }: {
  url: string; color: string; size: number; weight: IconWeight; style: IconStyle; flag: boolean
  colorMode?: IconColorMode
}) {
  const text = useInlineSvg(url)
  const html = useMemo(
    () => (text ? styleSvg(text, size, { iconColor: color, weight, style, isFlag: flag, colorMode }) : ''),
    [text, color, size, weight, style, flag, colorMode],
  )
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

  // Permanent Precision geometry — no user style selection.
  const iconStyle = ICON_STYLE
  // Default = Multicolor: icons with a reference multicolor variant open in
  // their original designed colors; icons without one fall back to mono.
  const [colorMode, setColorMode] = useState<IconColorMode>('multicolor')
  const [variantsOpen, setVariantsOpen] = useState(false)
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>(DEFAULT_BG_MODE)
  const [solidBackgroundColor, setSolidBackgroundColor] = useState(DEFAULT_BG_COLOR)
  const [bgOpacity, setBgOpacity] = useState(DEFAULT_BG_OPACITY)
  const [bgShape, setBgShape] = useState<BgShape>(DEFAULT_BG_SHAPE)
  const [selectedGradient, setSelectedGradient] = useState<LibraryGradient | null>(null)
  const [iconWeight, setIconWeight] = useState<IconWeight>(DEFAULT_WEIGHT)
  const [iconSize, setIconSize] = useState(DEFAULT_SIZE)
  const [iconPadding, setIconPadding] = useState(DEFAULT_PADDING)

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

  // ── Cross-module integration (Layout Builder handoff) ──
  // NOTE: the former ?applyTheme=1 theme-to-icon recoloring flow was removed
  // (final color-mode decision) — themes never overwrite icon colors.
  const router = useRouter()
  const [returnTo, setReturnTo] = useState<string | null>(null)
  const setIconBundle = useIntegrationWorkspaceStore((s) => s.setIconBundle)
  const setIntegrationSourceModule = useIntegrationWorkspaceStore((s) => s.setSourceModule)
  const setIntegrationReturnRoute = useIntegrationWorkspaceStore((s) => s.setReturnRoute)

  // Read query params on the client only — avoids the Next.js requirement to
  // wrap useSearchParams() in a Suspense boundary for this otherwise-static page.
  useEffect(() => {
    if (typeof window === 'undefined') return
    setReturnTo(new URLSearchParams(window.location.search).get('returnTo'))
  }, [])

  // Production gallery: the loader already contains business icons + flags.
  const icons = baseIcons

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

  // Migration (library switch, 2026-07): favorites may contain ids from the
  // removed legacy library (tabler-*/custom-*). Once the production registry
  // is loaded, silently drop ids that no longer resolve — flags and curated
  // business icons survive; removed icons are not recreated.
  useEffect(() => {
    if (icons.length === 0 || favorites.length === 0) return
    const valid = new Set(icons.map((i) => i.id))
    const cleaned = favorites.filter((id) => valid.has(id))
    if (cleaned.length !== favorites.length) {
      setFavorites(cleaned)
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(cleaned)) } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [icons, favorites.length])

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

  const selectedIcon = findIconById(icons, selectedIconId) ?? findIconById(icons, 'v2-bar-chart') ?? filtered[0]
  const relativeUrl = selectedIcon?.url ?? ''
  const selectedCount = selectedIds.length

  const flash = useCallback((key: string) => { setCopied(key); window.setTimeout(() => setCopied(null), 1700) }, [])
  const copyText = useCallback(async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text) } catch {
      try { const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta) } catch { /* ignore */ }
    }
    flash(key)
  }, [flash])

  const activateBackgroundMode = useCallback((mode: BackgroundMode) => {
    setBackgroundMode(mode)
    if (mode !== 'none' && bgShape === 'none') setBgShape('rounded')
  }, [bgShape])

  const sheetOptions = useCallback((isFlag: boolean): SheetOptions => ({
    iconColor: sanitizeHex(iconColor),
    weight: iconWeight,
    style: iconStyle,
    isFlag,
    // 'multicolor' renders the ORIGINAL reference geometry (per icon; icons
    // without a reference multicolor variant fall back to mono inside the
    // renderer) — exports therefore always match the preview.
    colorMode,
    bgFill: backgroundMode === 'solid' ? rgbaFromHex(solidBackgroundColor, bgOpacity) : 'transparent',
    bgShape: backgroundMode === 'none' ? 'none' : bgShape,
    padding: Math.round(iconPadding * (256 / 72)),
    gradient: backgroundMode === 'gradient' ? selectedGradient : null,
  }), [iconColor, iconWeight, iconStyle, colorMode, backgroundMode, solidBackgroundColor, bgOpacity, bgShape, iconPadding, selectedGradient])

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

  const handleExportPbit = useCallback(async () => {
    if (exporting) return
    const list = selectedExportList()
    if (list.length === 0) return
    setExporting('pbit')
    try {
      const renderedIcons = (await Promise.all(list.map(async (icon) => {
        const svgText = await fetchText(icon.url)
        if (!svgText) return null
        const svg = buildSingleSvg(svgText, 256, sheetOptions(isFlagIcon(icon.id)))
        return { id: icon.id, name: icon.name, svg }
      }))).filter((x): x is { id: string; name: string; svg: string } => Boolean(x))
      if (renderedIcons.length === 0) return

      const res = await fetch('/api/icon-studio/export/pbit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ icons: renderedIcons }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || 'Could not export the Power BI template.')
      }
      const blob = await res.blob()
      const disposition = res.headers.get('Content-Disposition') || ''
      const filenameMatch = /filename="([^"]+)"/.exec(disposition)
      downloadBlob(filenameMatch?.[1] || 'datacense-icon-library.pbit', blob)
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not export the Power BI template.')
    } finally {
      setExporting(null)
    }
  }, [exporting, selectedExportList, fetchText, sheetOptions])

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

  /**
   * Copy URL — a REAL absolute URL to the public render endpoint
   * (/api/icons/render/[iconId].svg) carrying the current customization as
   * safe query parameters. Opening it in a browser returns the rendered SVG.
   * Multicolor icons and flags keep their fixed colors (the endpoint ignores
   * recoloring parameters for them).
   */
  const renderIconUrl = useCallback((icon: IconLibraryItem): string => {
    const url = new URL(`/api/icons/render/${encodeURIComponent(icon.id)}.svg`, window.location.origin)
    const flag = isFlagIcon(icon.id)
    if (!flag && !icon.fixedColors) {
      url.searchParams.set('mode', colorMode)
      if (colorMode === 'mono') {
        url.searchParams.set('color', sanitizeHex(iconColor))
        url.searchParams.set('weight', iconWeight)
      }
    }
    if (backgroundMode === 'solid' && solidBackgroundColor !== 'transparent') {
      url.searchParams.set('bg', 'solid')
      url.searchParams.set('bgColor', sanitizeHex(solidBackgroundColor))
      url.searchParams.set('bgOpacity', String(bgOpacity))
      url.searchParams.set('shape', bgShape)
    }
    if (iconPadding !== DEFAULT_PADDING) url.searchParams.set('padding', String(iconPadding))
    return url.toString()
  }, [colorMode, iconColor, iconWeight, backgroundMode, solidBackgroundColor, bgOpacity, bgShape, iconPadding])

  const copyUrls = useCallback(() => {
    if (multiSelect && selectedCount > 0) {
      const urls = selectedIds.map((id) => byId.get(id)).filter((x): x is IconLibraryItem => Boolean(x)).map(renderIconUrl)
      void copyText(urls.join('\n'), 'url')
    } else if (selectedIcon) {
      void copyText(renderIconUrl(selectedIcon), 'url')
    }
  }, [multiSelect, selectedCount, selectedIds, byId, renderIconUrl, selectedIcon, copyText])

  const pbitExportCount = multiSelect && selectedCount > 0 ? selectedCount : selectedIcon ? 1 : 0
  const pbitPageCount = pbitExportCount > 0 ? computePageCount(pbitExportCount) : 0

  const selectAllVisible = useCallback(() => {
    if (!multiSelect) setMultiSelect(true)
    setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIcons.map((i) => i.id)])))
  }, [multiSelect, pageIcons])
  const selectCurrentCategory = useCallback(() => {
    if (!multiSelect) setMultiSelect(true)
    setSelectedIds(filtered.map((i) => i.id))
  }, [multiSelect, filtered])
  const clearSelection = useCallback(() => setSelectedIds([]), [])

  /**
   * Reset: restores default color/size/padding/background/shape/opacity/
   * weight/style while PRESERVING the selected icon. In Multicolor mode this
   * is "Reset to Original" — the reference multicolor geometry is re-rendered
   * from the registry source (it is never mutated, so restoring presentation
   * defaults is sufficient to show the exact original).
   */
  const resetCustomization = useCallback(() => {
    setBackgroundMode(DEFAULT_BG_MODE); setSolidBackgroundColor(DEFAULT_BG_COLOR); setBgOpacity(DEFAULT_BG_OPACITY); setBgShape(DEFAULT_BG_SHAPE); setSelectedGradient(null); setIconWeight(DEFAULT_WEIGHT); setIconSize(DEFAULT_SIZE); setIconPadding(DEFAULT_PADDING)
    setIconColorAll(DEFAULT_ICON_COLOR)
  }, [setIconColorAll])

  /** Mono-only: restore just the default single icon color. */
  const resetColor = useCallback(() => setIconColorAll(DEFAULT_ICON_COLOR), [setIconColorAll])

  // ── Random Color (Monochrome only) ──
  // Picks from the curated professional palette, never repeats the previous
  // pick, and skips colors with poor contrast against the current preview
  // background (solid background color, or white for none/gradient).
  const lastRandomColorRef = useRef<string | null>(null)
  const randomColor = useCallback(() => {
    const bg = backgroundMode === 'solid' && solidBackgroundColor !== 'transparent'
      ? sanitizeHex(solidBackgroundColor)
      : '#FFFFFF'
    const current = sanitizeHex(iconColor).toUpperCase()
    const usable = RANDOM_COLOR_PALETTE.filter(
      (c) => c !== lastRandomColorRef.current && c !== current && getContrastRatio(c, bg) >= 2,
    )
    const pool = usable.length > 0
      ? usable
      : RANDOM_COLOR_PALETTE.filter((c) => c !== lastRandomColorRef.current && c !== current)
    const choice = pool[Math.floor(Math.random() * pool.length)] ?? RANDOM_COLOR_PALETTE[0]
    lastRandomColorRef.current = choice
    setIconColorAll(choice)
  }, [backgroundMode, solidBackgroundColor, iconColor, setIconColorAll])

  // ── Selected-icon capability + details ──
  const selectedSvgText = useInlineSvg(relativeUrl)
  const selectedIsFlag = selectedIcon ? isFlagIcon(selectedIcon.id) : false
  // Fixed-color artwork (3D Analytics) always renders its original multicolor
  // design — like flags, it is never recolored or run through Precision.
  const selectedIsFixed = Boolean(selectedIcon?.fixedColors)
  // Multicolor is available ONLY when the reference library supplies an
  // original multicolor variant — a fake version is never generated.
  const selectedHasMulticolor = !selectedIsFlag && !!selectedSvgText && hasOriginalMulticolor(selectedSvgText)
  const effectiveMode: IconColorMode = selectedIsFixed || (colorMode === 'multicolor' && selectedHasMulticolor) ? 'multicolor' : 'mono'
  const iconDetails = useMemo(() => (selectedIcon ? getIconDetails(selectedIcon) : null), [selectedIcon])
  const contrastWarning = effectiveMode === 'mono' && !selectedIsFlag
    && backgroundMode === 'solid' && solidBackgroundColor !== 'transparent'
    && getContrastRatio(sanitizeHex(iconColor), sanitizeHex(solidBackgroundColor)) < 3

  const addIconsToLayoutBuilder = useCallback(() => {
    const list = selectedExportList()
    if (list.length === 0) return
    const uniqueIds = Array.from(new Set(list.map((icon) => icon.id)))
    const customization: IconCustomization = {
      iconColor: sanitizeHex(iconColor),
      weight: iconWeight,
      style: iconStyle,
      backgroundMode,
      solidBackgroundColor,
      bgOpacity,
      bgShape,
      gradient: selectedGradient
        ? { code: selectedGradient.code, name: selectedGradient.name, stops: selectedGradient.stops }
        : null,
      padding: iconPadding,
      size: iconSize,
      colorMode,
    }
    setIconBundle({ iconIds: uniqueIds, customization })
    setIntegrationSourceModule('icon-studio')
    setIntegrationReturnRoute('/layout-builder')
    router.push('/layout-builder?includeIcons=1')
  }, [
    selectedExportList, iconColor, iconWeight, iconStyle, backgroundMode, solidBackgroundColor,
    bgOpacity, bgShape, selectedGradient, iconPadding, iconSize, colorMode,
    setIconBundle, setIntegrationSourceModule, setIntegrationReturnRoute, router,
  ])

  const onIconClick = useCallback((icon: IconLibraryItem) => {
    if (multiSelect) setSelectedIds((prev) => (prev.includes(icon.id) ? prev.filter((x) => x !== icon.id) : [...prev, icon.id]))
    setSelectedIcon(icon)
  }, [multiSelect, setSelectedIcon])

  const iconBgStyle = useMemo(() => {
    const effectiveShape = backgroundMode === 'none' ? 'none' : bgShape
    const background = backgroundMode === 'gradient' && selectedGradient
      ? selectedGradient.css
      : backgroundMode === 'solid'
        ? rgbaFromHex(solidBackgroundColor, bgOpacity)
        : 'transparent'
    const padX = effectiveShape === 'capsule' ? iconPadding + 8 : iconPadding
    return { background, borderRadius: shapeRadiusCss(effectiveShape), padding: `${iconPadding}px ${padX}px` }
  }, [backgroundMode, selectedGradient, bgShape, solidBackgroundColor, bgOpacity, iconPadding])

  const gridIconSize = Math.max(16, Math.min(iconSize, 40))

  const iconCell = (icon: IconLibraryItem, size: number) => (
    <span className={styles.iconBg} style={iconBgStyle}>
      {isFlagIcon(icon.id)
        ? // eslint-disable-next-line @next/next/no-img-element
          <img src={icon.url} width={size} height={size} alt={icon.name} style={{ objectFit: 'contain', display: 'block' }} />
        : <InlineStyledIcon url={icon.url} color={iconColor} size={size} weight={iconWeight} style={iconStyle} flag={false} colorMode={icon.fixedColors ? 'multicolor' : colorMode} />}
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
          <Link className={`nav-btn accent ${styles.lift}`} href="/editor" title="Open Theme Builder">
            <Wand2 size={13} strokeWidth={2} /> {returnTo === '/editor' ? 'Back to Theme Builder' : 'Theme Builder'}
          </Link>
        </div>
      </header>

      <div className={styles.body}>
        {/* LEFT — customization */}
        <aside className={styles.left} aria-label="Icon customization">
          <p className={styles.groupLabel}>Customize</p>

          {!selectedIsFlag && !selectedIsFixed && (
            <ControlGroup label="Color mode">
              <div className={styles.pillRow} role="group" aria-label="Color mode">
                {COLOR_MODES.map((m) => {
                  const disabled = m.key === 'multicolor' && !selectedHasMulticolor
                  return (
                    <button
                      key={m.key}
                      type="button"
                      className={`${styles.pill} ${effectiveMode === m.key ? styles.pillActive : ''}`}
                      onClick={() => !disabled && setColorMode(m.key)}
                      disabled={disabled}
                      aria-pressed={effectiveMode === m.key}
                      title={disabled ? 'Multicolor variant not available' : COLOR_MODE_NAMES[m.key]}
                      style={disabled ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
              {!selectedHasMulticolor && (
                <p className={styles.helperNote} style={{ marginTop: 6 }}>Multicolor variant not available for this icon.</p>
              )}
              {effectiveMode === 'multicolor' && (
                <p className={styles.helperNote} style={{ marginTop: 6 }}>
                  Original reference colors — this icon&apos;s designed multicolor palette is preserved exactly and is not editable.
                </p>
              )}
            </ControlGroup>
          )}

          {!selectedIsFlag && effectiveMode === 'mono' && (
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
              <div className={styles.pillRow} style={{ marginTop: 6 }}>
                <button type="button" className={styles.pill} onClick={randomColor} title="Pick a random color from a curated, dashboard-friendly palette">
                  <Shuffle size={11} strokeWidth={2.4} style={{ marginRight: 4, verticalAlign: '-1px' }} />Random Color
                </button>
                <button type="button" className={styles.pill} onClick={resetColor} title="Restore the default icon color">Reset Color</button>
              </div>
            </ControlGroup>
          )}

          {selectedIsFlag && (
            <p className={styles.helperNote} style={{ marginBottom: 10 }}>
              Official country flag — original colors and proportions are always preserved. Color controls do not apply.
            </p>
          )}

          {selectedIsFixed && (
            <p className={styles.helperNote} style={{ marginBottom: 10 }}>
              Fixed-color 3D artwork — the curated palette is always preserved. Color controls do not apply.
            </p>
          )}

          <ControlGroup label="Background mode">
            <div className={styles.pillRow} role="group" aria-label="Background mode">
              {(['none', 'solid', 'gradient'] as BackgroundMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.pill} ${backgroundMode === mode ? styles.pillActive : ''}`}
                  onClick={() => {
                    if (mode === 'gradient' && !selectedGradient && GRADIENT_OPTIONS[0]) setSelectedGradient(GRADIENT_OPTIONS[0])
                    activateBackgroundMode(mode)
                  }}
                  aria-pressed={backgroundMode === mode}
                >
                  {mode === 'none' ? 'None' : mode === 'solid' ? 'Solid' : 'Gradient'}
                </button>
              ))}
            </div>
          </ControlGroup>

          <ControlGroup label="Background color">
            <div className={styles.swatchRow}>
              {BG_COLOR_SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`${styles.swatch} ${backgroundMode === 'solid' && solidBackgroundColor === c ? styles.swatchActive : ''}`}
                  style={{ background: c === 'transparent' ? CHECKER_BG : c }}
                  onClick={() => {
                    if (c === 'transparent') {
                      setSolidBackgroundColor(c)
                      setBackgroundMode('none')
                    } else {
                      setSolidBackgroundColor(c)
                      activateBackgroundMode('solid')
                    }
                  }}
                  title={c === 'transparent' ? 'Transparent' : c}
                  aria-label={`Background colour ${c}`}
                />
              ))}
            </div>
            <div className={styles.colorRow}>
              <input
                type="color"
                className={styles.colorSwatch}
                value={solidBackgroundColor === 'transparent' ? '#FFFFFF' : sanitizeHex(solidBackgroundColor)}
                onChange={(e) => { setSolidBackgroundColor(e.target.value.toUpperCase()); activateBackgroundMode('solid') }}
                aria-label="Background colour picker"
              />
              <input
                className={styles.hexInput}
                value={solidBackgroundColor}
                onChange={(e) => setSolidBackgroundColor(e.target.value)}
                onBlur={(e) => {
                  const v = e.currentTarget.value.trim()
                  if (v.toLowerCase() === 'transparent') {
                    setSolidBackgroundColor('transparent')
                    setBackgroundMode('none')
                  } else {
                    setSolidBackgroundColor(sanitizeHex(v).toUpperCase())
                    activateBackgroundMode('solid')
                  }
                }}
                aria-label="Background hex colour"
                spellCheck={false}
              />
            </div>
          </ControlGroup>

          {GRADIENT_OPTIONS.length > 0 && (
            <ControlGroup label="Gradient background">
              <div className={styles.gradRow}>
                <button type="button" className={`${styles.gradChip} ${backgroundMode === 'none' ? styles.gradChipActive : ''}`} style={{ background: CHECKER_BG }} onClick={() => setBackgroundMode('none')} title="No background" aria-label="No background" />
                {GRADIENT_OPTIONS.map((g) => (
                  <button
                    key={g.code}
                    type="button"
                    className={`${styles.gradChip} ${backgroundMode === 'gradient' && selectedGradient?.code === g.code ? styles.gradChipActive : ''}`}
                    style={{ background: g.css }}
                    onClick={() => { setSelectedGradient(g); activateBackgroundMode('gradient') }}
                    title={g.name}
                    aria-label={`Gradient ${g.name}`}
                  />
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

          {effectiveMode === 'mono' && !selectedIsFlag && (
            <ControlGroup label="Icon weight">
              <div className={styles.pillRow} role="group" aria-label="Icon weight">
                {ICON_WEIGHTS.map((w) => <button key={w.key} type="button" className={`${styles.pill} ${iconWeight === w.key ? styles.pillActive : ''}`} onClick={() => setIconWeight(w.key)} aria-pressed={iconWeight === w.key}>{w.label}</button>)}
              </div>
            </ControlGroup>
          )}

          <ControlGroup label={`Icon size — ${iconSize}px`}>
            <input type="range" min={16} max={48} value={iconSize} onChange={(e) => setIconSize(Number(e.target.value))} className={styles.slider} aria-label="Icon size" />
          </ControlGroup>

          <ControlGroup label={`Padding — ${iconPadding}px`}>
            <input type="range" min={0} max={24} value={iconPadding} onChange={(e) => setIconPadding(Number(e.target.value))} className={styles.slider} aria-label="Padding" />
          </ControlGroup>

          <button
            type="button"
            className={styles.resetBtn}
            onClick={resetCustomization}
            title="Restore default color, size, padding, background, shape and opacity — the selected icon stays selected"
          >
            <RotateCcw size={14} strokeWidth={2} /> {effectiveMode === 'multicolor' ? 'Reset to Original' : 'Reset to icon defaults'}
          </button>
        </aside>

        {/* CENTER — search + categories + grid */}
        <section className={styles.center} aria-label="Icon browser">
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
                    : <InlineStyledIcon url={relativeUrl} color={iconColor} size={Math.max(44, iconSize * 2.4)} weight={iconWeight} style={iconStyle} flag={false} colorMode={effectiveMode} />}
                </span>
              </div>

              <div>
                <h2 className={styles.previewName}>{selectedIcon?.name ?? 'Chart Bar'}</h2>
                <p className={styles.previewMeta}>
                  {effectiveMode === 'multicolor'
                    ? `${COLOR_MODE_NAMES.multicolor} · ${iconSize}px`
                    : `${ICON_WEIGHTS.find((w) => w.key === iconWeight)?.label} · ${COLOR_MODE_NAMES.mono} · ${iconSize}px`}
                </p>
              </div>

              {iconDetails && (
                <div className={styles.urlBox} style={{ display: 'grid', gap: 5, fontSize: 11.5, lineHeight: 1.45 }}>
                  <span><strong>Category:</strong> {selectedIcon?.primaryCategory ?? selectedIcon?.category}</span>
                  <span><strong>Usage:</strong> {iconDetails.usage}</span>
                  <span><strong>Power BI:</strong> {iconDetails.recommendedUse}</span>
                  {iconDetails.supportedColorModes && <span><strong>Color modes:</strong> {iconDetails.supportedColorModes.join(' · ')}</span>}
                  {iconDetails.aliases.length > 0 && <span><strong>Also known as:</strong> {iconDetails.aliases.join(', ')}</span>}
                  {selectedIsFlag && <span style={{ color: 'var(--studio-accent, #0D9488)' }}>Official country flag — original colours and proportions are always preserved; recolouring does not apply.</span>}
                  {contrastWarning && (
                    <span style={{ color: '#B45309' }}>Low icon/background contrast — pick a stronger colour (try Random Color).</span>
                  )}
                </div>
              )}

              <div>
                <button
                  type="button"
                  className={styles.copyBtn}
                  style={{ width: '100%' }}
                  onClick={() => setVariantsOpen((v) => !v)}
                  aria-expanded={variantsOpen}
                >
                  <Wand2 size={14} /> {variantsOpen ? 'Hide Variant Browser' : 'Browse Variants (weight)'}
                </button>
                {variantsOpen && !selectedIsFlag && effectiveMode === 'mono' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8 }}>
                    {ICON_WEIGHTS.map((w) => (
                      <button
                        key={w.key}
                        type="button"
                        onClick={() => setIconWeight(w.key)}
                        title={w.label}
                        aria-label={`Apply ${w.label} weight`}
                        style={{
                          display: 'grid', placeItems: 'center', padding: 6, borderRadius: 8, cursor: 'pointer',
                          border: iconWeight === w.key ? '2px solid var(--studio-accent, #0D9488)' : '1px solid rgba(15,23,42,.12)',
                          background: '#fff',
                        }}
                      >
                        <InlineStyledIcon url={relativeUrl} color={iconColor} size={22} weight={w.key} style={iconStyle} flag={false} colorMode="mono" />
                      </button>
                    ))}
                  </div>
                )}
                {variantsOpen && selectedIsFlag && (
                  <p className={styles.helperNote}>Country flags render in their official artwork — weight variants apply to outline icons only.</p>
                )}
                {variantsOpen && !selectedIsFlag && effectiveMode === 'multicolor' && (
                  <p className={styles.helperNote}>Original multicolor icons render exactly as designed — weight variants apply in Monochrome mode.</p>
                )}
              </div>

              <div>
                <div className={styles.fieldLabel}>Preview in Context</div>
                <div className={styles.contextStack}>
                  <div className={styles.kpiCard}>
                    <span className={styles.iconBg} style={iconBgStyle}>{selectedIcon && isFlagIcon(selectedIcon.id) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={relativeUrl} width={20} height={20} alt="" /> : <InlineStyledIcon url={relativeUrl} color={iconColor} size={20} weight={iconWeight} style={iconStyle} flag={false} colorMode={effectiveMode} />}</span>
                    <div style={{ minWidth: 0 }}><div className={styles.kpiValue}>$1.24M</div><div className={styles.kpiLabel}>Total Revenue</div></div>
                    <div className={styles.kpiDelta}>▲ 12.4%</div>
                  </div>
                  <div className={styles.kpiTile} style={{ background: sanitizeHex(themePrimary || '#2563EB') }}>
                    <span className={styles.iconBg} style={{ ...iconBgStyle, background: backgroundMode === 'none' ? 'rgba(255,255,255,.18)' : iconBgStyle.background }}>{selectedIcon && isFlagIcon(selectedIcon.id) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={relativeUrl} width={20} height={20} alt="" /> : <InlineStyledIcon url={relativeUrl} color={backgroundMode === 'none' ? '#FFFFFF' : iconColor} size={20} weight={iconWeight} style={iconStyle} flag={false} colorMode={effectiveMode} />}</span>
                    <div style={{ minWidth: 0 }}><div className={styles.tileValue}>847</div><div className={styles.tileLabel}>Active Users</div></div>
                  </div>
                  <div className={styles.sidebarItem}>
                    <span className={styles.iconBg} style={iconBgStyle}>{selectedIcon && isFlagIcon(selectedIcon.id) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={relativeUrl} width={16} height={16} alt="" /> : <InlineStyledIcon url={relativeUrl} color={iconColor} size={16} weight={iconWeight} style={iconStyle} flag={false} colorMode={effectiveMode} />}</span>
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
              <button
                type="button"
                className={`${styles.copyBtn} ${styles.copyBtnPrimary}`}
                disabled={pbitExportCount === 0}
                onClick={addIconsToLayoutBuilder}
                title="Send the selected icons (with their current customization) to the Layout Builder"
              >
                <ArrowUpRight size={15} /> {returnTo === '/layout-builder' ? 'Return to Layout Builder' : 'Add Selected Icons to Layout Builder'}
                {pbitExportCount > 0 ? ` (${pbitExportCount})` : ''}
              </button>
              <div className={styles.actionRow}>
                <button type="button" className={styles.copyBtn} disabled={!!exporting} onClick={handleDownloadSvg}><Download size={15} /> {exporting === 'svg' ? '…' : multiSelect && selectedCount > 1 ? 'SVG .zip' : 'SVG'}</button>
                <button type="button" className={styles.copyBtn} disabled={!!exporting} onClick={handleDownloadPng}><ImageIcon size={15} /> {exporting === 'png' ? '…' : multiSelect && selectedCount > 1 ? 'PNG .zip' : 'PNG'}</button>
              </div>
              {PBIT_EXPORT_VISIBLE && (
                <>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    disabled={!!exporting || pbitExportCount === 0}
                    onClick={handleExportPbit}
                    title={PBIT_EXPORT_VALIDATED
                      ? 'Insert every selected icon as its own image visual in a Power BI template. Opens in the Power BI Desktop version used to create the base template and in newer supported Power BI Desktop releases.'
                      : 'Diagnostic export — the generated .pbit is not yet confirmed to open in Power BI Desktop'}
                  >
                    <LayoutGrid size={15} />
                    {exporting === 'pbit'
                      ? 'Building template…'
                      : !PBIT_EXPORT_VALIDATED
                        ? `Power BI Template Export — Validation${pbitExportCount > 0 ? ` (${pbitExportCount} icon${pbitExportCount === 1 ? '' : 's'} · ${pbitPageCount} page${pbitPageCount === 1 ? '' : 's'})` : ''}`
                        : pbitExportCount === 0
                          ? 'Export Selected as Power BI Template'
                          : `Export Selected as Power BI Template (${pbitExportCount} icon${pbitExportCount === 1 ? '' : 's'} · ${pbitPageCount} page${pbitPageCount === 1 ? '' : 's'})`}
                  </button>
                  {!PBIT_EXPORT_VALIDATED && (
                    <p className={styles.helperNote}>
                      PBIT generation is under compatibility validation. SVG and PNG exports remain available.
                    </p>
                  )}
                </>
              )}
              <button
                type="button"
                className={`${styles.copyBtn} ${copied === 'url' ? styles.copyBtnDone : ''}`}
                onClick={copyUrls}
                title="Copy an absolute URL that renders this icon (customization included) — opens directly in a browser"
              >
                {copied === 'url' ? <Check size={15} /> : <Copy size={15} />} {copied === 'url' ? 'Copied' : multiSelect && selectedCount > 1 ? 'Copy URL List' : 'Copy URL'}
              </button>
              <span aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{copied ? 'Copied' : ''}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
