'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Upload, Download, Undo2, Redo2, Home, RotateCcw, LayoutDashboard } from 'lucide-react'
import { downloadThemeJSON, parseImportedThemeJSON } from '@/lib/themeGenerator'
import { useCSSSync, useThemeStore } from '@/store/themeStore'
import { LeftMenu } from './LeftMenu'
import { RightPanel } from './RightPanel'
import { DashboardCanvas } from '@/components/canvas/DashboardCanvas'

export function AppShell() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [navStatus, setNavStatus] = useState<string | null>(null)
  const [returnTo, setReturnTo] = useState<string | null>(null)

  // Read on the client only — avoids the Next.js Suspense requirement that
  // comes with useSearchParams() on this otherwise-static page.
  useEffect(() => {
    if (typeof window === 'undefined') return
    setReturnTo(new URLSearchParams(window.location.search).get('returnTo'))
  }, [])
  const themeName = useThemeStore((s) => s.themeName)
  const setThemeName = useThemeStore((s) => s.setThemeName)
  const applyImportedTheme = useThemeStore((s) => s.applyImportedTheme)
  const canUndo = useThemeStore((s) => s.historyPast.length > 0)
  const canRedo = useThemeStore((s) => s.historyFuture.length > 0)
  const undo = useThemeStore((s) => s.undo)
  const redo = useThemeStore((s) => s.redo)
  const resetAllFormatting = useThemeStore((s) => s.resetAllFormatting)
  useCSSSync()

  // The editor is a fixed full-viewport workspace: lock <body> scroll while
  // it is mounted so the inner panels own their own scrolling. Other routes
  // (landing, /icons, /layout-builder) scroll normally because this class is
  // only present on /editor.
  //
  // The lock is asserted on mount and removed on unmount. A `pageshow` guard
  // re-asserts it when THIS page is restored from the browser back/forward
  // (bfcache) cache — without it a restored editor could paint unlocked. The
  // unmount cleanup is the single source of truth for removing the class, so
  // it can never leak onto the landing / other routes when the user navigates
  // away (verified: body has no `app-locked` class on any non-editor route).
  useEffect(() => {
    const lock = () => document.body.classList.add('app-locked')
    const onPageShow = () => lock()
    lock()
    window.addEventListener('pageshow', onPageShow)
    return () => {
      window.removeEventListener('pageshow', onPageShow)
      document.body.classList.remove('app-locked')
    }
  }, [])

  function exportJson() {
    downloadThemeJSON(useThemeStore.getState())
    setNavStatus('Theme JSON exported')
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
        {/* Brand mark — links back to the landing page */}
        <Link href="/" className="nav-brand" title="Back to home" style={{ textDecoration: 'none' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/datacense-logo.jpg"
            alt="Datacense"
            style={{ height: 28, width: 'auto', borderRadius: 4, objectFit: 'contain', flexShrink: 0 }}
          />
          <div>
            <div className="nav-title">Power BI Theme Studio</div>
            <div className="nav-sub">Datacense</div>
          </div>
        </Link>

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

          <div className="nav-status-actions" aria-label="Formatting actions">
            <button
              className="nav-icon-btn"
              title="Undo last theme or formatting change"
              aria-label="Undo"
              type="button"
              disabled={!canUndo}
              onClick={() => {
                undo()
                setNavStatus('Undo applied')
              }}
            >
              <Undo2 size={14} strokeWidth={2} />
            </button>
            <button
              className="nav-icon-btn"
              title="Redo theme or formatting change"
              aria-label="Redo"
              type="button"
              disabled={!canRedo}
              onClick={() => {
                redo()
                setNavStatus('Redo applied')
              }}
            >
              <Redo2 size={14} strokeWidth={2} />
            </button>
            <button
              className="nav-btn nav-reset-btn"
              title="Reset all General and Visual formatting overrides"
              type="button"
              onClick={() => {
                resetAllFormatting()
                setNavStatus('Reset to theme defaults')
              }}
            >
              <RotateCcw size={13} strokeWidth={2} />
              Reset
            </button>
            <span className="nav-status-text" aria-live="polite">
              {navStatus ?? 'Theme ready'}
            </span>
          </div>

          {returnTo === '/layout-builder' && (
            <Link className="nav-btn accent" href="/layout-builder" title="Return to the Layout Builder">
              <LayoutDashboard size={13} strokeWidth={2} />
              Return to Layout Builder
            </Link>
          )}

          <Link className="nav-btn" href="/" title="Back to home">
            <Home size={13} strokeWidth={2} />
            Home
          </Link>
        </div>
      </header>

      {/* ── 3-Column Content Area ── */}
      <div className="content-area">
        <LeftMenu />

        <main className="center-area">
          <DashboardCanvas />
        </main>

        <RightPanel />
      </div>
    </div>
  )
}
