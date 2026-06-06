import type { Rect } from './types'

export interface VisualSize {
  width: number
  height: number
}

export interface VisualSizeOptions {
  fallbackWidth?: number
  fallbackHeight?: number
  minWidth?: number
  minHeight?: number
}

const DEFAULT_SIZE: Required<VisualSizeOptions> = {
  fallbackWidth: 420,
  fallbackHeight: 260,
  minWidth: 32,
  minHeight: 32,
}

export function resolveVisualSize(
  width: number,
  height: number,
  options: VisualSizeOptions = {},
): VisualSize {
  const opts = { ...DEFAULT_SIZE, ...options }
  const safeWidth = Number.isFinite(width) && width >= opts.minWidth ? width : opts.fallbackWidth
  const safeHeight = Number.isFinite(height) && height >= opts.minHeight ? height : opts.fallbackHeight

  return {
    width: Math.round(safeWidth),
    height: Math.round(safeHeight),
  }
}

export function visualRect(size: VisualSize): Rect {
  return { x: 0, y: 0, w: size.width, h: size.height }
}

export function clampPointToRect(
  x: number,
  y: number,
  rect: Rect,
  inset = 0,
): { x: number; y: number } {
  return {
    x: Math.max(rect.x + inset, Math.min(x, rect.x + rect.w - inset)),
    y: Math.max(rect.y + inset, Math.min(y, rect.y + rect.h - inset)),
  }
}
