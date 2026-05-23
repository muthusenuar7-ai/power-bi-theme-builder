'use client'

import { useMemo, useState } from 'react'
import { PRESET_CATEGORIES, getPresetsByCategory } from '@/lib/presets'
import { useThemeStore } from '@/store/themeStore'
import type { PresetTheme } from '@/types'

function matchesPreset(preset: PresetTheme, colors: string[], bg: string, fg: string): boolean {
  return (
    preset.bg.toUpperCase() === bg.toUpperCase() &&
    preset.fg.toUpperCase() === fg.toUpperCase() &&
    preset.colors.every((color, index) => color.toUpperCase() === colors[index]?.toUpperCase())
  )
}

export function PresetThemes() {
  const [category, setCategory] = useState<string>('All')
  const dataColors = useThemeStore((s) => s.dataColors)
  const bg = useThemeStore((s) => s.bg)
  const fg = useThemeStore((s) => s.fg)
  const applyPreset = useThemeStore((s) => s.applyPreset)
  const presets = useMemo(() => getPresetsByCategory(category), [category])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {PRESET_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            style={{
              border: '1px solid var(--border-ui)',
              borderRadius: 999,
              padding: '4px 8px',
              fontSize: 10.5,
              fontWeight: 700,
              background: category === cat ? 'var(--accent-ui)' : 'var(--surface)',
              color: category === cat ? 'white' : 'var(--text-2)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 252, overflowY: 'auto', paddingRight: 2 }}>
        {presets.map((preset) => {
          const active = matchesPreset(preset, dataColors, bg, fg)
          return (
            <button
              key={`${preset.cat}-${preset.name}`}
              type="button"
              onClick={() => applyPreset(preset)}
              style={{
                border: active ? '1px solid var(--accent-ui)' : '1px solid var(--border-ui)',
                boxShadow: active ? '0 0 0 2px rgba(13,148,136,.16)' : 'none',
                borderRadius: 8,
                background: active ? 'var(--accent-soft)' : 'var(--surface)',
                cursor: 'pointer',
                padding: 7,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', height: 12, overflow: 'hidden', borderRadius: 3 }}>
                {preset.colors.slice(0, 5).map((color, index) => (
                  <span key={`${color}-${index}`} style={{ flex: 1, background: color }} />
                ))}
              </div>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--text)', lineHeight: 1.2 }}>{preset.name}</span>
              <span style={{ fontSize: 9.5, color: 'var(--text-3)' }}>{preset.cat}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
