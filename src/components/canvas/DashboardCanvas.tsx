'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { useThemeStore } from '@/store/themeStore'
import { PAGE_SIZES } from '@/lib/pageSizes'
import { CHART_POOL } from '@/lib/chartPool'
import { getRelativeLuminance } from '@/lib/colorUtils'
import { DashboardLayout } from './DashboardLayout'
import { FocusView } from './FocusView'
import { PageNavigator } from './PageNavigator'

export function DashboardCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const bg           = useThemeStore((s) => s.bg)
  const fg           = useThemeStore((s) => s.fg)
  const primary      = useThemeStore((s) => s.primary)
  const accent       = useThemeStore((s) => s.accent)
  const dataColors   = useThemeStore((s) => s.dataColors)
  const spacing      = useThemeStore((s) => s.spacing)
  const pageSize     = useThemeStore((s) => s.pageSize)
  const zoom         = useThemeStore((s) => s.zoom)
  const focusVisual  = useThemeStore((s) => s.focusVisual)
  const currentPage  = useThemeStore((s) => s.currentPage)
  const layout       = useThemeStore((s) => s.layout)
  const setFocusVisual = useThemeStore((s) => s.setFocusVisual)

  const sz = PAGE_SIZES[pageSize] ?? PAGE_SIZES['16:9']

  // Apply canvas-scoped CSS custom properties for PBI theming
  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const lum   = getRelativeLuminance(bg)
    const isDark = lum < 0.18
    const cardBg     = isDark ? '#1F2937' : '#FFFFFF'
    const cardBorder = isDark ? 'rgba(255,255,255,.1)' : '#E4E4E4'
    const fgMuted    = isDark ? '#94A3B8' : '#605E5C'

    const vars: Record<string, string> = {
      '--canvas-bg':     bg,
      '--theme-fg':      fg,
      '--theme-fg-muted': fgMuted,
      '--theme-primary': primary,
      '--theme-accent':  accent,
      '--card-bg':       cardBg,
      '--card-border':   cardBorder,
      '--card-radius':   '6px',
      '--card-shadow':   isDark ? 'none' : '0 1px 3px rgba(0,0,0,.06)',
      '--gap':           `${spacing}px`,
      '--card-pad':      `${Math.max(8, spacing)}px`,
    }
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v))
    dataColors.forEach((c, i) => el.style.setProperty(`--c${i + 1}`, c))
  }, [bg, fg, primary, accent, dataColors, spacing])

  const recalcScale = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    if (zoom === 'fit') {
      const w = container.clientWidth  - 48
      const h = container.clientHeight - 48
      setScale(Math.min(w / sz.w, h / sz.h, 1))
    } else {
      setScale(zoom)
    }
  }, [zoom, sz.w, sz.h])

  useEffect(() => {
    recalcScale()
    const obs = new ResizeObserver(recalcScale)
    const el  = containerRef.current
    if (el) obs.observe(el)
    return () => obs.disconnect()
  }, [recalcScale])

  const focusChart = focusVisual ? CHART_POOL.find((c) => c.id === focusVisual) : null

  // Collapse excess layout space created by CSS scale (which doesn't affect flow)
  const scaledW = sz.w * scale
  const scaledH = sz.h * scale

  return (
    /* Scrollable workspace */
    <div
      ref={containerRef}
      style={{
        flex: 1, overflow: 'auto', minHeight: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 12,
        padding: 24, background: '#F1F5F9',
      }}
    >
      {/* Canvas stage — sized to the scaled dimensions so scrollbar is accurate */}
      <div style={{ position: 'relative', width: scaledW, height: scaledH, flexShrink: 0 }}>
        {/* PBI report canvas — full resolution, scaled via transform */}
        <div
          ref={canvasRef}
          id="pbi-report-canvas"
          data-export-canvas="report"
          style={{
            width:  sz.w,
            height: sz.h,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute', top: 0, left: 0,
            background: bg,
            borderRadius: 4,
            boxShadow: '0 12px 36px rgba(15,23,42,.12), 0 2px 6px rgba(15,23,42,.06)',
            overflow: 'hidden',
            fontFamily: "'Segoe UI', sans-serif",
          }}
        >
          {focusVisual ? (
            <FocusView chartId={focusVisual} />
          ) : (
            <DashboardLayout
              currentPage={currentPage}
              layout={layout}
              dataColors={dataColors}
            />
          )}

          {/* Canvas info badge (top-right) */}
          <div style={{
            position: 'absolute', top: 8, right: 8, zIndex: 10,
            background: 'rgba(0,0,0,.38)', color: '#fff',
            fontSize: 10, padding: '3px 8px', borderRadius: 999,
            fontFamily: 'monospace', letterSpacing: '.04em',
            display: 'flex', alignItems: 'center', gap: 6,
            pointerEvents: 'none',
          }}>
            <span>{focusChart ? focusChart.sub : 'Dashboard'}</span>
            <span style={{ opacity: .7 }}>{sz.w}×{sz.h}</span>
          </div>

          {/* Exit focus (top-left) */}
          {focusVisual && (
            <button
              onClick={() => setFocusVisual(null)}
              style={{
                position: 'absolute', top: 10, left: 10, zIndex: 10,
                background: 'rgba(15,23,42,.8)', color: '#fff',
                fontSize: 11, padding: '5px 11px', borderRadius: 999,
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontWeight: 500, fontFamily: 'inherit',
              }}
            >
              ← Dashboard
            </button>
          )}
        </div>
      </div>

      <PageNavigator />
    </div>
  )
}
