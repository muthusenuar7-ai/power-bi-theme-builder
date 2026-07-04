'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { BgShape, IconColorMode, IconStyle, IconWeight } from '@/lib/iconRenderer'

/**
 * Cross-module handoff state for Theme Builder <-> Icon Studio <-> Layout
 * Builder. Deliberately separate from `themeStore` (Theme Builder's own
 * state) — this store only carries the minimum needed to hand work between
 * modules, and is the single source of truth the combined PBIT exporter reads
 * from. Persisted to localStorage so a reload or short navigation away does
 * not lose the handoff; only ids + small config objects are stored, never
 * rendered SVG/PNG bytes.
 */

export type IntegrationSourceModule = 'theme-builder' | 'icon-studio' | 'layout-builder' | null

export interface SerializableGradient {
  code: string
  name: string
  stops: string[]
}

export interface IconCustomization {
  iconColor: string
  weight: IconWeight
  style: IconStyle
  backgroundMode: 'solid' | 'gradient' | 'none'
  solidBackgroundColor: string
  bgOpacity: number
  bgShape: BgShape
  gradient: SerializableGradient | null
  /** Raw UI padding value (same units/range as the Icon Studio padding slider). */
  padding: number
  /** Raw UI icon-size value (informational — current renderers use a fixed export box size). */
  size: number
  /** 'mono' (one color) or 'multicolor' (ORIGINAL reference geometry —
   *  never recolored). Omitted = mono. */
  colorMode?: IconColorMode
}

export interface ThemeSnapshot {
  themeId: string
  themeName: string
  dataColors: string[]
  canvasBackground: string
  visualBackground: string
  titleBackground: string
  titleColor: string
  labelColor: string
  borderColor: string
  kpiGood: string
  kpiBad: string
  kpiNeutral: string
  powerBIThemeJSON?: object
}

export interface IconBundle {
  iconIds: string[]
  customization: IconCustomization
  perIconOverrides?: Record<string, Partial<IconCustomization>>
}

interface IntegrationWorkspaceState {
  themeSnapshot: ThemeSnapshot | null
  iconBundle: IconBundle | null
  sourceModule: IntegrationSourceModule
  returnRoute: string | null
  updatedAt: number | null

  setThemeSnapshot: (snapshot: ThemeSnapshot) => void
  clearThemeSnapshot: () => void
  setIconBundle: (bundle: IconBundle) => void
  clearIconBundle: () => void
  setSourceModule: (module: IntegrationSourceModule) => void
  setReturnRoute: (route: string | null) => void
  clearAll: () => void
}

export const useIntegrationWorkspaceStore = create<IntegrationWorkspaceState>()(
  persist(
    (set) => ({
      themeSnapshot: null,
      iconBundle: null,
      sourceModule: null,
      returnRoute: null,
      updatedAt: null,

      setThemeSnapshot: (snapshot) => set({ themeSnapshot: snapshot, updatedAt: Date.now() }),
      clearThemeSnapshot: () => set({ themeSnapshot: null, updatedAt: Date.now() }),
      setIconBundle: (bundle) => set({ iconBundle: bundle, updatedAt: Date.now() }),
      clearIconBundle: () => set({ iconBundle: null, updatedAt: Date.now() }),
      setSourceModule: (module) => set({ sourceModule: module }),
      setReturnRoute: (route) => set({ returnRoute: route }),
      clearAll: () =>
        set({ themeSnapshot: null, iconBundle: null, sourceModule: null, returnRoute: null, updatedAt: Date.now() }),
    }),
    {
      name: 'dc-integration-workspace',
      // v2 (2026-07-03): legacy Tabler library removed — drop old ids.
      // v3 (2026-07-03): duotone/tritone + color slots removed — coerce those
      // modes to mono, drop slot overrides, keep 'multicolor' meaning the
      // ORIGINAL reference geometry (any theme-recolored slot state is gone).
      // v4 (2026-07-04): Choose Style removed — Precision is the permanent
      // geometry for normal icons; persisted heritage/framework/softline
      // selections migrate to 'precision'.
      version: 4,
      migrate: (persisted, version) => {
        const state = persisted as Partial<IntegrationWorkspaceState> | undefined
        if (!state) return state as unknown as IntegrationWorkspaceState
        if (version < 2 && state.iconBundle) {
          const validIds = state.iconBundle.iconIds.filter(
            (id) => id.startsWith('v2-') || id.startsWith('flag-country-'),
          )
          state.iconBundle = validIds.length > 0
            ? { ...state.iconBundle, iconIds: validIds }
            : null
        }
        if (version < 3 && state.iconBundle) {
          const clean = (c: Record<string, unknown>) => {
            const mode = c.colorMode
            c.colorMode = mode === 'multicolor' ? 'multicolor' : 'mono'
            delete c.colorSlots
            return c
          }
          const bundle = state.iconBundle as unknown as {
            customization?: Record<string, unknown>
            perIconOverrides?: Record<string, Record<string, unknown>>
          }
          if (bundle.customization) clean(bundle.customization)
          for (const key of Object.keys(bundle.perIconOverrides ?? {})) {
            clean(bundle.perIconOverrides![key])
          }
        }
        if (version < 4 && state.iconBundle) {
          const bundle = state.iconBundle as unknown as {
            customization?: Record<string, unknown>
            perIconOverrides?: Record<string, Record<string, unknown>>
          }
          if (bundle.customization) bundle.customization.style = 'precision'
          for (const key of Object.keys(bundle.perIconOverrides ?? {})) {
            if ('style' in bundle.perIconOverrides![key]) bundle.perIconOverrides![key].style = 'precision'
          }
        }
        return state as IntegrationWorkspaceState
      },
    },
  ),
)
