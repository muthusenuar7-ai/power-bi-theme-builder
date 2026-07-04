'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import type { SlicerSpec } from '@/lib/themeDashboardTemplates'

interface Props {
  theme: DashboardTheme
  slicers: SlicerSpec[]
}

/**
 * ThemeSlicerBar — Power BI-style slicers driven entirely by the resolved theme.
 *
 * Three realistic slicer modes mirror Power BI:
 *   • button   → a segmented button group (single select)
 *   • dropdown → a single-select dropdown with a themed popover list
 *   • multi    → a multi-select dropdown with themed checkboxes
 *
 * Selection is local visual state only (the preview demonstrates theme effect,
 * it does not filter data). Every colour — trigger surface, border, text,
 * selected/hover state, popover background and dropdown text — comes from the
 * DashboardTheme, so slicers stay clean in both light and dark themes and never
 * fall back to default browser dropdown chrome.
 */
export function ThemeSlicerBar({ theme, slicers }: Props) {
  const defaultSingle = () =>
    Object.fromEntries(slicers.filter((s) => s.kind !== 'multi').map((s) => [s.key, s.options[0]]))
  const defaultMulti = () =>
    Object.fromEntries(slicers.filter((s) => s.kind === 'multi').map((s) => [s.key, [...s.options]]))

  const [single, setSingle] = useState<Record<string, string>>(defaultSingle)
  const [multi, setMulti] = useState<Record<string, string[]>>(defaultMulti)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const openWrapRef = useRef<HTMLDivElement | null>(null)

  // Close the open popover on any click outside it.
  useEffect(() => {
    if (!openKey) return
    const onDown = (event: MouseEvent) => {
      if (openWrapRef.current && !openWrapRef.current.contains(event.target as Node)) setOpenKey(null)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [openKey])

  const reset = () => {
    setSingle(defaultSingle())
    setMulti(defaultMulti())
    setOpenKey(null)
  }

  const rounded = Math.max(6, theme.borderRadius - 2)
  const borderW = Math.max(1, theme.borderWidth)

  function labelTag(label: string) {
    return (
      <span
        style={{
          fontSize: theme.labelFontSize,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          color: theme.mutedText,
        }}
      >
        {label}
      </span>
    )
  }

  /** Segmented button group (single select). */
  function ButtonSlicer({ slicer }: { slicer: SlicerSpec }) {
    const value = single[slicer.key]
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {labelTag(slicer.label)}
        <div
          style={{
            display: 'flex',
            gap: 2,
            padding: 2,
            borderRadius: rounded,
            border: theme.borderEnabled ? `${borderW}px solid ${theme.borderColor}` : '1px solid transparent',
            background: theme.chipBackground,
          }}
        >
          {slicer.options.map((option) => {
            const on = value === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSingle((prev) => ({ ...prev, [slicer.key]: option }))}
                style={{
                  fontSize: theme.labelFontSize,
                  fontWeight: on ? 700 : 600,
                  padding: '4px 11px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  color: on ? theme.chipActiveText : theme.mutedText,
                  background: on ? theme.chipActiveBackground : 'transparent',
                  transition: 'background .12s, color .12s',
                }}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  function triggerStyle(open: boolean): React.CSSProperties {
    return {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      height: 28,
      minWidth: 104,
      padding: '0 9px',
      borderRadius: rounded,
      border: `${borderW}px solid ${open ? theme.primary : theme.borderColor}`,
      background: theme.visualBackground,
      color: theme.foreground,
      fontSize: theme.labelFontSize,
      fontWeight: 600,
      cursor: 'pointer',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      boxShadow: open ? `0 0 0 2px color-mix(in srgb, ${theme.primary} 32%, transparent)` : 'none',
      transition: 'border-color .12s, box-shadow .12s',
    }
  }

  function panelStyle(): React.CSSProperties {
    return {
      position: 'absolute',
      top: 'calc(100% + 4px)',
      left: 0,
      zIndex: 60,
      minWidth: '100%',
      width: 'max-content',
      maxWidth: 220,
      background: theme.visualBackground,
      border: `1px solid ${theme.borderColor}`,
      borderRadius: rounded,
      boxShadow: theme.shadow || '0 10px 28px rgba(15,23,42,.22)',
      padding: 4,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }
  }

  function optionRow(opt: string, on: boolean, onClick: () => void, kind: 'single' | 'multi') {
    return (
      <button
        key={opt}
        type="button"
        onClick={onClick}
        onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = theme.chipBackground }}
        onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = 'transparent' }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 8px',
          borderRadius: 6,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: theme.labelFontSize,
          fontWeight: on ? 700 : 600,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          color: on ? theme.primary : theme.foreground,
          background: on ? `color-mix(in srgb, ${theme.primary} 14%, transparent)` : 'transparent',
        }}
      >
        {kind === 'multi' ? (
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              border: `1.5px solid ${on ? theme.primary : theme.borderColor}`,
              background: on ? theme.primary : 'transparent',
              color: theme.chipActiveText,
            }}
          >
            {on && <Check size={10} strokeWidth={3.5} />}
          </span>
        ) : (
          <Check size={13} strokeWidth={3} style={{ flexShrink: 0, color: theme.primary, opacity: on ? 1 : 0 }} />
        )}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{opt}</span>
      </button>
    )
  }

  /** Single-select dropdown. */
  function DropdownSlicer({ slicer }: { slicer: SlicerSpec }) {
    const open = openKey === slicer.key
    const value = single[slicer.key]
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {labelTag(slicer.label)}
        <div ref={open ? openWrapRef : undefined} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setOpenKey(open ? null : slicer.key)} style={triggerStyle(open)} aria-haspopup="listbox" aria-expanded={open}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
            <ChevronDown size={13} style={{ flexShrink: 0, color: theme.mutedText, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .12s' }} />
          </button>
          {open && (
            <div role="listbox" style={panelStyle()}>
              {slicer.options.map((opt) =>
                optionRow(opt, value === opt, () => { setSingle((prev) => ({ ...prev, [slicer.key]: opt })); setOpenKey(null) }, 'single'),
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  /** Multi-select dropdown. */
  function MultiSlicer({ slicer }: { slicer: SlicerSpec }) {
    const open = openKey === slicer.key
    const values = multi[slicer.key] ?? []
    const allOn = values.length === slicer.options.length
    const display = allOn ? 'All' : values.length === 0 ? '(None)' : values.length === 1 ? values[0] : `${values.length} selected`

    const toggle = (opt: string) =>
      setMulti((prev) => {
        const current = prev[slicer.key] ?? []
        const next = current.includes(opt) ? current.filter((o) => o !== opt) : [...current, opt]
        return { ...prev, [slicer.key]: next }
      })

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {labelTag(slicer.label)}
        <div ref={open ? openWrapRef : undefined} style={{ position: 'relative' }}>
          <button type="button" onClick={() => setOpenKey(open ? null : slicer.key)} style={triggerStyle(open)} aria-haspopup="listbox" aria-expanded={open}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{display}</span>
            <ChevronDown size={13} style={{ flexShrink: 0, color: theme.mutedText, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .12s' }} />
          </button>
          {open && (
            <div role="listbox" aria-multiselectable="true" style={panelStyle()}>
              {slicer.options.map((opt) => optionRow(opt, values.includes(opt), () => toggle(opt), 'multi'))}
              <div style={{ display: 'flex', gap: 4, marginTop: 2, paddingTop: 4, borderTop: `1px solid ${theme.borderColor}` }}>
                <button
                  type="button"
                  onClick={() => setMulti((prev) => ({ ...prev, [slicer.key]: [...slicer.options] }))}
                  style={miniLinkStyle()}
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={() => setMulti((prev) => ({ ...prev, [slicer.key]: [] }))}
                  style={miniLinkStyle()}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  function miniLinkStyle(): React.CSSProperties {
    return {
      flex: 1,
      padding: '4px 6px',
      borderRadius: 5,
      border: `1px solid ${theme.borderColor}`,
      background: 'transparent',
      color: theme.primary,
      fontSize: Math.max(9, theme.labelFontSize - 1),
      fontWeight: 700,
      cursor: 'pointer',
      fontFamily: 'inherit',
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flexShrink: 0, position: 'relative', zIndex: 5 }}>
      {slicers.map((slicer) => {
        if (slicer.kind === 'button') return <ButtonSlicer key={slicer.key} slicer={slicer} />
        if (slicer.kind === 'dropdown') return <DropdownSlicer key={slicer.key} slicer={slicer} />
        return <MultiSlicer key={slicer.key} slicer={slicer} />
      })}
      <button
        type="button"
        onClick={reset}
        title="Clear all slicers"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: theme.labelFontSize,
          fontWeight: 600,
          color: theme.mutedText,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          fontFamily: 'inherit',
        }}
      >
        <RotateCcw size={12} strokeWidth={2} /> Clear
      </button>
    </div>
  )
}
