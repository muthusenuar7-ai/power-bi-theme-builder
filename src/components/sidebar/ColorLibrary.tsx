'use client'

import { useMemo, useState } from 'react'
import { COLOR_FAMILIES, COLOR_LIBRARY } from '@/lib/datacenseLibrary'
import { getReadableTextColor } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'

const MAX_SWATCHES = 240

type ApplyTarget = 'primary' | 'accent' | `c${number}`

const TARGETS: { value: ApplyTarget; label: string }[] = [
  { value: 'primary', label: 'Primary' },
  { value: 'accent', label: 'Accent' },
  ...Array.from({ length: 10 }, (_, i) => ({ value: `c${i}` as ApplyTarget, label: `C${i + 1}` })),
]

/**
 * ColorLibrary — browses the curated `colors.json` preset colour library
 * (de-duplicated by hex) and applies a chosen colour to a selected role
 * (Primary, Accent, or a data-colour slot C1–C10). Searchable + family-filtered.
 */
export function ColorLibrary() {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('All')
  const [target, setTarget] = useState<ApplyTarget>('primary')

  const setPrimary = useThemeStore((s) => s.setPrimary)
  const setAccent = useThemeStore((s) => s.setAccent)
  const setDataColor = useThemeStore((s) => s.setDataColor)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return COLOR_LIBRARY.filter(
      (c) =>
        (family === 'All' || c.family === family) &&
        (!needle || c.name.toLowerCase().includes(needle) || c.hex.toLowerCase().includes(needle)),
    )
  }, [query, family])

  const shown = filtered.slice(0, MAX_SWATCHES)

  function applyColor(hex: string) {
    if (target === 'primary') setPrimary(hex)
    else if (target === 'accent') setAccent(hex)
    else setDataColor(Number(target.slice(1)), hex)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${COLOR_LIBRARY.length} colours…`}
          spellCheck={false}
          style={{
            flex: 1, minWidth: 0, height: 27, border: '1px solid var(--border-ui)', borderRadius: 6,
            background: 'var(--surface)', color: 'var(--text)', fontSize: 11, padding: '0 8px', outline: 'none',
          }}
        />
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          aria-label="Colour family"
          style={{
            height: 27, border: '1px solid var(--border-ui)', borderRadius: 6, background: 'var(--surface)',
            color: 'var(--text-2)', fontSize: 10, padding: '0 4px', maxWidth: 96,
          }}
        >
          <option>All</option>
          {COLOR_FAMILIES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: 'var(--text-3)', fontWeight: 700 }}>
        Apply to
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as ApplyTarget)}
          aria-label="Apply colour to"
          style={{
            flex: 1, minWidth: 0, height: 25, border: '1px solid var(--border-ui)', borderRadius: 6,
            background: 'var(--surface)', color: 'var(--text-2)', fontSize: 10.5, padding: '0 6px',
          }}
        >
          {TARGETS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </label>

      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
        {filtered.length.toLocaleString()} colours{filtered.length > MAX_SWATCHES ? ` · showing ${MAX_SWATCHES}` : ''}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 4,
          maxHeight: 240,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {shown.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => applyColor(c.hex)}
            title={`${c.name} · ${c.hex} — apply to ${TARGETS.find((t) => t.value === target)?.label}`}
            aria-label={`Apply ${c.name} ${c.hex}`}
            style={{
              height: 24,
              borderRadius: 5,
              border: '1px solid rgba(15,23,42,.18)',
              background: c.hex,
              color: getReadableTextColor(c.hex),
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
        {shown.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '12px 8px', fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center' }}>
            No colours match.
          </div>
        )}
      </div>
    </div>
  )
}
