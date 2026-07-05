'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * Canvas zoom controller for the Layout Builder center workspace.
 *
 * The zoom affects ONLY the visual preview — it drives the scale factor that
 * CanvasPreview multiplies zone coordinates by. It never touches the layout
 * model (canvas width/height, zone coords, spacing) or any export path
 * (JSON / CSV / PBIT), so exported coordinates are always the unscaled model.
 *
 * Modes:
 *   - 'fit'       largest scale that fits the whole canvas in the workspace
 *                 (both width and height)
 *   - 'fit-width' scale to the workspace width; vertical scroll may remain
 *   - 'manual'    a user-chosen fixed percentage (slider / +/- / 100%)
 *
 * A ResizeObserver on the actual center workspace element recalculates the fit
 * scales whenever the available area changes: browser resize, resolution
 * change, left/right panel resize or collapse, canvas preset change, or
 * orientation change. In fit modes the applied scale follows those recalcs; in
 * manual mode the user's percentage is preserved across resizes.
 */

export type ZoomMode = 'fit' | 'fit-width' | 'manual'

export const MIN_ZOOM = 0.2
export const MAX_ZOOM = 2
export const ZOOM_STEP = 0.05

const STORAGE_KEY = 'dc-lb-zoom'
const DEFAULT_MANUAL = 0.6

function clamp(value: number, min = MIN_ZOOM, max = MAX_ZOOM): number {
  return Math.min(max, Math.max(min, value))
}

interface PersistedZoom {
  mode: ZoomMode
  manualScale: number
}

/** New sessions default to Fit to Screen; legacy numeric values migrate to manual. */
function readInitial(): PersistedZoom {
  if (typeof window === 'undefined') return { mode: 'fit', manualScale: DEFAULT_MANUAL }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { mode: 'fit', manualScale: DEFAULT_MANUAL }

    // Legacy: a bare number string (old fixed zoom) → treat as manual zoom.
    if (!raw.includes('{')) {
      const num = Number(raw)
      if (!Number.isNaN(num) && raw.trim() !== '') {
        return { mode: 'manual', manualScale: clamp(num) }
      }
      return { mode: 'fit', manualScale: DEFAULT_MANUAL }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedZoom>
    const mode: ZoomMode =
      parsed.mode === 'fit' || parsed.mode === 'fit-width' || parsed.mode === 'manual'
        ? parsed.mode
        : 'fit'
    const manualScale = clamp(Number(parsed.manualScale) || DEFAULT_MANUAL)
    return { mode, manualScale }
  } catch {
    return { mode: 'fit', manualScale: DEFAULT_MANUAL }
  }
}

interface UseCanvasZoomArgs {
  canvasWidth: number
  canvasHeight: number
}

export interface CanvasZoomController {
  /** Attach to the scrollable center-workspace element (the measured area). */
  viewportRef: React.RefObject<HTMLDivElement | null>
  /** The scale factor to apply to the preview (already clamped to [MIN, MAX]). */
  scale: number
  mode: ZoomMode
  /** Current applied scale as a whole-number percentage (shown even in fit modes). */
  percent: number
  setFit: () => void
  setFitWidth: () => void
  setManual: (scale: number) => void
  zoomIn: () => void
  zoomOut: () => void
  reset100: () => void
}

export function useCanvasZoom({ canvasWidth, canvasHeight }: UseCanvasZoomArgs): CanvasZoomController {
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const initial = useRef<PersistedZoom>(readInitial())

  const [mode, setMode] = useState<ZoomMode>(initial.current.mode)
  const [manualScale, setManualScale] = useState<number>(initial.current.manualScale)
  const [fitScale, setFitScale] = useState<number>(initial.current.manualScale)
  const [fitWidthScale, setFitWidthScale] = useState<number>(initial.current.manualScale)

  // Recompute both fit scales from the ACTUAL center-workspace box (client size
  // minus its CSS padding) and the canvas model dimensions. Uses the workspace
  // element, never the browser window, so panel widths/toolbar/footer are all
  // accounted for implicitly (they shrink the measured element).
  const recalcFit = useCallback(() => {
    const el = viewportRef.current
    if (!el) return
    const cs = window.getComputedStyle(el)
    const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
    const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
    const availW = el.clientWidth - padX
    const availH = el.clientHeight - padY
    if (availW <= 0 || availH <= 0 || canvasWidth <= 0 || canvasHeight <= 0) return

    const wScale = availW / canvasWidth
    const hScale = availH / canvasHeight
    const nextFit = clamp(Math.min(wScale, hScale))
    const nextFitWidth = clamp(wScale)

    // Only update on a meaningful change to avoid scrollbar-driven churn.
    setFitScale((prev) => (Math.abs(prev - nextFit) > 0.001 ? nextFit : prev))
    setFitWidthScale((prev) => (Math.abs(prev - nextFitWidth) > 0.001 ? nextFitWidth : prev))
  }, [canvasWidth, canvasHeight])

  // Measure after layout and whenever the workspace element resizes (browser
  // size, resolution, panel resize/collapse, orientation) or the canvas preset
  // changes (recalcFit identity changes with canvas dimensions).
  useLayoutEffect(() => {
    recalcFit()
    const el = viewportRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => recalcFit())
    ro.observe(el)
    window.addEventListener('orientationchange', recalcFit)
    window.addEventListener('resize', recalcFit)
    return () => {
      ro.disconnect()
      window.removeEventListener('orientationchange', recalcFit)
      window.removeEventListener('resize', recalcFit)
    }
  }, [recalcFit])

  // Persist mode + manual percentage so it survives reloads / navigation.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, manualScale }))
    } catch {
      /* localStorage unavailable — zoom still works, just not remembered */
    }
  }, [mode, manualScale])

  const scale = mode === 'fit' ? fitScale : mode === 'fit-width' ? fitWidthScale : manualScale

  const setFit = useCallback(() => setMode('fit'), [])
  const setFitWidth = useCallback(() => setMode('fit-width'), [])

  const setManual = useCallback((next: number) => {
    setManualScale(clamp(next))
    setMode('manual')
  }, [])

  // +/- capture the current applied scale first so stepping out of a fit mode
  // continues smoothly from where the fit left off.
  const zoomIn = useCallback(() => {
    setManualScale(clamp(scale + ZOOM_STEP))
    setMode('manual')
  }, [scale])

  const zoomOut = useCallback(() => {
    setManualScale(clamp(scale - ZOOM_STEP))
    setMode('manual')
  }, [scale])

  const reset100 = useCallback(() => {
    setManualScale(1)
    setMode('manual')
  }, [])

  return {
    viewportRef,
    scale,
    mode,
    percent: Math.round(scale * 100),
    setFit,
    setFitWidth,
    setManual,
    zoomIn,
    zoomOut,
    reset100,
  }
}
