'use client'

import { useRef } from 'react'
import { sanitizeHex } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'

export function ColorPalette() {
  const dataColors = useThemeStore((s) => s.dataColors)
  const setDataColor = useThemeStore((s) => s.setDataColor)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>Data Colors</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)' }}>Standard 10-colour theme palette</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 7 }}>
        {dataColors.slice(0, 10).map((color, index) => {
          return (
            <button
              key={index}
              type="button"
              onClick={() => inputRefs.current[index]?.click()}
              title={`Edit data color ${index + 1}: ${color}`}
              style={{
                position: 'relative',
                height: 38,
                borderRadius: 7,
                border: '1px solid rgba(15,23,42,.18)',
                background: color,
                color: 'white',
                overflow: 'hidden',
                cursor: 'pointer',
                fontSize: 10,
                fontWeight: 900,
                textShadow: '0 1px 2px rgba(0,0,0,.38)',
              }}
            >
              C{index + 1}
              <input
                ref={(node) => {
                  inputRefs.current[index] = node
                }}
                type="color"
                value={sanitizeHex(color)}
                onChange={(event) => setDataColor(index, sanitizeHex(event.target.value))}
                aria-label={`Data color ${index + 1}`}
                style={{ position: 'absolute', inset: 0, opacity: 0, pointerEvents: 'none' }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
