'use client'

import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react'

interface Props {
  /** Design width of the report canvas in px (e.g. 1280 for 16:9). */
  width: number
  /** Design height of the report canvas in px (e.g. 720 for 16:9). */
  height: number
  /** 'fit' scales to the available area; a number is an explicit zoom factor. */
  zoom: 'fit' | number
  background: string
  shadow: string
  children: ReactNode
}

/**
 * ThemeDashboardCanvas — a clean, responsive Power BI-style report surface.
 *
 * The report is authored at a fixed design size (default 1280×720 = 16:9) and
 * uniformly transform-scaled to fit the available width/height. Because the
 * whole surface scales as one unit, every font, chart and gap keeps its
 * proportion and stays readable at any laptop resolution — and there is no
 * inner scrollbar. The background/shadow come straight from the resolved theme,
 * so there is never a hardcoded white paper.
 */
export function ThemeDashboardCanvas({ width, height, zoom, background, shadow, children }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)

  const recalc = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (zoom === 'fit') {
      const w = el.clientWidth
      const h = el.clientHeight
      if (w <= 0 || h <= 0) return
      setScale(Math.max(0.2, Math.min(w / width, h / height, 1)))
    } else {
      setScale(zoom)
    }
  }, [zoom, width, height])

  useEffect(() => {
    recalc()
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(recalc)
    obs.observe(el)
    return () => obs.disconnect()
  }, [recalc])

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        width: '100%',
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Footprint box keeps the scaled paper centred without overflow. */}
      <div style={{ width: width * scale, height: height * scale, flexShrink: 0 }}>
        <div
          data-export-canvas="report"
          style={{
            width,
            height,
            aspectRatio: '16 / 9',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            background,
            boxShadow: shadow,
            borderRadius: 8,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
