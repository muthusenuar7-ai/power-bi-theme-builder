'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Check, ChevronLeft, ChevronRight, Copy, ExternalLink } from 'lucide-react'
import type { IconLibraryItem } from '@/types'
import type { IconLibraryCategoryFilter } from '@/lib/iconLibrary'
import { findIconById, ICON_LIBRARY_COUNT, loadGeneratedIconLibrary, searchIcons } from '@/lib/iconLibrary'
import { sanitizeHex } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'
import { IconCategoryFilter } from './IconCategoryFilter'
import { IconPicker } from './IconPicker'
import { IconSearchBox } from './IconSearchBox'
import { RecolorableIcon } from './RecolorableIcon'

const PAGE_SIZE = 100

function ActionButton({
  children,
  onClick,
  title,
}: {
  children: ReactNode
  onClick: () => void
  title: string
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={{
        height: 28,
        borderRadius: 6,
        border: '1px solid var(--border-ui)',
        background: 'var(--surface)',
        color: 'var(--text-2)',
        fontSize: 10.5,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        padding: '0 8px',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

export function IconLibraryPanel() {
  const [icons, setIcons] = useState<IconLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<IconLibraryCategoryFilter>('All')
  const [page, setPage] = useState(0)
  const [copyStatus, setCopyStatus] = useState<string | null>(null)

  const selectedIconId = useThemeStore((s) => s.selectedIconId)
  const selectedIconUrl = useThemeStore((s) => s.selectedIconUrl)
  const selectedIconColor = useThemeStore((s) => s.selectedIconColor)
  const setSelectedIcon = useThemeStore((s) => s.setSelectedIcon)
  const setSelectedIconColor = useThemeStore((s) => s.setSelectedIconColor)

  useEffect(() => {
    let active = true
    loadGeneratedIconLibrary()
      .then((loadedIcons) => {
        if (!active) return
        setIcons(loadedIcons)
        setLoadError(null)
      })
      .catch(() => {
        if (!active) return
        setLoadError('Unable to load icon metadata. Run npm run generate:icons and refresh.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => searchIcons(icons, query, category), [icons, query, category])
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageIcons = useMemo(
    () => filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE),
    [filtered, safePage],
  )
  const selectedIcon = findIconById(icons, selectedIconId) ?? findIconById(icons, 'tabler-chart-bar') ?? filtered[0]

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(`${label} copied`)
      window.setTimeout(() => setCopyStatus(null), 1600)
    } catch {
      setCopyStatus('Copy unavailable')
      window.setTimeout(() => setCopyStatus(null), 1600)
    }
  }

  const relativeUrl = selectedIcon?.url ?? selectedIconUrl ?? '/icon-library/tabler/chart-bar.svg'
  const fullUrl = typeof window === 'undefined' ? relativeUrl : `${window.location.origin}${relativeUrl}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        padding: 10,
        border: '1px solid var(--border-ui)',
        borderRadius: 10,
        background: 'var(--surface-2)',
        display: 'grid',
        gridTemplateColumns: '54px 1fr',
        gap: 10,
        alignItems: 'center',
      }}>
        <div style={{
          height: 48,
          width: 48,
          borderRadius: 10,
          background: 'var(--surface)',
          border: '1px solid var(--border-ui)',
          display: 'grid',
          placeItems: 'center',
        }}>
          <RecolorableIcon
            url={relativeUrl}
            color={selectedIconColor}
            size={28}
            title={selectedIcon?.name ?? 'Selected icon'}
          />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedIcon?.name ?? 'Chart Bar'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>
            {selectedIcon?.category ?? 'Analytics'} / Tabler / MIT
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center' }}>
            <input
              type="color"
              value={sanitizeHex(selectedIconColor)}
              onChange={(event) => setSelectedIconColor(event.target.value.toUpperCase())}
              aria-label="Selected icon color"
              style={{ width: 28, height: 26, padding: 0, border: '1px solid var(--border-ui)', borderRadius: 6, background: 'transparent' }}
            />
            <input
              value={selectedIconColor}
              onChange={(event) => setSelectedIconColor(event.target.value)}
              onBlur={(event) => setSelectedIconColor(sanitizeHex(event.currentTarget.value).toUpperCase())}
              aria-label="Selected icon hex color"
              spellCheck={false}
              style={{
                minWidth: 0,
                flex: 1,
                height: 26,
                border: '1px solid var(--border-ui)',
                borderRadius: 6,
                padding: '0 7px',
                fontFamily: 'var(--font-jetbrains-mono, monospace)',
                fontSize: 10,
                background: 'var(--surface)',
                color: 'var(--text)',
              }}
            />
          </div>
        </div>
      </div>

      <IconSearchBox value={query} onChange={(value) => { setQuery(value); setPage(0) }} />
      <IconCategoryFilter value={category} onChange={(value) => { setCategory(value); setPage(0) }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-3)', fontWeight: 700 }}>
          {filtered.length.toLocaleString()} shown / {(icons.length || ICON_LIBRARY_COUNT).toLocaleString()} total
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          <button
            type="button"
            aria-label="Previous icon page"
            disabled={safePage === 0}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: '1px solid var(--border-ui)',
              background: 'var(--surface)',
              color: 'var(--text-2)',
              opacity: safePage === 0 ? 0.45 : 1,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ChevronLeft size={13} />
          </button>
          <span style={{ minWidth: 58, textAlign: 'center', alignSelf: 'center', fontSize: 10.5, color: 'var(--text-3)' }}>
            {safePage + 1}/{totalPages}
          </span>
          <button
            type="button"
            aria-label="Next icon page"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: '1px solid var(--border-ui)',
              background: 'var(--surface)',
              color: 'var(--text-2)',
              opacity: safePage >= totalPages - 1 ? 0.45 : 1,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{
          border: '1px solid var(--border-ui)',
          borderRadius: 10,
          padding: 24,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-3)',
          background: 'var(--surface)',
        }}>
          Loading Icon Studio assets...
        </div>
      ) : loadError ? (
        <div style={{
          border: '1px dashed var(--border-ui)',
          borderRadius: 10,
          padding: 16,
          fontSize: 11,
          lineHeight: 1.5,
          color: 'var(--text-2)',
          background: 'var(--surface)',
        }}>
          {loadError}
        </div>
      ) : pageIcons.length ? (
        <IconPicker
          icons={pageIcons}
          selectedIconId={selectedIconId}
          iconColor={selectedIconColor}
          onSelect={setSelectedIcon}
        />
      ) : (
        <div style={{
          border: '1px dashed var(--border-ui)',
          borderRadius: 10,
          padding: 24,
          textAlign: 'center',
          fontSize: 11,
          color: 'var(--text-3)',
        }}>
          No icons match this search.
        </div>
      )}

      <div style={{
        border: '1px solid var(--border-ui)',
        borderRadius: 10,
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: 'var(--surface)',
      }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>
          Selected icon URL
        </div>
        <div style={{
          fontSize: 10.5,
          color: 'var(--text-2)',
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
          overflowWrap: 'anywhere',
          padding: 7,
          borderRadius: 6,
          background: 'var(--surface-2)',
        }}>
          {relativeUrl}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <ActionButton title="Copy relative icon URL" onClick={() => copy(relativeUrl, 'Relative URL')}>
            <Copy size={12} /> Relative
          </ActionButton>
          <ActionButton title="Copy full icon URL" onClick={() => copy(fullUrl, 'Full URL')}>
            <ExternalLink size={12} /> Full URL
          </ActionButton>
        </div>
        {copyStatus && (
          <div aria-live="polite" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--accent-ui)', fontWeight: 700 }}>
            <Check size={12} /> {copyStatus}
          </div>
        )}
      </div>
    </div>
  )
}
