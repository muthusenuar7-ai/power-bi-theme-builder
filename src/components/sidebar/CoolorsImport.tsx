'use client'

import { useRef, useState } from 'react'
import { Check, FileUp } from 'lucide-react'
import { parseCoolorsFile, parseCoolorsUrl } from '@/lib/coolorsParser'
import { useThemeStore } from '@/store/themeStore'

function padColors(colors: string[], existing: string[]): string[] {
  return [...colors, ...existing].slice(0, 8)
}

export function CoolorsImport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const existingColors = useThemeStore((s) => s.dataColors)
  const setDataColors = useThemeStore((s) => s.setDataColors)
  const setPrimary = useThemeStore((s) => s.setPrimary)
  const setAccent = useThemeStore((s) => s.setAccent)
  const [url, setUrl] = useState('')
  const [extracted, setExtracted] = useState<string[]>([])
  const [message, setMessage] = useState('Paste a Coolors URL or import text with hex values.')

  function showColors(colors: string[], source: string) {
    if (colors.length === 0) {
      setExtracted([])
      setMessage(`No valid colors found in ${source}.`)
      return
    }

    setExtracted(colors)
    setMessage(`${colors.length} color${colors.length === 1 ? '' : 's'} detected.`)
  }

  function applyColors() {
    if (extracted.length === 0) {
      setMessage('Read a palette before applying.')
      return
    }

    const colors = padColors(extracted, existingColors)
    setDataColors(colors)
    setPrimary(colors[0])
    setAccent(colors[1] ?? colors[0])
    setMessage('Palette applied to data colors.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-3)' }}>Coolors URL</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://coolors.co/0d9488-3b82f6..."
            style={{
              flex: 1,
              minWidth: 0,
              height: 28,
              border: '1px solid var(--border-ui)',
              borderRadius: 6,
              padding: '0 8px',
              fontSize: 11,
              color: 'var(--text)',
              background: 'var(--surface)',
            }}
          />
          <button
            type="button"
            onClick={() => showColors(parseCoolorsUrl(url), 'the URL')}
            style={{
              height: 28,
              border: '1px solid var(--border-ui)',
              borderRadius: 6,
              padding: '0 9px',
              fontSize: 10.5,
              fontWeight: 800,
              color: 'var(--text-2)',
              background: 'var(--surface-2)',
              cursor: 'pointer',
            }}
          >
            Read
          </button>
        </div>
      </label>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.csv,.json"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = () => showColors(parseCoolorsFile(String(reader.result ?? '')), file.name)
          reader.onerror = () => setMessage('Could not read that file.')
          reader.readAsText(file)
          event.currentTarget.value = ''
        }}
      />

      <div style={{ display: 'flex', gap: 6 }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            height: 28,
            border: '1px solid var(--border-ui)',
            borderRadius: 6,
            background: 'var(--surface)',
            color: 'var(--text-2)',
            fontSize: 10.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <FileUp size={12} strokeWidth={2.2} />
          Import file
        </button>
        <button
          type="button"
          onClick={applyColors}
          style={{
            flex: 1,
            height: 28,
            border: '1px solid var(--accent-ui)',
            borderRadius: 6,
            background: 'var(--accent-ui)',
            color: 'white',
            fontSize: 10.5,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Check size={12} strokeWidth={2.2} />
          Apply
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
        {padColors(extracted, existingColors).map((color, index) => (
          <div
            key={`${color}-${index}`}
            title={color}
            style={{ height: 20, borderRadius: 4, border: '1px solid var(--border-ui)', background: color }}
          />
        ))}
      </div>
      <div style={{ fontSize: 10.5, color: extracted.length ? 'var(--text-2)' : 'var(--text-3)', lineHeight: 1.4 }}>{message}</div>
    </div>
  )
}
