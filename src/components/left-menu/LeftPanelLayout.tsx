'use client'

import { useThemeStore } from '@/store/themeStore'
import { PAGE_SIZES, PAGE_SIZE_KEYS } from '@/lib/pageSizes'
import type { ZoomLevel } from '@/types'

const ZOOM_OPTIONS: { value: string; label: string }[] = [
  { value: 'fit',  label: 'Fit to window' },
  { value: '0.25', label: '25%' },
  { value: '0.5',  label: '50%' },
  { value: '0.75', label: '75%' },
  { value: '1',    label: '100%' },
]

function toZoomStr(z: ZoomLevel): string { return z === 'fit' ? 'fit' : String(z) }
function fromZoomStr(s: string): ZoomLevel { return s === 'fit' ? 'fit' : (parseFloat(s) as ZoomLevel) }

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'block', fontSize: 10.5, fontWeight: 700,
      color: 'var(--text-3)', marginBottom: 6,
    }}>
      {children}
    </span>
  )
}

const fieldSelect: React.CSSProperties = {
  width: '100%', height: 30, padding: '0 8px',
  fontSize: 12, fontFamily: 'inherit',
  border: '1px solid var(--border-ui)', borderRadius: 6,
  background: 'var(--surface)', color: 'var(--text)',
  outline: 'none', cursor: 'pointer',
}

function LayoutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-ui)',
      borderRadius: 10, overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px', borderBottom: '1px solid var(--border-ui)',
        fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
        letterSpacing: '.06em', textTransform: 'uppercase',
        background: 'var(--surface-2)',
      }}>
        {title}
      </div>
      <div style={{ padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

function ComingSoonBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      aria-disabled="true"
      style={{
        border: '1px dashed var(--border-ui)',
        borderRadius: 8,
        background: 'var(--surface-2)',
        padding: '10px 11px',
        color: 'var(--text-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)' }}>{title}</span>
        <span
          style={{
            flexShrink: 0,
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            borderRadius: 999,
            padding: '2px 7px',
            background: 'var(--surface)',
            color: 'var(--text-3)',
            border: '1px solid var(--border-ui)',
          }}
        >
          Coming soon
        </span>
      </div>
      <p style={{ margin: 0, fontSize: 11, lineHeight: 1.4 }}>{detail}</p>
    </div>
  )
}

export function LeftPanelLayout() {
  const pageSize   = useThemeStore((s) => s.pageSize)
  const zoom       = useThemeStore((s) => s.zoom)
  const setPageSize = useThemeStore((s) => s.setPageSize)
  const setZoom    = useThemeStore((s) => s.setZoom)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      <LayoutSection title="Canvas">
        <label>
          <FieldLabel>Page size</FieldLabel>
          <select style={fieldSelect} value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
            {PAGE_SIZE_KEYS.map((k) => (
              <option key={k} value={k}>{PAGE_SIZES[k].label}</option>
            ))}
          </select>
        </label>
        <label>
          <FieldLabel>Zoom level</FieldLabel>
          <select style={fieldSelect} value={toZoomStr(zoom)} onChange={(e) => setZoom(fromZoomStr(e.target.value))}>
            {ZOOM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </LayoutSection>

      <LayoutSection title="Dashboard Elements">
        <ComingSoonBlock
          title="KPI and slicer counts"
          detail="The current dashboard preview uses fixed executive templates. Count and position controls are disabled until template-safe layout editing is wired."
        />
      </LayoutSection>

      <LayoutSection title="Spacing">
        <ComingSoonBlock
          title="Visual spacing"
          detail="Spacing will return as a template-aware control. For now it is locked to preserve the polished preview layout."
        />
      </LayoutSection>

    </div>
  )
}
