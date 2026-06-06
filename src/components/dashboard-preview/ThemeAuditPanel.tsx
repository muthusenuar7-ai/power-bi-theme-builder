'use client'

import { useEffect, useMemo, useState } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { getThemeAudit, type AuditStatus } from '@/lib/themeAudit'
import { resolveDashboardTheme } from '@/lib/dashboardThemeResolver'

/**
 * ThemeAuditPanel — DEVELOPMENT-ONLY diagnostic.
 *
 * Renders a small, collapsible overlay listing the active theme state values
 * (and which are missing), and console.table()s the same audit whenever a value
 * changes. It mounts only when `process.env.NODE_ENV === 'development'` (the
 * mount site in DashboardCanvas guards it, so it is tree-shaken from production
 * builds). It reads state read-only and never mutates the store.
 */
export function ThemeAuditPanel() {
  const themeName = useThemeStore((s) => s.themeName)
  const paletteSize = useThemeStore((s) => s.paletteSize)
  const dataColors = useThemeStore((s) => s.dataColors)
  const primary = useThemeStore((s) => s.primary)
  const accent = useThemeStore((s) => s.accent)
  const bg = useThemeStore((s) => s.bg)
  const customCanvasBackground = useThemeStore((s) => s.customCanvasBackground)
  const visualBackground = useThemeStore((s) => s.visualBackground)
  const cardBackground = useThemeStore((s) => s.cardBackground)
  const borderColor = useThemeStore((s) => s.borderColor)
  const titleColor = useThemeStore((s) => s.titleColor)
  const labelColor = useThemeStore((s) => s.labelColor)
  const canvasBackgroundMode = useThemeStore((s) => s.canvasBackgroundMode)
  const visualBackgroundMode = useThemeStore((s) => s.visualBackgroundMode)
  const fg = useThemeStore((s) => s.fg)
  const good = useThemeStore((s) => s.good)
  const neutral = useThemeStore((s) => s.neutral)
  const bad = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)
  const formatProps = useThemeStore((s) => s.formatProps)

  const [open, setOpen] = useState(false)

  // Resolve the same DashboardTheme the preview uses, so the audit reports the
  // concrete derived values (not "missing") for non-explicit properties.
  const theme = useMemo(
    () =>
      resolveDashboardTheme({
        dataColors, paletteSize, primary, accent, bg, customCanvasBackground, visualBackground, cardBackground, borderColor, titleColor, labelColor, canvasBackgroundMode, visualBackgroundMode, fg, good, neutral, bad, tableAccent, formatProps,
      }),
    [dataColors, paletteSize, primary, accent, bg, customCanvasBackground, visualBackground, cardBackground, borderColor, titleColor, labelColor, canvasBackgroundMode, visualBackgroundMode, fg, good, neutral, bad, tableAccent, formatProps],
  )

  const audit = getThemeAudit(
    { themeName, paletteSize, dataColors, bg, customCanvasBackground, visualBackground, cardBackground, borderColor, titleColor, labelColor, canvasBackgroundMode, visualBackgroundMode, fg, good, neutral, bad, tableAccent, formatProps },
    theme,
  )

  // Log the audit table whenever a tracked value changes.
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.table(audit.fields)
    // eslint-disable-next-line no-console
    if (audit.missing.length) console.info('[theme-audit] missing:', audit.missing.join(', '))
    // audit is rebuilt each render from the deps below; logging on those deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bg, customCanvasBackground, visualBackground, cardBackground, borderColor, titleColor, labelColor, canvasBackgroundMode, visualBackgroundMode, fg, good, neutral, bad, tableAccent, paletteSize, dataColors, formatProps, themeName])

  const STATUS_COLOR: Record<AuditStatus, string> = {
    set: '#E2E8F0',
    derived: '#93C5FD',
    'dashboard-only': '#FCD34D',
    missing: '#FCA5A5',
  }
  const STATUS_TAG: Record<AuditStatus, string> = {
    set: '',
    derived: ' ·derived',
    'dashboard-only': ' ·preview',
    missing: '',
  }

  const dot = (v: string | number | null) =>
    typeof v === 'string' && /^#|rgb|hsl/i.test(v) ? (
      <span
        style={{
          display: 'inline-block',
          width: 10,
          height: 10,
          borderRadius: 2,
          background: v,
          border: '1px solid rgba(255,255,255,.35)',
          marginRight: 6,
          verticalAlign: 'middle',
        }}
      />
    ) : null

  return (
    <div
      style={{
        position: 'absolute',
        left: 12,
        bottom: 12,
        zIndex: 50,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 11,
        color: '#E2E8F0',
        background: 'rgba(15,23,42,.92)',
        border: '1px solid rgba(148,163,184,.3)',
        borderRadius: 8,
        boxShadow: '0 8px 24px rgba(0,0,0,.35)',
        maxWidth: 280,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          color: '#93C5FD',
          fontWeight: 700,
          fontSize: 11,
          padding: '6px 10px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span>🔎 Theme Audit (dev)</span>
        <span style={{ opacity: 0.7 }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 10px 10px', maxHeight: 320, overflow: 'auto' }}>
          <div style={{ opacity: 0.7, marginBottom: 4 }}>
            {audit.themeName} · {audit.dataColorsCount} colours
          </div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 6, flexWrap: 'wrap' }}>
            {audit.dataColors.map((c, i) => (
              <span
                key={`${c}-${i}`}
                title={c}
                style={{ width: 12, height: 12, borderRadius: 2, background: c, border: '1px solid rgba(255,255,255,.25)' }}
              />
            ))}
          </div>
          {Object.entries(audit.fields).map(([name, f]) => (
            <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '1px 0' }}>
              <span style={{ opacity: 0.85 }}>{name}</span>
              <span style={{ color: STATUS_COLOR[f.status] }}>
                {dot(f.value)}
                {f.value === null ? 'missing' : String(f.value)}
                <span style={{ opacity: 0.6, fontSize: 9 }}>{STATUS_TAG[f.status]}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
