'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { GRADIENT_FAMILIES, GRADIENT_LIBRARY, type LibraryGradient } from '@/lib/datacenseLibrary'

const MAX_TILES = 120

/**
 * GradientPicker — browses the `gradient_library.json` gradient library
 * (de-duplicated by stops). Selecting a gradient applies it to a web-preview
 * CSS variable (`--dc-selected-gradient`) for use in the browser preview only.
 * Power BI export never emits a CSS gradient — it uses the gradient's SOLID
 * fallback colour (first stop), surfaced here so the choice is explicit.
 */
export function GradientPicker() {
  const [query, setQuery] = useState('')
  const [family, setFamily] = useState('All')
  const [selected, setSelected] = useState<LibraryGradient | null>(null)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return GRADIENT_LIBRARY.filter(
      (g) =>
        (family === 'All' || g.family === family) &&
        (!needle || g.name.toLowerCase().includes(needle) || g.category.toLowerCase().includes(needle)),
    )
  }, [query, family])

  const shown = filtered.slice(0, MAX_TILES)

  // Apply the selected gradient to a root CSS variable so the web preview can
  // consume it. Cleared on unmount. This is preview-only — never exported.
  useEffect(() => {
    const root = document.documentElement
    if (selected) {
      root.style.setProperty('--dc-selected-gradient', selected.css)
      root.style.setProperty('--dc-selected-gradient-solid', selected.solid)
    }
    return () => {
      /* leave the last selection in place; do not thrash on re-render */
    }
  }, [selected])

  async function copyCss() {
    if (!selected) return
    try {
      await navigator.clipboard.writeText(selected.css)
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${GRADIENT_LIBRARY.length} gradients…`}
          spellCheck={false}
          style={{
            flex: 1, minWidth: 0, height: 27, border: '1px solid var(--border-ui)', borderRadius: 6,
            background: 'var(--surface)', color: 'var(--text)', fontSize: 11, padding: '0 8px', outline: 'none',
          }}
        />
        <select
          value={family}
          onChange={(e) => setFamily(e.target.value)}
          aria-label="Gradient family"
          style={{
            height: 27, border: '1px solid var(--border-ui)', borderRadius: 6, background: 'var(--surface)',
            color: 'var(--text-2)', fontSize: 10, padding: '0 4px', maxWidth: 110,
          }}
        >
          <option>All</option>
          {GRADIENT_FAMILIES.map((f) => (
            <option key={f}>{f}</option>
          ))}
        </select>
      </div>

      {selected && (
        <div
          style={{
            borderRadius: 8,
            border: '1px solid var(--border-ui)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ height: 44, background: selected.css, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: selected.textColor }}>{selected.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--surface)' }}>
            <span style={{ width: 16, height: 16, borderRadius: 4, background: selected.solid, border: '1px solid rgba(15,23,42,.2)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--text-3)', flex: 1, minWidth: 0 }}>
              Export fallback <strong style={{ color: 'var(--text-2)' }}>{selected.solid}</strong>
            </span>
            <button
              type="button"
              onClick={copyCss}
              title="Copy CSS gradient"
              style={{
                display: 'flex', alignItems: 'center', gap: 4, height: 24, padding: '0 8px',
                border: '1px solid var(--border-ui)', borderRadius: 6, background: 'var(--surface)',
                color: 'var(--text-2)', fontSize: 10, fontWeight: 700, cursor: 'pointer',
              }}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy CSS'}
            </button>
          </div>
        </div>
      )}

      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
        {filtered.length.toLocaleString()} gradients{filtered.length > MAX_TILES ? ` · showing ${MAX_TILES}` : ''}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 5,
          maxHeight: 220,
          overflowY: 'auto',
          paddingRight: 2,
        }}
      >
        {shown.map((g) => (
          <button
            key={g.code}
            type="button"
            onClick={() => setSelected(g)}
            title={`${g.name} · ${g.family}`}
            aria-label={`Select ${g.name}`}
            aria-pressed={selected?.code === g.code}
            style={{
              height: 30,
              borderRadius: 6,
              border: selected?.code === g.code ? '1.5px solid var(--accent-ui)' : '1px solid rgba(15,23,42,.18)',
              boxShadow: selected?.code === g.code ? '0 0 0 2px rgba(13,148,136,.14)' : 'none',
              background: g.css,
              cursor: 'pointer',
              padding: 0,
            }}
          />
        ))}
        {shown.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '12px 8px', fontSize: 10.5, color: 'var(--text-3)', textAlign: 'center' }}>
            No gradients match.
          </div>
        )}
      </div>
    </div>
  )
}
