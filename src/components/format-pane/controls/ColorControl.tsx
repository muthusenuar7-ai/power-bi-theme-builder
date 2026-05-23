'use client'

import { useState } from 'react'
import { sanitizeHex } from '@/lib/colorUtils'

interface ColorControlProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

const HEX_INPUT = /^#?[0-9a-fA-F]{0,6}$/
const COMPLETE_HEX = /^#?[0-9a-fA-F]{3}$|^#?[0-9a-fA-F]{6}$/

function HexInput({ value, onChange, disabled = false }: ColorControlProps) {
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
        disabled={disabled}
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
          width: 76,
          height: 25,
          border: '1px solid var(--border-ui)',
          borderRadius: 5,
          background: 'var(--surface)',
          color: 'var(--text)',
          padding: '0 6px',
          fontSize: 10,
          fontFamily: 'var(--font-jetbrains-mono, monospace)',
          opacity: disabled ? 0.58 : 1,
        }}
      />
  )
}

export function ColorControl({ value, onChange, disabled = false }: ColorControlProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <input
        type="color"
        value={sanitizeHex(value)}
        disabled={disabled}
        onChange={(event) => onChange(sanitizeHex(event.target.value).toUpperCase())}
        style={{ width: 25, height: 25, border: '1px solid var(--border-ui)', borderRadius: 5, padding: 0, background: 'transparent', flexShrink: 0, opacity: disabled ? 0.58 : 1 }}
        aria-label="Color picker"
      />
      <HexInput key={value} value={value} onChange={onChange} disabled={disabled} />
    </div>
  )
}
