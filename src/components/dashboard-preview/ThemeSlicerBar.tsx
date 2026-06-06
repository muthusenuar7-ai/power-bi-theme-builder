'use client'

import { useState } from 'react'
import type { DashboardTheme } from '@/lib/dashboardThemeResolver'
import type { SlicerSpec } from '@/lib/themeDashboardTemplates'

interface Props {
  theme: DashboardTheme
  slicers: SlicerSpec[]
}

/**
 * ThemeSlicerBar — compact theme-driven slicer chips (Region / Segment / Year).
 *
 * Selection is local visual state only (the preview demonstrates theme effect,
 * it does not filter data). Active chip uses the theme primary; the chip group
 * sits on the theme chip background with theme borders.
 */
export function ThemeSlicerBar({ theme, slicers }: Props) {
  const [selected, setSelected] = useState<Record<string, string>>(
    () => Object.fromEntries(slicers.map((s) => [s.key, s.options[0]])),
  )

  const reset = () => setSelected(Object.fromEntries(slicers.map((s) => [s.key, s.options[0]])))

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', flexShrink: 0 }}>
      {slicers.map((slicer) => (
        <div key={slicer.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              fontSize: theme.labelFontSize,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              color: theme.mutedText,
            }}
          >
            {slicer.label}
          </span>
          <div
            style={{
              display: 'flex',
              gap: 2,
              padding: 2,
              borderRadius: Math.max(6, theme.borderRadius - 2),
              border: theme.borderEnabled ? `${Math.max(1, theme.borderWidth)}px solid ${theme.borderColor}` : '1px solid transparent',
              // Theme-driven chip-group surface (a soft tint derived from the
              // canvas); the active chip + outline still sit on top of it.
              background: theme.chipBackground,
            }}
          >
            {slicer.options.map((option) => {
              const on = selected[slicer.key] === option
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelected((prev) => ({ ...prev, [slicer.key]: option }))}
                  style={{
                    fontSize: theme.labelFontSize,
                    fontWeight: 600,
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
      ))}
      <button
        type="button"
        onClick={reset}
        style={{
          fontSize: theme.labelFontSize,
          color: theme.mutedText,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 6px',
          fontFamily: 'inherit',
        }}
      >
        ↺ Reset
      </button>
    </div>
  )
}
