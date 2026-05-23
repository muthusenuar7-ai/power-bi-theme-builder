'use client'

import { useState } from 'react'
import { Download, LayoutGrid, FileCode } from 'lucide-react'
import { useThemeStore } from '@/store/themeStore'
import { exportCanvasPNG } from '@/lib/canvasExport'
import { downloadLayoutJSON } from '@/lib/layoutExporter'
import { PAGE_SIZES, PAGE_SIZE_KEYS } from '@/lib/pageSizes'
import { downloadPBITemplate } from '@/lib/pbiTemplateExporter'
import type { ZoomLevel, SlicerPosition } from '@/types'

const ZOOM_OPTIONS = [
  { value: 'fit',  label: 'Fit'  },
  { value: '0.25', label: '25%'  },
  { value: '0.5',  label: '50%'  },
  { value: '0.75', label: '75%'  },
  { value: '1',    label: '100%' },
]

function toZoomStr(z: ZoomLevel): string { return z === 'fit' ? 'fit' : String(z) }
function fromZoomStr(s: string): ZoomLevel { return s === 'fit' ? 'fit' : (parseFloat(s) as ZoomLevel) }

const S = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
    height: 46, flexShrink: 0, background: '#FFFFFF',
    borderBottom: '1px solid #E2E8F0', overflowX: 'auto' as const,
    scrollbarWidth: 'none' as const,
  } as React.CSSProperties,
  group: {
    display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0,
  } as React.CSSProperties,
  label: {
    fontSize: 10, fontWeight: 600, color: '#94A3B8',
    letterSpacing: '0.06em', textTransform: 'uppercase' as const, whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
  divider: { width: 1, height: 22, background: '#E2E8F0', flexShrink: 0 } as React.CSSProperties,
  select: {
    height: 28, padding: '0 6px', fontSize: 12, fontFamily: 'inherit',
    border: '1px solid #E2E8F0', borderRadius: 6, background: '#FFFFFF',
    color: '#0F172A', outline: 'none', cursor: 'pointer', flexShrink: 0,
  } as React.CSSProperties,
  actions: { marginLeft: 'auto', display: 'flex', gap: 5, alignItems: 'center', flexShrink: 0 } as React.CSSProperties,
  btn: {
    height: 27, padding: '0 9px', fontSize: 11, fontWeight: 500,
    border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569',
    borderRadius: 6, cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
    gap: 5, fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,
}

export function CanvasToolbar() {
  const [exporting, setExporting] = useState<'png' | 'layout' | 'template' | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const pageSize    = useThemeStore((s) => s.pageSize)
  const zoom        = useThemeStore((s) => s.zoom)
  const layout      = useThemeStore((s) => s.layout)
  const spacing     = useThemeStore((s) => s.spacing)
  const setPageSize = useThemeStore((s) => s.setPageSize)
  const setZoom     = useThemeStore((s) => s.setZoom)
  const setLayout   = useThemeStore((s) => s.setLayout)
  const setSpacing  = useThemeStore((s) => s.setSpacing)

  function notify(message: string): void {
    setStatus(message)
    window.setTimeout(() => setStatus(null), 2800)
  }

  async function handlePngExport(): Promise<void> {
    try {
      setExporting('png')
      const filename = await exportCanvasPNG(useThemeStore.getState())
      notify(`PNG exported: ${filename}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed.'
      notify(message || 'Unable to capture canvas')
    } finally {
      setExporting(null)
    }
  }

  function handleLayoutExport(): void {
    try {
      setExporting('layout')
      downloadLayoutJSON(useThemeStore.getState())
      notify('Layout JSON downloaded')
    } catch {
      notify('Layout export failed')
    } finally {
      setExporting(null)
    }
  }

  function handleTemplateExport(): void {
    try {
      setExporting('template')
      downloadPBITemplate(useThemeStore.getState())
      notify('PBI Template downloaded')
    } catch {
      notify('PBI Template export failed')
    } finally {
      setExporting(null)
    }
  }

  const isBusy = exporting !== null

  return (
    <div style={S.bar}>
      {/* Page Size */}
      <div style={S.group}>
        <span style={S.label}>Page</span>
        <select style={S.select} value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
          {PAGE_SIZE_KEYS.map((k) => (
            <option key={k} value={k}>{PAGE_SIZES[k].label}</option>
          ))}
        </select>
      </div>

      <div style={S.divider} />

      {/* Zoom */}
      <div style={S.group}>
        <span style={S.label}>Zoom</span>
        <select style={{ ...S.select, width: 70 }} value={toZoomStr(zoom)} onChange={(e) => setZoom(fromZoomStr(e.target.value))}>
          {ZOOM_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={S.divider} />

      {/* Slicers */}
      <div style={S.group}>
        <span style={S.label}>Slicers</span>
        <select style={{ ...S.select, width: 50 }} value={layout.numSlicers}
          onChange={(e) => setLayout({ numSlicers: Number(e.target.value) })}>
          {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <select style={{ ...S.select, width: 68 }} value={layout.slicerPos}
          disabled={layout.numSlicers === 0}
          onChange={(e) => setLayout({ slicerPos: e.target.value as SlicerPosition })}>
          {(['top', 'left', 'right'] as SlicerPosition[]).map((p) => (
            <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
          ))}
        </select>
      </div>

      <div style={S.divider} />

      {/* KPIs */}
      <div style={S.group}>
        <span style={S.label}>KPIs</span>
        <select style={{ ...S.select, width: 50 }} value={layout.numKpis}
          onChange={(e) => setLayout({ numKpis: Number(e.target.value) })}>
          {[0, 2, 3, 4, 5, 6, 8].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      <div style={S.divider} />

      {/* Spacing */}
      <div style={S.group}>
        <span style={S.label}>Gap</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 110 }}>
          <input type="range" min={4} max={28} value={spacing}
            onChange={(e) => setSpacing(Number(e.target.value))}
            style={{ flex: 1, height: 4, accentColor: 'var(--accent-ui, #0D9488)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 10.5, color: '#475569', fontFamily: 'monospace', width: 24, textAlign: 'right' }}>
            {spacing}
          </span>
        </div>
      </div>

      {/* Export actions */}
      <div style={S.actions}>
        {status && (
          <span aria-live="polite" style={{ fontSize: 10.5, color: '#475569', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {status}
          </span>
        )}
        <button
          type="button"
          title="Export the visible report canvas as PNG"
          style={{ ...S.btn, opacity: isBusy ? 0.6 : 1, cursor: isBusy ? 'wait' : 'pointer' }}
          disabled={isBusy}
          onClick={() => void handlePngExport()}
        >
          <Download size={12} strokeWidth={2} />{exporting === 'png' ? 'Exporting...' : 'PNG'}
        </button>
        <button
          type="button"
          title="Download the generated dashboard layout JSON"
          style={{ ...S.btn, opacity: isBusy ? 0.6 : 1, cursor: isBusy ? 'wait' : 'pointer' }}
          disabled={isBusy}
          onClick={handleLayoutExport}
        >
          <LayoutGrid size={12} strokeWidth={2} />Layout
        </button>
        <button
          type="button"
          title="Download a Power BI layout template HTML guide"
          style={{ ...S.btn, opacity: isBusy ? 0.6 : 1, cursor: isBusy ? 'wait' : 'pointer' }}
          disabled={isBusy}
          onClick={handleTemplateExport}
        >
          <FileCode size={12} strokeWidth={2} />PBI
        </button>
      </div>
    </div>
  )
}
