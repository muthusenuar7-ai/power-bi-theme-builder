'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Clock, LayoutDashboard, Search, Shuffle, Sparkles, Star } from 'lucide-react'
import { getAllThemePresets, getThemePresetCategories } from '@/lib/themePresetRegistry'
import { computeThemeQuality, sortThemesByQuality, type ThemeQualityTier } from '@/lib/themeQuality'
import { useThemeStore } from '@/store/themeStore'
import { useIntegrationWorkspaceStore } from '@/store/integrationWorkspaceStore'
import { buildThemeSnapshot } from '@/lib/integration/themeToIconMapping'
import type { PresetTheme } from '@/types'

/** Quality-first default order: Signature → Premium → Standard → Experimental
 *  (curated priorityRank, then score, then name). Every theme stays present. */
const ALL_PRESETS = sortThemesByQuality(getAllThemePresets())
const THEME_QUALITY = computeThemeQuality(ALL_PRESETS)
const tierOf = (id: string): ThemeQualityTier => THEME_QUALITY.get(id)?.qualityTier ?? 'Standard'
const PAGE_SIZE = 100
const FAVORITES_KEY = 'dc-theme-favorites'
const RECENTS_KEY = 'dc-theme-recents'
const RECENTS_LIMIT = 20
const CATEGORY_ORDER = [
  'All',
  'Pastel Professional',
  'Corporate',
  'Vivid / Creative',
  'Soft / Pastel',
  'Executive / Finance',
  'General',
  'Nature / Sustainability',
  'Minimal / Monochrome',
] as const
const COLOR_FAMILY_OPTIONS = ['All', 'Blue', 'Orange', 'Red', 'Green', 'Neutral', 'Gold', 'Teal', 'Rose', 'Black', 'Violet'] as const
const USE_CASE_OPTIONS = [
  'All',
  'Corporate Palette',
  'Executive / Finance',
  'Soft Palette',
  'Vivid Palette',
  'Pastel + Dark Text',
  'Dark Anchor + Light Background',
  'Warm Accent + Cool Primary',
  'Navy + Gold',
  'Green + Neutral',
  'Monochrome',
] as const

type Scope = 'all' | 'featured' | 'favorites' | 'recent'
type CategoryFilter = string
type ColorFamilyFilter = (typeof COLOR_FAMILY_OPTIONS)[number]
type UseCaseFilter = (typeof USE_CASE_OPTIONS)[number]

function matchesPreset(preset: PresetTheme, colors: string[], bg: string, fg: string): boolean {
  const presetColors = preset.dataColorsFull
  const currentColors = colors
  return (
    (preset.dashboardBackground ?? preset.background).toUpperCase() === bg.toUpperCase() &&
    preset.foreground.toUpperCase() === fg.toUpperCase() &&
    presetColors.length === currentColors.length &&
    presetColors.every((color, index) => color.toUpperCase() === currentColors[index]?.toUpperCase())
  )
}

/** Full palette strip — every theme colour, equal width, no clipping/overflow. */
function PaletteBand({ colors }: { colors: string[] }) {
  const list = colors.length ? colors : ['#E2E8F0']
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        width: '100%',
        height: 24,
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid rgba(15,23,42,.14)',
      }}
    >
      {list.map((color, i) => (
        <span key={`${color}-${i}`} style={{ flex: '1 1 0', minWidth: 0, height: '100%', background: color }} />
      ))}
    </div>
  )
}

/** Search index: name, id, tags, family, patterns, category, collection, hex colours. */
function searchableText(preset: PresetTheme): string {
  return [
    preset.id,
    preset.name,
    preset.category,
    preset.categories?.join(' '),
    preset.collectionClass,
    preset.tags?.join(' '),
    preset.recommendedFor?.join(' '),
    preset.dataColorsFull.join(' '),
    preset.colors.join(' '),
    preset.hue,
    preset.profile,
    preset.harmony,
    preset.mode,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function normalizedWords(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/#[0-9a-f]{3,6}/g, ' ')
    .split(/[^a-z0-9#]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function matchesUseCase(preset: PresetTheme, useCase: UseCaseFilter): boolean {
  if (useCase === 'All') return true
  const text = searchableText(preset)
  return normalizedWords(useCase).every((word) => text.includes(word))
}

function filterSelectStyle(): React.CSSProperties {
  return {
    width: '100%',
    height: 30,
    border: '1px solid var(--border-ui)',
    borderRadius: 6,
    background: 'var(--surface)',
    color: 'var(--text)',
    fontSize: 10.5,
    fontWeight: 650,
    padding: '0 7px',
    outline: 'none',
    fontFamily: 'inherit',
  }
}

function Pager({
  start, end, total, page, totalPages, onPrev, onNext,
}: {
  start: number; end: number; total: number; page: number; totalPages: number; onPrev: () => void; onNext: () => void
}) {
  const btn = (disabled: boolean): React.CSSProperties => ({
    width: 30, height: 26, borderRadius: 6, border: '1px solid var(--border-ui)',
    background: 'var(--surface)', color: disabled ? 'var(--text-3)' : 'var(--text-2)',
    cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>
        {start}–{end} of {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" disabled={page === 0} onClick={onPrev} style={btn(page === 0)} aria-label="Previous page">
          <ChevronLeft size={14} />
        </button>
        <span style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 700, minWidth: 54, textAlign: 'center' }}>
          {page + 1} / {totalPages}
        </span>
        <button type="button" disabled={page >= totalPages - 1} onClick={onNext} style={btn(page >= totalPages - 1)} aria-label="Next page">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

export function PresetThemes() {
  const router = useRouter()
  const setThemeSnapshot = useIntegrationWorkspaceStore((s) => s.setThemeSnapshot)
  const setSourceModule = useIntegrationWorkspaceStore((s) => s.setSourceModule)
  const setReturnRoute = useIntegrationWorkspaceStore((s) => s.setReturnRoute)
  const [scope, setScope] = useState<Scope>('all')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('All')
  const [colorFamily, setColorFamily] = useState<ColorFamilyFilter>('All')
  const [useCase, setUseCase] = useState<UseCaseFilter>('All')
  const [page, setPage] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [recents, setRecents] = useState<string[]>([])
  const lastRandomRef = useRef<string | null>(null)

  const dataColors = useThemeStore((s) => s.dataColors)
  const bg = useThemeStore((s) => s.bg)
  const fg = useThemeStore((s) => s.fg)
  const applyPreset = useThemeStore((s) => s.applyPreset)

  // Load persisted favorites + recents.
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const f = localStorage.getItem(FAVORITES_KEY)
        if (f) setFavorites(JSON.parse(f) as string[])
        const r = localStorage.getItem(RECENTS_KEY)
        if (r) setRecents(JSON.parse(r) as string[])
      } catch {
        /* storage unavailable */
      }
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev]
      try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const selectTheme = useCallback((preset: PresetTheme) => {
    applyPreset(preset)
    setRecents((prev) => {
      const next = [preset.id, ...prev.filter((x) => x !== preset.id)].slice(0, RECENTS_LIMIT)
      try { localStorage.setItem(RECENTS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [applyPreset])

  const byId = useMemo(() => new Map(ALL_PRESETS.map((p) => [p.id, p])), [])
  const categoryOptions = useMemo(() => {
    const actual = new Set(getThemePresetCategories().filter((item) => item !== 'All'))
    const ordered: string[] = CATEGORY_ORDER.filter((item) => item === 'All' || actual.has(item))
    for (const item of actual) if (!ordered.includes(item)) ordered.push(item)
    return ordered
  }, [])

  const scopedPresets = useMemo(() => {
    if (scope === 'featured') return ALL_PRESETS.filter((p) => THEME_QUALITY.get(p.id)?.isFeatured)
    if (scope === 'favorites') return favorites.map((id) => byId.get(id)).filter((p): p is PresetTheme => Boolean(p))
    if (scope === 'recent') return recents.map((id) => byId.get(id)).filter((p): p is PresetTheme => Boolean(p))
    return ALL_PRESETS
  }, [scope, favorites, recents, byId])

  const presets = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return scopedPresets.filter((preset) => {
      const text = searchableText(preset)
      const matchesSearch = !needle || text.includes(needle)
      const matchesCategory = category === 'All' || (preset.categories ?? [preset.category]).includes(category)
      const matchesFamily = colorFamily === 'All' || (preset.hue ?? '').toLowerCase() === colorFamily.toLowerCase()
      return matchesSearch && matchesCategory && matchesFamily && matchesUseCase(preset, useCase)
    })
  }, [scopedPresets, query, category, colorFamily, useCase])

  // Random Theme: by default picks from Signature + Premium themes within the
  // currently shown list (attractive, production-ready results), still
  // respecting active search/filters/scope. "Include all themes" widens the
  // pool to everything shown. Avoids repeating the last pick.
  const [randomIncludeAll, setRandomIncludeAll] = useState(false)
  const randomPool = useMemo(() => {
    if (randomIncludeAll) return presets
    const priority = presets.filter((p) => {
      const tier = tierOf(p.id)
      return tier === 'Signature' || tier === 'Premium'
    })
    return priority.length > 0 ? priority : presets
  }, [presets, randomIncludeAll])

  const pickRandomTheme = useCallback(() => {
    if (randomPool.length === 0) return
    let choice = randomPool[Math.floor(Math.random() * randomPool.length)]
    if (randomPool.length > 1 && choice.id === lastRandomRef.current) {
      choice = randomPool[(randomPool.indexOf(choice) + 1) % randomPool.length]
    }
    lastRandomRef.current = choice.id
    selectTheme(choice)
  }, [randomPool, selectTheme])

  const captureThemeSnapshot = useCallback(() => {
    const state = useThemeStore.getState()
    const activePreset = ALL_PRESETS.find((preset) => matchesPreset(preset, state.dataColors, state.bg, state.fg))
    const snapshot = buildThemeSnapshot(state, activePreset?.id ?? 'custom')
    setThemeSnapshot(snapshot)
    return snapshot
  }, [setThemeSnapshot])

  // Opens Icon Studio without any theme-to-icon recoloring: reference
  // multicolor icons keep their original designed palette, so the theme is
  // deliberately NOT applied to icon colors (final color-mode decision).
  const openIconStudio = useCallback(() => {
    captureThemeSnapshot()
    setSourceModule('theme-builder')
    setReturnRoute('/editor')
    router.push('/icons?returnTo=/editor')
  }, [captureThemeSnapshot, router, setSourceModule, setReturnRoute])

  const applyThemeToLayoutBuilder = useCallback(() => {
    captureThemeSnapshot()
    setSourceModule('theme-builder')
    setReturnRoute('/editor')
    router.push('/layout-builder')
  }, [captureThemeSnapshot, router, setSourceModule, setReturnRoute])

  const totalPages = Math.max(1, Math.ceil(presets.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pagePresets = presets.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
  const start = presets.length ? safePage * PAGE_SIZE + 1 : 0
  const end = Math.min(presets.length, (safePage + 1) * PAGE_SIZE)
  const showPager = presets.length > PAGE_SIZE

  const scopeButton = (value: Scope, label: string, icon?: React.ReactNode, count?: number) => (
    <button
      type="button"
      onClick={() => { setScope(value); setPage(0) }}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        height: 28, borderRadius: 7, border: '1px solid var(--border-ui)',
        background: scope === value ? 'var(--accent-ui)' : 'var(--surface)',
        color: scope === value ? '#fff' : 'var(--text-2)',
        fontSize: 10.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
      }}
      aria-pressed={scope === value}
    >
      {icon}
      {label}{typeof count === 'number' ? ` (${count})` : ''}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>Search themes</span>
        <span style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={12} strokeWidth={2} style={{ position: 'absolute', left: 8, color: 'var(--text-3)' }} />
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setPage(0) }}
            placeholder={`Search ${ALL_PRESETS.length} themes — name, tag, use case, colour…`}
            spellCheck={false}
            style={{
              width: '100%', height: 30, border: '1px solid var(--border-ui)', borderRadius: 6,
              background: 'var(--surface)', color: 'var(--text)', fontSize: 11, padding: '0 8px 0 26px', outline: 'none',
            }}
          />
        </span>
      </label>

      {/* Random Theme — defaults to Signature + Premium picks. */}
      <button
        type="button"
        onClick={pickRandomTheme}
        disabled={randomPool.length === 0}
        title={randomIncludeAll
          ? 'Apply a random theme from every theme in the current list'
          : 'Apply a random Signature or Premium theme from the current list'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          height: 32,
          borderRadius: 8,
          border: '1px solid var(--accent-ui)',
          background: 'var(--accent-ui)',
          color: '#fff',
          fontSize: 11.5,
          fontWeight: 750,
          fontFamily: 'inherit',
          cursor: randomPool.length === 0 ? 'not-allowed' : 'pointer',
          opacity: randomPool.length === 0 ? 0.5 : 1,
        }}
      >
        <Shuffle size={13} strokeWidth={2.2} />
        Random Theme
        <span style={{ fontWeight: 600, opacity: 0.8 }}>· {randomPool.length}</span>
      </button>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, fontWeight: 650, color: 'var(--text-3)', cursor: 'pointer', marginTop: -4 }}>
        <input
          type="checkbox"
          checked={randomIncludeAll}
          onChange={(e) => setRandomIncludeAll(e.target.checked)}
          aria-label="Include all themes in Random Theme picks"
        />
        Include all themes (not just Signature &amp; Premium)
      </label>

      {/* Cross-module handoff: send this theme's colours to Icon Studio / Layout Builder. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button
          type="button"
          onClick={openIconStudio}
          title="Open Icon Studio (icons keep their own designed colors — themes never recolor them)"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            height: 30, borderRadius: 8, border: '1px solid var(--border-ui)',
            background: 'var(--surface)', color: 'var(--text)',
            fontSize: 10.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <Sparkles size={13} strokeWidth={2.2} />
          Open Icon Studio
        </button>
        <button
          type="button"
          onClick={applyThemeToLayoutBuilder}
          title="Make this theme available to the Layout Builder's combined export"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            height: 30, borderRadius: 8, border: '1px solid var(--border-ui)',
            background: 'var(--surface)', color: 'var(--text)',
            fontSize: 10.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          <LayoutDashboard size={13} strokeWidth={2.2} />
          Apply to Layout Builder
        </button>
      </div>

      {/* Simple scope switch — search-first, no category browsing required. */}
      <div style={{ display: 'flex', gap: 6 }}>
        {scopeButton('featured', 'Featured', <Sparkles size={12} strokeWidth={2} />)}
        {scopeButton('all', 'All')}
        {scopeButton('favorites', 'Favorites', <Star size={12} strokeWidth={2} />, favorites.length)}
        {scopeButton('recent', 'Recent', <Clock size={12} strokeWidth={2} />, recents.length)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)' }}>Category</span>
          <select
            value={category}
            onChange={(event) => { setCategory(event.target.value); setPage(0) }}
            style={filterSelectStyle()}
            aria-label="Filter themes by category"
          >
            {categoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)' }}>Color Family</span>
            <select
              value={colorFamily}
              onChange={(event) => { setColorFamily(event.target.value as ColorFamilyFilter); setPage(0) }}
              style={filterSelectStyle()}
              aria-label="Filter themes by color family"
            >
              {COLOR_FAMILY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)' }}>Use Case</span>
            <select
              value={useCase}
              onChange={(event) => { setUseCase(event.target.value as UseCaseFilter); setPage(0) }}
              style={filterSelectStyle()}
              aria-label="Filter themes by use case"
            >
              {USE_CASE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
        </div>
      </div>

      {/* Top pagination */}
      <Pager
        start={start} end={end} total={presets.length} page={safePage} totalPages={totalPages}
        onPrev={() => setPage((c) => Math.max(0, c - 1))}
        onNext={() => setPage((c) => Math.min(totalPages - 1, c + 1))}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 480, paddingRight: 2 }}>
        {pagePresets.map((preset, presetIndex) => {
          const active = matchesPreset(preset, dataColors, bg, fg)
          const fav = favorites.includes(preset.id)
          const tier = tierOf(preset.id)
          // Section dividers where the quality tier changes (default order is
          // tier-sorted). Experimental stays under "All Themes" unlabeled.
          const prevTier = presetIndex > 0 ? tierOf(pagePresets[presetIndex - 1].id) : null
          const divider = scope === 'all'
            ? (tier === 'Signature' && prevTier !== 'Signature' && presetIndex === 0 ? 'Signature Themes'
              : tier === 'Premium' && prevTier !== 'Premium' ? 'Premium'
                : tier === 'Standard' && prevTier !== null && prevTier !== 'Standard' && prevTier !== 'Experimental' ? 'All Themes'
                  : null)
            : null
          return (
            <div key={preset.id} style={{ display: 'contents' }}>
              {divider && (
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--text-3)', padding: '6px 2px 0' }}>
                  {divider}
                </div>
              )}
            <div
              role="button"
              tabIndex={0}
              className={`premium-theme-card ${active ? 'is-active' : ''}`}
              onClick={() => selectTheme(preset)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectTheme(preset) } }}
              title={[preset.name, preset.collectionClass, preset.recommendedFor?.[0]].filter(Boolean).join(' • ')}
              style={{
                position: 'relative',
                border: active ? '1.5px solid var(--accent-ui)' : '1px solid var(--border-ui)',
                boxShadow: active ? '0 0 0 2px rgba(13,148,136,.12)' : 'none',
                borderRadius: 8,
                background: active ? 'var(--accent-soft)' : 'var(--surface)',
                cursor: 'pointer', padding: '8px 9px', width: '100%', minHeight: 58, fontFamily: 'inherit',
                transition: 'border-color .12s, background .12s, box-shadow .12s',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: active ? 800 : 700,
                    color: active ? 'var(--accent-ui)' : 'var(--text)', lineHeight: 1.2,
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {preset.name}
                  </span>
                  {(tier === 'Signature' || tier === 'Premium') && (
                    <span style={{
                      fontSize: 8.5, fontWeight: 800, letterSpacing: '.05em', flexShrink: 0, textTransform: 'uppercase',
                      color: tier === 'Signature' ? '#92600A' : 'var(--accent-ui)',
                      background: tier === 'Signature' ? 'rgba(245,196,81,.22)' : 'var(--accent-soft)',
                      border: tier === 'Signature' ? '1px solid rgba(190,140,30,.35)' : '1px solid transparent',
                      borderRadius: 999, padding: '1px 6px',
                    }}>
                      {tier}
                    </span>
                  )}
                  {preset.collectionClass && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: 'var(--accent-ui)', flexShrink: 0,
                      background: 'var(--accent-soft)', borderRadius: 999, padding: '1px 7px',
                      maxWidth: 94, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {preset.collectionClass.replace(/\s*Collection$/i, '')}
                    </span>
                  )}
                  {preset.hue && (
                    <span style={{
                      fontSize: 9, fontWeight: 800, color: 'var(--text-3)', flexShrink: 0,
                      background: 'var(--surface-2)', border: '1px solid var(--border-ui)', borderRadius: 999, padding: '1px 6px',
                      maxWidth: 58, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {preset.hue}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(preset.id) }}
                    title={fav ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={fav ? `Remove ${preset.name} from favorites` : `Add ${preset.name} to favorites`}
                    aria-pressed={fav}
                    style={{
                      flexShrink: 0, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: fav ? '#F59E0B' : 'var(--text-3)', padding: 0,
                    }}
                  >
                    <Star size={14} strokeWidth={2} fill={fav ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <PaletteBand colors={preset.dataColorsFull} />
              </div>
            </div>
            </div>
          )
        })}

        {presets.length === 0 && (
          <div style={{ padding: '16px 10px', border: '1px dashed var(--border-ui)', borderRadius: 8, color: 'var(--text-3)', fontSize: 11, textAlign: 'center' }}>
            {scope === 'favorites' ? 'No favorite themes yet — tap the star on any theme.'
              : scope === 'recent' ? 'No recently used themes yet — select a theme to start.'
              : 'No themes match your search.'}
          </div>
        )}
      </div>

      {/* Bottom pagination */}
      {showPager && (
        <Pager
          start={start} end={end} total={presets.length} page={safePage} totalPages={totalPages}
          onPrev={() => setPage((c) => Math.max(0, c - 1))}
          onNext={() => setPage((c) => Math.min(totalPages - 1, c + 1))}
        />
      )}
    </div>
  )
}
