'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { cyclePalette, getPaletteBySize, inferPaletteSizeFromDataColors, normalizeHexColor } from '@/lib/paletteUtils'
import { getRelativeLuminance } from '@/lib/colorUtils'
import { ensureAccentVisible, refineChartColors } from '@/lib/themeSurfaceFormula'
import { getVisualFormatSchema } from '@/lib/visualFormatSchema'
import {
  APP_TYPOGRAPHY_BASELINE,
  removeTypographyFormatProps,
  typographyDefaultsFromPreset,
  typographyDefaultsToFormatProps,
} from '@/lib/typographyDefaults'
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
  PaletteSize,
  ThemeHistorySnapshot,
} from '@/types'

const DEFAULT_COLORS = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B',
  '#EF4444', '#10B981', '#F97316', '#EC4899',
  '#2563EB', '#64748B',
]

/**
 * Typography defaults seeded into formatProps so they EXIST in state from first
 * load (Theme Audit reports them as "set", Export JSON gets stable values).
 * These are background-independent, so seeding them is safe — unlike colours,
 * which we deliberately leave unset so the resolver can derive readable values
 * from the chosen background (see dashboardThemeResolver).
 */
const HISTORY_LIMIT = 60
const DEFAULT_FORMAT_PROPS: Record<string, FormatValue> = typographyDefaultsToFormatProps(APP_TYPOGRAPHY_BASELINE)

const initialState: ThemeState = {
  dataColors:      DEFAULT_COLORS,
  primary:         '#0D9488',
  accent:          '#3B82F6',
  bg:              '#FFFFFF',
  customCanvasBackground: null,
  visualBackground: '#FFFFFF',
  cardBackground:   '#FFFFFF',
  borderColor:      '#E2E8F0',
  titleColor:       '#0F172A',
  labelColor:       '#475569',
  gridlineColor:    '#E2E8F0',
  dividerColor:     '#E2E8F0',
  highlight:        '#3B82F6',
  tooltipBackground: '#FFFFFF',
  tableHeaderBackground: '#F1F5F9',
  tableRowAlt:      '#F8FAFC',
  canvasBackgroundMode: 'theme',
  visualBackgroundMode: 'theme',
  fg:              '#0F172A',
  good:            '#10B981',
  neutral:         '#F59E0B',
  bad:             '#EF4444',
  tableAccent:     '#0D9488',
  pageSize:        '16:9',
  zoom:            'fit',
  spacing:         10,
  paletteSize:     10,
  layout:          { numSlicers: 2, slicerPos: 'left', numKpis: 4 },
  dashboardDomain: 'sales',
  currentPage:     0,
  execDomain:      'sales',
  execPage:        0,
  focusVisual:     null,
  skillLevel:      'basic',
  activeFormatTab: 'visual',
  formatProps:     { ...DEFAULT_FORMAT_PROPS },
  typographyDefaults: { ...APP_TYPOGRAPHY_BASELINE },
  selectedVisual:  null,
  themeName:       'My PBI Theme',
  visualTitles:    {},
  selectedIconId:    'v2-bar-chart',
  selectedIconUrl:   null,
  selectedIconColor: '#0D9488',
  recentIcons:       ['v2-bar-chart'],
  historyPast:       [],
  historyFuture:     [],
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

function removeKeys(
  props: Record<string, FormatValue>,
  keys: string[],
): Record<string, FormatValue> {
  const blocked = new Set(keys)
  const next: Record<string, FormatValue> = {}
  for (const [key, value] of Object.entries(props)) {
    if (!blocked.has(key)) next[key] = value
  }
  return next
}

function snapshotState(s: ThemeState): ThemeHistorySnapshot {
  return {
    dataColors: [...s.dataColors],
    primary: s.primary,
    accent: s.accent,
    bg: s.bg,
    customCanvasBackground: s.customCanvasBackground,
    visualBackground: s.visualBackground,
    cardBackground: s.cardBackground,
    borderColor: s.borderColor,
    titleColor: s.titleColor,
    labelColor: s.labelColor,
    gridlineColor: s.gridlineColor,
    dividerColor: s.dividerColor,
    highlight: s.highlight,
    tooltipBackground: s.tooltipBackground,
    tableHeaderBackground: s.tableHeaderBackground,
    tableRowAlt: s.tableRowAlt,
    canvasBackgroundMode: s.canvasBackgroundMode,
    visualBackgroundMode: s.visualBackgroundMode,
    fg: s.fg,
    good: s.good,
    neutral: s.neutral,
    bad: s.bad,
    tableAccent: s.tableAccent,
    paletteSize: s.paletteSize,
    formatProps: { ...s.formatProps },
    typographyDefaults: { ...s.typographyDefaults },
    visualTitles: { ...s.visualTitles },
  }
}

function historyPatch(s: ThemeState): Pick<ThemeState, 'historyPast' | 'historyFuture'> {
  return {
    historyPast: [...s.historyPast.slice(-(HISTORY_LIMIT - 1)), snapshotState(s)],
    historyFuture: [],
  }
}

function restoreSnapshot(snapshot: ThemeHistorySnapshot): Partial<ThemeState> {
  return {
    ...snapshot,
    dataColors: [...snapshot.dataColors],
    formatProps: { ...snapshot.formatProps },
    visualTitles: { ...snapshot.visualTitles },
  }
}

export const useThemeStore = create<ThemeState & ThemeActions>()((set) => ({
  ...initialState,

  setDataColor: (index, hex) =>
    set((s) => {
      const dc = getPaletteBySize(s.dataColors, 10)
      dc[index] = normalizeHexColor(hex, dc[index])
      return { ...historyPatch(s), dataColors: dc }
    }),

  setDataColors: (colors) => set((s) => ({ ...historyPatch(s), dataColors: getPaletteBySize(colors, 10) })),
  setPaletteSize: (size: PaletteSize) => set((s) => ({ ...historyPatch(s), paletteSize: size })),

  setPrimary:  (hex) => set((s) => ({ ...historyPatch(s), primary: hex })),
  setAccent:   (hex) => set((s) => ({ ...historyPatch(s), accent: hex })),
  setBg:       (hex) => set((s) => ({ ...historyPatch(s), customCanvasBackground: normalizeHexColor(hex, '#FFFFFF'), canvasBackgroundMode: 'custom' })),
  resetCanvasBackground: () => set((s) => ({ ...historyPatch(s), customCanvasBackground: null, canvasBackgroundMode: 'theme' })),
  setVisualBackground: (hex) =>
    set((s) => ({
      ...historyPatch(s),
      visualBackgroundMode: 'custom',
      formatProps: { ...s.formatProps, 'general.background.color': normalizeHexColor(hex, s.visualBackground) },
    })),
  resetVisualBackground: () =>
    set((s) => ({
      ...historyPatch(s),
      visualBackgroundMode: 'theme',
      formatProps: removePrefix(s.formatProps, 'general.background'),
    })),
  setFg:       (hex) => set((s) => ({ ...historyPatch(s), fg: hex })),
  setGood:     (hex) => set((s) => ({ ...historyPatch(s), good: hex })),
  setNeutral:  (hex) => set((s) => ({ ...historyPatch(s), neutral: hex })),
  setBad:      (hex) => set((s) => ({ ...historyPatch(s), bad: hex })),
  setTableAccent: (hex) => set((s) => ({ ...historyPatch(s), tableAccent: hex })),

  applyImportedTheme: (patch: ThemeImportPatch) =>
    set((s) => {
      const inferredSize = patch.paletteSize ?? (patch.dataColors?.length ? inferPaletteSizeFromDataColors(patch.dataColors) : s.paletteSize)
      const importedSurface = normalizeHexColor(
        patch.visualBackground ?? patch.cardBackground ?? s.visualBackground,
        '#FFFFFF',
      )
      const importedColors = patch.dataColors?.length
        ? refineChartColors(getPaletteBySize([...patch.dataColors, ...s.dataColors], 10), importedSurface).colors
        : getPaletteBySize(s.dataColors, 10)

      return {
        ...historyPatch(s),
        themeName:   patch.themeName ?? s.themeName,
        dataColors:  importedColors,
        primary:     patch.primary ?? importedColors[0] ?? s.primary,
        accent:      patch.accent ?? importedColors[1] ?? s.accent,
        bg:          patch.bg ?? s.bg,
        fg:          patch.fg ?? s.fg,
        visualBackground: patch.visualBackground ?? s.visualBackground,
        cardBackground: patch.cardBackground ?? patch.visualBackground ?? s.cardBackground,
        borderColor: patch.borderColor ?? s.borderColor,
        titleColor: patch.titleColor ?? s.titleColor,
        labelColor: patch.labelColor ?? s.labelColor,
        gridlineColor: patch.gridlineColor ?? s.gridlineColor,
        dividerColor: patch.dividerColor ?? s.dividerColor,
        highlight: patch.highlight ?? s.highlight,
        tooltipBackground: patch.tooltipBackground ?? s.tooltipBackground,
        tableHeaderBackground: patch.tableHeaderBackground ?? s.tableHeaderBackground,
        tableRowAlt: patch.tableRowAlt ?? s.tableRowAlt,
        customCanvasBackground: null,
        canvasBackgroundMode: 'theme',
        visualBackgroundMode: 'theme',
        good:        patch.good ?? s.good,
        neutral:     patch.neutral ?? s.neutral,
        bad:         patch.bad ?? s.bad,
        tableAccent: patch.tableAccent ?? importedColors[0] ?? s.tableAccent,
        paletteSize: inferredSize,
        currentPage: 0,
        typographyDefaults: patch.typographyDefaults ?? { ...APP_TYPOGRAPHY_BASELINE },
        formatProps: {
          ...removeTypographyFormatProps(s.formatProps),
          ...typographyDefaultsToFormatProps(patch.typographyDefaults ?? APP_TYPOGRAPHY_BASELINE),
        },
      }
    }),

  applyPreset: (preset: PresetTheme) =>
    set((s) => {
      const sourceColors = preset.dataColorsFull?.length ? preset.dataColorsFull : preset.colors
      const declaredColors = sourceColors.length
        ? sourceColors.map((color, index) => normalizeHexColor(color, DEFAULT_COLORS[index % DEFAULT_COLORS.length]))
        : [...DEFAULT_COLORS]
      const background = normalizeHexColor(
        preset.dashboardBackground ?? preset.pageBackground ?? preset.background ?? preset.bg,
        s.bg,
      )
      const foreground = normalizeHexColor(preset.foreground ?? preset.fg, s.fg)
      const visualBackground = normalizeHexColor(preset.visualBackground, s.visualBackground)
      const cardBackground = normalizeHexColor(preset.cardBackground ?? preset.visualBackground, visualBackground)
      // Standard colour formula: soft/washed-out palette colours are strengthened
      // (hue preserved) against the card surface so charts stay elegant and
      // readable in the preview AND in the exported Power BI JSON.
      const colors = refineChartColors(declaredColors, visualBackground).colors
      const primary = normalizeHexColor(preset.primaryColor, colors[0] ?? s.primary)
      const accent = normalizeHexColor(preset.accentColor, colors[1] ?? s.accent)
      const typographyDefaults = typographyDefaultsFromPreset(preset)
      const presetGeneral = typographyDefaultsToFormatProps(typographyDefaults)
      const inheritedProps = removeKeys(removeTypographyFormatProps(s.formatProps), [
        'general.background.color',
        'general.background.transparency',
        'general.title.fontColor',
        'general.label.fontColor',
        'general.border.color',
      ])
      return {
        ...historyPatch(s),
        dataColors:  colors,
        primary,
        accent,
        bg:          background,
        customCanvasBackground: null,
        visualBackground,
        cardBackground,
        borderColor: normalizeHexColor(preset.borderColor, s.borderColor),
        titleColor: normalizeHexColor(preset.titleColor, foreground),
        labelColor: normalizeHexColor(preset.labelColor, foreground),
        gridlineColor: normalizeHexColor(preset.gridlineColor, s.gridlineColor),
        dividerColor: normalizeHexColor(preset.dividerColor, preset.gridlineColor ?? s.dividerColor),
        highlight: normalizeHexColor(preset.highlight, accent),
        tooltipBackground: normalizeHexColor(preset.tooltipBackground, cardBackground),
        tableHeaderBackground: normalizeHexColor(preset.tableHeaderBackground, s.tableHeaderBackground),
        tableRowAlt: normalizeHexColor(preset.tableRowAlt, cardBackground),
        canvasBackgroundMode: 'theme',
        visualBackgroundMode: 'theme',
        fg:          foreground,
        good:        ensureAccentVisible(preset.good, visualBackground, '#16A34A'),
        neutral:     ensureAccentVisible(preset.neutral, visualBackground, '#F59E0B'),
        bad:         ensureAccentVisible(preset.bad, visualBackground, '#DC2626'),
        tableAccent: preset.tableAccent ?? primary,
        // Kept for compatibility with older import/QA code. Preset selection no
        // longer derives or mutates active data colours from this field.
        paletteSize: s.paletteSize,
        currentPage: 0,
        typographyDefaults,
        formatProps: { ...inheritedProps, ...presetGeneral },
      }
    }),

  setPageSize:      (key) => set({ pageSize: key, currentPage: 0 }),
  setZoom:          (level: ZoomLevel) => set({ zoom: level }),
  setSpacing:       (px) => set({ spacing: px }),
  setLayout:        (config: Partial<LayoutConfig>) =>
    set((s) => ({ layout: { ...s.layout, ...config } })),
  setDashboardDomain: (domain) => set({ dashboardDomain: domain, focusVisual: null }),
  setCurrentPage:   (page) => set({ currentPage: page }),
  setExecDomain:    (domain) => set({ execDomain: domain, execPage: 0 }),
  setExecPage:      (page) => set({ execPage: page }),
  setFocusVisual:   (vid) => set({ focusVisual: vid }),
  setSkillLevel:    (level: SkillLevel) => set({ skillLevel: level }),
  setFormatTab:     (tab: FormatTab) => set({ activeFormatTab: tab }),
  setProp:          (key, value) =>
    set((s) => ({
      ...historyPatch(s),
      formatProps: { ...s.formatProps, [key]: value },
      ...(key.startsWith('general.background.') ? { visualBackgroundMode: 'custom' as const } : {}),
    })),
  updateGeneralFormat: (path, value) =>
    set((s) => {
      const key = withScope('general', path)
      return {
        ...historyPatch(s),
        formatProps: { ...s.formatProps, [key]: value },
        ...(key.startsWith('general.background.') ? { visualBackgroundMode: 'custom' as const } : {}),
      }
    }),
  updateVisualFormat: (visualId, path, value) =>
    set((s) => {
      const scope = getVisualScope(visualId)
      return { ...historyPatch(s), formatProps: { ...s.formatProps, [withScope(scope, path)]: value } }
    }),
  resetGeneralSection: (sectionId) =>
    set((s) => ({
      ...historyPatch(s),
      formatProps: removePrefix(s.formatProps, `general.${sectionId}`),
      ...(sectionId === 'background' ? { visualBackgroundMode: 'theme' as const } : {}),
    })),
  resetVisualSection: (visualId, sectionId) =>
    set((s) => ({ ...historyPatch(s), formatProps: removePrefix(s.formatProps, `${getVisualScope(visualId)}.${sectionId}`) })),
  resetVisualFormat: (visualId) =>
    set((s) => ({ ...historyPatch(s), formatProps: removePrefix(s.formatProps, `${getVisualScope(visualId)}.`) })),
  resetTypography: () =>
    set((s) => ({
      ...historyPatch(s),
      formatProps: {
        ...removeTypographyFormatProps(s.formatProps),
        ...typographyDefaultsToFormatProps(s.typographyDefaults),
      },
    })),
  setSelectedVisual: (vid) => set({ selectedVisual: vid }),
  setThemeName:     (name) => set({ themeName: name }),
  setVisualTitle:   (visualId, title) =>
    set((s) => ({ ...historyPatch(s), visualTitles: { ...s.visualTitles, [visualId]: title } })),
  setSelectedIcon: (icon) =>
    set((s) => ({
      selectedIconId: icon.id,
      selectedIconUrl: icon.url,
      recentIcons: [icon.id, ...s.recentIcons.filter((id) => id !== icon.id)].slice(0, 24),
    })),
  setSelectedIconColor: (hex) => set({ selectedIconColor: normalizeHexColor(hex, '#0D9488') }),
  undo: () =>
    set((s) => {
      const previous = s.historyPast[s.historyPast.length - 1]
      if (!previous) return {}
      return {
        ...restoreSnapshot(previous),
        historyPast: s.historyPast.slice(0, -1),
        historyFuture: [snapshotState(s), ...s.historyFuture].slice(0, HISTORY_LIMIT),
      }
    }),
  redo: () =>
    set((s) => {
      const next = s.historyFuture[0]
      if (!next) return {}
      return {
        ...restoreSnapshot(next),
        historyPast: [...s.historyPast.slice(-(HISTORY_LIMIT - 1)), snapshotState(s)],
        historyFuture: s.historyFuture.slice(1),
      }
    }),
  resetAllFormatting: () =>
    set((s) => ({
      ...historyPatch(s),
      customCanvasBackground: null,
      canvasBackgroundMode: 'theme',
      visualBackgroundMode: 'theme',
      formatProps: typographyDefaultsToFormatProps(s.typographyDefaults),
      visualTitles: {},
    })),
}))

/**
 * Syncs Zustand color state to CSS custom properties so SVG charts
 * and layout CSS react to color changes without re-rendering JS logic.
 * Must be called inside a 'use client' component.
 */
export function useCSSSync() {
  const dataColors  = useThemeStore((s) => s.dataColors)
  const paletteSize = useThemeStore((s) => s.paletteSize)
  const primary     = useThemeStore((s) => s.primary)
  const accent      = useThemeStore((s) => s.accent)
  const bg          = useThemeStore((s) => s.bg)
  const customCanvasBackground = useThemeStore((s) => s.customCanvasBackground)
  const canvasBackgroundMode = useThemeStore((s) => s.canvasBackgroundMode)
  const fg          = useThemeStore((s) => s.fg)
  const good        = useThemeStore((s) => s.good)
  const neutral     = useThemeStore((s) => s.neutral)
  const bad         = useThemeStore((s) => s.bad)
  const tableAccent = useThemeStore((s) => s.tableAccent)
  const fontFace    = useThemeStore((s) => s.formatProps['general.typography.fontFace'])
  const titleSize   = useThemeStore((s) => s.formatProps['general.title.fontSize'])
  const labelSize   = useThemeStore((s) => s.formatProps['general.label.fontSize'])

  useEffect(() => {
    const s = document.documentElement.style
    const activePalette = dataColors.length ? dataColors : DEFAULT_COLORS
    Array.from({ length: 10 }).forEach((_, index) => {
      s.setProperty(`--c${index + 1}`, cyclePalette(activePalette, index))
    })
    s.setProperty('--palette-size', String(activePalette.length))
    s.setProperty('--primary',      primary)
    s.setProperty('--accent',       accent)
    const effectiveBg = canvasBackgroundMode === 'custom' && customCanvasBackground
      ? customCanvasBackground
      : bg
    s.setProperty('--pbi-bg',       effectiveBg)
    s.setProperty('--pbi-fg',       fg)
    s.setProperty('--good',         good)
    s.setProperty('--neutral',      neutral)
    s.setProperty('--bad',          bad)
    s.setProperty('--table-accent', tableAccent)
    s.setProperty('--accent-ui',    primary)
    s.setProperty('--accent-2',     shiftLightness(primary, -8))

    // Typography — theme-level font + sizes consumed by the preview & charts.
    const font = typeof fontFace === 'string' && fontFace.trim() ? fontFace : 'Segoe UI'
    s.setProperty('--preview-font-family', `'${font}', 'Segoe UI', sans-serif`)
    s.setProperty('--preview-title-size', `${typeof titleSize === 'number' ? titleSize : 14}px`)
    s.setProperty('--preview-label-size', `${typeof labelSize === 'number' ? labelSize : 9}px`)

    // Workspace surround (the area behind the report "paper") tracks the theme
    // background so dark themes don't sit on a fixed light-grey dot grid.
    const isDark = getRelativeLuminance(effectiveBg) < 0.18
    s.setProperty('--workspace-bg',  isDark ? '#0B1220' : '#E8EDF2')
    s.setProperty('--workspace-dot', isDark ? 'rgba(148,163,184,.16)' : '#CBD5E1')
  }, [dataColors, paletteSize, primary, accent, bg, customCanvasBackground, canvasBackgroundMode, fg, good, neutral, bad, tableAccent, fontFace, titleSize, labelSize])
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
