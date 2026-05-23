'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { getVisualFormatSchema } from '@/lib/visualFormatSchema'
import type {
  ThemeState,
  ThemeActions,
  LayoutConfig,
  PresetTheme,
  ThemeImportPatch,
  ZoomLevel,
  SkillLevel,
  FormatTab,
  FormatValue,
} from '@/types'

const DEFAULT_COLORS = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#10B981', '#F97316', '#EC4899',
]

const initialState: ThemeState = {
  dataColors:      DEFAULT_COLORS,
  primary:         '#0D9488',
  accent:          '#3B82F6',
  bg:              '#FFFFFF',
  fg:              '#0F172A',
  good:            '#10B981',
  neutral:         '#F59E0B',
  bad:             '#EF4444',
  tableAccent:     '#0D9488',
  pageSize:        '16:9',
  zoom:            'fit',
  spacing:         10,
  layout:          { numSlicers: 2, slicerPos: 'left', numKpis: 4 },
  currentPage:     0,
  focusVisual:     null,
  skillLevel:      'basic',
  activeFormatTab: 'visual',
  formatProps:     {},
  selectedVisual:  null,
  themeName:       'My PBI Theme',
  visualTitles:    {},
}

function withScope(scope: string, path: string): string {
  const cleanPath = path.replace(/^\.+/, '')
  return cleanPath.startsWith(`${scope}.`) ? cleanPath : `${scope}.${cleanPath}`
}

function getVisualScope(visualId: string): string {
  return getVisualFormatSchema(visualId)?.stateScope ?? visualId
}

function removePrefix(
  props: Record<string, FormatValue>,
  prefix: string,
): Record<string, FormatValue> {
  const next: Record<string, FormatValue> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!key.startsWith(prefix)) next[key] = value
  }
  return next
}

export const useThemeStore = create<ThemeState & ThemeActions>()((set) => ({
  ...initialState,

  setDataColor: (index, hex) =>
    set((s) => {
      const dc = [...s.dataColors]
      dc[index] = hex
      return { dataColors: dc }
    }),

  setDataColors: (colors) => set({ dataColors: colors }),

  setPrimary:  (hex) => set({ primary: hex }),
  setAccent:   (hex) => set({ accent: hex }),
  setBg:       (hex) => set({ bg: hex }),
  setFg:       (hex) => set({ fg: hex }),
  setGood:     (hex) => set({ good: hex }),
  setNeutral:  (hex) => set({ neutral: hex }),
  setBad:      (hex) => set({ bad: hex }),
  setTableAccent: (hex) => set({ tableAccent: hex }),

  applyImportedTheme: (patch: ThemeImportPatch) =>
    set((s) => {
      const importedColors = patch.dataColors?.length
        ? [...patch.dataColors, ...s.dataColors].slice(0, 8)
        : s.dataColors

      return {
        themeName:   patch.themeName ?? s.themeName,
        dataColors:  importedColors,
        primary:     patch.primary ?? importedColors[0] ?? s.primary,
        accent:      patch.accent ?? importedColors[1] ?? s.accent,
        bg:          patch.bg ?? s.bg,
        fg:          patch.fg ?? s.fg,
        good:        patch.good ?? s.good,
        neutral:     patch.neutral ?? s.neutral,
        bad:         patch.bad ?? s.bad,
        tableAccent: patch.tableAccent ?? importedColors[0] ?? s.tableAccent,
        currentPage: 0,
      }
    }),

  applyPreset: (preset: PresetTheme) =>
    set({
      dataColors:  [...preset.colors],
      primary:     preset.colors[0],
      accent:      preset.colors[1],
      bg:          preset.bg,
      fg:          preset.fg,
      tableAccent: preset.colors[0],
      currentPage: 0,
    }),

  setPageSize:      (key) => set({ pageSize: key, currentPage: 0 }),
  setZoom:          (level: ZoomLevel) => set({ zoom: level }),
  setSpacing:       (px) => set({ spacing: px }),
  setLayout:        (config: Partial<LayoutConfig>) =>
    set((s) => ({ layout: { ...s.layout, ...config } })),
  setCurrentPage:   (page) => set({ currentPage: page }),
  setFocusVisual:   (vid) => set({ focusVisual: vid }),
  setSkillLevel:    (level: SkillLevel) => set({ skillLevel: level }),
  setFormatTab:     (tab: FormatTab) => set({ activeFormatTab: tab }),
  setProp:          (key, value) =>
    set((s) => ({ formatProps: { ...s.formatProps, [key]: value } })),
  updateGeneralFormat: (path, value) =>
    set((s) => ({ formatProps: { ...s.formatProps, [withScope('general', path)]: value } })),
  updateVisualFormat: (visualId, path, value) =>
    set((s) => {
      const scope = getVisualScope(visualId)
      return { formatProps: { ...s.formatProps, [withScope(scope, path)]: value } }
    }),
  resetGeneralSection: (sectionId) =>
    set((s) => ({ formatProps: removePrefix(s.formatProps, `general.${sectionId}`) })),
  resetVisualSection: (visualId, sectionId) =>
    set((s) => ({ formatProps: removePrefix(s.formatProps, `${getVisualScope(visualId)}.${sectionId}`) })),
  resetVisualFormat: (visualId) =>
    set((s) => ({ formatProps: removePrefix(s.formatProps, `${getVisualScope(visualId)}.`) })),
  setSelectedVisual: (vid) => set({ selectedVisual: vid }),
  setThemeName:     (name) => set({ themeName: name }),
  setVisualTitle:   (visualId, title) =>
    set((s) => ({ visualTitles: { ...s.visualTitles, [visualId]: title } })),
}))

/**
 * Syncs Zustand color state to CSS custom properties so SVG charts
 * and layout CSS react to color changes without re-rendering JS logic.
 * Must be called inside a 'use client' component.
 */
export function useCSSSync() {
  const dataColors  = useThemeStore((s) => s.dataColors)
  const primary     = useThemeStore((s) => s.primary)
  const accent      = useThemeStore((s) => s.accent)
  const bg          = useThemeStore((s) => s.bg)
  const fg          = useThemeStore((s) => s.fg)
  const good        = useThemeStore((s) => s.good)
  const neutral     = useThemeStore((s) => s.neutral)
  const bad         = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)

  useEffect(() => {
    const s = document.documentElement.style
    dataColors.slice(0, 8).forEach((c, i) => s.setProperty(`--c${i + 1}`, c))
    s.setProperty('--primary',      primary)
    s.setProperty('--accent',       accent)
    s.setProperty('--pbi-bg',       bg)
    s.setProperty('--pbi-fg',       fg)
    s.setProperty('--good',         good)
    s.setProperty('--neutral',      neutral)
    s.setProperty('--bad',          bad)
    s.setProperty('--table-accent', tableAccent)
    s.setProperty('--accent-ui',    primary)
    s.setProperty('--accent-2',     shiftLightness(primary, -8))
  }, [dataColors, primary, accent, bg, fg, good, neutral, bad, tableAccent])
}

function shiftLightness(hex: string, delta: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const clamp  = (v: number) => Math.max(0, Math.min(255, v))
  const factor = 1 + delta / 100
  return (
    '#' +
    [clamp(Math.round(r * factor)), clamp(Math.round(g * factor)), clamp(Math.round(b * factor))]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  )
}
