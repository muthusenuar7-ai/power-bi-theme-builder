'use client'

import { Maximize2, Minus, MoveHorizontal, Plus } from 'lucide-react'
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP, type CanvasZoomController } from './useCanvasZoom'

/**
 * Power BI-style zoom bar: minus, slider, live percentage, plus, then the
 * Fit to Screen / Fit to Width / 100% controls. The active mode is highlighted.
 */
export function CanvasZoomBar({ zoom }: { zoom: CanvasZoomController }) {
  return (
    <div className="zoom-bar" role="group" aria-label="Canvas zoom">
      <button
        className="zoom-icon-btn"
        type="button"
        title="Zoom out"
        aria-label="Zoom out"
        disabled={zoom.scale <= MIN_ZOOM}
        onClick={zoom.zoomOut}
      >
        <Minus size={14} strokeWidth={2.2} />
      </button>

      <input
        className="zoom-slider"
        type="range"
        min={Math.round(MIN_ZOOM * 100)}
        max={Math.round(MAX_ZOOM * 100)}
        step={Math.round(ZOOM_STEP * 100)}
        value={zoom.percent}
        aria-label="Zoom level"
        onChange={(e) => zoom.setManual(Number(e.target.value) / 100)}
      />

      <button
        className="zoom-icon-btn"
        type="button"
        title="Zoom in"
        aria-label="Zoom in"
        disabled={zoom.scale >= MAX_ZOOM}
        onClick={zoom.zoomIn}
      >
        <Plus size={14} strokeWidth={2.2} />
      </button>

      <span className="zoom-percent" title="Current zoom">
        {zoom.percent}%
      </span>

      <div className="zoom-bar-divider" />

      <button
        className={`zoom-mode-btn ${zoom.mode === 'fit' ? 'sel' : ''}`}
        type="button"
        title="Fit the whole canvas in the workspace"
        onClick={zoom.setFit}
      >
        <Maximize2 size={13} strokeWidth={2} /> Fit
      </button>
      <button
        className={`zoom-mode-btn ${zoom.mode === 'fit-width' ? 'sel' : ''}`}
        type="button"
        title="Fit the canvas to the workspace width"
        onClick={zoom.setFitWidth}
      >
        <MoveHorizontal size={13} strokeWidth={2} /> Width
      </button>
      <button
        className={`zoom-mode-btn ${zoom.mode === 'manual' && zoom.percent === 100 ? 'sel' : ''}`}
        type="button"
        title="Reset to 100%"
        onClick={zoom.reset100}
      >
        100%
      </button>
    </div>
  )
}
