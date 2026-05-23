'use client'

import { useRef, useState } from 'react'
import { Upload, Download, FileCode, Undo2, Redo2 } from 'lucide-react'
import { downloadThemeJSON, parseImportedThemeJSON } from '@/lib/themeGenerator'
import { downloadPBITemplate } from '@/lib/pbiTemplateExporter'
import { useCSSSync, useThemeStore } from '@/store/themeStore'
import { LeftSidebar } from './LeftSidebar'
import { RightPanel } from './RightPanel'
import { CanvasToolbar } from '@/components/canvas/CanvasToolbar'
import { VisualSelectorBar } from '@/components/canvas/VisualSelectorBar'
import { DashboardCanvas } from '@/components/canvas/DashboardCanvas'

export function AppShell() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [navStatus, setNavStatus] = useState<string | null>(null)
  const themeName = useThemeStore((s) => s.themeName)
  const setThemeName = useThemeStore((s) => s.setThemeName)
  const applyImportedTheme = useThemeStore((s) => s.applyImportedTheme)
  useCSSSync()

  function exportJson() {
    downloadThemeJSON(useThemeStore.getState())
    setNavStatus('Theme JSON exported')
  }

  function exportPbiTemplate() {
    downloadPBITemplate(useThemeStore.getState())
    setNavStatus('PBI Template downloaded')
  }

  async function importJson(file: File) {
    try {
      const patch = await parseImportedThemeJSON(file)
      const usableKeys = Object.keys(patch).filter((key) => key !== 'warnings')

      if (usableKeys.length === 0) {
        setNavStatus('No theme values found')
        window.alert('The JSON file loaded, but no supported Power BI theme values were found.')
        return
      }

      applyImportedTheme(patch)
      setNavStatus(`Imported ${patch.themeName ?? file.name}`)

      if (patch.warnings?.length) {
        window.alert(patch.warnings.join('\n'))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown import error.'
      setNavStatus('Import failed')
      window.alert(`Could not import this JSON file.\n\n${message}`)
    }
  }

  return (
    <div className="app-shell">
      {/* ── Top Navigation Bar (52 px) ── */}
      <header className="top-nav">
        {/* Brand mark */}
        <div className="nav-brand">
          <div className="nav-logo" aria-hidden="true">DC</div>
          <div>
            <div className="nav-title">Theme Studio</div>
            <div className="nav-sub">Power BI - Datacense</div>
          </div>
        </div>

        <div className="nav-divider" />

        {/* Datacense wordmark logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/datacense-logo.jpg"
          alt="Datacense"
          width={110}
          height={28}
          style={{ objectFit: 'contain', opacity: 0.85 }}
        />

        <div className="nav-divider" />

        {/* Editable theme name */}
        <div className="nav-center">
          <input
            className="nav-name-input"
            type="text"
            value={themeName}
            onChange={(e) => setThemeName(e.target.value)}
            onBlur={() => {
              if (!themeName.trim()) setThemeName('My PBI Theme')
            }}
            aria-label="Theme name"
            spellCheck={false}
          />
        </div>

        {/* Action buttons */}
        <div className="nav-actions">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void importJson(file)
              event.currentTarget.value = ''
            }}
          />

          <button
            className="nav-btn"
            title="Import a Power BI theme JSON file"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={13} strokeWidth={2} />
            Import JSON
          </button>

          <button className="nav-btn accent" title="Export theme as Power BI JSON" type="button" onClick={exportJson}>
            <Download size={13} strokeWidth={2} />
            Export JSON
          </button>

          <button className="nav-btn" title="Download Power BI layout template" type="button" onClick={exportPbiTemplate}>
            <FileCode size={13} strokeWidth={2} />
            PBI Template
          </button>

          <div className="nav-divider" />

          <button className="nav-icon-btn" title="Undo" aria-label="Undo" disabled>
            <Undo2 size={14} strokeWidth={2} />
          </button>
          <button className="nav-icon-btn" title="Redo" aria-label="Redo" disabled>
            <Redo2 size={14} strokeWidth={2} />
          </button>

          {navStatus && (
            <span aria-live="polite" style={{ fontSize: 10, color: 'var(--text-3)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {navStatus}
            </span>
          )}
        </div>
      </header>

      {/* ── 3-Column Content Area ── */}
      <div className="content-area">
        <LeftSidebar />

        <main className="center-area">
          <CanvasToolbar />
          <VisualSelectorBar />
          <DashboardCanvas />
        </main>

        <RightPanel />
      </div>
    </div>
  )
}
