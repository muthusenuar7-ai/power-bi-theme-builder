import { generateThemeJSON } from '@/lib/themeGenerator'
import { resolveThemeSurfaces } from '@/lib/themeSurfaceResolver'
import type { ThemeState } from '@/types'
import type { ThemeSnapshot } from '@/store/integrationWorkspaceStore'


/** Builds the integration-workspace theme snapshot from the live Theme Builder state. */
export function buildThemeSnapshot(state: ThemeState, themeId: string): ThemeSnapshot {
  const surfaces = resolveThemeSurfaces(state)
  const powerBIThemeJSON = generateThemeJSON(state) as unknown as object

  return {
    themeId,
    themeName: state.themeName,
    dataColors: [...state.dataColors],
    canvasBackground: surfaces.effectiveCanvasBackground,
    visualBackground: surfaces.effectiveVisualBackground,
    titleBackground: surfaces.effectiveTitleBackground,
    titleColor: surfaces.effectiveTitleColor,
    labelColor: surfaces.effectiveLabelColor,
    borderColor: surfaces.effectiveBorderColor,
    kpiGood: surfaces.effectiveKpiGood,
    kpiBad: surfaces.effectiveKpiBad,
    kpiNeutral: surfaces.effectiveKpiNeutral,
    powerBIThemeJSON,
  }
}

// NOTE (final color-mode decision, 2026-07-03): the theme-to-icon recoloring
// mapping (mapThemeToIconPatch and its contrast helpers) was removed. Themes
// must never overwrite icon colors — reference multicolor icons keep their
// original designed palette, and monochrome color is user-chosen only.
