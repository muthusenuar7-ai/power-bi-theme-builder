'use client'

import { FONT_OPTIONS } from '@/lib/formatProps'
import { useThemeStore } from '@/store/themeStore'

const SIZE_FIELDS = [
  { key: 'general.callout.fontSize', label: 'Callout size', min: 16, max: 56, fallback: 36 },
  { key: 'general.title.fontSize', label: 'Title size', min: 8, max: 32, fallback: 14 },
  { key: 'general.header.fontSize', label: 'Header size', min: 8, max: 28, fallback: 11 },
  { key: 'general.label.fontSize', label: 'Label size', min: 7, max: 18, fallback: 9 },
] as const

function numberValue(value: string | number | boolean | undefined, fallback: number): number {
  return typeof value === 'number' ? value : fallback
}

export function Typography() {
  const formatProps = useThemeStore((s) => s.formatProps)
  const setProp = useThemeStore((s) => s.setProp)
  const fontFace = typeof formatProps['general.typography.fontFace'] === 'string'
    ? formatProps['general.typography.fontFace']
    : 'Segoe UI'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>Font family</span>
        <select
          value={fontFace}
          onChange={(event) => setProp('general.typography.fontFace', event.target.value)}
          style={{
            height: 30,
            border: '1px solid var(--border-ui)',
            borderRadius: 6,
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 11,
            padding: '0 8px',
            fontFamily: 'inherit',
          }}
        >
          {FONT_OPTIONS.map((font) => (
            <option key={font} value={font}>{font}</option>
          ))}
        </select>
      </label>

      {SIZE_FIELDS.map((field) => {
        const value = numberValue(formatProps[field.key], field.fallback)
        return (
          <label key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>
              {field.label}
              <span style={{ color: 'var(--text-2)' }}>{value}px</span>
            </span>
            <input
              type="range"
              min={field.min}
              max={field.max}
              value={value}
              onChange={(event) => setProp(field.key, Number(event.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-ui)' }}
            />
          </label>
        )
      })}
    </div>
  )
}
