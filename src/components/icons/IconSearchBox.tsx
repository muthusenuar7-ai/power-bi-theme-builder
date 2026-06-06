'use client'

import { Search } from 'lucide-react'

interface IconSearchBoxProps {
  value: string
  onChange: (value: string) => void
}

export function IconSearchBox({ value, onChange }: IconSearchBoxProps) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{
        fontSize: 10,
        fontWeight: 700,
        color: 'var(--text-3)',
        letterSpacing: '.07em',
        textTransform: 'uppercase',
      }}>
        Search icons
      </span>
      <span style={{ position: 'relative', display: 'block' }}>
        <Search
          size={13}
          strokeWidth={2}
          style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}
        />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search chart, user, truck..."
          aria-label="Search icons"
          style={{
            width: '100%',
            height: 32,
            borderRadius: 7,
            border: '1px solid var(--border-ui)',
            background: 'var(--surface)',
            color: 'var(--text)',
            fontSize: 11.5,
            padding: '0 9px 0 29px',
            outline: 'none',
          }}
        />
      </span>
    </label>
  )
}
