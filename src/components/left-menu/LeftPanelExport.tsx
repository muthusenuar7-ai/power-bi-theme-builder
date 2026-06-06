'use client'

import { useRef, useState } from 'react'
import { Download, Image as ImageIcon, LayoutGrid, Upload } from 'lucide-react'
import { downloadThemeJSON, parseImportedThemeJSON } from '@/lib/themeGenerator'
import { downloadLayoutJSON } from '@/lib/layoutExporter'
import { exportCanvasPNG } from '@/lib/canvasExport'
import { useThemeStore } from '@/store/themeStore'

interface ExportBtnProps {
  icon: React.ReactNode
  label: string
  sub: string
  onClick: () => void
  accent?: boolean
  disabled?: boolean
}

function ExportBtn({ icon, label, sub, onClick, accent, disabled }: ExportBtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 12px',
        border: accent ? '1px solid var(--accent-ui)' : '1px solid var(--border-ui)',
        borderRadius: 10,
        background: accent ? 'var(--accent-ui)' : 'var(--surface)',
        color: accent ? '#fff' : 'var(--text)',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        textAlign: 'left', fontFamily: 'inherit',
        transition: 'border-color .12s, background .12s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = 'var(--accent-ui)'
          if (!accent) e.currentTarget.style.background = 'var(--surface-2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = accent ? 'var(--accent-ui)' : 'var(--border-ui)'
          if (!accent) e.currentTarget.style.background = 'var(--surface)'
        }
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
        background: accent ? 'rgba(255,255,255,.18)' : 'var(--surface-2)',
        border: accent ? '1px solid rgba(255,255,255,.25)' : '1px solid var(--border-ui)',
        display: 'grid', placeItems: 'center',
        color: accent ? '#fff' : 'var(--accent-ui)',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 10, color: accent ? 'rgba(255,255,255,.7)' : 'var(--text-3)', marginTop: 1 }}>{sub}</div>
      </div>
    </button>
  )
}

export function LeftPanelExport() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const applyImportedTheme = useThemeStore((s) => s.applyImportedTheme)

  function notify(msg: string) {
    setStatus(msg)
    window.setTimeout(() => setStatus(null), 3000)
  }

  function handleExportJson() {
    downloadThemeJSON(useThemeStore.getState())
    notify('✓ Theme JSON exported')
  }

  function handleExportPng() {
    setBusy('png')
    exportCanvasPNG(useThemeStore.getState())
      .then((filename) => notify(`✓ PNG saved: ${filename}`))
      .catch((e) => notify(e instanceof Error ? e.message : 'PNG export failed'))
      .finally(() => setBusy(null))
  }

  function handleExportLayout() {
    downloadLayoutJSON(useThemeStore.getState())
    notify('✓ Layout JSON downloaded')
  }

  async function handleImport(file: File) {
    try {
      setBusy('import')
      const patch = await parseImportedThemeJSON(file)
      const usableKeys = Object.keys(patch).filter((key) => key !== 'warnings')
      if (usableKeys.length === 0) {
        notify('No theme values found in file')
        window.alert('The JSON loaded but no supported theme values were found.')
        return
      }
      applyImportedTheme(patch)
      notify(`✓ Imported ${patch.themeName ?? file.name}`)
      if (patch.warnings?.length) window.alert(patch.warnings.join('\n'))
    } catch (error) {
      notify('Import failed')
      window.alert(`Could not import: ${error instanceof Error ? error.message : 'Unknown error.'}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Status message */}
      {status && (
        <div style={{
          padding: '8px 12px', borderRadius: 8, fontSize: 11,
          background: 'var(--accent-soft)', color: 'var(--accent-2)',
          border: '1px solid rgba(13,148,136,.25)', fontWeight: 600,
        }}>
          {status}
        </div>
      )}

      {/* ── Export ── */}
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '.07em', textTransform: 'uppercase' }}>
        Export
      </div>

      <ExportBtn
        icon={<Download size={14} strokeWidth={2} />}
        label="Export JSON"
        sub="Power BI theme (.json)"
        onClick={handleExportJson}
        accent
      />
      <ExportBtn
        icon={<ImageIcon size={14} strokeWidth={2} />}
        label="Export PNG"
        sub="Canvas screenshot (.png)"
        onClick={handleExportPng}
        disabled={busy === 'png'}
      />
      <ExportBtn
        icon={<LayoutGrid size={14} strokeWidth={2} />}
        label="Layout JSON"
        sub="Dashboard layout (.json)"
        onClick={handleExportLayout}
      />
      {/* ── Import ── */}
      <div style={{
        fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '.07em', textTransform: 'uppercase',
        marginTop: 4,
      }}>
        Import
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImport(file)
          e.currentTarget.value = ''
        }}
      />
      <ExportBtn
        icon={<Upload size={14} strokeWidth={2} />}
        label="Import JSON"
        sub="Load an existing Power BI theme"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy === 'import'}
      />

      <div style={{
        padding: '10px 12px', borderRadius: 8, fontSize: 10.5,
        background: 'var(--surface-2)', border: '1px solid var(--border-ui)',
        color: 'var(--text-3)', lineHeight: 1.5,
      }}>
        All exports use the current theme state. The Export JSON button in the top nav also works.
      </div>
    </div>
  )
}
