'use client'

import { useState } from 'react'
import { sanitizeHex } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'

interface ColorFieldProps {
  label: string
  value: string
  onChange: (hex: string) => void
  onReset?: () => void
}

const HEX_INPUT = /^#?[0-9a-fA-F]{0,6}$/
const COMPLETE_HEX = /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/

type HexInputProps = Omit<ColorFieldProps, 'label'>

function HexInput({ value, onChange }: HexInputProps) {
  const [draft, setDraft] = useState(value)

  function commit(raw: string) {
    if (!COMPLETE_HEX.test(raw)) {
      setDraft(value)
      return
    }

    const next = sanitizeHex(raw).toUpperCase()
    setDraft(next)
    onChange(next)
  }

  return (
        <input
          value={draft}
          onChange={(event) => {
            const next = event.target.value
            if (HEX_INPUT.test(next)) setDraft(next.startsWith('#') ? next : `#${next}`)
          }}
          onBlur={() => commit(draft)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
          spellCheck={false}
          style={{
            minWidth: 0,
            flex: 1,
            height: 28,
            border: '1px solid var(--border-ui)',
            borderRadius: 6,
            padding: '0 7px',
            fontFamily: 'var(--font-jetbrains-mono, monospace)',
            fontSize: 10.5,
            color: 'var(--text)',
            background: 'var(--surface)',
          }}
        />
  )
}

function ColorField({ label, value, onChange, onReset }: ColorFieldProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="color"
          value={sanitizeHex(value)}
          onChange={(event) => onChange(sanitizeHex(event.target.value).toUpperCase())}
          aria-label={`${label} picker`}
          style={{ width: 28, height: 28, padding: 0, border: '1px solid var(--border-ui)', borderRadius: 6, background: 'transparent' }}
        />
        <HexInput key={value} value={value} onChange={onChange} />
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            title={`Reset ${label} to theme`}
            style={{
              height: 28,
              border: '1px solid var(--border-ui)',
              borderRadius: 6,
              background: 'var(--surface)',
              color: 'var(--text-3)',
              fontSize: 10,
              fontWeight: 750,
              padding: '0 7px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
        )}
      </span>
    </label>
  )
}

export function BrandColors() {
  const primary = useThemeStore((s) => s.primary)
  const accent = useThemeStore((s) => s.accent)
  const bg = useThemeStore((s) => s.bg)
  const customCanvasBackground = useThemeStore((s) => s.customCanvasBackground)
  const canvasBackgroundMode = useThemeStore((s) => s.canvasBackgroundMode)
  const visualBackgroundMode = useThemeStore((s) => s.visualBackgroundMode)
  const themeVisualBackground = useThemeStore((s) => s.visualBackground)
  const themeBorderColor = useThemeStore((s) => s.borderColor)
  const themeTitleColor = useThemeStore((s) => s.titleColor)
  const themeLabelColor = useThemeStore((s) => s.labelColor)
  const fg = useThemeStore((s) => s.fg)
  const good = useThemeStore((s) => s.good)
  const neutral = useThemeStore((s) => s.neutral)
  const bad = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)
  const formatProps = useThemeStore((s) => s.formatProps)
  const setPrimary = useThemeStore((s) => s.setPrimary)
  const setAccent = useThemeStore((s) => s.setAccent)
  const setBg = useThemeStore((s) => s.setBg)
  const resetCanvasBackground = useThemeStore((s) => s.resetCanvasBackground)
  const setVisualBackground = useThemeStore((s) => s.setVisualBackground)
  const resetVisualBackground = useThemeStore((s) => s.resetVisualBackground)
  const setFg = useThemeStore((s) => s.setFg)
  const setGood = useThemeStore((s) => s.setGood)
  const setNeutral = useThemeStore((s) => s.setNeutral)
  const setBad = useThemeStore((s) => s.setBad)
  const setTableAccent = useThemeStore((s) => s.setTableAccent)
  const updateGeneralFormat = useThemeStore((s) => s.updateGeneralFormat)

  const effectiveCanvasBackground = canvasBackgroundMode === 'custom' && customCanvasBackground
    ? customCanvasBackground
    : bg
  const visualBackground = visualBackgroundMode === 'custom' && typeof formatProps['general.background.color'] === 'string'
    ? formatProps['general.background.color']
    : themeVisualBackground
  const borderColor = typeof formatProps['general.border.color'] === 'string'
    ? formatProps['general.border.color']
    : themeBorderColor
  const titleColor = typeof formatProps['general.title.fontColor'] === 'string'
    ? formatProps['general.title.fontColor']
    : themeTitleColor
  const labelColor = typeof formatProps['general.label.fontColor'] === 'string'
    ? formatProps['general.label.fontColor']
    : themeLabelColor

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ColorField label="Primary"      value={primary}     onChange={setPrimary} />
      <ColorField label="Accent"       value={accent}      onChange={setAccent} />
      <ColorField label="Background"   value={effectiveCanvasBackground} onChange={setBg} onReset={resetCanvasBackground} />
      <ColorField label="Foreground"   value={fg}          onChange={setFg} />
      <ColorField label="Visual Background" value={visualBackground} onChange={setVisualBackground} onReset={resetVisualBackground} />
      <ColorField label="Visual Border"     value={borderColor}      onChange={(hex) => updateGeneralFormat('border.color', hex)} />
      <ColorField label="Title Text"        value={titleColor}       onChange={(hex) => updateGeneralFormat('title.fontColor', hex)} />
      <ColorField label="Label Text"        value={labelColor}       onChange={(hex) => updateGeneralFormat('label.fontColor', hex)} />
      <ColorField label="Good"         value={good}        onChange={setGood} />
      <ColorField label="Neutral"      value={neutral}     onChange={setNeutral} />
      <ColorField label="Bad"          value={bad}         onChange={setBad} />
      <ColorField label="Table Accent" value={tableAccent} onChange={setTableAccent} />
    </div>
  )
}
