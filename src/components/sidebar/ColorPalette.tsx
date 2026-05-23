'use client'

import { useRef } from 'react'
import { sanitizeHex } from '@/lib/colorUtils'
import { useThemeStore } from '@/store/themeStore'

export function ColorPalette() {
  const dataColors = useThemeStore((s) => s.dataColors)
  const setDataColor = useThemeStore((s) => s.setDataColor)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {dataColors.slice(0, 8).map((color, index) => (
        <button
          key={index}
          type="button"
          onClick={() => inputRefs.current[index]?.click()}
          title={`Edit data color ${index + 1}: ${color}`}
          style={{
            position: 'relative',
            height: 54,
            borderRadius: 8,
            border: '1px solid rgba(15,23,42,.16)',
            background: color,
            color: 'white',
            overflow: 'hidden',
            cursor: 'pointer',
            fontSize: 10.5,
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
      ))}
    </div>
  )
}
