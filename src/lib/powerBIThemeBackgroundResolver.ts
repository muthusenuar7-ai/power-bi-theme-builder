import type { ThemeState } from '@/types'
import { resolveThemeSurfaces } from '@/lib/themeSurfaceResolver'

type PowerBIBackgroundState = Pick<
  ThemeState,
  | 'dataColors'
  | 'paletteSize'
  | 'primary'
  | 'bg'
  | 'customCanvasBackground'
  | 'canvasBackgroundMode'
  | 'visualBackground'
  | 'cardBackground'
  | 'visualBackgroundMode'
  | 'formatProps'
>

export interface PowerBIExportBackgrounds {
  canvasBackground: string
  outspaceBackground: string
  visualBackground: string
  canvasBackgroundSource: 'theme' | 'custom'
  visualBackgroundSource: 'theme' | 'custom'
}

/**
 * Power BI export background resolver.
 *
 * Dashboard Preview intentionally derives a visible report-page surface from a
 * theme's raw background on light themes. Export uses the same deterministic
 * canvas/card surfaces so the imported Power BI page reads like the Studio
 * preview, while still emitting only schema-safe #RRGGBB colors.
 */
export function resolvePowerBIExportBackgrounds(state: PowerBIBackgroundState): PowerBIExportBackgrounds {
  const surfaces = resolveThemeSurfaces(state)

  return {
    canvasBackground: surfaces.effectiveCanvasBackground,
    outspaceBackground: surfaces.effectiveOutspaceBackground,
    visualBackground: surfaces.effectiveVisualBackground,
    canvasBackgroundSource: surfaces.source.canvasBackground,
    visualBackgroundSource: surfaces.source.visualBackground,
  }
}
