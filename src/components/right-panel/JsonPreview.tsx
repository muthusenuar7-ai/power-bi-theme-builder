'use client'

import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { Check, Copy, Download } from 'lucide-react'
import { downloadThemeJSON, generateThemeJSON } from '@/lib/themeGenerator'
import { useThemeStore } from '@/store/themeStore'

const buttonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  border: '1px solid var(--border-ui)',
  borderRadius: 6,
  padding: '5px 8px',
  fontSize: 10.5,
  fontWeight: 700,
  color: 'var(--text-2)',
  background: 'var(--surface)',
  cursor: 'pointer',
}

export function JsonPreview() {
  const state = useThemeStore()
  const [copied, setCopied] = useState(false)

  const theme = useMemo(() => generateThemeJSON(state), [state])
  const json = useMemo(() => JSON.stringify(theme, null, 2), [theme])

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
      window.alert('Could not copy JSON to the clipboard.')
    }
  }

  return (
    <div style={{ margin: '0 14px 14px' }}>
      <div
        style={{
          borderRadius: 'var(--r-md)',
          border: '1px solid var(--border-ui)',
          overflow: 'hidden',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            padding: '9px 12px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border-ui)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--text-3)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            JSON Preview
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" style={buttonStyle} onClick={copyJson} title="Copy generated Power BI theme JSON">
              {copied ? <Check size={12} strokeWidth={2.2} /> : <Copy size={12} strokeWidth={2.2} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              type="button"
              style={{ ...buttonStyle, background: 'var(--accent-ui)', border: '1px solid var(--accent-ui)', color: 'white' }}
              onClick={() => downloadThemeJSON(state)}
              title="Export generated Power BI theme JSON"
            >
              <Download size={12} strokeWidth={2.2} />
              Export
            </button>
          </div>
        </div>

        <pre
          style={{
            margin: 0,
            maxHeight: 360,
            padding: '12px',
            overflow: 'auto',
            background: '#111827',
            color: '#D1D5DB',
            fontFamily: 'var(--font-jetbrains-mono, "JetBrains Mono", monospace)',
            fontSize: 9.5,
            lineHeight: 1.55,
            whiteSpace: 'pre',
          }}
        >
          {json}
        </pre>
      </div>
    </div>
  )
}
